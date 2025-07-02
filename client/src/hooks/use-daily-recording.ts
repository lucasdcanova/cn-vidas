import { useState, useCallback, useRef, useEffect } from 'react';
import { DailyCall } from '@daily-co/daily-js';

interface UseDailyRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  recordingId: string | null;
}

interface UseDailyRecordingReturn extends UseDailyRecordingState {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ recordingId: string } | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

export function useDailyRecording(callObject: DailyCall | null): UseDailyRecordingReturn {
  const [state, setState] = useState<UseDailyRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
    recordingId: null
  });

  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }));
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    console.log('🎤 [useDailyRecording] Iniciando gravação via Daily.co...');
    
    if (!callObject) {
      console.error('❌ [useDailyRecording] Objeto de chamada Daily não disponível');
      setState(prev => ({ ...prev, error: 'Chamada não inicializada' }));
      return;
    }

    try {
      // Resetar estado
      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        error: null,
        recordingId: null
      });

      // Iniciar gravação no Daily
      console.log('🔄 [useDailyRecording] Chamando startRecording no Daily...');
      await callObject.startRecording({
        // Configurações de gravação
        layout: {
          preset: 'audio-only', // Apenas áudio
        },
      });

      // Atualizar estado
      startTimeRef.current = Date.now();
      startDurationTimer();
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null
      }));

      console.log('✅ [useDailyRecording] Gravação iniciada com sucesso');
    } catch (error) {
      console.error('❌ [useDailyRecording] Erro ao iniciar gravação:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar gravação'
      }));
    }
  }, [callObject, startDurationTimer]);

  const stopRecording = useCallback(async (): Promise<{ recordingId: string } | null> => {
    console.log('🛑 [useDailyRecording] Parando gravação...');
    
    if (!callObject) {
      console.error('❌ [useDailyRecording] Objeto de chamada Daily não disponível');
      return null;
    }

    if (!state.isRecording) {
      console.warn('⚠️ [useDailyRecording] Tentativa de parar gravação quando não está gravando');
      return null;
    }

    try {
      // Parar gravação no Daily
      console.log('🔄 [useDailyRecording] Chamando stopRecording no Daily...');
      await callObject.stopRecording();

      // Parar timer
      stopDurationTimer();

      // Obter ID da gravação (se disponível)
      const recordingId = Date.now().toString(); // Temporário - Daily pode fornecer um ID real

      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        recordingId
      }));

      console.log('✅ [useDailyRecording] Gravação parada com sucesso');
      return { recordingId };
    } catch (error) {
      console.error('❌ [useDailyRecording] Erro ao parar gravação:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao parar gravação'
      }));
      return null;
    }
  }, [callObject, state.isRecording, stopDurationTimer]);

  // Pausar e retomar não são suportados pela API do Daily
  const pauseRecording = useCallback(() => {
    console.warn('⚠️ [useDailyRecording] Pausar gravação não é suportado pelo Daily.co');
  }, []);

  const resumeRecording = useCallback(() => {
    console.warn('⚠️ [useDailyRecording] Retomar gravação não é suportado pelo Daily.co');
  }, []);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      stopDurationTimer();
    };
  }, [stopDurationTimer]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
}