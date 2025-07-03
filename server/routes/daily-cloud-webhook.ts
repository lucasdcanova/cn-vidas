import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { consultationRecordings } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { uploadToS3WithRetry, generateS3Key } from '../utils/s3-upload.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/webhooks/daily-recording
 * Webhook para receber notificações do Daily.co sobre gravações
 */
router.post('/daily-recording', async (req: Request, res: Response) => {
  try {
    console.log('🔔 [Daily Webhook] Notificação recebida:', req.body.type);
    
    const { type, payload } = req.body;
    
    switch (type) {
      case 'recording.started':
        await handleRecordingStarted(payload);
        break;
        
      case 'recording.stopped':
        await handleRecordingStopped(payload);
        break;
        
      case 'recording.ready-to-download':
        await handleRecordingReady(payload);
        break;
        
      case 'recording.error':
        await handleRecordingError(payload);
        break;
        
      default:
        console.log(`⚠️ [Daily Webhook] Tipo de evento não tratado: ${type}`);
    }
    
    // Sempre responder com 200 para o Daily.co
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ [Daily Webhook] Erro ao processar webhook:', error);
    // Ainda assim responder com 200 para evitar retry do Daily.co
    res.status(200).json({ received: true, error: true });
  }
});

/**
 * Quando a gravação inicia
 */
async function handleRecordingStarted(payload: any) {
  console.log('🔴 [Daily Webhook] Gravação iniciada:', payload);
  
  const { id: recordingId, room_name, start_ts } = payload;
  
  // Extrair appointmentId do nome da sala (ex: emergency-58-1751574517329)
  // O formato é emergency-{userId}-{timestamp}, mas precisamos buscar pelo nome da sala
  const appointmentMatch = await db.select()
    .from(consultationRecordings)
    .where(eq(consultationRecordings.roomName, room_name))
    .limit(1);
  
  if (!appointmentMatch || appointmentMatch.length === 0) {
    console.error('❌ [Daily Webhook] Não foi possível encontrar consulta para room_name:', room_name);
    return;
  }
  
  const appointmentId = appointmentMatch[0].appointmentId;
  
  // Atualizar registro de gravação
  await db.update(consultationRecordings)
    .set({
      cloudRecordingStatus: 'recording',
      processingStartedAt: new Date(start_ts * 1000)
    })
    .where(eq(consultationRecordings.appointmentId, appointmentId));
    
  console.log(`✅ [Daily Webhook] Status atualizado para 'recording' - appointment ${appointmentId}`);
}

/**
 * Quando a gravação para
 */
async function handleRecordingStopped(payload: any) {
  console.log('⏹️ [Daily Webhook] Gravação parada:', payload);
  
  const { id: recordingId, room_name, duration } = payload;
  
  // Buscar appointmentId pelo nome da sala
  const appointmentMatch = await db.select()
    .from(consultationRecordings)
    .where(eq(consultationRecordings.roomName, room_name))
    .limit(1);
  
  if (!appointmentMatch || appointmentMatch.length === 0) return;
  
  const appointmentId = appointmentMatch[0].appointmentId;
  
  // Atualizar duração
  await db.update(consultationRecordings)
    .set({
      cloudRecordingStatus: 'stopped',
      duration: Math.floor(duration)
    })
    .where(eq(consultationRecordings.appointmentId, appointmentId));
}

/**
 * Quando a gravação está pronta para download
 */
async function handleRecordingReady(payload: any) {
  console.log('✅ [Daily Webhook] Gravação pronta para download:', payload);
  
  const { id: recordingId, room_name, download_link, duration } = payload;
  
  // Buscar appointmentId pelo nome da sala
  const appointmentMatch = await db.select()
    .from(consultationRecordings)
    .where(eq(consultationRecordings.roomName, room_name))
    .limit(1);
  
  if (!appointmentMatch || appointmentMatch.length === 0) return;
  
  const appointmentId = appointmentMatch[0].appointmentId;
  
  try {
    // 1. Baixar o arquivo de áudio
    console.log('📥 [Daily Webhook] Baixando gravação...');
    const response = await fetch(download_link);
    const buffer = await response.buffer();
    
    // 2. Salvar temporariamente
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `recording-${appointmentId}.mp4`);
    await fs.writeFile(tempPath, buffer);
    
    console.log(`💾 [Daily Webhook] Arquivo salvo temporariamente: ${tempPath}`);
    
    // 3. Upload para S3
    let audioUrl = `/uploads/recordings/${appointmentId}/recording.mp4`;
    let finalPath = tempPath; // Caminho do arquivo para processar
    
    try {
      const s3Key = generateS3Key('recording', `consultation-${appointmentId}.mp4`);
      audioUrl = await uploadToS3WithRetry(tempPath, s3Key);
      console.log(`☁️ [Daily Webhook] Upload S3 concluído: ${audioUrl}`);
    } catch (s3Error) {
      console.warn('⚠️ [Daily Webhook] Falha no S3, usando armazenamento local');
      // Mover para pasta local
      const localDir = path.join(process.cwd(), 'uploads', 'recordings', appointmentId.toString());
      await fs.mkdir(localDir, { recursive: true });
      finalPath = path.join(localDir, 'recording.mp4');
      await fs.rename(tempPath, finalPath);
    }
    
    // 4. Atualizar registro
    await db.update(consultationRecordings)
      .set({
        audioUrl,
        cloudRecordingUrl: download_link,
        cloudRecordingStatus: 'completed',
        duration: Math.floor(duration),
        fileSize: buffer.length
      })
      .where(eq(consultationRecordings.appointmentId, appointmentId));
    
    // 5. Iniciar processamento de transcrição e IA
    console.log('🤖 [Daily Webhook] Iniciando processamento com IA...');
    await processRecordingWithAI(appointmentId, finalPath);
    
    // 6. Limpar arquivo temporário apenas se necessário
    if (finalPath === tempPath && audioUrl.startsWith('https://')) {
      // Arquivo foi enviado para S3 e ainda está no temp, pode limpar
      await fs.unlink(tempPath).catch(() => {});
    }
    
  } catch (error) {
    console.error('❌ [Daily Webhook] Erro ao processar gravação:', error);
    
    await db.update(consultationRecordings)
      .set({
        cloudRecordingStatus: 'error',
        aiProcessingStatus: 'error',
        aiProcessingError: error.message
      })
      .where(eq(consultationRecordings.appointmentId, appointmentId));
  }
}

