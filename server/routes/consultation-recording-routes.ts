import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth-unified';
import { uploadToS3 } from '../utils/s3-upload';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY || '';
if (!openaiApiKey) {
  console.error('⚠️ [ConsultationRecording] OPENAI_API_KEY não configurada!');
} else {
  console.log('✅ [ConsultationRecording] OpenAI API Key configurada');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Configurar multer para upload temporário
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'temp-uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `recording-${uniqueSuffix}.webm`);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de áudio inválido'));
    }
  }
});

// Upload de gravação
router.post('/upload', requireAuth, upload.single('audio'), async (req: AuthRequest, res) => {
  try {
    console.log('📥 [Recording Upload] Recebendo upload de gravação de consulta...');
    console.log('📥 [Recording Upload] Headers:', req.headers);
    console.log('📥 [Recording Upload] Body:', req.body);
    
    const { appointmentId } = req.body;
    const userId = req.user?.id;
    const file = req.file;
    
    console.log('📋 [Recording Upload] Dados recebidos:', {
      userId,
      appointmentId,
      fileSize: file?.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      mimeType: file?.mimetype,
      filename: file?.filename,
      timestamp: new Date().toISOString()
    });

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    if (!file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    if (!appointmentId) {
      return res.status(400).json({ success: false, error: 'ID da consulta não fornecido' });
    }

    // Verificar se o usuário é médico e tem acesso à consulta
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { doctors: true }
    });

    if (!user || user.role !== 'doctor') {
      await fs.unlink(file.path); // Limpar arquivo temporário
      return res.status(403).json({ success: false, error: 'Apenas médicos podem gravar consultas' });
    }

    // Verificar se a consulta existe e pertence ao médico
    const appointment = await prisma.appointments.findFirst({
      where: {
        id: parseInt(appointmentId),
        doctor_id: user.doctors[0]?.id
      }
    });

    if (!appointment) {
      await fs.unlink(file.path);
      return res.status(404).json({ success: false, error: 'Consulta não encontrada' });
    }

    // Verificar se já existe gravação para esta consulta
    const existingRecording = await prisma.consultation_recordings.findUnique({
      where: { appointment_id: appointment.id }
    });

    if (existingRecording) {
      await fs.unlink(file.path);
      return res.status(400).json({ success: false, error: 'Já existe uma gravação para esta consulta' });
    }

    // Upload para S3 (ou outro storage)
    let audioUrl: string;
    try {
      audioUrl = await uploadToS3(file.path, `recordings/${appointmentId}/${file.filename}`);
    } catch (error) {
      console.error('⚠️ [Recording Upload] Erro no upload S3:', error);
      // Se não tiver S3 configurado, salvar localmente
      const localDir = path.join(process.cwd(), 'uploads', 'recordings', appointmentId.toString());
      console.log(`📁 [Recording Upload] Criando diretório local: ${localDir}`);
      await fs.mkdir(localDir, { recursive: true });
      const localPath = path.join(localDir, file.filename);
      console.log(`💾 [Recording Upload] Movendo arquivo para: ${localPath}`);
      await fs.rename(file.path, localPath);
      audioUrl = `uploads/recordings/${appointmentId}/${file.filename}`; // Sem barra inicial
      console.log(`✅ [Recording Upload] Arquivo salvo localmente. URL: ${audioUrl}`);
    }

    // Criar registro no banco
    const recording = await prisma.consultation_recordings.create({
      data: {
        appointment_id: appointment.id,
        audio_url: audioUrl,
        transcription_status: 'pending',
        processing_started_at: new Date()
      }
    });

    // Limpar arquivo temporário se ainda existir
    try {
      await fs.unlink(file.path);
    } catch (error) {
      // Ignorar se já foi movido
    }

    // Iniciar processamento assíncrono
    processRecording(recording.id).catch(error => {
      console.error('Erro no processamento assíncrono:', error);
    });

    res.json({
      success: true,
      recordingId: recording.id,
      message: 'Gravação enviada para processamento'
    });

  } catch (error: any) {
    console.error('Erro no upload:', error);
    
    // Limpar arquivo temporário em caso de erro
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignorar
      }
    }

    res.status(500).json({
      success: false,
      error: 'Erro ao processar gravação'
    });
  }
});

