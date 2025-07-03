import { Router, Request, Response } from 'express';
import { storage } from '../storage.js';
import { createRoom, createToken, getRoomDetails } from '../utils/daily.js';
import { startCloudRecording, stopCloudRecording, getRecordingDownloadUrl } from '../utils/daily-cloud-recording.js';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../db.js';
import { consultationRecordings } from '../../shared/schema.js';

const router = Router();

// Mapa para armazenar IDs de gravação por consulta
const recordingMap = new Map<number, { recordingId: string; startTime: number }>();

/**
 * POST /api/emergency/v2/cloud/join/:appointmentId
 * Médico entra na consulta e inicia gravação na nuvem
 */
router.post('/join/:appointmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.id;
    const appointmentId = parseInt(req.params.appointmentId);
    
    console.log(`🩺 [Emergency Cloud] Médico ${doctorId} entrando na consulta ${appointmentId}`);
    
    // Buscar dados da consulta
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    
    // Verificar se é médico
    const doctor = await storage.getDoctor(doctorId);
    if (!doctor) {
      return res.status(403).json({ error: 'Apenas médicos podem atender consultas' });
    }
    
    // Criar token para o médico
    const roomName = appointment.telemedRoomName;
    const token = await createToken(roomName, {
      user_id: doctorId.toString(),
      user_name: doctor.name,
      is_owner: true,
      enable_recording: 'cloud', // Habilitar gravação na nuvem
      start_video_off: false,
      start_audio_off: false
    });
    
    // Atualizar consulta com médico
    await storage.updateAppointment(appointmentId, {
      doctorId: doctorId,
      status: 'in_progress'
    });
    
    // Iniciar gravação na nuvem automaticamente
    try {
      console.log('☁️ [Emergency Cloud] Iniciando gravação automática na nuvem...');
      
      const { startCloudRecording } = await import('../utils/daily-cloud-recording.js');
      const recording = await startCloudRecording({
        roomName: roomName,
        layout: 'default',
        maxDuration: 3600 // 1 hora máximo
      });
      
      // Salvar ID da gravação
      recordingMap.set(appointmentId, {
        recordingId: recording.id,
        startTime: recording.startTime
      });
      
      // Criar registro no banco
      await db.insert(consultationRecordings).values({
        appointmentId,
        doctorId,
        audioUrl: '', // Será preenchido quando a gravação estiver pronta
        cloudRecordingId: recording.id,
        transcriptionStatus: 'pending',
        aiProcessingStatus: 'pending',
        processingStartedAt: new Date()
      });
      
      console.log('✅ [Emergency Cloud] Gravação na nuvem iniciada:', recording.id);
      
    } catch (recordingError) {
      console.error('⚠️ [Emergency Cloud] Erro ao iniciar gravação, mas consulta continua:', recordingError);
      // Não falhar a consulta se a gravação falhar
    }
    
    res.json({
      success: true,
      roomName,
      roomUrl: `https://cnvidas.daily.co/${roomName}`,
      token,
      appointmentId,
      patientName: appointment.patientName,
      cloudRecording: recordingMap.has(appointmentId)
    });
    
  } catch (error) {
    console.error('❌ [Emergency Cloud] Erro:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

/**
 * POST /api/emergency/v2/cloud/complete/:appointmentId
 * Finalizar consulta e parar gravação na nuvem
 */
router.post('/complete/:appointmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    const doctorId = req.user!.id;
    
    console.log(`🏁 [Emergency Cloud] Finalizando consulta ${appointmentId}`);
    
    // Verificar se há gravação ativa
    const recordingInfo = recordingMap.get(appointmentId);
    if (recordingInfo) {
      try {
        console.log('🛑 [Emergency Cloud] Parando gravação na nuvem...');
        
        await stopCloudRecording(recordingInfo.recordingId);
        
        // Calcular duração
        const duration = Math.floor((Date.now() - recordingInfo.startTime) / 1000);
        
        // Atualizar registro no banco
        await db.update(consultationRecordings)
          .set({
            duration,
            processingCompletedAt: new Date()
          })
          .where(eq(consultationRecordings.appointmentId, appointmentId));
        
        // Remover do mapa
        recordingMap.delete(appointmentId);
        
        console.log(`✅ [Emergency Cloud] Gravação parada. Duração: ${duration}s`);
        
        // Agendar download e processamento da gravação
        setTimeout(async () => {
          await processCloudRecording(appointmentId, recordingInfo.recordingId);
        }, 5000); // Aguardar 5 segundos para o Daily processar
        
      } catch (error) {
        console.error('⚠️ [Emergency Cloud] Erro ao parar gravação:', error);
      }
    }
    
    // Atualizar status da consulta
    await storage.updateAppointment(appointmentId, {
      status: 'completed',
      endTime: new Date()
    });
    
    res.json({ 
      success: true, 
      message: 'Consulta concluída com sucesso',
      hasRecording: !!recordingInfo
    });
    
  } catch (error) {
    console.error('❌ [Emergency Cloud] Erro:', error);
    res.status(500).json({ error: 'Erro ao finalizar consulta' });
  }
});

/**
 * Processar gravação da nuvem
 */
async function processCloudRecording(appointmentId: number, recordingId: string) {
  try {
    console.log('🔄 [Emergency Cloud] Processando gravação da nuvem:', recordingId);
    
    // Obter URL de download
    const downloadUrl = await getRecordingDownloadUrl(recordingId);
    
    // Atualizar registro com URL
    await db.update(consultationRecordings)
      .set({
        audioUrl: downloadUrl,
        cloudRecordingUrl: downloadUrl
      })
      .where(eq(consultationRecordings.appointmentId, appointmentId));
    
    // Disparar processamento de transcrição e IA
    // (reutilizar código existente de processamento)
    
    console.log('✅ [Emergency Cloud] Gravação processada e disponível');
    
  } catch (error) {
    console.error('❌ [Emergency Cloud] Erro ao processar gravação:', error);
    
    await db.update(consultationRecordings)
      .set({
        transcriptionStatus: 'error',
        aiProcessingStatus: 'error',
        processingError: error.message
      })
      .where(eq(consultationRecordings.appointmentId, appointmentId));
  }
}

export default router;