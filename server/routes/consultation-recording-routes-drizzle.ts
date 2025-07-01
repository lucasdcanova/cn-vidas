import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { consultationRecordings, appointments, doctors, medicalRecords, medicalRecordEntries } from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authenticateToken, requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { storage } from '../storage.js';

const router = Router();

// Configurar multer para upload de arquivos
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'));
    }
  },
});

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Upload de gravação
router.post('/upload', authenticateToken, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    console.log('📼 [Recording Upload] Iniciando upload de gravação...');
    console.log('📼 [Recording Upload] Headers:', req.headers);
    console.log('📼 [Recording Upload] Body:', req.body);
    console.log('📼 [Recording Upload] Usuário autenticado:', (req as any).user);
    console.log('📼 [Recording Upload] Request files:', req.file ? 'Arquivo presente' : 'Nenhum arquivo');
    console.log('📼 [Recording Upload] Request method:', req.method);
    console.log('📼 [Recording Upload] Request URL:', req.url);
    
    const file = req.file;
    if (!file) {
      console.error('❌ [Recording Upload] Arquivo não encontrado no request');
      return res.status(400).json({ success: false, error: 'Arquivo não encontrado' });
    }

    const appointmentId = parseInt(req.body.appointmentId);

    if (!appointmentId) {
      console.error('❌ [Recording Upload] ID da consulta não fornecido');
      await fs.unlink(file.path);
      return res.status(400).json({ success: false, error: 'ID da consulta é obrigatório' });
    }

    console.log(`📋 [Recording Upload] Dados recebidos:`, {
      appointmentId,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      mimeType: file.mimetype,
      filename: file.filename,
      originalName: file.originalname,
      timestamp: new Date().toISOString()
    });

    // Verificar se a consulta existe e obter o médico
    const [appointment] = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) {
      await fs.unlink(file.path);
      return res.status(404).json({ success: false, error: 'Consulta não encontrada' });
    }

    // Obter o doctorId da consulta
    const doctorId = appointment.doctorId;
    if (!doctorId) {
      await fs.unlink(file.path);
      return res.status(400).json({ success: false, error: 'Médico não encontrado para esta consulta' });
    }

    console.log(`📋 [Recording Upload] Médico: ${doctorId}`);

    // Verificar se já existe gravação para esta consulta
    const [existingRecording] = await db.select()
      .from(consultationRecordings)
      .where(eq(consultationRecordings.appointmentId, appointmentId))
      .limit(1);

    if (existingRecording) {
      await fs.unlink(file.path);
      return res.status(400).json({ success: false, error: 'Já existe uma gravação para esta consulta' });
    }

    // Salvar arquivo localmente
    const localDir = path.join(process.cwd(), 'uploads', 'recordings', appointmentId.toString());
    console.log(`📁 [Recording Upload] Criando diretório: ${localDir}`);
    await fs.mkdir(localDir, { recursive: true });
    
    const fileName = `recording-${Date.now()}.webm`;
    const localPath = path.join(localDir, fileName);
    console.log(`💾 [Recording Upload] Salvando arquivo: ${localPath}`);
    
    await fs.rename(file.path, localPath);
    const audioUrl = `/uploads/recordings/${appointmentId}/${fileName}`;
    
    // Obter informações do arquivo
    const stats = await fs.stat(localPath);
    const fileSize = stats.size;
    
    console.log(`✅ [Recording Upload] Arquivo salvo. Tamanho: ${fileSize} bytes`);

    // Criar registro no banco
    const [recording] = await db.insert(consultationRecordings)
      .values({
        appointmentId,
        doctorId,
        audioUrl,
        fileSize,
        transcriptionStatus: 'pending',
        aiProcessingStatus: 'pending',
        processingStartedAt: new Date(),
      })
      .returning();

    console.log(`✅ [Recording Upload] Registro criado no banco. ID: ${recording.id}`);

    // Iniciar processamento assíncrono
    processRecording(recording.id).catch(error => {
      console.error('❌ [Recording Process] Erro no processamento:', error);
    });

    res.json({
      success: true,
      recordingId: recording.id,
      message: 'Gravação enviada com sucesso. Processamento iniciado.',
    });

  } catch (error) {
    console.error('❌ [Recording Upload] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar gravação' });
  }
});