// Função auxiliar para formatar SOAP estruturado em texto
function formatSoapToText(soap: any): string {
  if (!soap) return '';
  
  let text = '';
  
  // Identificação
  if (soap.identificacao) {
    text += '=== IDENTIFICAÇÃO ===\n';
    if (typeof soap.identificacao === 'string') {
      text += soap.identificacao + '\n';
    } else {
      Object.entries(soap.identificacao).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
    }
    text += '\n';
  }
  
  // Subjetivo
  if (soap.subjetivo) {
    text += '=== SUBJETIVO (S) ===\n';
    if (typeof soap.subjetivo === 'string') {
      text += soap.subjetivo + '\n';
    } else {
      Object.entries(soap.subjetivo).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
    }
    text += '\n';
  }
  
  // Objetivo
  if (soap.objetivo) {
    text += '=== OBJETIVO (O) ===\n';
    if (typeof soap.objetivo === 'string') {
      text += soap.objetivo + '\n';
    } else {
      Object.entries(soap.objetivo).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
    }
    text += '\n';
  }
  
  // Avaliação
  if (soap.avaliacao) {
    text += '=== AVALIAÇÃO (A) ===\n';
    if (typeof soap.avaliacao === 'string') {
      text += soap.avaliacao + '\n';
    } else {
      Object.entries(soap.avaliacao).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
    }
    text += '\n';
  }
  
  // Plano
  if (soap.plano) {
    text += '=== PLANO (P) ===\n';
    if (typeof soap.plano === 'string') {
      text += soap.plano + '\n';
    } else {
      Object.entries(soap.plano).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
    }
  }
  
  return text.trim();
}

