import fetch from 'node-fetch';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

interface StartRecordingParams {
  roomName: string;
  layout?: 'default' | 'single-participant' | 'active-speaker' | 'portrait' | 'landscape';
  maxDuration?: number; // em segundos
  backgroundColor?: string;
  instanceId?: string;
}

interface RecordingResponse {
  id: string;
  roomName: string;
  startTime: number;
  layout: string;
  status: 'recording' | 'stopped' | 'error';
  duration?: number;
  shareToken?: string;
  recordingId?: string;
}

/**
 * Inicia gravação na nuvem do Daily.co
 */
export async function startCloudRecording(params: StartRecordingParams): Promise<RecordingResponse> {
  try {
    console.log('☁️ [Daily Cloud Recording] Iniciando gravação na nuvem:', params.roomName);
    
    const response = await fetch(`${DAILY_API_URL}/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_name: params.roomName,
        layout: {
          preset: params.layout || 'default'
        },
        max_duration: params.maxDuration || 7200, // 2 horas padrão
        background_color: params.backgroundColor || '#000000',
        instance_id: params.instanceId,
        // Configurações específicas para consultas médicas
        options: {
          audio_only: true, // Apenas áudio para economizar espaço
          audio_bitrate: 128, // 128kbps para boa qualidade de voz
          video_bitrate: 0, // Sem vídeo
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('✅ [Daily Cloud Recording] Gravação iniciada:', data);
    
    return {
      id: data.id,
      roomName: params.roomName,
      startTime: Date.now(),
      layout: params.layout || 'default',
      status: 'recording',
      recordingId: data.id
    };
    
  } catch (error) {
    console.error('❌ [Daily Cloud Recording] Erro ao iniciar gravação:', error);
    throw error;
  }
}

/**
 * Para gravação na nuvem
 */
export async function stopCloudRecording(recordingId: string): Promise<void> {
  try {
    console.log('🛑 [Daily Cloud Recording] Parando gravação:', recordingId);
    
    const response = await fetch(`${DAILY_API_URL}/recordings/${recordingId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily API error: ${response.status} - ${error}`);
    }

    console.log('✅ [Daily Cloud Recording] Gravação parada');
    
  } catch (error) {
    console.error('❌ [Daily Cloud Recording] Erro ao parar gravação:', error);
    throw error;
  }
}

/**
 * Obter status e URL da gravação
 */
export async function getRecordingStatus(recordingId: string): Promise<any> {
  try {
    const response = await fetch(`${DAILY_API_URL}/recordings/${recordingId}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('❌ [Daily Cloud Recording] Erro ao buscar status:', error);
    throw error;
  }
}

/**
 * Obter URL de download da gravação
 */
export async function getRecordingDownloadUrl(recordingId: string): Promise<string> {
  try {
    console.log('📥 [Daily Cloud Recording] Obtendo URL de download:', recordingId);
    
    const response = await fetch(`${DAILY_API_URL}/recordings/${recordingId}/access-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valid_for_secs: 3600 // URL válida por 1 hora
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('✅ [Daily Cloud Recording] URL de download obtida');
    
    return data.download_link;
    
  } catch (error) {
    console.error('❌ [Daily Cloud Recording] Erro ao obter URL:', error);
    throw error;
  }
}

/**
 * Deletar gravação do Daily.co
 */
export async function deleteCloudRecording(recordingId: string): Promise<void> {
  try {
    console.log('🗑️ [Daily Cloud Recording] Deletando gravação:', recordingId);
    
    const response = await fetch(`${DAILY_API_URL}/recordings/${recordingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily API error: ${response.status} - ${error}`);
    }

    console.log('✅ [Daily Cloud Recording] Gravação deletada');
    
  } catch (error) {
    console.error('❌ [Daily Cloud Recording] Erro ao deletar:', error);
    throw error;
  }
}

/**
 * Configurar webhook para notificações de gravação
 */
export async function setupRecordingWebhook(webhookUrl: string): Promise<void> {
  try {
    console.log('🔔 [Daily Cloud Recording] Configurando webhook:', webhookUrl);
    
    // Implementação do webhook para receber notificações quando
    // a gravação estiver pronta para download
    
    // O Daily.co enviará notificações para:
    // - recording.started
    // - recording.stopped  
    // - recording.ready-to-download
    // - recording.error
    
  } catch (error) {
    console.error('❌ [Daily Cloud Recording] Erro ao configurar webhook:', error);
    throw error;
  }
}