// Buscar gravação por consulta
router.get('/appointment/:appointmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    const userId = (req as any).user?.id;
    
    console.log('🔍 [Recording] Buscando gravação para appointment:', appointmentId);
    console.log('👤 [Recording] User ID:', userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }
    
    // Primeiro verificar se o usuário tem acesso à consulta
    const [appointment] = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);
      
    if (!appointment) {
      console.log('❌ [Recording] Consulta não encontrada:', appointmentId);
      return res.status(404).json({ success: false, error: 'Consulta não encontrada' });
    }
    
    // Verificar se o usuário é o paciente ou o médico da consulta
    const isPatient = appointment.userId === userId;
    
    // Se não for o paciente, verificar se é o médico
    let isDoctor = false;
    if (!isPatient && appointment.doctorId) {
      const [doctor] = await db.select()
        .from(doctors)
        .where(eq(doctors.id, appointment.doctorId))
        .limit(1);
      
      if (doctor && doctor.userId === userId) {
        isDoctor = true;
      }
    }
    
    if (!isPatient && !isDoctor) {
      console.log('❌ [Recording] Usuário não tem acesso à consulta:', { userId, appointmentId, isPatient, isDoctor });
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }
    
    // Buscar a gravação
    const [recording] = await db.select()
      .from(consultationRecordings)
      .where(eq(consultationRecordings.appointmentId, appointmentId))
      .limit(1);

    if (!recording) {
      console.log('❌ [Recording] Nenhuma gravação encontrada para appointment:', appointmentId);
      return res.status(404).json({ success: false, error: 'Gravação não encontrada' });
    }
    
    // Buscar prontuário médico relacionado se existir
    const [medicalRecordEntry] = await db.select()
      .from(medicalRecordEntries)
      .where(eq(medicalRecordEntries.appointmentId, appointmentId))
      .orderBy(desc(medicalRecordEntries.createdAt))
      .limit(1);
    
    console.log('✅ [Recording] Gravação encontrada:', {
      id: recording.id,
      status: recording.transcriptionStatus,
      medicalRecordId: medicalRecordEntry?.id
    });

    res.json({
      success: true,
      recording: {
        id: recording.id,
        status: recording.transcriptionStatus,
        hasTranscription: !!recording.transcription,
        hasAiNotes: !!recording.soapNote,
        medicalRecordId: medicalRecordEntry?.recordId,
        error: recording.transcriptionError,
        createdAt: recording.createdAt,
        completedAt: recording.processingCompletedAt
      }
    });
  } catch (error) {
    console.error('❌ [Recording] Erro ao buscar gravação por appointmentId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar gravação'
    });
  }
});

