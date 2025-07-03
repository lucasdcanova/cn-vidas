import React, { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, { DailyCall, DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import { Mic, MicOff, Video, VideoOff, Phone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
// import RecordingControls from './RecordingControls'; // Removido - usando gravação na nuvem
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface DailyVideoCallProps {
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

// Global reference for recording controls
declare global {
  interface Window {
    recordingControlsRef?: {
      stopRecording: () => Promise<void>;
    };
    recordingControlsStopping?: boolean;
  }
}

export default function DailyVideoCall({
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
}: DailyVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState<Record<string, DailyParticipant>>({});
  const [error, setError] = useState<string | null>(null);
  
  const callStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch settings for recording
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
        console.error('Error fetching patient settings:', error);
        return null;
      }
    },
    enabled: isDoctor && !!appointmentId
  });

  const { data: doctorSettings } = useQuery({
    queryKey: ['/api/users/settings'],
    queryFn: async () => {
      if (!isDoctor) return null;
      
      try {
        const response = await axios.get('/api/users/settings');
        return response.data;
      } catch (error) {
        console.error('Error fetching doctor settings:', error);
        return null;
      }
    },
    enabled: isDoctor
  });

  // Determine if recording should start automatically
  const shouldAutoRecord = useCallback(() => {
    if (!isDoctor) return false;
    
    const patientAllowsRecording = !patientSettings || patientSettings.privacy?.allowConsultationRecording !== false;
    const doctorAllowsRecording = !doctorSettings || doctorSettings.privacy?.allowConsultationRecording !== false;
    
    console.log('🎙️ [DailyVideoCall] Auto-recording check:', {
      patientAllows: patientAllowsRecording,
      doctorAllows: doctorAllowsRecording,
      result: patientAllowsRecording && doctorAllowsRecording
    });
    
    return patientAllowsRecording && doctorAllowsRecording;
  }, [isDoctor, patientSettings, doctorSettings]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Duration timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(duration);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  // Create and configure Daily call
  const createCall = useCallback(async () => {
    if (!roomUrl || !containerRef.current) {
      console.error('❌ [DailyVideoCall] roomUrl or container not available', {
        hasRoomUrl: !!roomUrl,
        hasContainer: !!containerRef.current,
        roomUrl: roomUrl
      });
      setIsConnecting(false);
      return;
    }

    try {
      console.log('🎬 [DailyVideoCall] Creating Daily instance...', {
        roomUrl,
        userName,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'no token'
      });
      
      // Request media permissions first
      console.log('🎤 [DailyVideoCall] Requesting media permissions...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: true 
        });
        console.log('✅ [DailyVideoCall] Media permissions granted');
        // Release the stream after checking
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error('❌ [DailyVideoCall] Media permission error:', permError);
        setError('Please allow camera and microphone access');
        setIsConnecting(false);
        return;
      }
      
      // Create iframe for Daily.js
      const callFrame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: '0',
          zIndex: 1
        },
        showLeaveButton: false,
        showFullscreenButton: false,
        showLocalVideo: true,
        showParticipantsBar: false
      });

      callRef.current = callFrame;

      // Configure events
      callFrame
        .on('joined-meeting', handleJoinedMeeting)
        .on('left-meeting', handleLeftMeeting)
        .on('participant-joined', handleParticipantJoined)
        .on('participant-updated', handleParticipantUpdated)
        .on('participant-left', handleParticipantLeft)
        .on('error', handleError)
        .on('camera-error', handleCameraError)
        .on('microphone-error', handleMicrophoneError)
        .on('track-started', handleTrackStarted)
        .on('track-stopped', handleTrackStopped);

      console.log('✅ [DailyVideoCall] Daily iframe created and events configured');

      // Join room
      const joinConfig: any = {
        url: roomUrl,
        userName: userName,
        startVideoOff: false,
        startAudioOff: false
      };

      if (token) {
        joinConfig.token = token;
      }

      console.log('🚀 [DailyVideoCall] Joining room...', {
        url: joinConfig.url,
        userName: joinConfig.userName,
        hasToken: !!joinConfig.token,
        startVideoOff: joinConfig.startVideoOff,
        startAudioOff: joinConfig.startAudioOff
      });
      
      try {
        await callFrame.join(joinConfig);
        console.log('✅ [DailyVideoCall] Successfully joined room');
      } catch (joinError: any) {
        console.error('❌ [DailyVideoCall] Failed to join room:', {
          error: joinError,
          message: joinError.message,
          errorMsg: joinError.errorMsg
        });
        throw joinError;
      }

    } catch (error: any) {
      console.error('❌ [DailyVideoCall] Error creating call:', {
        error,
        message: error?.message,
        stack: error?.stack
      });
      
      // More specific error messages
      if (error?.message?.includes('token')) {
        setError('Authentication error - invalid token');
      } else if (error?.message?.includes('room')) {
        setError('Room not found or expired');
      } else if (error?.message?.includes('network')) {
        setError('Network connection error');
      } else {
        setError(error?.message || 'Error connecting to video call');
      }
      
      setIsConnecting(false);
      
      // Clean up if needed
      if (callRef.current) {
        try {
          await callRef.current.destroy();
          callRef.current = null;
        } catch (cleanupError) {
          console.error('❌ [DailyVideoCall] Error cleaning up:', cleanupError);
        }
      }
    }
  }, [roomUrl, userName, token]);

  // Event handlers
  const handleJoinedMeeting = useCallback((event?: DailyEventObject) => {
    console.log('✅ [DailyVideoCall] Joined meeting', event);
    setIsCallActive(true);
    setIsConnecting(false);
    setError(null);
    callStartTimeRef.current = Date.now();
    
    // Update participants
    if (callRef.current) {
      const allParticipants = callRef.current.participants();
      setParticipants(allParticipants);
      
      // Ensure audio is enabled for local participant
      const localParticipant = allParticipants.local;
      if (localParticipant) {
        console.log('📊 [DailyVideoCall] Local participant status:', {
          audio: localParticipant.audio,
          video: localParticipant.video,
          tracks: localParticipant.tracks
        });
        
        // Force enable audio if it's disabled
        if (!localParticipant.audio) {
          console.log('🔊 [DailyVideoCall] Enabling local audio...');
          callRef.current.setLocalAudio(true);
        }
      }
    }
    
    onJoinCall?.();
  }, [onJoinCall]);

  const handleLeftMeeting = useCallback((event?: DailyEventObject) => {
    console.log('👋 [DailyVideoCall] Left meeting', event);
    setIsCallActive(false);
    setIsConnecting(false);
    setParticipants({});
    onLeaveCall?.();
  }, [onLeaveCall]);

  const handleParticipantJoined = useCallback((event?: DailyEventObject) => {
    if (!event?.participant) return;
    
    console.log('👤 [DailyVideoCall] Participant joined:', event.participant);
    
    setParticipants(prev => ({
      ...prev,
      [event.participant.session_id]: event.participant
    }));
    
    if (!event.participant.local) {
      onParticipantJoined?.(event.participant);
    }
  }, [onParticipantJoined]);

  const handleParticipantUpdated = useCallback((event?: DailyEventObject) => {
    if (!event?.participant) return;
    
    console.log('🔄 [DailyVideoCall] Participant updated:', {
      id: event.participant.session_id,
      audio: event.participant.audio,
      video: event.participant.video,
      tracks: event.participant.tracks
    });
    
    setParticipants(prev => ({
      ...prev,
      [event.participant.session_id]: event.participant
    }));
    
    // Update local states if it's the local participant
    if (event.participant.local) {
      setIsAudioEnabled(event.participant.audio);
      setIsVideoEnabled(event.participant.video);
    }
  }, []);

  const handleParticipantLeft = useCallback((event?: DailyEventObject) => {
    if (!event?.participant) return;
    
    console.log('👋 [DailyVideoCall] Participant left:', event.participant);
    
    setParticipants(prev => {
      const newParticipants = { ...prev };
      delete newParticipants[event.participant.session_id];
      return newParticipants;
    });
    
    if (!event.participant.local) {
      onParticipantLeft?.(event.participant);
    }
  }, [onParticipantLeft]);

  const handleTrackStarted = useCallback((event?: DailyEventObject) => {
    if (!event?.participant || !event.track) return;
    
    console.log('🎵 [DailyVideoCall] Track started:', {
      participantId: event.participant.session_id,
      isLocal: event.participant.local,
      trackKind: event.track.kind,
      trackState: event.track.readyState
    });
  }, []);

  const handleTrackStopped = useCallback((event?: DailyEventObject) => {
    if (!event?.participant || !event.track) return;
    
    console.log('🛑 [DailyVideoCall] Track stopped:', {
      participantId: event.participant.session_id,
      trackKind: event.track.kind
    });
  }, []);

  const handleError = useCallback((event?: DailyEventObject) => {
    console.error('❌ [DailyVideoCall] Error:', event);
    setError(event?.errorMsg || 'Unknown error');
    setIsConnecting(false);
  }, []);

  const handleCameraError = useCallback((event?: DailyEventObject) => {
    console.error('📹 [DailyVideoCall] Camera error:', event);
    setError('Camera access error');
  }, []);

  const handleMicrophoneError = useCallback((event?: DailyEventObject) => {
    console.error('🎤 [DailyVideoCall] Microphone error:', event);
    setError('Microphone access error');
  }, []);

  // Controls
  const toggleAudio = useCallback(async () => {
    if (!callRef.current) return;
    
    try {
      const newState = !isAudioEnabled;
      console.log(`🎤 [DailyVideoCall] Toggling audio: ${isAudioEnabled} -> ${newState}`);
      await callRef.current.setLocalAudio(newState);
      setIsAudioEnabled(newState);
    } catch (error) {
      console.error('❌ [DailyVideoCall] Error toggling audio:', error);
    }
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(async () => {
    if (!callRef.current) return;
    
    try {
      const newState = !isVideoEnabled;
      console.log(`📹 [DailyVideoCall] Toggling video: ${isVideoEnabled} -> ${newState}`);
      await callRef.current.setLocalVideo(newState);
      setIsVideoEnabled(newState);
    } catch (error) {
      console.error('❌ [DailyVideoCall] Error toggling video:', error);
    }
  }, [isVideoEnabled]);

  const leaveCall = useCallback(async () => {
    console.log('🔴 [DailyVideoCall] Ending call...');
    
    // Recording is now handled by Daily.co cloud recording
    
    if (callRef.current) {
      try {
        await callRef.current.leave();
        await callRef.current.destroy();
        callRef.current = null;
      } catch (error) {
        console.error('❌ [DailyVideoCall] Error leaving call:', error);
      }
    }
  }, []);

  // Auto-start call
  useEffect(() => {
    if (roomUrl && !isCallActive && !isConnecting && !callRef.current) {
      console.log('🎯 [DailyVideoCall] Auto-starting call...');
      setIsConnecting(true);
      
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        createCall();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [roomUrl, isCallActive, isConnecting, createCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 [DailyVideoCall] Cleaning up component...');
      if (callRef.current) {
        callRef.current.leave().catch(console.error);
        callRef.current.destroy().catch(console.error);
      }
    };
  }, []);

  // Periodic audio check
  useEffect(() => {
    if (!isCallActive || !callRef.current) return;
    
    const checkAudio = () => {
      if (!callRef.current) return;
      
      const participants = callRef.current.participants();
      const localParticipant = participants.local;
      
      if (localParticipant && !localParticipant.audio && isAudioEnabled) {
        console.warn('⚠️ [DailyVideoCall] Local audio is disabled, re-enabling...');
        callRef.current.setLocalAudio(true);
      }
      
      // Log participants status
      console.log('🔍 [DailyVideoCall] Periodic check:', {
        duration: formatDuration(callDuration),
        localAudio: localParticipant?.audio,
        localVideo: localParticipant?.video,
        remoteCount: Object.keys(participants).filter(id => id !== 'local').length
      });
    };
    
    // Check every 5 seconds
    const interval = setInterval(checkAudio, 5000);
    
    return () => clearInterval(interval);
  }, [isCallActive, callDuration, isAudioEnabled, formatDuration]);

  // Render remote participants
  const remoteParticipants = Object.values(participants).filter(p => !p.local);
  const hasRemoteParticipants = remoteParticipants.length > 0;

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      {/* Daily iframe container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Overlay with controls */}
      {isCallActive && (
        <>
          {/* Header */}
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

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent" style={{ zIndex: 50 }}>
            <div className="flex items-center justify-center gap-4">
              {/* Audio button */}
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
                aria-label={isAudioEnabled ? "Mute" : "Unmute"}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </button>

              {/* End call button */}
              <button
                onClick={leaveCall}
                className={cn(
                  "relative rounded-full transition-all duration-200",
                  "w-16 h-16 flex items-center justify-center mx-4",
                  "bg-red-500 hover:bg-red-600 shadow-xl",
                  "transform hover:scale-105 active:scale-95"
                )}
                aria-label="End call"
              >
                <Phone className="w-7 h-7 text-white rotate-[135deg]" />
              </button>

              {/* Video button */}
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
                aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Status indicator */}
          {!hasRemoteParticipants && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center" style={{ zIndex: 40 }}>
              <p className="text-white/60 text-lg">Waiting for participant...</p>
            </div>
          )}
        </>
      )}

      {/* Connecting state */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-white text-lg">Connecting...</p>
            <p className="text-white/60 text-sm mt-2">Setting up your video call...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && !isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div className="text-center max-w-md">
            <div className="bg-red-500/20 rounded-full p-4 mb-4 mx-auto w-fit">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-white text-lg font-medium mb-2">Connection Error</p>
            <p className="text-white/80 text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsConnecting(true);
                createCall();
              }}
              className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}