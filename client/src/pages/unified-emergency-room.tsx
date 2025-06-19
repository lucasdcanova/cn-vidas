import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import MinimalistVideoCall from '@/components/telemedicine/MinimalistVideoCall';

/**
 * Sala de Emergência Unificada
 * Página única que garante que médico e paciente acessem a mesma sala
 */
export default function UnifiedEmergencyRoom() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<{
    roomUrl: string;
    token: string;
    appointmentId: number;
    roomName: string;
  } | null>(null);
  
  const isDoctor = user?.role === 'doctor';
  
  // Extrair ID da consulta da URL
  const getAppointmentIdFromUrl = (): number | null => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const appointmentId = urlParams.get('id');
      return appointmentId ? parseInt(appointmentId) : null;
    } catch (e) {
      console.error('Erro ao extrair ID da URL:', e);
      return null;
    }
  };
  
  // Entrar na sala de emergência
  const joinEmergencyRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        toast({
          title: 'Não autorizado',
          description: 'Você precisa estar logado para acessar esta página',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }
      
      // 1. Verificar se há ID na URL
      const appointmentId = getAppointmentIdFromUrl();
      
      if (!appointmentId) {
        throw new Error('ID da consulta não fornecido');
      }
      
      // 2. Buscar dados da consulta de emergência
      const response = await apiRequest('GET', `/api/emergency/v2/consultation/${appointmentId}`);
      
      if (!response.ok) {
        throw new Error('Consulta não encontrada');
      }

      const data = await response.json();
      console.log('📊 Dados da consulta:', {
        appointmentId,
        roomUrl: data.roomUrl,
        dailyRoomUrl: data.dailyRoomUrl,
        telemedRoomName: data.telemedRoomName,
        hasToken: !!data.token
      });

      // Garantir que temos a URL da sala
      let roomUrl = data.roomUrl || data.dailyRoomUrl;
      let roomName = data.telemedRoomName; // Usar o nome que já está salvo!
      
      if (!roomUrl && roomName) {
        roomUrl = `https://cnvidas.daily.co/${roomName}`;
      }
      
      if (!roomUrl || !roomName) {
        throw new Error('Sala de emergência não encontrada. Certifique-se de que a consulta foi criada corretamente.');
      }
      
      console.log('🎯 Usando sala existente:', {
        roomName,
        roomUrl,
        appointmentId
      });
      
      // Verificar se a sala existe no Daily.co antes de tentar entrar
      console.log('🔍 Verificando se a sala existe no Daily.co...');
      const verifyResponse = await apiRequest('GET', `/api/emergency/v2/verify-room/${roomName}`);
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        if (!verifyData.exists) {
          console.error('❌ Sala não existe no Daily.co, aguardando propagação...');
          // Aguardar mais tempo para propagação
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.log('✅ Sala confirmada no Daily.co:', verifyData.room);
        }
      }
      
      // Use the token from the consultation data if available
      let token = data.token;
      
      // For emergency rooms, we'll work without tokens (public mode)
      // Daily.co allows public rooms without authentication
      if (!token) {
        console.log('🔓 Sala de emergência funcionará em modo público (sem token)');
        // No need to request a token for emergency rooms
        // The room was created with the emergency consultation
      } else {
        console.log('✅ Usando token existente da consulta');
      }
      
      // Configurar dados da sala
      const roomInfo = {
        roomUrl,
        token: token || null,
        appointmentId: appointmentId,
        roomName: roomUrl.split('/').pop() || `emergency-${appointmentId}`
      };
      
      console.log('🏠 Dados finais da sala:', {
        roomUrl: roomInfo.roomUrl,
        roomName: roomInfo.roomName,
        token: roomInfo.token,
        tokenType: typeof roomInfo.token,
        hasToken: !!roomInfo.token,
        isDoctor
      });
      
      // Atualizar estado
      setRoomData(roomInfo);
      
      toast({
        title: 'Sala de emergência',
        description: isDoctor ? 'Conectando ao paciente...' : 'Médico está sendo notificado...',
      });
      
    } catch (err) {
      console.error('Erro ao acessar sala:', err);
      setError(err instanceof Error ? err.message : 'Erro ao acessar sala de emergência');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar a sala de emergência',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Sair da chamada
  const handleLeaveCall = () => {
    navigate('/');
    
    toast({
      title: 'Atendimento encerrado',
      description: 'Você saiu da sala de emergência',
    });
  };
  
  // Iniciar ao carregar a página
  useEffect(() => {
    joinEmergencyRoom();
  }, [user]);
  
  return (
    <>
      <Helmet>
        <title>Atendimento de Emergência | CN Vidas</title>
      </Helmet>
      
      <div className="container max-w-6xl py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-center">
            {isDoctor ? 'Atendimento de Emergência' : 'Consulta de Emergência'}
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            {isDoctor 
              ? 'Você está atendendo um paciente em emergência'
              : 'Um médico foi notificado e entrará na sala em instantes'}
          </p>
        </header>
        
        {/* Conteúdo da página - estados condicionais */}
        <div className="space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">
                {isDoctor ? 'Conectando ao paciente...' : 'Conectando ao médico...'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Por favor, aguarde enquanto preparamos sua consulta
              </p>
            </div>
          )}
          
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-8 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erro na conexão</h2>
              <p className="text-center mb-6">{error}</p>
              <Button 
                onClick={joinEmergencyRoom}
                variant="default"
              >
                Tentar novamente
              </Button>
            </div>
          )}
          
          {!loading && !error && roomData && (
            <div className="fixed inset-0 z-50 bg-black">
              <MinimalistVideoCall
                roomUrl={roomData.roomUrl}
                token={roomData.token || undefined}
                userName={user?.fullName || (isDoctor ? 'Médico' : 'Paciente')}
                isDoctor={isDoctor}
                onLeaveCall={handleLeaveCall}
                appointmentId={roomData.appointmentId}
                enableRecording={true}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}