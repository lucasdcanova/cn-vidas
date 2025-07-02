import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

interface UseAudioRecordingReturn extends UseAudioRecordingState {
  startRecording: (audioStream?: MediaStream) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

export function useAudioRecordingV2(): UseAudioRecordingReturn {
  const [state, setState] = useState<UseAudioRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);

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

  const startRecording = useCallback(async (providedStream?: MediaStream) => {
    console.log('🎤 [useAudioRecordingV2] Iniciando gravação de áudio...');
    console.log('🎙️ [useAudioRecordingV2] Stream fornecida?', !!providedStream);
    
    try {
      // Resetar estado
      audioChunksRef.current = [];
      audioBlobRef.current = null;
      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        error: null
      });

      let stream: MediaStream;

      if (providedStream) {
        // Usar stream fornecida (ex: da videochamada)
        console.log('✅ [useAudioRecordingV2] Usando stream fornecida');
        console.log(`📊 [useAudioRecordingV2] Tracks de áudio na stream: ${providedStream.getAudioTracks().length}`);
        stream = providedStream;
      } else {
        // Fallback para microfone local
        console.log('🎙️ [useAudioRecordingV2] Solicitando permissões de microfone...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
        console.log('✅ [useAudioRecordingV2] Permissão de microfone concedida');
      }

      // Verificar se há tracks de áudio
      const audioTracks = stream.getAudioTracks();
      console.log(`🔊 [useAudioRecordingV2] Tracks de áudio encontradas: ${audioTracks.length}`);
      audioTracks.forEach((track, index) => {
        console.log(`  Track ${index}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`);
      });

      if (audioTracks.length === 0) {
        throw new Error('Nenhuma track de áudio disponível');
      }

      // Criar MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      console.log(`🎬 [useAudioRecordingV2] Criando MediaRecorder com mimeType: ${mimeType}`);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      // Configurar event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`📊 [useAudioRecordingV2] Dados de áudio recebidos: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 [useAudioRecordingV2] MediaRecorder parado');
        console.log(`📦 [useAudioRecordingV2] Total de chunks de áudio: ${audioChunksRef.current.length}`);
        
        // Criar blob final
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlobRef.current = audioBlob;
        console.log(`💾 [useAudioRecordingV2] Blob de áudio criado: ${audioBlob.size} bytes`);
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('❌ [useAudioRecordingV2] Erro no MediaRecorder:', event.error);
        setState(prev => ({ ...prev, error: 'Erro na gravação' }));
      };

      // Salvar referência e iniciar gravação
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Coletar dados a cada 1 segundo
      
      // Atualizar estado
      startTimeRef.current = Date.now();
      startDurationTimer();
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null
      }));

      console.log('✅ [useAudioRecordingV2] Gravação iniciada com sucesso');
    } catch (error) {
      console.error('❌ [useAudioRecordingV2] Erro ao iniciar gravação:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar gravação'
      }));
    }
  }, [startDurationTimer]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    console.log('🛑 [useAudioRecordingV2] Parando gravação...');
    
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        console.warn('⚠️ [useAudioRecordingV2] MediaRecorder não está ativo');
        resolve(null);
        return;
      }

      // Configurar handler para quando parar
      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 [useAudioRecordingV2] MediaRecorder parado');
        console.log(`📦 [useAudioRecordingV2] Total de chunks de áudio: ${audioChunksRef.current.length}`);
        
        // Criar blob final
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlobRef.current = audioBlob;
        console.log(`💾 [useAudioRecordingV2] Blob de áudio criado: ${audioBlob.size} bytes`);
        
        // Parar timer e limpar
        stopDurationTimer();
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false
        }));
        
        // Limpar recursos
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        resolve(audioBlob);
      };

      // Parar gravação
      mediaRecorderRef.current.stop();
      
      // Parar todas as tracks
      if (mixedStreamRef.current) {
        mixedStreamRef.current.getTracks().forEach(track => track.stop());
        mixedStreamRef.current = null;
      }
    });
  }, [stopDurationTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      console.log('⏸️ [useAudioRecordingV2] Gravação pausada');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      console.log('▶️ [useAudioRecordingV2] Gravação retomada');
    }
  }, []);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      stopDurationTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mixedStreamRef.current) {
        mixedStreamRef.current.getTracks().forEach(track => track.stop());
      }
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