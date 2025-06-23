import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldAlert, User, Clock, Video, AlertCircle, Loader2 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface EmergencyAppointment {
  id: number;
  userId: number;
  patientName?: string;
  createdAt: string;
  status: string;
  telemedRoomName?: string;
  telemedRoomUrl?: string;
  isEmergency: boolean;
}

export function EmergencyAppointmentsListOptimized() {
  const { toast } = useToast();
  const previousCountRef = useRef(0);
  const isFirstLoad = useRef(true);

  // Use React Query for efficient data fetching and caching
  const { data: emergencyData, isLoading, isFetching } = useQuery({
    queryKey: ['/api/doctors/appointments-emergency'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/doctors/appointments');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      const data = await response.json();
      const appointments = data.appointments || [];
      
      // Filter only emergency appointments that are waiting
      // The backend already includes patient info, so we don't need separate calls
      return appointments.filter((apt: any) => 
        apt.isEmergency && 
        (apt.status === 'waiting' || apt.status === 'scheduled' || apt.status === 'confirmed')
      );
    },
    refetchInterval: 3000, // Faster refresh for emergencies
    refetchIntervalInBackground: true,
    staleTime: 2000, // Data is fresh for 2 seconds
  });

  const emergencyAppointments = emergencyData || [];

  // Show notification for new emergencies
  useEffect(() => {
    if (!isFirstLoad.current && emergencyAppointments.length > previousCountRef.current) {
      const newCount = emergencyAppointments.length - previousCountRef.current;
      toast({
        title: "🚨 Nova consulta de emergência!",
        description: `${newCount} ${newCount > 1 ? 'pacientes estão' : 'paciente está'} aguardando atendimento`,
        variant: "default",
        duration: 5000,
      });

      // Play notification sound if available
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(() => {});
      } catch {}
    }
    
    previousCountRef.current = emergencyAppointments.length;
    isFirstLoad.current = false;
  }, [emergencyAppointments.length, toast]);

  const handleJoinEmergency = async (appointment: EmergencyAppointment) => {
    try {
      const response = await apiRequest('POST', `/api/emergency/v2/join/${appointment.id}`);
      
      if (response.ok) {
        toast({
          title: "Entrando na sala de emergência",
          description: `Conectando com ${appointment.patientName || 'paciente'}...`,
        });
        
        // Redirect to emergency room
        window.location.href = `/doctor-emergency-room/${appointment.id}`;
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao entrar na consulta",
          description: error.error || "Não foi possível entrar na consulta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao entrar na emergência:', error);
      toast({
        title: "Erro",
        description: "Erro ao tentar entrar na consulta de emergência",
        variant: "destructive"
      });
    }
  };

  // Calculate wait time
  const getWaitTime = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  };

  // Don't show anything if no emergencies
  if (!isLoading && emergencyAppointments.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "space-y-4 transition-all duration-300",
      isFetching && "opacity-90"
    )}>
      <Card className="border-red-500 bg-red-50 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 bg-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
              <CardTitle className="text-red-700 text-lg">
                Emergências Aguardando Atendimento
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && (
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              )}
              <Badge variant="destructive" className="animate-pulse">
                {emergencyAppointments.length} {emergencyAppointments.length === 1 ? 'paciente' : 'pacientes'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : (
            emergencyAppointments.map((appointment, index) => (
              <Card 
                key={appointment.id} 
                className={cn(
                  "border-red-300 bg-white transition-all duration-300",
                  "hover:shadow-md hover:border-red-400",
                  index === 0 && "ring-2 ring-red-500 ring-opacity-50" // Highlight first/oldest
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Patient info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-red-600" />
                          </div>
                          {/* Pulse effect for urgency */}
                          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patientName || 'Paciente'}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Aguardando há {getWaitTime(appointment.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-red-600 border-red-300 animate-pulse"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Urgente
                      </Badge>
                    </div>

                    {/* Action button */}
                    <Button
                      onClick={() => handleJoinEmergency(appointment)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white group"
                      size="sm"
                    >
                      <Video className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                      Atender Emergência Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}