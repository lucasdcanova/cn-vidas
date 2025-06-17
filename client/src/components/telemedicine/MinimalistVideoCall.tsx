import React, { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import RecordingControls from './RecordingControls';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Global para rastrear instâncias Daily
declare global {
  interface Window {
    dailyCallInstance?: DailyCall | null;
  }
}

interface MinimalistVideoCallProps {
  roomUrl?: string;
  token?: string;
  onJoinCall?: () => void;
  onLeaveCall?: () => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  userName?: string;
  isDoctor?: boolean;
  appointmentId?: number;
  enableRecording?: boolean;
}

// Função para limpar instâncias Daily globais
const cleanupGlobalDailyInstances = async () => {
  if (typeof window !== 'undefined' && window.dailyCallInstance) {
    try {
      console.log('🧹 Limpando instância Daily global existente...');
      await window.dailyCallInstance.destroy();
      window.dailyCallInstance = null;
    } catch (e) {
      console.error('Erro ao limpar instância global:', e);
    }
  }
};

export default function MinimalistVideoCall({
  roomUrl,
  token,
  onJoinCall,
  onLeaveCall,
  onParticipantJoined,
  onParticipantLeft,
  userName = 'Você',
  isDoctor = false,
  appointmentId,
  enableRecording = true
}: MinimalistVideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteParticipant, setRemoteParticipant] = useState<any>(null);
  const callStartTimeRef = useRef<number>(0);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  
  // Limpar instâncias ao montar
  useEffect(() => {
    cleanupGlobalDailyInstances();
  }, []);

  // Buscar configurações do paciente quando for médico
  const { data: patientSettings } = useQuery({
    queryKey: ['patient-settings', appointmentId],
    queryFn: async () => {
      if (!isDoctor || !appointmentId) return null;
      
      try {
        const appointmentResponse = await axios.get(`/api/appointments/${appointmentId}`);
        const patientId = appointmentResponse.data.user_id;
        const settingsResponse = await axios.get(`/api/users/${patientId}/settings`);
        return settingsResponse.data;
      } catch (error) {
        console.error('Erro ao buscar configurações do paciente:', error);
        return null;
      }
    },
    enabled: isDoctor && !!appointmentId
  });

  // Buscar configurações do médico
  const { data: doctorSettings } = useQuery({
    queryKey: ['/api/users/settings'],
    queryFn: async () => {
      if (!isDoctor) return null;
      
      try {
        const response = await axios.get('/api/users/settings');
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar configurações do médico:', error);
        return null;
      }
    },
    enabled: isDoctor
  });

  // Determinar se deve gravar automaticamente
  const shouldAutoRecord = () => {
    if (!isDoctor || !patientSettings || !doctorSettings) return false;
    
    const patientAllowsRecording = patientSettings.privacy?.allowConsultationRecording !== false;
    const doctorAllowsRecording = doctorSettings.privacy?.allowConsultationRecording !== false;
    
    return patientAllowsRecording && doctorAllowsRecording;
  };

  // Timer para duração da chamada
  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => {
        if (callStartTimeRef.current) {
          const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(duration);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para entrar na chamada
  const joinCall = useCallback(async () => {
    if (!roomUrl || isCallActive || isConnecting || hasJoinedCall) return;

    setIsConnecting(true);
    setHasJoinedCall(true);

    try {
      console.log('🎬 Iniciando videochamada headless...');
      
      // Limpar qualquer instância global existente
      await cleanupGlobalDailyInstances();
      
      // Criar call object (sem iframe)
      const callObject = DailyIframe.createCallObject({
        subscribeToTracksAutomatically: true
      });

      callRef.current = callObject;
      window.dailyCallInstance = callObject;

      // Configurar eventos
      callObject
        .on('joined-meeting', () => {
          console.log('✅ Conectado à sala');
          setIsCallActive(true);
          setIsConnecting(false);
          callStartTimeRef.current = Date.now();
          onJoinCall?.();
        })
        .on('left-meeting', () => {
          console.log('👋 Desconectado da sala');
          setIsCallActive(false);
          setCallDuration(0);
          onLeaveCall?.();
        })
        .on('participant-joined', (event) => {
          if (event?.participant && !event.participant.local) {
            console.log('👥 Participante entrou:', event.participant);
            setRemoteParticipant(event.participant);
            onParticipantJoined?.(event.participant);
          }
        })
        .on('participant-left', (event) => {
          if (event?.participant && !event.participant.local) {
            console.log('👋 Participante saiu:', event.participant);
            setRemoteParticipant(null);
            onParticipantLeft?.(event.participant);
          }
        })
        .on('track-started', (event) => {
          handleTrackStarted(event);
        })
        .on('track-stopped', (event) => {
          handleTrackStopped(event);
        })
        .on('error', (event) => {
          console.error('❌ Erro na videochamada:', event);
          setIsConnecting(false);
        });

      // Entrar na sala
      const joinOptions: any = {
        url: roomUrl,
        userName: userName || 'Usuário',
        startVideoOff: !isVideoEnabled,
        startAudioOff: !isAudioEnabled
      };

      if (token) {
        joinOptions.token = token;
      }

      await callObject.join(joinOptions);

    } catch (error: any) {
      console.error('❌ Erro ao entrar na videochamada:', error);
      setIsConnecting(false);
      setHasJoinedCall(false);
      
      // Cleanup em caso de erro
      if (callRef.current) {
        try {
          await callRef.current.destroy();
        } catch (e) {
          console.error('Erro ao destruir call object:', e);
        }
        callRef.current = null;
      }
    }
  }, [roomUrl, token, userName, isVideoEnabled, isAudioEnabled, onJoinCall, onLeaveCall, onParticipantJoined, onParticipantLeft, isCallActive, isConnecting, hasJoinedCall]);

  // Função para lidar com tracks iniciados
  const handleTrackStarted = (event: any) => {
    const { participant, track } = event;
    
    if (track && track.readyState === 'live') {
      const stream = new MediaStream([track]);
      
      if (participant.local) {
        // Vídeo local
        if (track.kind === 'video' && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        // Vídeo remoto
        if (track.kind === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      }
    }
  };

  // Função para lidar com tracks parados
  const handleTrackStopped = (event: any) => {
    const { participant, track } = event;
    
    if (track.kind === 'video') {
      if (participant.local && localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      } else if (!participant.local && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  // Função para sair da chamada
  const leaveCall = useCallback(async () => {
    console.log('🔴 Encerrando videochamada...');
    if (callRef.current) {
      try {
        // Parar gravação se estiver gravando
        if (window.recordingControlsRef) {
          console.log('⏹️ [MinimalistVideoCall] Parando gravação antes de sair...');
          await window.recordingControlsRef.stopRecording();
          console.log('✅ [MinimalistVideoCall] Gravação parada com sucesso');
        }
        
        await callRef.current.leave();
        await callRef.current.destroy();
        callRef.current = null;
      } catch (error) {
        console.error('❌ [MinimalistVideoCall] Erro ao sair da chamada:', error);
      }
    }
    setHasJoinedCall(false);
  }, []);

  // Alternar áudio
  const toggleAudio = useCallback(() => {
    if (callRef.current) {
      const newState = !isAudioEnabled;
      callRef.current.setLocalAudio(newState);
      setIsAudioEnabled(newState);
    }
  }, [isAudioEnabled]);

  // Alternar vídeo
  const toggleVideo = useCallback(() => {
    if (callRef.current) {
      const newState = !isVideoEnabled;
      callRef.current.setLocalVideo(newState);
      setIsVideoEnabled(newState);
    }
  }, [isVideoEnabled]);

  // Auto-iniciar quando tiver URL
  useEffect(() => {
    if (roomUrl && !isCallActive && !isConnecting && !hasJoinedCall) {
      const timer = setTimeout(() => {
        joinCall();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [roomUrl, isCallActive, isConnecting, hasJoinedCall, joinCall]);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.leave().catch(console.error);
        callRef.current.destroy().catch(console.error);
        callRef.current = null;
      }
      setHasJoinedCall(false);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      {/* Vídeo remoto em tela cheia */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Vídeo local PIP */}
      {isCallActive && (
        <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Overlay com informações */}
      {isCallActive && (
        <>
          {/* Header minimalista */}
          <div className="absolute top-0 left-0 right-0 p-6" style={{ zIndex: 50 }}>
            <div className="flex justify-between items-center">
              <div className="bg-black/40 backdrop-blur-xl rounded-full px-4 py-2">
                <p className="text-white text-sm font-medium">
                  {formatDuration(callDuration)}
                </p>
              </div>
              
              {isDoctor && enableRecording && appointmentId && (
                <div className="bg-black/40 backdrop-blur-xl rounded-full">
                  <RecordingControls
                    appointmentId={appointmentId}
                    className="px-4 py-2"
                    autoStart={shouldAutoRecord()}
                    patientConsent={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controles estilo FaceTime */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent" style={{ zIndex: 50 }}>
            <div className="flex items-center justify-center gap-4">
              {/* Botão de Mudo */}
              <button
                onClick={toggleAudio}
                className={cn(
                  "relative rounded-full transition-all duration-200",
                  "w-14 h-14 flex items-center justify-center",
                  "backdrop-blur-xl shadow-lg",
                  isAudioEnabled 
                    ? "bg-white/30 hover:bg-white/40 text-white" 
                    : "bg-white text-black"
                )}
                aria-label={isAudioEnabled ? "Silenciar" : "Ativar som"}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </button>

              {/* Botão de Encerrar */}
              <button
                onClick={leaveCall}
                className={cn(
                  "relative rounded-full transition-all duration-200",
                  "w-16 h-16 flex items-center justify-center mx-4",
                  "bg-red-500 hover:bg-red-600 shadow-xl",
                  "transform hover:scale-105 active:scale-95"
                )}
                aria-label="Encerrar"
              >
                <Phone className="w-7 h-7 text-white rotate-[135deg]" />
              </button>

              {/* Botão de Câmera */}
              <button
                onClick={toggleVideo}
                className={cn(
                  "relative rounded-full transition-all duration-200",
                  "w-14 h-14 flex items-center justify-center",
                  "backdrop-blur-xl shadow-lg",
                  isVideoEnabled 
                    ? "bg-white/30 hover:bg-white/40 text-white" 
                    : "bg-white text-black"
                )}
                aria-label={isVideoEnabled ? "Desativar câmera" : "Ativar câmera"}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Estado de conexão */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-white text-lg">Conectando...</p>
          </div>
        </div>
      )}
    </div>
  );
}