/**
 * Quando há erro na gravação
 */
async function handleRecordingError(payload: any) {
  console.error('❌ [Daily Webhook] Erro na gravação:', payload);
  
  const { room_name, error_msg } = payload;
  
  // Buscar appointmentId pelo nome da sala
  const appointmentMatch = await db.select()
    .from(consultationRecordings)
    .where(eq(consultationRecordings.roomName, room_name))
    .limit(1);
  
  if (!appointmentMatch || appointmentMatch.length === 0) return;
  
  const appointmentId = appointmentMatch[0].appointmentId;
  
  await db.update(consultationRecordings)
    .set({
      cloudRecordingStatus: 'error',
      aiProcessingError: error_msg
    })
    .where(eq(consultationRecordings.appointmentId, appointmentId));
}

/**
 * Processar gravação com OpenAI
 */
async function processRecordingWithAI(appointmentId: number, audioPath: string) {
  try {
    // 1. Transcrever com Whisper
    console.log('🎤 [AI Processing] Transcrevendo áudio...');
    
    const audioFile = await fs.readFile(audioPath);
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: new File([audioFile], 'audio.mp4', { type: 'audio/mp4' }),
      model: 'whisper-1',
      language: 'pt',
    });
    
    const transcription = transcriptionResponse.text;
    console.log('✅ [AI Processing] Transcrição concluída:', transcription.substring(0, 100) + '...');
    
    // 2. Gerar prontuário com GPT-4
    console.log('🤖 [AI Processing] Gerando prontuário com IA...');
    
    const systemPrompt = `Você é um assistente médico especializado em criar prontuários médicos detalhados a partir de transcrições de consultas.
    
Analise a transcrição e crie um prontuário no formato SOAP incluindo:
- S (Subjetivo): Queixas e sintomas relatados pelo paciente
- O (Objetivo): Observações e dados objetivos
- A (Avaliação): Diagnóstico ou hipóteses diagnósticas
- P (Plano): Tratamento e condutas

Também extraia:
- Medicamentos prescritos (se houver)
- Exames solicitados (se houver)
- Orientações fornecidas
- Necessidade de retorno

Formate a resposta em JSON.`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcrição da consulta:\n\n${transcription}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const aiContent = JSON.parse(aiResponse.choices[0].message.content || '{}');
    console.log('✅ [AI Processing] Prontuário gerado com sucesso');
    
    // 3. Atualizar registro com dados processados
    await db.update(consultationRecordings)
      .set({
        transcription,
        transcriptionStatus: 'completed',
        soapNote: aiContent.soap || {},
        prescription: aiContent.prescription || {},
        summary: aiContent.summary || '',
        aiProcessingStatus: 'completed',
        processingCompletedAt: new Date()
      })
      .where(eq(consultationRecordings.appointmentId, appointmentId));
    
    // 4. Criar prontuário médico
    await createMedicalRecord(appointmentId, aiContent, transcription);
    
  } catch (error) {
    console.error('❌ [AI Processing] Erro:', error);
    
    await db.update(consultationRecordings)
      .set({
        aiProcessingStatus: 'error',
        aiProcessingError: error.message
      })
      .where(eq(consultationRecordings.appointmentId, appointmentId));
  }
}

/**
 * Criar prontuário médico no sistema
 */
async function createMedicalRecord(appointmentId: number, aiContent: any, transcription: string) {
  try {
    // Buscar dados da consulta
    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId }
    });
    
    if (!appointment) {
      throw new Error('Consulta não encontrada');
    }
    
    // Buscar o médico através da tabela doctors
    const doctor = await prisma.doctors.findUnique({
      where: { id: appointment.doctor_id },
      include: { users: true }
    });
    
    if (!doctor || !doctor.users) {
      throw new Error(`Médico não encontrado: doctorId ${appointment.doctor_id}`);
    }
    
    const doctorUser = doctor.users;
    
    // Formatar conteúdo SOAP
    const soapContent = `
**S - SUBJETIVO**
${aiContent.soap?.subjetivo || 'Não informado'}

**O - OBJETIVO**
${aiContent.soap?.objetivo || 'Não informado'}

**A - AVALIAÇÃO**
${aiContent.soap?.avaliacao || 'Não informado'}

**P - PLANO**
${aiContent.soap?.plano || 'Não informado'}

**OBSERVAÇÕES**
${aiContent.observacoes || ''}
`.trim();

    // Criar prontuário
    const newRecord = await prisma.medical_records.create({
      data: {
        patient_id: appointment.user_id,
        doctor_id: doctorUser.id,
        appointment_id: appointmentId,
        content: {
          type: 'SOAP',
          data: soapContent,
          transcription: transcription,
          prescription: aiContent.prescription || {}
        },
        status: 'draft',
        ai_generated: true
      }
    });
    
    console.log('✅ [Medical Record] Prontuário criado:', newRecord.id);
    
  } catch (error) {
    console.error('❌ [Medical Record] Erro ao criar prontuário:', error);
    throw error;
  }
}

export default router;