// Função assíncrona para processar a gravação
async function processRecording(recordingId: number) {
  console.log(`\n🎯 [ProcessRecording] ===== INICIANDO PROCESSAMENTO =====`);
  console.log(`📝 [ProcessRecording] Recording ID: ${recordingId}`);
  console.log(`🕐 [ProcessRecording] Timestamp: ${new Date().toISOString()}`);
  console.log(`🔑 [ProcessRecording] OpenAI API Key configurada: ${!!process.env.OPENAI_API_KEY}`);
  
  try {
    const recording = await prisma.consultation_recordings.findUnique({
      where: { id: recordingId },
      include: {
        appointments: {
          include: {
            users: true,
            doctors: {
              include: {
                users: true
              }
            }
          }
        }
      }
    });

    if (!recording || !recording.audio_url) {
      throw new Error('Gravação não encontrada');
    }

    console.log(`📂 [ProcessRecording] Gravação encontrada:`, {
      id: recording.id,
      appointmentId: recording.appointment_id,
      audioUrl: recording.audio_url,
      status: recording.transcription_status
    });

    // Baixar áudio se estiver em URL externa
    let audioPath = recording.audio_url;
    if (audioPath.startsWith('http')) {
      // TODO: Implementar download de URL externa
      throw new Error('Download de URL externa não implementado');
    } else {
      // Arquivo local
      audioPath = path.join(process.cwd(), audioPath);
    }

    console.log(`📤 [ProcessRecording] Verificando arquivo de áudio: ${audioPath}`);
    
    // Verificar se o arquivo existe
    try {
      await fs.access(audioPath);
      const stats = await fs.stat(audioPath);
      console.log(`✅ [ProcessRecording] Arquivo encontrado. Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error(`❌ [ProcessRecording] Arquivo não encontrado: ${audioPath}`);
      throw new Error(`Arquivo de áudio não encontrado: ${audioPath}`);
    }

    // Transcrever com Whisper
    console.log('🎤 [ProcessRecording] Iniciando transcrição com Whisper...');
    const audioFile = await fs.readFile(audioPath);
    
    console.log('📡 [ProcessRecording] Enviando para API do OpenAI...');
    console.log(`📊 [ProcessRecording] Tamanho do arquivo: ${(audioFile.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 [ProcessRecording] Caminho do arquivo: ${audioPath}`);
    
    let transcription: string;
    
    try {
      // Usar fs.createReadStream para o arquivo
      const audioStream = fsSync.createReadStream(audioPath);
      
      const transcriptionResult = await openai.audio.transcriptions.create({
        file: audioStream as any,
        model: 'whisper-1',
        language: 'pt',
        response_format: 'text'
      });
      
      transcription = transcriptionResult;

      console.log(`✅ [ProcessRecording] Transcrição concluída. Tamanho: ${transcription.length} caracteres`);
      console.log(`📝 [ProcessRecording] Primeiros 200 caracteres da transcrição:`, transcription.substring(0, 200) + '...');
    } catch (transcriptionError: any) {
      console.error(`❌ [ProcessRecording] Erro na transcrição:`, transcriptionError);
      console.error(`📋 [ProcessRecording] Detalhes do erro:`, {
        message: transcriptionError.message,
        status: transcriptionError.response?.status,
        data: transcriptionError.response?.data,
        stack: transcriptionError.stack
      });
      throw new Error(`Erro na transcrição: ${transcriptionError.message}`);
    }

    // Atualizar transcrição no banco
    await prisma.consultation_recordings.update({
      where: { id: recordingId },
      data: {
        transcription: transcription,
        transcription_status: 'transcribed'
      }
    });

    console.log(`💾 [ProcessRecording] Transcrição salva no banco de dados`);

    // Gerar prontuário e prescrição com GPT-4
    console.log('🤖 [ProcessRecording] Gerando prontuário com IA (GPT-4)...');
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente médico especializado em criar prontuários médicos estruturados e prescrições médicas.
          
          Analise a transcrição da consulta e crie:
          1. Um prontuário no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano)
          2. Uma prescrição médica detalhada (se medicamentos foram mencionados)
          
          IMPORTANTE: Retorne a resposta em formato JSON com a seguinte estrutura:
          {
            "soap": {
              "identificacao": {...},
              "subjetivo": {...},
              "objetivo": {...},
              "avaliacao": {...},
              "plano": {...}
            },
            "prescricao": {
              "medicamentos": [
                {
                  "nome": "Nome do medicamento",
                  "dosagem": "Ex: 500mg",
                  "via": "Ex: Via oral",
                  "frequencia": "Ex: 2x ao dia",
                  "duracao": "Ex: 7 dias",
                  "quantidade": "Ex: 14 comprimidos",
                  "instrucoes": "Ex: Tomar após as refeições"
                }
              ],
              "observacoes": "Observações gerais da prescrição"
            }
          }
          
          Estrutura do prontuário SOAP:
          
          1. IDENTIFICAÇÃO
          - Data e hora da consulta
          - Médico responsável
          - Paciente
          
          2. SUBJETIVO (S)
          - Queixa principal
          - História da doença atual
          - Sintomas relatados
          
          3. OBJETIVO (O)
          - Exame físico mencionado
          - Sinais vitais (se mencionados)
          - Observações clínicas
          
          4. AVALIAÇÃO (A)
          - Hipóteses diagnósticas
          - Diagnóstico provável
          - CID-10 sugerido (se aplicável)
          
          5. PLANO (P)
          - Conduta terapêutica
          - Medicações prescritas
          - Exames solicitados
          - Orientações
          - Retorno
          
          Para a PRESCRIÇÃO:
          - Extraia TODOS os medicamentos mencionados na consulta
          - Inclua dosagem, via de administração, frequência e duração
          - Se alguma informação não foi mencionada, indique como "Não especificado"
          - Adicione instruções especiais quando mencionadas
          - Se nenhum medicamento foi prescrito, retorne um array vazio
          
          Seja conciso, objetivo e use terminologia médica apropriada.
          Destaque informações importantes como alergias, contraindicações ou alertas.`
        },
        {
          role: 'user',
          content: `Por favor, crie um prontuário médico estruturado e prescrição baseados nesta transcrição de consulta:
          
          Médico: Dr. ${recording.appointments?.doctors?.users?.full_name}
          Paciente: ${recording.appointments?.users?.full_name}
          
          Transcrição:
          ${transcription}`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const aiGeneratedContent = aiResponse.choices[0].message.content;
    
    console.log(`✅ [ProcessRecording] Prontuário gerado pela IA. Tamanho: ${aiGeneratedContent?.length || 0} caracteres`);

    // Parse o JSON retornado pela IA
    let parsedContent;
    try {
      parsedContent = JSON.parse(aiGeneratedContent || '{}');
    } catch (error) {
      console.error('❌ [ProcessRecording] Erro ao fazer parse do JSON da IA:', error);
      // Fallback para formato antigo se falhar o parse
      parsedContent = {
        soap: aiGeneratedContent,
        prescricao: { medicamentos: [], observacoes: '' }
      };
    }

    // Formatar o conteúdo SOAP como texto para compatibilidade
    const soapText = typeof parsedContent.soap === 'string' 
      ? parsedContent.soap 
      : formatSoapToText(parsedContent.soap);

    // Atualizar com prontuário gerado
    await prisma.consultation_recordings.update({
      where: { id: recordingId },
      data: {
        ai_generated_notes: soapText,
        transcription_status: 'completed',
        processing_completed_at: new Date()
      }
    });

    console.log(`💾 [ProcessRecording] Notas da IA salvas no banco de dados`);

    // Criar prontuário médico em rascunho
    console.log(`📄 [ProcessRecording] Criando prontuário médico...`);
    const medicalRecord = await prisma.medical_records.create({
      data: {
        patient_id: recording.appointments!.user_id,
        doctor_id: recording.appointments!.doctors!.user_id,
        appointment_id: recording.appointments!.id,
        recording_id: recording.id,
        content: {
          type: 'SOAP',
          data: soapText,
          prescription: parsedContent.prescricao || { medicamentos: [], observacoes: '' }
        },
        status: 'draft',
        ai_generated: true
      }
    });

    console.log(`✅ [ProcessRecording] Prontuário criado com sucesso! ID: ${medicalRecord.id}`);
    console.log(`🎉 [ProcessRecording] Processamento concluído para gravação ${recordingId}`);
    console.log(`🔗 [ProcessRecording] Prontuário disponível em: /doctor/medical-records/edit?recordId=${medicalRecord.id}`);

  } catch (error: any) {
    console.error(`❌ [ProcessRecording] Erro no processamento da gravação ${recordingId}:`, error);
    console.error(`📝 [ProcessRecording] Stack trace:`, error.stack);
    
    // Atualizar status de erro
    await prisma.consultation_recordings.update({
      where: { id: recordingId },
      data: {
        transcription_status: 'error',
        processing_error: error.message,
        processing_completed_at: new Date()
      }
    });
    
    console.log(`🚨 [ProcessRecording] Status de erro salvo no banco de dados`);
  }
}

// Obter status de processamento
router.get('/status/:recordingId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    // Verificar se o usuário tem acesso
    const recording = await prisma.consultation_recordings.findFirst({
      where: {
        id: parseInt(recordingId),
        appointments: {
          OR: [
            { user_id: userId },
            { doctors: { user_id: userId } }
          ]
        }
      },
      include: {
        medical_records: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ success: false, error: 'Gravação não encontrada' });
    }

    res.json({
      success: true,
      recording: {
        id: recording.id,
        status: recording.transcription_status,
        hasTranscription: !!recording.transcription,
        hasAiNotes: !!recording.ai_generated_notes,
        medicalRecordId: recording.medical_records[0]?.id,
        error: recording.processing_error,
        createdAt: recording.created_at,
        completedAt: recording.processing_completed_at
      }
    });

  } catch (error: any) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status da gravação'
    });
  }
});

