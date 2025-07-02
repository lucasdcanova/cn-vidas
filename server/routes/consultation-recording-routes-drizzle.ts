import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { consultationRecordings, appointments, doctors, users } from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authenticateToken, requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { storage } from '../storage.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    // Buscar prontuário médico AI relacionado se existir
    console.log('🔍 [Recording] Buscando prontuário médico para appointment:', appointmentId);
    const medicalRecord = await prisma.medical_records.findFirst({
      where: { 
        appointment_id: appointmentId
      }
    });
    
    if (medicalRecord) {
      console.log('✅ [Recording] Prontuário médico encontrado:', medicalRecord.id);
    } else {
      console.log('❌ [Recording] Nenhum prontuário médico encontrado para esta consulta');
    }
    
    // Determinar status baseado no processamento
    let status = 'pending';
    if (recording.transcriptionStatus === 'failed' || recording.aiProcessingStatus === 'failed') {
      status = 'error';
    } else if (recording.aiProcessingStatus === 'completed' && medicalRecord) {
      status = 'completed';
    } else if (recording.transcriptionStatus === 'completed') {
      status = 'transcribed';
    } else if (recording.transcriptionStatus === 'processing' || recording.aiProcessingStatus === 'processing') {
      status = 'processing';
    }
    
    console.log('✅ [Recording] Gravação encontrada:', {
      id: recording.id,
      transcriptionStatus: recording.transcriptionStatus,
      aiProcessingStatus: recording.aiProcessingStatus,
      medicalRecordId: medicalRecord?.id,
      status
    });

    res.json({
      success: true,
      recording: {
        id: recording.id,
        status,
        hasTranscription: !!recording.transcription,
        hasAiNotes: !!recording.soapNote,
        medicalRecordId: medicalRecord?.id,
        error: recording.transcriptionError || recording.aiProcessingError,
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
    console.log('🎯 [Recording Process] Iniciando criação do prontuário médico...');
    const medicalRecord = await createMedicalRecordFromRecording(recording.appointmentId, recording.doctorId, aiContent);
    
    if (medicalRecord) {
      console.log(`✅ [Recording Process] Prontuário médico criado com ID: ${medicalRecord.id}`);
    } else {
      console.log('⚠️ [Recording Process] Prontuário médico não foi criado (pode já existir)');
    }
    
    console.log(`✅ [Recording Process] Processamento concluído para gravação ${recordingId}`);
    
  } catch (error) {
    console.error(`❌ [Recording Process] Erro no processamento:`, error);
    console.error(`❌ [Recording Process] Stack trace:`, error.stack);
    console.error(`❌ [Recording Process] Tipo do erro:`, error.constructor.name);
    
    // Log adicional para debug
    if (error.response) {
      console.error(`❌ [Recording Process] Response data:`, error.response.data);
      console.error(`❌ [Recording Process] Response status:`, error.response.status);
    }
    
    // Atualizar status de erro
    await db.update(consultationRecordings)
      .set({
        transcriptionStatus: 'failed',
        aiProcessingStatus: 'failed',
        transcriptionError: error instanceof Error ? error.message : 'Erro desconhecido',
        aiProcessingError: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      .where(eq(consultationRecordings.id, recordingId));
  }
}

// Criar prontuário médico a partir da gravação
async function createMedicalRecordFromRecording(appointmentId: number, doctorId: number, aiContent: any) {
  try {
    console.log('📋 [Medical Record] Criando prontuário médico com IA a partir da gravação...');
    console.log('📋 [Medical Record] Dados:', { appointmentId, doctorId });
    console.log('📋 [Medical Record] AI Content recebido:', JSON.stringify(aiContent, null, 2));
    
    // Buscar informações da consulta e do médico
    const [appointment] = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) {
      console.error('❌ [Medical Record] Consulta não encontrada para ID:', appointmentId);
      throw new Error('Consulta não encontrada');
    }

    console.log('📋 [Medical Record] Consulta encontrada:', { 
      id: appointment.id, 
      userId: appointment.userId,
      doctorId: appointment.doctorId,
      date: appointment.date
    });

    // Buscar o userId do médico
    const [doctor] = await db.select()
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.id, doctorId))
      .limit(1);

    if (!doctor) {
      console.error('❌ [Medical Record] Médico não encontrado para ID:', doctorId);
      throw new Error('Médico não encontrado');
    }

    const doctorUserId = doctor.users.id;
    console.log('📋 [Medical Record] Médico encontrado - userId:', doctorUserId);

    // Verificar se já existe prontuário AI para esta consulta
    console.log('📋 [Medical Record] Verificando prontuários existentes...');
    const existingRecords = await prisma.medical_records.findFirst({
      where: { 
        appointment_id: appointmentId
      }
    });

    if (existingRecords) {
      console.log('⚠️ [Medical Record] Prontuário já existe para esta consulta:', existingRecords.id);
      return existingRecords;
    }

    // Formatar conteúdo SOAP
    const soap = aiContent.soap_note || {};
    const soapContent = `SUBJETIVO:\n${soap.subjetivo || 'Não informado'}\n\n` +
                       `OBJETIVO:\n${soap.objetivo || 'Não informado'}\n\n` +
                       `AVALIAÇÃO:\n${soap.avaliacao || 'Não informado'}\n\n` +
                       `PLANO:\n${soap.plano || 'Não informado'}`;

    // Formatar prescrições
    const prescriptionData = aiContent.prescricoes?.map((med: any) => ({
      nome: med.medicamento || med.nome,
      dosagem: med.dosagem,
      via: med.via || 'Oral',
      frequencia: med.posologia || med.frequencia,
      duracao: med.duracao,
      quantidade: med.quantidade || '1 caixa',
      instrucoes: med.orientacoes || med.instrucoes
    })) || [];

    // Criar prontuário no sistema de IA
    const newRecord = await prisma.medical_records.create({
      data: {
        patient_id: appointment.userId,
        doctor_id: doctorUserId,
        appointment_id: appointmentId,
        content: {
          type: 'SOAP',
          data: soapContent,
          transcription: aiContent.transcricao,
          prescription: {
            medicamentos: prescriptionData,
            observacoes: aiContent.observacoes_prescricao || ''
          }
        },
        status: 'draft',
        ai_generated: true
      }
    });

    console.log('✅ [Medical Record] Prontuário AI criado com sucesso:', newRecord.id);
    console.log('📋 [Medical Record] Detalhes do prontuário criado:', {
      id: newRecord.id,
      patient_id: newRecord.patient_id,
      doctor_id: newRecord.doctor_id,
      appointment_id: newRecord.appointment_id,
      status: newRecord.status,
      ai_generated: newRecord.ai_generated
    });

    // Log do prontuário criado - removido update pois não há coluna medicalRecordId
    console.log('✅ [Medical Record] Prontuário vinculado à consulta:', appointmentId);
    
    // Retornar o prontuário criado
    return newRecord;
    
  } catch (error) {
    console.error('❌ [Medical Record] Erro ao criar prontuário:', error);
    console.error('❌ [Medical Record] Stack trace:', error.stack);
    throw error;
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
      // Log detalhado do tipo de dados recebido
      console.log('🔍 [Recording Upload Base64] Tipo de dados audio:', typeof audio);
      console.log('🔍 [Recording Upload Base64] Primeiros 200 chars:', audio.substring(0, 200));
      
      // Remover o prefixo data: se existir
      let base64Data = audio;
      if (audio.includes(',')) {
        console.log('🔍 [Recording Upload Base64] Detectado prefixo data:, removendo...');
        const parts = audio.split(',');
        console.log('🔍 [Recording Upload Base64] Prefixo:', parts[0]);
        base64Data = parts[1] || audio;
      }
      
      // Validar se é base64 válido
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64Data.replace(/\s/g, ''))) {
        console.error('❌ [Recording Upload Base64] String base64 inválida');
        console.log('🔍 [Recording Upload Base64] Primeiros 100 chars do base64:', base64Data.substring(0, 100));
        console.log('🔍 [Recording Upload Base64] Últimos 100 chars do base64:', base64Data.substring(base64Data.length - 100));
        throw new Error('String base64 contém caracteres inválidos');
      }
      
      // Remover espaços em branco se houver
      base64Data = base64Data.replace(/\s/g, '');
      console.log('🔍 [Recording Upload Base64] Tamanho do base64 limpo:', base64Data.length);
      
      // Tentar converter em blocos menores para evitar problemas de memória
      console.log('🔄 [Recording Upload Base64] Convertendo base64 para buffer...');
      
      try {
        audioBuffer = Buffer.from(base64Data, 'base64');
        fileSize = audioBuffer.length;
        
        console.log(`📊 [Recording Upload Base64] Conversão bem-sucedida! Tamanho do arquivo: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (fileSize === 0) {
          throw new Error('Arquivo de áudio vazio após conversão');
        }
        
        // Verificar se o buffer parece ser um arquivo de áudio válido
        const header = audioBuffer.slice(0, 4).toString('hex');
        console.log('🔍 [Recording Upload Base64] Header do arquivo (hex):', header);
        
      } catch (conversionError) {
        console.error('❌ [Recording Upload Base64] Erro específico na conversão Buffer.from:', conversionError);
        console.error('Stack trace:', conversionError.stack);
        throw conversionError;
      }
      
    } catch (bufferError) {
      console.error('❌ [Recording Upload Base64] Erro ao converter base64:', bufferError);
      console.error('Stack trace completo:', bufferError.stack);
      
      // Log adicional para debug
      console.log('🔍 [Recording Upload Base64] Informações de debug:');
      console.log('- Tamanho do audio recebido:', audio?.length || 0);
      console.log('- Tipo do audio:', typeof audio);
      console.log('- Audio é string?:', typeof audio === 'string');
      console.log('- Audio está vazio?:', !audio || audio.length === 0);
      
      return res.status(400).json({ 
        success: false, 
        error: 'Erro ao processar dados de áudio base64',
        details: bufferError instanceof Error ? bufferError.message : 'Erro desconhecido',
        debug: {
          audioLength: audio?.length || 0,
          audioType: typeof audio,
          errorMessage: bufferError.message,
          errorStack: process.env.NODE_ENV !== 'production' ? bufferError.stack : undefined
        }
      });
    }
    
    // Salvar arquivo localmente
    const localDir = path.join(process.cwd(), 'uploads', 'recordings', appointmentIdNum.toString());
    console.log(`📁 [Recording Upload Base64] Criando diretório: ${localDir}`);
    
    try {
      await fs.mkdir(localDir, { recursive: true });
      console.log(`✅ [Recording Upload Base64] Diretório criado ou já existe: ${localDir}`);
    } catch (dirError: any) {
      console.error('❌ [Recording Upload Base64] Erro ao criar diretório:', dirError);
      console.error('- Erro:', dirError.message);
      console.error('- Código:', dirError.code);
      console.error('- Path:', localDir);
      throw new Error(`Falha ao criar diretório de uploads: ${dirError.message}`);
    }
    
    const fileName = `recording-${Date.now()}.webm`;
    const localPath = path.join(localDir, fileName);
    console.log(`💾 [Recording Upload Base64] Salvando arquivo: ${localPath}`);
    
    try {
      await fs.writeFile(localPath, audioBuffer);
      console.log(`✅ [Recording Upload Base64] Arquivo escrito com sucesso`);
      
      // Verificar se o arquivo foi realmente salvo
      const stats = await fs.stat(localPath);
      console.log(`📊 [Recording Upload Base64] Arquivo verificado - Tamanho: ${stats.size} bytes`);
      
      if (stats.size !== fileSize) {
        console.warn(`⚠️ [Recording Upload Base64] Tamanho do arquivo salvo (${stats.size}) diferente do esperado (${fileSize})`);
      }
    } catch (writeError: any) {
      console.error('❌ [Recording Upload Base64] Erro ao escrever arquivo:', writeError);
      console.error('- Erro:', writeError.message);
      console.error('- Código:', writeError.code);
      console.error('- Path:', localPath);
      throw new Error(`Falha ao salvar arquivo de áudio: ${writeError.message}`);
    }
    
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
    
  } catch (error: any) {
    console.error('❌ [Recording Upload Base64] Erro geral:', error);
    console.error('Stack trace:', error.stack);
    
    // Log detalhado do erro
    console.log('🔍 [Recording Upload Base64] Detalhes do erro:');
    console.log('- Tipo do erro:', error.constructor.name);
    console.log('- Mensagem:', error.message);
    console.log('- Código:', error.code);
    console.log('- Nome:', error.name);
    
    // Log adicional para debug em produção
    console.error('🚨 [Recording Upload Base64] Erro completo:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      requestBody: {
        hasAudio: !!req.body.audio,
        audioLength: req.body.audio?.length || 0,
        appointmentId: req.body.appointmentId,
        audioMimeType: req.body.audioMimeType
      }
    });
    
    // Verificar se é erro de payload muito grande
    if (error.message && error.message.includes('PayloadTooLargeError')) {
      return res.status(413).json({ 
        success: false, 
        error: 'Arquivo muito grande',
        details: 'O arquivo de áudio excede o tamanho máximo permitido'
      });
    }
    
    // Verificar se é erro de JSON parsing
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Erro ao processar dados JSON',
        details: 'Os dados enviados não estão em formato JSON válido'
      });
    }
    
    // Sempre retornar alguma informação útil, mesmo em produção
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar gravação',
      details: error.message || 'Erro interno do servidor',
      errorType: error.name || 'UnknownError'
    });
  }
});

export default router;