// Função para processar gravação
async function processRecording(recordingId: number) {
  console.log(`🎙️ [Recording Process] Iniciando processamento da gravação ${recordingId}...`);
  
  try {
    // Buscar gravação
    const [recording] = await db.select()
      .from(consultationRecordings)
      .where(eq(consultationRecordings.id, recordingId))
      .limit(1);

    if (!recording) {
      throw new Error('Gravação não encontrada');
    }

    // Atualizar status
    await db.update(consultationRecordings)
      .set({ transcriptionStatus: 'processing' })
      .where(eq(consultationRecordings.id, recordingId));

    // Buscar arquivo
    const filePath = path.join(process.cwd(), recording.audioUrl.startsWith('/') ? recording.audioUrl.slice(1) : recording.audioUrl);
    console.log(`📁 [Recording Process] Lendo arquivo: ${filePath}`);
    
    const audioFile = await fs.readFile(filePath);
    
    // Transcrever com OpenAI
    console.log('🎤 [Recording Process] Enviando para transcrição...');
    
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: new File([audioFile], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      language: 'pt',
    });

    const transcription = transcriptionResponse.text;
    console.log(`✅ [Recording Process] Transcrição concluída. ${transcription.length} caracteres`);

    // Atualizar com transcrição
    await db.update(consultationRecordings)
      .set({ 
        transcription,
        transcriptionStatus: 'completed',
      })
      .where(eq(consultationRecordings.id, recordingId));

    // Gerar prontuário com IA
    console.log('🤖 [Recording Process] Gerando prontuário com IA...');
    
    await db.update(consultationRecordings)
      .set({ aiProcessingStatus: 'processing' })
      .where(eq(consultationRecordings.id, recordingId));

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente médico especializado em criar prontuários médicos profissionais a partir de transcrições de consultas. 
          Analise a transcrição e gere:
          1. Nota SOAP completa (Subjetivo, Objetivo, Avaliação, Plano)
          2. Prescrições médicas detalhadas com:
             - Nome do medicamento (genérico e comercial se mencionado)
             - Dosagem e concentração
             - Posologia (quantas vezes ao dia)
             - Duração do tratamento
             - Orientações especiais
          3. Resumo executivo da consulta
          
          Para as prescrições, formate cada item como objeto com as chaves:
          - medicamento: nome do medicamento
          - dosagem: dosagem e concentração
          - posologia: como tomar
          - duracao: tempo de tratamento
          - orientacoes: orientações especiais
          
          Retorne em formato JSON com as chaves: 
          - soap_note (com subjetivo, objetivo, avaliacao, plano)
          - prescricoes (array de objetos com medicamento, dosagem, posologia, duracao, orientacoes)
          - resumo (texto resumindo a consulta)`
        },
        {
          role: 'user',
          content: `Transcrição da consulta:\n\n${transcription}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const aiContent = JSON.parse(aiResponse.choices[0].message.content || '{}');
    console.log('✅ [Recording Process] Prontuário gerado com IA');

    // Atualizar com dados da IA
    await db.update(consultationRecordings)
      .set({
        soapNote: aiContent.soap_note || {},
        prescription: aiContent.prescricoes || [],
        summary: aiContent.resumo || '',
        aiProcessingStatus: 'completed',
        processingCompletedAt: new Date(),
      })
      .where(eq(consultationRecordings.id, recordingId));

    // Criar prontuário médico automaticamente
    await createMedicalRecordFromRecording(recording.appointmentId, recording.doctorId, aiContent);
    
    console.log(`✅ [Recording Process] Processamento concluído para gravação ${recordingId}`);
    
  } catch (error) {
    console.error(`❌ [Recording Process] Erro no processamento:`, error);
    
    // Atualizar status de erro
    await db.update(consultationRecordings)
      .set({
        transcriptionStatus: 'failed',
        aiProcessingStatus: 'failed',
        transcriptionError: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      .where(eq(consultationRecordings.id, recordingId));
  }
}

// Criar prontuário médico a partir da gravação
async function createMedicalRecordFromRecording(appointmentId: number, doctorId: number, aiContent: any) {
  try {
    console.log('📋 [Medical Record] Criando prontuário a partir da gravação...');
    
    // Buscar informações da consulta
    const [appointment] = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) {
      throw new Error('Consulta não encontrada');
    }

    // Verificar se já existe prontuário
    const [existingRecord] = await db.select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, appointment.userId))
      .limit(1);

    let recordId: number;

    if (existingRecord) {
      recordId = existingRecord.id;
    } else {
      // Criar novo prontuário
      const [newRecord] = await db.insert(medicalRecords)
        .values({
          patientId: appointment.userId,
          primaryDoctorId: doctorId,
          emergencyContact: '',
        })
        .returning();
      
      recordId = newRecord.id;
    }

    // Criar entrada no prontuário
    const soap = aiContent.soap_note || {};
    await db.insert(medicalRecordEntries)
      .values({
        recordId,
        appointmentId,
        authorId: appointment.userId, // Usar o userId do médico
        entryType: 'consultation',
        content: aiContent.resumo || 'Consulta realizada',
        subjective: soap.subjetivo || '',
        objective: soap.objetivo || '',
        assessment: soap.avaliacao || '',
        plan: soap.plano || '',
        prescriptions: aiContent.prescricoes || [],
        signedAt: new Date(),
      });

    console.log('✅ [Medical Record] Prontuário criado com sucesso');
    
  } catch (error) {
    console.error('❌ [Medical Record] Erro ao criar prontuário:', error);
  }
}