// Obter transcrição
router.get('/transcription/:recordingId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    const recording = await prisma.consultation_recordings.findFirst({
      where: {
        id: parseInt(recordingId),
        appointments: {
          OR: [
            { user_id: userId },
            { doctors: { user_id: userId } }
          ]
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ success: false, error: 'Gravação não encontrada' });
    }

    if (!recording.transcription) {
      return res.status(404).json({ success: false, error: 'Transcrição ainda não disponível' });
    }

    res.json({
      success: true,
      transcription: recording.transcription,
      aiNotes: recording.ai_generated_notes
    });

  } catch (error: any) {
    console.error('Erro ao obter transcrição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter transcrição'
    });
  }
});

// Obter gravação por appointmentId
router.get('/appointment/:appointmentId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    console.log('🔍 [Recording] Buscando gravação para appointment:', appointmentId);

    // Buscar gravação relacionada à consulta
    const recording = await prisma.consultation_recordings.findUnique({
      where: { appointment_id: appointmentId },
      include: {
        medical_records: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!recording) {
      console.log('❌ [Recording] Nenhuma gravação encontrada para appointment:', appointmentId);
      return res.status(404).json({ success: false, error: 'Gravação não encontrada' });
    }

    console.log('✅ [Recording] Gravação encontrada:', {
      id: recording.id,
      status: recording.transcription_status,
      medicalRecordId: recording.medical_records[0]?.id
    });

    res.json({
      success: true,
      recording: {
        id: recording.id,
        status: recording.transcription_status,
        hasTranscription: !!recording.transcription,
        hasAiNotes: !!recording.ai_generated_notes,
        medicalRecordId: recording.medical_records[0]?.id,
        error: recording.processing_error,
        createdAt: recording.created_at,
        completedAt: recording.processing_completed_at
      }
    });

  } catch (error: any) {
    console.error('Erro ao obter gravação por appointmentId:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter gravação'
    });
  }
});

