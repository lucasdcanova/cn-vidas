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
    recordingControlsRef?: {
      stopRecording: () => Promise<void>;
    };
    recordingControlsStopping?: boolean;
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
      const instance = window.dailyCallInstance;
      window.dailyCallInstance = null; // Limpar referência primeiro
      
      // Verificar se a instância ainda está ativa antes de destruir
      if (instance && typeof instance.destroy === 'function') {
        try {
          await instance.leave();
        } catch (e) {
          // Ignorar erro se já saiu
        }
        await instance.destroy();
      }
    } catch (e) {
      console.error('Erro ao limpar instância global:', e);
      window.dailyCallInstance = null; // Garantir que a referência seja limpa mesmo com erro
    }
  }
  
  // Adicionar um pequeno delay para garantir limpeza completa
  await new Promise(resolve => setTimeout(resolve, 100));
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
  const [userIntentionallyMuted, setUserIntentionallyMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteParticipant, setRemoteParticipant] = useState<any>(null);
  const callStartTimeRef = useRef<number>(0);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  
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
      } catch (error: any) {
        // Se erro 404, assumir configurações padrão
        if (error.response?.status === 404) {
          console.warn('⚠️ [MinimalistVideoCall] Configurações do paciente não encontradas, usando padrão');
          return {
            privacy: {
              allowConsultationRecording: true
            }
          };
        }
        console.error('❌ [MinimalistVideoCall] Erro ao buscar configurações do paciente:', error);
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
      } catch (error: any) {
        // Se erro 404, assumir configurações padrão
        if (error.response?.status === 404) {
          console.warn('⚠️ [MinimalistVideoCall] Configurações do médico não encontradas, usando padrão');
          return {
            privacy: {
              allowConsultationRecording: true
            }
          };
        }
        console.error('❌ [MinimalistVideoCall] Erro ao buscar configurações do médico:', error);
        return null;
      }
    },
    enabled: isDoctor
  });

  // Determinar se deve gravar automaticamente
  const shouldAutoRecord = () => {
    // Se for médico em consulta de emergência, sempre gravar por padrão
    if (!isDoctor) return false;
    
    // Se não conseguiu buscar configurações, assumir que pode gravar
    // (melhor gravar e ter o registro do que não gravar)
    if (!patientSettings && !doctorSettings) {
      console.log('⚠️ [MinimalistVideoCall] Configurações não encontradas, habilitando gravação por padrão');
      return true;
    }
    
    // Se tiver as configurações, verificar permissões
    const patientAllowsRecording = !patientSettings || patientSettings.privacy?.allowConsultationRecording !== false;
    const doctorAllowsRecording = !doctorSettings || doctorSettings.privacy?.allowConsultationRecording !== false;
    
    console.log('🎙️ [MinimalistVideoCall] Verificação de gravação automática:', {
      patientAllows: patientAllowsRecording,
      doctorAllows: doctorAllowsRecording,
      resultado: patientAllowsRecording && doctorAllowsRecording
    });
    
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
  
  // Verificação periódica do participante remoto
  useEffect(() => {
    if (isCallActive && callRef.current) {
      const checkInterval = setInterval(() => {
        const participants = callRef.current?.participants();
        if (participants) {
          const remoteParticipants = Object.values(participants).filter(p => !p.local);
          if (remoteParticipants.length > 0) {
            if (!remoteParticipant) {
              console.log('🔍 [MinimalistVideoCall] Participante remoto detectado na verificação periódica');
              setRemoteParticipant(remoteParticipants[0]);
            }
            
            // Verificar estado do vídeo remoto
            if (remoteVideoRef.current) {
              const stream = remoteVideoRef.current.srcObject as MediaStream;
              if (stream) {
                const videoTracks = stream.getVideoTracks();
                const audioTracks = stream.getAudioTracks();
                console.log('📊 [MinimalistVideoCall] Estado do vídeo remoto:', {
                  hasStream: true,
                  videoTracks: videoTracks.length,
                  audioTracks: audioTracks.length,
                  videoEnabled: videoTracks.some(t => t.enabled),
                  videoReadyState: videoTracks[0]?.readyState,
                  videoElement: {
                    width: remoteVideoRef.current.videoWidth,
                    height: remoteVideoRef.current.videoHeight,
                    readyState: remoteVideoRef.current.readyState,
                    paused: remoteVideoRef.current.paused,
                    display: window.getComputedStyle(remoteVideoRef.current).display,
                    visibility: window.getComputedStyle(remoteVideoRef.current).visibility
                  }
                });
              }
            }
          }
        }
      }, 2000); // Verificar a cada 2 segundos
      
      return () => clearInterval(checkInterval);
    }
  }, [isCallActive, remoteParticipant]);

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
      
      // Verificar permissões de microfone e câmera
      console.log('🎤 [MinimalistVideoCall] Solicitando permissões de mídia...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: true 
        });
        console.log('✅ [MinimalistVideoCall] Permissões concedidas:', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length
        });
        // Liberar a stream após verificar
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error('❌ [MinimalistVideoCall] Erro ao obter permissões:', permError);
        alert('Por favor, permita o acesso ao microfone e câmera para iniciar a videochamada.');
        setIsConnecting(false);
        setHasJoinedCall(false);
        return;
      }
      
      // Limpar qualquer instância global existente
      await cleanupGlobalDailyInstances();
      
      // Verificar se já não existe uma instância
      if (window.dailyCallInstance) {
        console.error('❌ [MinimalistVideoCall] Instância Daily já existe!');
        setIsConnecting(false);
        setHasJoinedCall(false);
        return;
      }
      
      // Criar call object (sem iframe)
      const callObject = DailyIframe.createCallObject({
        subscribeToTracksAutomatically: true,
        audioSource: true,  // Garantir que o áudio está habilitado
        videoSource: true,  // Garantir que o vídeo está habilitado
        dailyConfig: {
          // Configurações adicionais para melhorar compatibilidade
          experimentalChromeVideoMuteLess: true,
          // Forçar configurações de áudio
          micAudioMode: 'music',
          userMediaVideoConstraints: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          userMediaAudioConstraints: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }
      });

      callRef.current = callObject;
      window.dailyCallInstance = callObject;

      // Configurar eventos
      callObject
        .on('joined-meeting', async () => {
          console.log('✅ Conectado à sala');
          setIsCallActive(true);
          setIsConnecting(false);
          callStartTimeRef.current = Date.now();
          onJoinCall?.();
          
          // Verificar e processar participantes existentes
          setTimeout(() => {
            const participants = callObject.participants();
            console.log('👥 [MinimalistVideoCall] Participantes ao entrar:', Object.keys(participants));
            
            // Processar cada participante
            Object.entries(participants).forEach(([id, participant]) => {
              if (!participant.local) {
                console.log('🔍 [MinimalistVideoCall] Processando participante remoto existente:', {
                  id,
                  userName: participant.userName,
                  audio: participant.audio,
                  video: participant.video,
                  tracks: {
                    audio: !!participant.audioTrack,
                    video: !!participant.videoTrack
                  }
                });
                
                // Sempre atualizar o participante remoto
                setRemoteParticipant(participant);
                
                // Se já existir participante remoto com tracks, configurar suas tracks
                if (participant.audioTrack || participant.videoTrack) {
                  console.log('🎯 Participante existente tem tracks, processando...');
                  
                  // Criar evento simulado para processar as tracks
                  if (participant.videoTrack) {
                    handleTrackStarted({
                      participant,
                      track: participant.videoTrack
                    });
                  }
                  if (participant.audioTrack) {
                    handleTrackStarted({
                      participant,
                      track: participant.audioTrack
                    });
                  }
                } else {
                  console.log('⏳ Participante existente ainda sem tracks');
                }
              }
            });
          }, 1000);
        })
        .on('left-meeting', () => {
          console.log('👋 Desconectado da sala');
          setIsCallActive(false);
          setCallDuration(0);
          onLeaveCall?.();
        })
        .on('participant-joined', (event) => {
          if (event?.participant && !event.participant.local) {
            console.log('👥 Participante entrou:', {
              id: event.participant.session_id,
              userName: event.participant.userName,
              audio: event.participant.audio,
              video: event.participant.video,
              tracks: event.participant.tracks,
              audioTrack: !!event.participant.audioTrack,
              videoTrack: !!event.participant.videoTrack
            });
            
            // Atualizar estado do participante remoto
            setRemoteParticipant(event.participant);
            
            // Se já tiver tracks, processar imediatamente
            if (event.participant.audioTrack || event.participant.videoTrack) {
              console.log('🎯 Participante já tem tracks, processando...');
              if (event.participant.videoTrack) {
                handleTrackStarted({
                  participant: event.participant,
                  track: event.participant.videoTrack
                });
              }
              if (event.participant.audioTrack) {
                handleTrackStarted({
                  participant: event.participant,
                  track: event.participant.audioTrack
                });
              }
            } else {
              console.log('⏳ Participante ainda sem tracks, aguardando track-started...');
            }
            
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
        .on('participant-updated', async (event) => {
          console.log('🔄 [MinimalistVideoCall] Participante atualizado:', {
            participantId: event?.participant?.session_id,
            isLocal: event?.participant?.local,
            audio: event?.participant?.audio,
            video: event?.participant?.video,
            audioTrack: !!event?.participant?.audioTrack,
            videoTrack: !!event?.participant?.videoTrack,
            subscribed: event?.participant?.subscribed,
            tracks: event?.participant?.tracks
          });
          
          // Se for local, atualizar estado dos controles
          if (event?.participant?.local) {
            // Apenas atualizar áudio se não foi intencionalmente mutado pelo usuário
            if (!userIntentionallyMuted || event.participant.audio) {
              setIsAudioEnabled(event.participant.audio);
            }
            setIsVideoEnabled(event.participant.video);
          }
          
          // Log de participante com áudio desabilitado (sem tentar reabilitar)
          if (event?.participant && !event.participant.audio) {
            console.log('🔇 [MinimalistVideoCall] Participante com áudio mutado:', event.participant.session_id);
          }
          
          // Se for participante remoto, atualizar estado e verificar se precisamos recriar a stream
          if (!event?.participant?.local) {
            // Atualizar estado do participante remoto
            setRemoteParticipant(event.participant);
            
            if (remoteVideoRef.current) {
              const participant = event.participant;
              if (participant.audioTrack || participant.videoTrack) {
                const currentStream = remoteVideoRef.current.srcObject as MediaStream;
                if (!currentStream) {
                  console.log('🔧 [MinimalistVideoCall] Criando nova stream para participante remoto');
                  const newStream = new MediaStream();
                  if (participant.audioTrack) {
                    newStream.addTrack(participant.audioTrack);
                  }
                  if (participant.videoTrack) {
                    newStream.addTrack(participant.videoTrack);
                  }
                  remoteVideoRef.current.srcObject = newStream;
                  remoteVideoRef.current.muted = false;
                  remoteVideoRef.current.volume = 1.0;
                }
              }
            }
          }
        })
        .on('active-speaker-change', (event) => {
          console.log('🗣️ [MinimalistVideoCall] Mudança de speaker ativo:', event?.activeSpeaker);
        })
        .on('camera-error', (event) => {
          console.error('📹 [MinimalistVideoCall] Erro de câmera:', event);
        })
        .on('microphone-error', (event) => {
          console.error('🎤 [MinimalistVideoCall] Erro de microfone:', event);
        })
        .on('error', (event) => {
          console.error('❌ Erro na videochamada:', event);
          setIsConnecting(false);
        });

      // Entrar na sala
      const joinOptions: any = {
        url: roomUrl,
        userName: userName || 'Usuário',
        startVideoOff: false, // Sempre iniciar com vídeo ligado
        startAudioOff: false  // IMPORTANTE: Sempre iniciar com áudio ligado
      };

      if (token) {
        joinOptions.token = token;
      }

      console.log('🎙️ [MinimalistVideoCall] Configurações de entrada:', {
        audioEnabled: true,
        videoEnabled: true,
        userName: joinOptions.userName,
        hasToken: !!token
      });

      await callObject.join(joinOptions);
      
      // Verificar configurações da sala após entrar
      const roomInfo = callObject.room();
      console.log('🏠 [MinimalistVideoCall] Informações da sala:', {
        name: roomInfo?.name,
        config: roomInfo?.config,
        signaling_impl: roomInfo?.signaling_impl
      });
      
      // Aguardar um momento para a conexão estabilizar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Garantir que o áudio e vídeo estão configurados corretamente
      console.log('🔊 [MinimalistVideoCall] Configurando mídia após entrar...');
      await callObject.setLocalAudio(isAudioEnabled);
      await callObject.setLocalVideo(isVideoEnabled);
      
      // Forçar inicialização do vídeo local após entrar
      setTimeout(async () => {
        console.log('🎥 [MinimalistVideoCall] Forçando inicialização do vídeo local...');
        const localParticipant = callObject.participants()?.local;
        if (localParticipant && localParticipant.video && localVideoRef.current) {
          const videoTrack = localParticipant.tracks?.video?.track || localParticipant.videoTrack;
          if (videoTrack) {
            console.log('📹 [MinimalistVideoCall] Track de vídeo local encontrado, aplicando ao elemento...');
            const newStream = new MediaStream();
            newStream.addTrack(videoTrack);
            localVideoRef.current.srcObject = newStream;
            localVideoRef.current.setAttribute('autoplay', 'true');
            localVideoRef.current.setAttribute('playsinline', 'true');
            localVideoRef.current.setAttribute('muted', 'true');
            localVideoRef.current.play().catch(e => console.error('Erro ao reproduzir vídeo local:', e));
          }
        }
      }, 1000);
      
      // Verificar e logar todos os dispositivos disponíveis
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('🎛️ [MinimalistVideoCall] Dispositivos disponíveis:', {
          audioInputs: devices.filter(d => d.kind === 'audioinput').map(d => ({ id: d.deviceId, label: d.label })),
          videoInputs: devices.filter(d => d.kind === 'videoinput').map(d => ({ id: d.deviceId, label: d.label })),
          audioOutputs: devices.filter(d => d.kind === 'audiooutput').map(d => ({ id: d.deviceId, label: d.label }))
        });
      } catch (err) {
        console.error('❌ [MinimalistVideoCall] Erro ao enumerar dispositivos:', err);
      }
      
      // Forçar atualização de mídia local
      setTimeout(async () => {
        try {
          console.log('🔄 [MinimalistVideoCall] Forçando atualização de mídia...');
          const localParticipant = callObject.participants().local;
          if (localParticipant) {
            // Apenas logar o estado do áudio, sem forçar reativação
            if (!localParticipant.audio) {
              console.log('🔇 [MinimalistVideoCall] Áudio local está desabilitado');
            }
            // Se o vídeo não estiver ativo, tentar reativar
            if (!localParticipant.video) {
              console.log('⚠️ [MinimalistVideoCall] Vídeo local não detectado, reativando...');
              await callObject.setLocalVideo(false);
              await new Promise(resolve => setTimeout(resolve, 100));
              await callObject.setLocalVideo(true);
            }
            // Verificar e logar estado final
            const updatedParticipant = callObject.participants().local;
            console.log('📊 [MinimalistVideoCall] Estado final da mídia local:', {
              audio: updatedParticipant?.audio,
              video: updatedParticipant?.video,
              tracks: {
                audio: !!updatedParticipant?.audioTrack,
                video: !!updatedParticipant?.videoTrack
              }
            });
          }
        } catch (err) {
          console.error('❌ [MinimalistVideoCall] Erro ao atualizar mídia:', err);
        }
      }, 1500);
      
      // Verificar status do áudio
      const localParticipant = callObject.participants().local;
      console.log('🎤 [MinimalistVideoCall] Status do participante local:', {
        audio: localParticipant?.audio,
        video: localParticipant?.video,
        audioTrack: localParticipant?.audioTrack,
        videoTrack: localParticipant?.videoTrack,
        tracks: localParticipant?.tracks
      });
      
      // Verificar configurações de áudio/vídeo
      const inputSettings = callObject.getInputSettings();
      console.log('🎛️ [MinimalistVideoCall] Configurações de entrada:', {
        audio: inputSettings?.audio,
        video: inputSettings?.video
      });
      
      // Verificar todos os participantes periodicamente
      const checkParticipants = () => {
        const participants = callObject.participants();
        console.log('👥 [MinimalistVideoCall] Participantes na sala:', {
          total: Object.keys(participants).length,
          participantes: Object.entries(participants).map(([id, p]) => ({
            id: id,
            local: p.local,
            audio: p.audio,
            video: p.video,
            userName: p.userName
          }))
        });
      };
      
      // Verificar participantes a cada 3 segundos
      const intervalId = setInterval(checkParticipants, 3000);
      
      // Limpar intervalo ao sair
      callObject.on('left-meeting', () => {
        clearInterval(intervalId);
      });

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
    
    console.log('🎵 [MinimalistVideoCall] Track iniciado:', {
      participantId: participant?.session_id,
      isLocal: participant?.local,
      trackKind: track?.kind,
      trackState: track?.readyState,
      trackId: track?.id,
      trackEnabled: track?.enabled,
      trackMuted: track?.muted
    });
    
    if (track && track.readyState === 'live') {
      if (participant.local) {
        // Tracks locais
        if (track.kind === 'video' && localVideoRef.current) {
          console.log('📹 [MinimalistVideoCall] Configurando vídeo local');
          console.log('📹 [MinimalistVideoCall] Track de vídeo local:', {
            id: track.id,
            enabled: track.enabled,
            readyState: track.readyState,
            settings: track.getSettings()
          });
          
          try {
            // Sempre criar nova stream para o vídeo local
            const newStream = new MediaStream();
            newStream.addTrack(track);
            
            // Definir a stream no elemento de vídeo
            localVideoRef.current.srcObject = newStream;
            
            // Garantir atributos necessários
            localVideoRef.current.setAttribute('autoplay', 'true');
            localVideoRef.current.setAttribute('playsinline', 'true');
            localVideoRef.current.setAttribute('muted', 'true');
            
            // Forçar reprodução imediata
            const playPromise = localVideoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('✅ [MinimalistVideoCall] Vídeo local reproduzindo');
                  console.log('📹 [MinimalistVideoCall] Estado do vídeo local:', {
                    srcObject: !!localVideoRef.current.srcObject,
                    videoWidth: localVideoRef.current.videoWidth,
                    videoHeight: localVideoRef.current.videoHeight,
                    readyState: localVideoRef.current.readyState,
                    paused: localVideoRef.current.paused
                  });
                })
                .catch(e => {
                  console.error('❌ [MinimalistVideoCall] Erro ao reproduzir vídeo local:', e);
                });
            }
          } catch (err) {
            console.error('❌ [MinimalistVideoCall] Erro ao configurar vídeo local:', err);
          }
        } else if (track.kind === 'audio') {
          console.log('🎤 [MinimalistVideoCall] Track de áudio local detectado');
          // Apenas logar se o track está desabilitado, sem tentar reabilitar
          if (!track.enabled) {
            console.log('🔇 [MinimalistVideoCall] Track de áudio local está mutado');
          }
        }
      } else {
        // Tracks remotos - IMPORTANTE: combinar áudio e vídeo na mesma stream
        // Atualizar o participante remoto se ainda não tiver sido definido
        if (!remoteParticipant || remoteParticipant.session_id !== participant.session_id) {
          console.log('📝 [MinimalistVideoCall] Atualizando participante remoto via track-started');
          setRemoteParticipant(participant);
        }
        
        if (remoteVideoRef.current) {
          let currentStream = remoteVideoRef.current.srcObject as MediaStream;
          
          if (!currentStream) {
            currentStream = new MediaStream();
            remoteVideoRef.current.srcObject = currentStream;
            console.log('🎬 [MinimalistVideoCall] Nova MediaStream criada para remoto');
          }
          
          if (track.kind === 'video') {
            console.log('📹 [MinimalistVideoCall] Adicionando vídeo remoto à stream');
            // Remover tracks de vídeo antigos
            currentStream.getVideoTracks().forEach(t => currentStream.removeTrack(t));
            currentStream.addTrack(track);
            
            // Log detalhado do estado do vídeo
            console.log('🎬 [MinimalistVideoCall] Estado do elemento de vídeo remoto:', {
              element: !!remoteVideoRef.current,
              srcObject: !!remoteVideoRef.current.srcObject,
              videoTracks: currentStream.getVideoTracks().length,
              display: remoteVideoRef.current.style.display,
              computedDisplay: window.getComputedStyle(remoteVideoRef.current).display,
              width: remoteVideoRef.current.offsetWidth,
              height: remoteVideoRef.current.offsetHeight,
              readyState: remoteVideoRef.current.readyState,
              videoWidth: remoteVideoRef.current.videoWidth,
              videoHeight: remoteVideoRef.current.videoHeight
            });
            
            // Garantir reprodução do vídeo
            remoteVideoRef.current.play().catch(e => {
              console.error('❌ [MinimalistVideoCall] Erro ao reproduzir vídeo remoto:', e);
            });
          } else if (track.kind === 'audio') {
            console.log('🔊 [MinimalistVideoCall] Adicionando áudio remoto à stream');
            // Remover tracks de áudio antigos
            currentStream.getAudioTracks().forEach(t => currentStream.removeTrack(t));
            currentStream.addTrack(track);
            
            // Verificar se o track está habilitado
            if (!track.enabled) {
              console.log('🔇 [MinimalistVideoCall] Track de áudio remoto está mutado');
            }
            
            // IMPORTANTE: Garantir que o elemento de vídeo está configurado corretamente
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.volume = 1.0;
            
            // Adicionar atributos necessários
            remoteVideoRef.current.setAttribute('playsinline', 'true');
            remoteVideoRef.current.setAttribute('webkit-playsinline', 'true');
            remoteVideoRef.current.setAttribute('autoplay', 'true');
            
            // Tentar diferentes métodos para garantir reprodução do áudio
            const playPromise = remoteVideoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('✅ [MinimalistVideoCall] Reprodução iniciada com sucesso');
                  // Verificar se o áudio está sendo reproduzido
                  console.log('🔊 [MinimalistVideoCall] Estado do áudio:', {
                    muted: remoteVideoRef.current.muted,
                    volume: remoteVideoRef.current.volume,
                    paused: remoteVideoRef.current.paused,
                    readyState: remoteVideoRef.current.readyState
                  });
                })
                .catch(error => {
                  console.error('❌ [MinimalistVideoCall] Erro ao iniciar reprodução:', error);
                  // Tentar novamente após interação do usuário
                  document.addEventListener('click', () => {
                    remoteVideoRef.current?.play();
                  }, { once: true });
                });
            }
          }
          
          console.log('📊 [MinimalistVideoCall] Stream remoto atualizado:', {
            videoTracks: currentStream.getVideoTracks().length,
            audioTracks: currentStream.getAudioTracks().length,
            audioEnabled: currentStream.getAudioTracks().some(t => t.enabled),
            videoEnabled: currentStream.getVideoTracks().some(t => t.enabled)
          });
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
        if (window.recordingControlsRef && !window.recordingControlsStopping) {
          console.log('⏹️ [MinimalistVideoCall] Parando gravação antes de sair...');
          
          // Verificar se realmente está gravando
          const isRecording = window.recordingControlsRef.isRecording ? window.recordingControlsRef.isRecording() : false;
          console.log('🎙️ [MinimalistVideoCall] Estado da gravação:', isRecording);
          
          if (isRecording || window.recordingControlsRef.stopRecording) {
            window.recordingControlsStopping = true; // Flag para evitar dupla chamada
            try {
              await window.recordingControlsRef.stopRecording();
              console.log('✅ [MinimalistVideoCall] Gravação parada com sucesso');
              
              // Aguardar um momento para garantir que o upload seja concluído
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (recordingError) {
              console.error('❌ [MinimalistVideoCall] Erro ao parar gravação:', recordingError);
            }
            window.recordingControlsStopping = false;
          }
        }
        
        if (callRef.current) {
          await callRef.current.leave();
          await callRef.current.destroy();
          callRef.current = null;
        }
      } catch (error) {
        console.error('❌ [MinimalistVideoCall] Erro ao sair da chamada:', error);
      }
    }
    setHasJoinedCall(false);
  }, []);

  // Alternar áudio
  const toggleAudio = useCallback(async () => {
    if (callRef.current) {
      const newState = !isAudioEnabled;
      console.log(`🎤 [MinimalistVideoCall] Alternando áudio: ${isAudioEnabled} -> ${newState}`);
      
      try {
        // Marcar intenção do usuário
        setUserIntentionallyMuted(!newState);
        
        // Atualizar estado local imediatamente
        setIsAudioEnabled(newState);
        
        // Aplicar mudança no Daily
        await callRef.current.setLocalAudio(newState);
        
        console.log('✅ [MinimalistVideoCall] Áudio alternado com sucesso');
      } catch (error) {
        console.error('❌ [MinimalistVideoCall] Erro ao alternar áudio:', error);
        // Reverter estado em caso de erro
        setIsAudioEnabled(!newState);
        setUserIntentionallyMuted(false);
      }
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
      const cleanup = async () => {
        console.log('🧹 [MinimalistVideoCall] Limpando ao desmontar componente...');
        
        if (callRef.current) {
          try {
            await callRef.current.leave();
          } catch (e) {
            // Ignorar erro se já saiu
          }
          
          try {
            await callRef.current.destroy();
          } catch (e) {
            console.error('Erro ao destruir instância:', e);
          }
          
          callRef.current = null;
        }
        
        // Limpar instância global também
        if (window.dailyCallInstance) {
          window.dailyCallInstance = null;
        }
        
        setHasJoinedCall(false);
      };
      
      cleanup();
    };
  }, []);

  // Timer para duração da chamada e verificação de áudio
  useEffect(() => {
    if (isCallActive && callStartTimeRef.current) {
      const timer = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
        
        // Verificar status do áudio a cada 10 segundos
        if (duration % 10 === 0 && callRef.current) {
          const participants = callRef.current.participants();
          console.log('🔍 [MinimalistVideoCall] Verificação periódica de áudio:', {
            duracao: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
            local: {
              audio: participants.local?.audio,
              video: participants.local?.video
            },
            remoteCount: Object.keys(participants).filter(id => id !== 'local').length
          });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCallActive]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      {/* Placeholder quando não há participante remoto */}
      {!remoteParticipant && isCallActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-white text-lg">Aguardando participante...</p>
          </div>
        </div>
      )}
      
      {/* Vídeo remoto em tela cheia */}
      <video
        ref={remoteVideoRef}
        autoPlay={true}
        playsInline={true}
        muted={false}  // Garantir que o áudio NÃO está mutado
        controls={false}
        volume={1.0}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ 
          transform: 'scaleX(-1)',
          display: remoteParticipant ? 'block' : 'none',
          zIndex: 1
        }}
        onLoadedMetadata={(e) => {
          const video = e.target as HTMLVideoElement;
          console.log('🎥 [MinimalistVideoCall] Vídeo remoto carregado:', {
            muted: video.muted,
            volume: video.volume,
            paused: video.paused,
            srcObject: !!video.srcObject
          });
          // Garantir que o áudio está habilitado
          video.muted = false;
          video.volume = 1.0;
          // Adicionar atributos necessários
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          // Tentar reproduzir se estiver pausado
          if (video.paused) {
            video.play().catch(e => {
              console.error('❌ [MinimalistVideoCall] Erro ao iniciar reprodução do vídeo:', e);
            });
          }
        }}
        onCanPlayThrough={(e) => {
          const video = e.target as HTMLVideoElement;
          console.log('🎬 [MinimalistVideoCall] Vídeo pronto para reproduzir');
          // Garantir reprodução
          if (video.paused) {
            video.play().catch(e => {
              console.error('❌ [MinimalistVideoCall] Erro ao reproduzir vídeo:', e);
            });
          }
        }}
      />

      {/* Vídeo local PIP */}
      {isCallActive && (
        <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl" style={{ zIndex: 10 }}>
          <video
            ref={localVideoRef}
            autoPlay={true}
            playsInline={true}
            muted={true}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              console.log('🎥 [MinimalistVideoCall] Vídeo local metadata carregada:', {
                srcObject: !!video.srcObject,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });
            }}
            onPlay={() => {
              console.log('▶️ [MinimalistVideoCall] Vídeo local iniciou reprodução');
            }}
            onError={(e) => {
              console.error('❌ [MinimalistVideoCall] Erro no vídeo local:', e);
            }}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      )}
      
      {/* Debug info */}
      {isCallActive && (
        <div className="absolute top-20 left-4 bg-black/80 text-white p-2 rounded text-xs" style={{ zIndex: 100 }}>
          <p>Local Video Element: {localVideoRef.current?.srcObject ? 'YES' : 'NO'}</p>
          {localVideoRef.current?.srcObject && (
            <>
              <p>Local Stream Tracks: V:{(localVideoRef.current.srcObject as MediaStream).getVideoTracks().length} A:{(localVideoRef.current.srcObject as MediaStream).getAudioTracks().length}</p>
              <p>Local Video Track: {(localVideoRef.current.srcObject as MediaStream).getVideoTracks()[0]?.enabled ? 'ENABLED' : 'DISABLED'}</p>
              <p>Local Video Dims: {localVideoRef.current.videoWidth}x{localVideoRef.current.videoHeight}</p>
            </>
          )}
          <p>---</p>
          <p>Remote Video Element: {remoteVideoRef.current?.srcObject ? 'YES' : 'NO'}</p>
          {remoteVideoRef.current?.srcObject && (
            <>
              <p>Remote Stream Tracks: V:{(remoteVideoRef.current.srcObject as MediaStream).getVideoTracks().length} A:{(remoteVideoRef.current.srcObject as MediaStream).getAudioTracks().length}</p>
              <p>Remote Video Track: {(remoteVideoRef.current.srcObject as MediaStream).getVideoTracks()[0]?.enabled ? 'ENABLED' : 'DISABLED'}</p>
            </>
          )}
          <p>Remote Participant: {remoteParticipant ? `${remoteParticipant.userName || remoteParticipant.session_id}` : 'NONE'}</p>
          <p>Participant State: A:{remoteParticipant?.audio ? 'ON' : 'OFF'} V:{remoteParticipant?.video ? 'ON' : 'OFF'}</p>
          <p>---</p>
          <p>Audio Enabled: {isAudioEnabled ? 'YES' : 'NO'}</p>
          <p>Video Enabled: {isVideoEnabled ? 'YES' : 'NO'}</p>
        </div>
      )}

      {/* Overlay com informações */}
      {isCallActive && (
        <>
          {/* Header minimalista */}
          <div className="absolute top-0 left-0 right-0 p-6" style={{ zIndex: 50 }}>
            <div className="flex justify-between items-center">
              <div className="bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-2">
                <p className="text-white text-sm font-medium">
                  {formatDuration(callDuration)}
                </p>
                {remoteParticipant && (
                  <>
                    <span className="text-white/60">•</span>
                    <p className="text-white text-sm">
                      {remoteParticipant.userName || 'Participante'}
                    </p>
                  </>
                )}
              </div>
              
              {isDoctor && enableRecording && appointmentId && (
                <div className="bg-black/40 backdrop-blur-xl rounded-full">
                  {(() => {
                    const shouldRecord = shouldAutoRecord();
                    console.log('🎙️ [MinimalistVideoCall] Renderizando RecordingControls:', {
                      appointmentId,
                      enableRecording,
                      isDoctor,
                      shouldAutoRecord: shouldRecord,
                      patientConsent: true,
                      patientSettings: patientSettings,
                      doctorSettings: doctorSettings
                    });
                    return (
                      <RecordingControls
                        appointmentId={appointmentId}
                        className="px-4 py-2"
                        autoStart={shouldRecord}
                        patientConsent={true}
                      />
                    );
                  })()}
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