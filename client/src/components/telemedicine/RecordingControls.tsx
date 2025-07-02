import React, { useState, useEffect, useCallback } from 'react';
import { Circle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioRecordingV2 } from '@/hooks/use-audio-recording-v2';
import { useToast } from '@/hooks/use-toast';
import { httpRequest } from '@/lib/http-client';

interface RecordingControlsProps {
  appointmentId: number;
  onRecordingStart?: () => void;
  onRecordingStop?: (recordingId: number) => void;
  className?: string;
  autoStart?: boolean;
  patientConsent?: boolean;
  audioStream?: MediaStream;
}

export default function RecordingControls({
  appointmentId,
  onRecordingStart,
  onRecordingStop,
  className,
  autoStart = false,
  patientConsent = false,
  audioStream
}: RecordingControlsProps) {
  const { toast } = useToast();
  const { state, startRecording, stopRecording, pauseRecording, resumeRecording } = useAudioRecordingV2();
  
  console.log('🎯 [RecordingControls] Componente renderizado com props:', {
    appointmentId,
    autoStart,
    patientConsent,
    className,
    timestamp: new Date().toISOString()
  });
  const [isUploading, setIsUploading] = useState(false);
  const [hasConsent, setHasConsent] = useState(patientConsent);
  const [hasStarted, setHasStarted] = useState(false);
  const [manualStart, setManualStart] = useState(false);
  
  // Atualizar hasConsent quando patientConsent mudar
  useEffect(() => {
    console.log('🔄 [RecordingControls] Atualizando hasConsent:', {
      patientConsent,
      hasConsentAnterior: hasConsent,
      hasConsentNovo: patientConsent
    });
    setHasConsent(patientConsent);
  }, [patientConsent]);

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

  // Parar gravação e fazer upload
  const handleStopRecording = async () => {
    console.log('🛑 [RecordingControls] Parando gravação...');
    
    // Verificar se já está parando
    if (!state.isRecording) {
      console.warn('⚠️ [RecordingControls] Tentativa de parar gravação quando não está gravando');
      return;
    }
    
    const audioBlob = await stopRecording();
    
    if (!audioBlob) {
      console.error('❌ [RecordingControls] Erro: Não foi possível obter o áudio gravado');
      // Não mostrar toast de erro se a gravação já foi salva anteriormente
      // Isso pode acontecer quando o método é chamado múltiplas vezes
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
      const response = await httpRequest(`/api/consultation-recordings/upload`, {
        method: 'POST',
        body: formData,
        // Não definir Content-Type para FormData - o navegador define automaticamente com boundary
        headers: {}
      });

      console.log('📥 [RecordingControls] Resposta do servidor:', response);
      
      if (response.success) {
        console.log('✅ [RecordingControls] Upload concluído com sucesso!');
        console.log(`🆔 [RecordingControls] Recording ID: ${response.recordingId}`);
        console.log('📄 [RecordingControls] Prontuário será gerado automaticamente');
        
        toast({
          title: 'Gravação salva',
          description: 'A gravação foi processada e o prontuário será gerado automaticamente.',
        });
        onRecordingStop?.(response.recordingId);
      } else {
        console.error('❌ [RecordingControls] Resposta do servidor indica falha:', response);
      }
    } catch (error: any) {
      console.error('❌ [RecordingControls] Erro ao fazer upload:', error);
      console.error('📋 [RecordingControls] Detalhes do erro:', {
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: 'Erro no upload',
        description: error.message || 'Falha ao enviar gravação.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      console.log('🔄 [RecordingControls] Upload finalizado');
      
      // Limpar referência global após o upload
      if ((window as any).recordingControlsRef) {
        delete (window as any).recordingControlsRef;
      }
    }
  };

  // Expor métodos para controle externo
  useEffect(() => {
    if (autoStart) {
      (window as any).recordingControlsRef = {
        stopRecording: handleStopRecording,
        isRecording: () => state.isRecording
      };
    }
    
    return () => {
      // Não deletar imediatamente, pois pode estar sendo usado
      // Será limpo após o upload ser concluído
    };
  }, [autoStart, handleStopRecording, state.isRecording]);

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
  
  // Iniciar gravação
  const handleStartRecording = useCallback(async () => {
    console.log('🎙️ [RecordingControls] Iniciando gravação...', {
      appointmentId,
      hasConsent,
      autoStart,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Verificar se temos permissão do navegador
      console.log('🔐 [RecordingControls] Verificando permissões do navegador...');
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('🔐 [RecordingControls] Status da permissão:', permission.state);
      
      await startRecording(audioStream);
      console.log('✅ [RecordingControls] Gravação iniciada com sucesso');
      console.log('🎙️ [RecordingControls] Usando stream:', audioStream ? 'Stream fornecida' : 'Microfone local');
      setManualStart(true);
      onRecordingStart?.();
    } catch (error: any) {
      console.error('❌ [RecordingControls] Erro ao iniciar gravação:', {
        error: error.message,
        stack: error.stack,
        appointmentId,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Erro ao iniciar gravação',
        description: error.message || 'Não foi possível iniciar a gravação. Verifique as permissões do microfone.',
        variant: 'destructive'
      });
    }
  }, [appointmentId, hasConsent, autoStart, startRecording, onRecordingStart, toast, audioStream]);

  // Log inicial quando o componente monta
  useEffect(() => {
    console.log('🚀 [RecordingControls] Componente montado com props:', {
      appointmentId,
      autoStart,
      patientConsent,
      className
    });
  }, []);

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
  }, [autoStart, hasConsent, hasStarted, state.isRecording, handleStartRecording]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Botão para iniciar/parar gravação manualmente */}
      {!state.isRecording && !hasStarted && !autoStart && (
        <button
          onClick={handleStartRecording}
          className="flex items-center gap-2 px-3 py-1 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          title="Iniciar gravação"
        >
          <Circle className="h-3 w-3" />
          <span>Gravar</span>
        </button>
      )}

      {/* Indicador de gravação */}
      {state.isRecording && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <Circle className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
          <span>{formatDuration(state.duration)}</span>
          {(manualStart || autoStart) && (
            <button
              onClick={handleStopRecording}
              className="ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
              title="Parar gravação"
              disabled={isUploading}
            >
              Parar
            </button>
          )}
        </div>
      )}

      {/* Erro */}
      {state.error && !state.isRecording && (
        <div className="text-xs text-red-400">
          Erro na gravação
        </div>
      )}

      {/* Indicador de upload */}
      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Enviando...</span>
        </div>
      )}
    </div>
  );
}