// Obter gravação
router.get('/:recordingId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const recordingId = parseInt(req.params.recordingId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    // Verificar se o usuário tem acesso
    const recording = await prisma.consultation_recordings.findFirst({
      where: {
        id: recordingId,
        appointments: {
          OR: [
            { user_id: userId },
            { doctors: { user_id: userId } }
          ]
        }
      },
      include: {
        medical_records: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ success: false, error: 'Gravação não encontrada' });
    }

    res.json({
      success: true,
      recording: {
        id: recording.id,
        status: recording.transcription_status,
        hasTranscription: !!recording.transcription,
        hasAiNotes: !!recording.ai_generated_notes,
        medicalRecordId: recording.medical_records[0]?.id,
        error: recording.processing_error,
        createdAt: recording.created_at,
        completedAt: recording.processing_completed_at
      }
    });

  } catch (error: any) {
    console.error('Erro ao obter gravação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter gravação'
    });
  }
});

// Deletar gravação
router.delete('/:recordingId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const recordingId = parseInt(req.params.recordingId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    // Verificar se o usuário tem acesso
    const recording = await prisma.consultation_recordings.findFirst({
      where: {
        id: recordingId,
        appointments: {
          OR: [
            { user_id: userId },
            { doctors: { user_id: userId } }
          ]
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ success: false, error: 'Gravação não encontrada' });
    }

    // Remover gravação do banco
    await prisma.consultation_recordings.delete({
      where: { id: recordingId }
    });

    res.json({
      success: true,
      message: 'Gravação removida com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao deletar gravação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar gravação'
    });
  }
});

export default router;