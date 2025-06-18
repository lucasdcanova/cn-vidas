import React, { useState, useEffect } from 'react';
import { Circle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface RecordingControlsProps {
  appointmentId: number;
  onRecordingStart?: () => void;
  onRecordingStop?: (recordingId: number) => void;
  className?: string;
  autoStart?: boolean;
  patientConsent?: boolean;
}

export default function RecordingControls({
  appointmentId,
  onRecordingStart,
  onRecordingStop,
  className,
  autoStart = false,
  patientConsent = false
}: RecordingControlsProps) {
  const { toast } = useToast();
  const { state, startRecording, stopRecording, pauseRecording, resumeRecording } = useAudioRecording();
  const [isUploading, setIsUploading] = useState(false);
  const [hasConsent, setHasConsent] = useState(patientConsent);
  const [hasStarted, setHasStarted] = useState(false);

  // Expor métodos para controle externo
  useEffect(() => {
    if (autoStart) {
      (window as any).recordingControlsRef = {
        stopRecording: handleStopRecording
      };
    }
    
    return () => {
      if ((window as any).recordingControlsRef) {
        delete (window as any).recordingControlsRef;
      }
    };
  }, [autoStart]);

  // Formatador de duração
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Logs para debug
  useEffect(() => {
    console.log('🔍 [RecordingControls] Estado do componente:', {
      appointmentId,
      autoStart,
      patientConsent,
      hasConsent,
      hasStarted,
      isRecording: state.isRecording,
      isUploading
    });
  }, [appointmentId, autoStart, patientConsent, hasConsent, hasStarted, state.isRecording, isUploading]);

  // Iniciar gravação automaticamente se configurado
  useEffect(() => {
    console.log('🔄 [RecordingControls] Verificando condições para auto-start:', {
      autoStart,
      hasConsent,
      hasStarted,
      isRecording: state.isRecording,
      condicoesAtendidas: autoStart && hasConsent && !hasStarted && !state.isRecording
    });
    
    if (autoStart && hasConsent && !hasStarted && !state.isRecording) {
      setHasStarted(true);
      // Aguardar 5 segundos para garantir que a chamada está estável
      console.log('⏱️ [RecordingControls] Aguardando 5 segundos para iniciar gravação automática...');
      setTimeout(() => {
        console.log('🎙️ [RecordingControls] Iniciando gravação automática após 5 segundos');
        handleStartRecording();
      }, 5000);
    }
  }, [autoStart, hasConsent, hasStarted, state.isRecording]);

  // Iniciar gravação automaticamente
  const handleStartRecording = async () => {
    console.log('🎙️ [RecordingControls] Iniciando gravação...');
    try {
      await startRecording();
      console.log('✅ [RecordingControls] Gravação iniciada com sucesso');
      onRecordingStart?.();
    } catch (error) {
      console.error('❌ [RecordingControls] Erro ao iniciar gravação:', error);
    }
  };

  // Parar gravação e fazer upload
  const handleStopRecording = async () => {
    console.log('🛑 [RecordingControls] Parando gravação...');
    const audioBlob = await stopRecording();
    
    if (!audioBlob) {
      console.error('❌ [RecordingControls] Erro: Não foi possível obter o áudio gravado');
      toast({
        title: 'Erro na gravação',
        description: 'Não foi possível obter o áudio gravado.',
        variant: 'destructive'
      });
      return;
    }

    console.log('📤 [RecordingControls] Iniciando upload da gravação...');
    console.log(`📊 [RecordingControls] Tamanho do arquivo: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);
    setIsUploading(true);

    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('audio', audioBlob, `consultation_${appointmentId}.webm`);
      formData.append('appointmentId', appointmentId.toString());

      console.log('🚀 [RecordingControls] Enviando gravação para o servidor...');
      console.log(`🆔 [RecordingControls] Appointment ID: ${appointmentId}`);
      
      // Fazer upload
      const response = await axios.post(
        `/api/consultation-recordings/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            console.log(`📈 [RecordingControls] Progresso do upload: ${percentCompleted}%`);
          }
        }
      );

      console.log('📥 [RecordingControls] Resposta do servidor:', response.data);
      
      if (response.data.success) {
        console.log('✅ [RecordingControls] Upload concluído com sucesso!');
        console.log(`🆔 [RecordingControls] Recording ID: ${response.data.recordingId}`);
        console.log('📄 [RecordingControls] Prontuário será gerado automaticamente');
        
        toast({
          title: 'Gravação salva',
          description: 'A gravação foi processada e o prontuário será gerado automaticamente.',
        });
        onRecordingStop?.(response.data.recordingId);
      } else {
        console.error('❌ [RecordingControls] Resposta do servidor indica falha:', response.data);
      }
    } catch (error: any) {
      console.error('❌ [RecordingControls] Erro ao fazer upload:', error);
      console.error('📋 [RecordingControls] Detalhes do erro:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: 'Erro no upload',
        description: error.response?.data?.error || 'Falha ao enviar gravação.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      console.log('🔄 [RecordingControls] Upload finalizado');
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Indicador de gravação */}
      {state.isRecording && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <Circle className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
          <span>{formatDuration(state.duration)}</span>
        </div>
      )}

      {/* Erro */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Indicador de upload */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando gravação...
        </div>
      )}
    </div>
  );
}