// Nova rota para upload via base64 (para iOS/Capacitor)
router.post('/upload-base64', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('📼 [Recording Upload Base64] Iniciando upload de gravação base64...');
    console.log('📼 [Recording Upload Base64] Headers:', req.headers);
    console.log('📼 [Recording Upload Base64] Body keys:', Object.keys(req.body));
    console.log('📼 [Recording Upload Base64] Usuário autenticado:', (req as any).user);
    console.log('📼 [Recording Upload Base64] Audio data length:', req.body.audio?.length || 0);
    console.log('📼 [Recording Upload Base64] Audio first 100 chars:', req.body.audio?.substring(0, 100));
    
    const { audio, audioMimeType, appointmentId } = req.body;
    
    if (!audio) {
      console.error('❌ [Recording Upload Base64] Dados de áudio não encontrados');
      return res.status(400).json({ success: false, error: 'Dados de áudio não encontrados' });
    }
    
    if (!appointmentId) {
      console.error('❌ [Recording Upload Base64] ID da consulta não fornecido');
      return res.status(400).json({ success: false, error: 'ID da consulta é obrigatório' });
    }
    
    const appointmentIdNum = parseInt(appointmentId);
    
    console.log(`📋 [Recording Upload Base64] Dados recebidos:`, {
      appointmentId: appointmentIdNum,
      mimeType: audioMimeType || 'audio/webm',
      audioLength: audio.length,
      timestamp: new Date().toISOString()
    });
    
    // Verificar se a consulta existe e obter o médico
    const [appointment] = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentIdNum))
      .limit(1);
      
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Consulta não encontrada' });
    }
    
    // Obter o doctorId da consulta
    const doctorId = appointment.doctorId;
    if (!doctorId) {
      return res.status(400).json({ success: false, error: 'Médico não encontrado para esta consulta' });
    }
    
    console.log(`📋 [Recording Upload Base64] Médico: ${doctorId}`);
    
    // Verificar se já existe gravação para esta consulta
    const [existingRecording] = await db.select()
      .from(consultationRecordings)
      .where(eq(consultationRecordings.appointmentId, appointmentIdNum))
      .limit(1);
      
    if (existingRecording) {
      return res.status(400).json({ success: false, error: 'Já existe uma gravação para esta consulta' });
    }
    
    // Converter base64 para buffer
    console.log('🔄 [Recording Upload Base64] Convertendo base64 para buffer...');
    
    let audioBuffer: Buffer;
    let fileSize: number;
    
    try {
      // Remover o prefixo data: se existir
      let base64Data = audio;
      if (audio.includes(',')) {
        base64Data = audio.split(',').pop() || audio;
      }
      
      audioBuffer = Buffer.from(base64Data, 'base64');
      fileSize = audioBuffer.length;
      
      console.log(`📊 [Recording Upload Base64] Tamanho do arquivo: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
      
      if (fileSize === 0) {
        throw new Error('Arquivo de áudio vazio após conversão');
      }
    } catch (bufferError) {
      console.error('❌ [Recording Upload Base64] Erro ao converter base64:', bufferError);
      return res.status(400).json({ 
        success: false, 
        error: 'Erro ao processar dados de áudio base64',
        details: bufferError instanceof Error ? bufferError.message : 'Erro desconhecido'
      });
    }
    
    // Salvar arquivo localmente
    const localDir = path.join(process.cwd(), 'uploads', 'recordings', appointmentIdNum.toString());
    console.log(`📁 [Recording Upload Base64] Criando diretório: ${localDir}`);
    await fs.mkdir(localDir, { recursive: true });
    
    const fileName = `recording-${Date.now()}.webm`;
    const localPath = path.join(localDir, fileName);
    console.log(`💾 [Recording Upload Base64] Salvando arquivo: ${localPath}`);
    
    await fs.writeFile(localPath, audioBuffer);
    const audioUrl = `/uploads/recordings/${appointmentIdNum}/${fileName}`;
    
    console.log(`✅ [Recording Upload Base64] Arquivo salvo. Tamanho: ${fileSize} bytes`);
    
    // Criar registro no banco
    const [recording] = await db.insert(consultationRecordings)
      .values({
        appointmentId: appointmentIdNum,
        doctorId,
        audioUrl,
        fileSize,
        transcriptionStatus: 'pending',
        aiProcessingStatus: 'pending',
        processingStartedAt: new Date(),
      })
      .returning();
      
    console.log(`✅ [Recording Upload Base64] Registro criado no banco. ID: ${recording.id}`);
    
    // Iniciar processamento assíncrono
    processRecording(recording.id).catch(error => {
      console.error('❌ [Recording Process] Erro no processamento:', error);
    });
    
    res.json({
      success: true,
      recordingId: recording.id,
      message: 'Gravação enviada com sucesso. Processamento iniciado.',
    });
    
  } catch (error) {
    console.error('❌ [Recording Upload Base64] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar gravação' });
  }
});

export default router;