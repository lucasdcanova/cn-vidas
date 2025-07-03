import React, { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall, DailyEvent, DailyParticipant } from '@daily-co/daily-js';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CloudRecordingIndicator from './CloudRecordingIndicator';

interface MinimalistVideoCallProps {
  roomUrl: string;
  token?: string;
  onJoinCall?: () => void;
  onLeaveCall?: (callData?: any) => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  userName?: string;
  isDoctor?: boolean;
  appointmentId?: string;
  enableRecording?: boolean;
}

// Limpar instâncias globais do Daily.co
const cleanupGlobalDailyInstances = async () => {
  if (typeof window !== 'undefined' && window.dailyCallInstance) {
    try {
      await window.dailyCallInstance.destroy();
      window.dailyCallInstance = null;
    } catch (e) {
      console.error('Erro ao limpar instância global:', e);
      window.dailyCallInstance = null;
    }
  }
  await new Promise(resolve => setTimeout(resolve, 100));
};

export default function MinimalistVideoCallCloud({
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
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [isCloudRecording, setIsCloudRecording] = useState(false);
  const callStartTimeRef = useRef<number>(0);

  // Limpar instâncias ao montar
  useEffect(() => {
    cleanupGlobalDailyInstances();
  }, []);

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

  // Manipuladores de eventos Daily
  const handleJoinedMeeting = () => {
    console.log('✅ Conectado à sala');
    setIsCallActive(true);
    setIsConnecting(false);
    setHasJoinedCall(true);
    callStartTimeRef.current = Date.now();
    onJoinCall?.();
  };

  const handleLeftMeeting = () => {
    console.log('👋 Desconectado da sala');
    setIsCallActive(false);
    setRemoteParticipant(null);
    setHasJoinedCall(false);
    setCallDuration(0);
    
    const duration = callStartTimeRef.current 
      ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      : 0;
    
    onLeaveCall?.({ duration });
  };

  const handleParticipantJoined = (event: DailyEvent) => {
    const participant = event?.participant;
    if (participant && !participant.local) {
      console.log('👤 Participante entrou:', participant.user_name);
      setRemoteParticipant(participant);
      updateVideoTrack(participant);
      onParticipantJoined?.(participant);
    }
  };

  const handleParticipantLeft = (event: DailyEvent) => {
    const participant = event?.participant;
    if (participant && !participant.local) {
      console.log('👤 Participante saiu:', participant.user_name);
      setRemoteParticipant(null);
      onParticipantLeft?.(participant);
    }
  };

  const handleParticipantUpdated = (event: DailyEvent) => {
    const participant = event?.participant;
    if (participant && !participant.local) {
      setRemoteParticipant(participant);
      updateVideoTrack(participant);
    }
  };

  const handleRecordingStarted = () => {
    console.log('🔴 Gravação na nuvem iniciada');
    setIsCloudRecording(true);
  };

  const handleRecordingStopped = () => {
    console.log('⏹️ Gravação na nuvem parada');
    setIsCloudRecording(false);
  };

  const updateVideoTrack = (participant: DailyParticipant) => {
    if (!remoteVideoRef.current) return;

    const videoTrack = participant.tracks?.video?.persistentTrack;
    if (videoTrack && participant.video) {
      const stream = new MediaStream([videoTrack]);
      remoteVideoRef.current.srcObject = stream;
    } else {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Inicializar Daily.co
  useEffect(() => {
    if (!roomUrl || !token || hasJoinedCall) return;

    const initializeCall = async () => {
      setIsConnecting(true);

      try {
        await cleanupGlobalDailyInstances();
        
        console.log('🎬 Iniciando videochamada com gravação na nuvem...');
        
        const newCallInstance = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: true,
          dailyConfig: {
            experimentalChromeVideoMuteLightOff: true
          }
        });

        window.dailyCallInstance = newCallInstance;
        callRef.current = newCallInstance;

        // Configurar eventos
        newCallInstance.on('joined-meeting', handleJoinedMeeting);
        newCallInstance.on('left-meeting', handleLeftMeeting);
        newCallInstance.on('participant-joined', handleParticipantJoined);
        newCallInstance.on('participant-left', handleParticipantLeft);
        newCallInstance.on('participant-updated', handleParticipantUpdated);
        newCallInstance.on('recording-started', handleRecordingStarted);
        newCallInstance.on('recording-stopped', handleRecordingStopped);
        newCallInstance.on('track-started', handleTrackStarted);
        newCallInstance.on('track-stopped', handleTrackStopped);

        // Entrar na sala
        await newCallInstance.join({
          url: roomUrl,
          token: token,
          userName: userName,
          dailyConfig: {
            camSimulcastEncodings: [
              { maxBitrate: 100000, maxFramerate: 15, scaleResolutionDownBy: 4 },
              { maxBitrate: 500000, maxFramerate: 30, scaleResolutionDownBy: 1 }
            ]
          }
        });

      } catch (error) {
        console.error('❌ Erro ao entrar na videochamada:', error);
        setIsConnecting(false);
      }
    };

    const timeout = setTimeout(initializeCall, 500);
    return () => clearTimeout(timeout);
  }, [roomUrl, token, userName, hasJoinedCall]);

  const handleTrackStarted = async (event: DailyEvent) => {
    if (!event?.participant) return;

    const { participant, track } = event;
    
    if (participant.local && track?.kind === 'video' && localVideoRef.current) {
      const stream = new MediaStream([track]);
      localVideoRef.current.srcObject = stream;
    }
  };

  const handleTrackStopped = (event: DailyEvent) => {
    if (!event?.participant) return;

    const { participant, track } = event;
    
    if (participant.local && track?.kind === 'video' && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Controles de mídia
  const toggleAudio = async () => {
    if (!callRef.current) return;
    
    try {
      const newState = !isAudioEnabled;
      await callRef.current.setLocalAudio(newState);
      setIsAudioEnabled(newState);
    } catch (error) {
      console.error('Erro ao alternar áudio:', error);
    }
  };

  const toggleVideo = async () => {
    if (!callRef.current) return;
    
    try {
      const newState = !isVideoEnabled;
      await callRef.current.setLocalVideo(newState);
      setIsVideoEnabled(newState);
    } catch (error) {
      console.error('Erro ao alternar vídeo:', error);
    }
  };

  const endCall = async () => {
    if (!callRef.current) return;
    
    try {
      await callRef.current.leave();
      await callRef.current.destroy();
      callRef.current = null;
      window.dailyCallInstance = null;
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    }
  };

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (callRef.current) {
          try {
            await callRef.current.leave();
            await callRef.current.destroy();
          } catch (error) {
            console.error('Erro na limpeza:', error);
          }
          callRef.current = null;
          window.dailyCallInstance = null;
        }
      };
      cleanup();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Indicador de gravação na nuvem */}
      {isDoctor && <CloudRecordingIndicator isRecording={isCloudRecording} duration={callDuration} />}
      
      {/* Vídeos */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vídeo remoto */}
        <Card className="relative overflow-hidden bg-gray-900">
          <CardContent className="p-0 h-full">
            {remoteParticipant ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Video className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-400">Aguardando participante...</p>
                </div>
              </div>
            )}
            {remoteParticipant && (
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                {remoteParticipant.user_name || 'Participante'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vídeo local */}
        <Card className="relative overflow-hidden bg-gray-900">
          <CardContent className="p-0 h-full">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              {userName} (Você)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={isAudioEnabled ? "secondary" : "destructive"}
                onClick={toggleAudio}
                disabled={!isCallActive || isConnecting}
              >
                {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>

              <Button
                size="icon"
                variant={isVideoEnabled ? "secondary" : "destructive"}
                onClick={toggleVideo}
                disabled={!isCallActive || isConnecting}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>

              {isCallActive && (
                <div className="ml-4 text-sm text-muted-foreground">
                  {formatDuration(callDuration)}
                </div>
              )}
            </div>

            <Button
              variant="destructive"
              onClick={endCall}
              disabled={!isCallActive || isConnecting}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Encerrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status de conexão */}
      {isConnecting && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Conectando à videochamada...
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta quando sem participante */}
      {isCallActive && !remoteParticipant && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aguardando o outro participante entrar na chamada...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}