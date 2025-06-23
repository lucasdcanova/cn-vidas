import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Video, Clock, Calendar, User, ShieldAlert, 
  AlertCircle, Loader2 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EmergencyAwareAppointmentsListProps {
  onJoinAppointment?: (appointment: any) => void;
  onDeleteEmergencyAppointment?: (id: string) => void;
}

export function EmergencyAwareAppointmentsList({ 
  onJoinAppointment,
  onDeleteEmergencyAppointment 
}: EmergencyAwareAppointmentsListProps) {
  const { toast } = useToast();

  // Fetch all appointments with React Query
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['/api/doctors/appointments-all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/doctors/appointments');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      const data = await response.json();
      console.log('🔍 EmergencyAwareAppointmentsList - API Response:', data);
      console.log('🔍 EmergencyAwareAppointmentsList - Appointments:', data.appointments);
      return data.appointments || [];
    },
    refetchInterval: 5000, // Update every 5 seconds
    refetchIntervalInBackground: true,
  });

  const appointments = appointmentsData || [];
  console.log('📊 EmergencyAwareAppointmentsList - Total appointments:', appointments.length);
  console.log('📊 EmergencyAwareAppointmentsList - Emergency appointments:', appointments.filter((a: any) => a.isEmergency).length);

  // Filter upcoming appointments (including emergencies)
  const upcomingAppointments = appointments.filter((app: any) => {
    // Emergency appointments - show if active
    if (app.isEmergency) {
      return app.status === 'waiting' || app.status === 'scheduled' || 
             app.status === 'confirmed' || app.status === 'in_progress';
    }
    
    // Regular appointments - check date
    if (!app.date) return false;
    const appointmentDate = new Date(app.date);
    return !isPast(appointmentDate) || isToday(appointmentDate);
  });

  // Sort appointments - emergencies first, then by date
  const sortedAppointments = upcomingAppointments.sort((a: any, b: any) => {
    // Emergencies always come first
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;
    
    // If both are emergencies, sort by creation time
    if (a.isEmergency && b.isEmergency) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    // For regular appointments, sort by date
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const handleJoinEmergency = async (appointment: any) => {
    try {
      const response = await apiRequest('POST', `/api/emergency/v2/join/${appointment.id}`);
      
      if (response.ok) {
        toast({
          title: "Entrando na consulta",
          description: `Conectando com ${appointment.patientName || 'paciente'}...`,
        });
        
        if (onJoinAppointment) {
          onJoinAppointment(appointment);
        } else {
          // Default behavior - redirect to emergency room
          window.location.href = `/doctor-emergency-room/${appointment.id}`;
        }
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao entrar na consulta",
          description: error.error || "Não foi possível entrar na consulta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao entrar na consulta:', error);
      toast({
        title: "Erro",
        description: "Erro ao tentar entrar na consulta",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sortedAppointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center h-32">
          <Video className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Você não tem consultas agendadas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedAppointments.map((appointment: any) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onJoin={() => handleJoinEmergency(appointment)}
          onDelete={onDeleteEmergencyAppointment}
        />
      ))}
    </div>
  );
}

function AppointmentCard({ 
  appointment, 
  onJoin, 
  onDelete 
}: { 
  appointment: any;
  onJoin: () => void;
  onDelete?: (id: string) => void;
}) {
  const isEmergency = appointment.isEmergency;
  const isWaiting = appointment.status === 'waiting';
  
  const getWaitTime = () => {
    if (!isEmergency || !appointment.createdAt) return null;
    const totalMinutes = Math.floor((Date.now() - new Date(appointment.createdAt).getTime()) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (totalMinutes < 1) return { text: 'Agora mesmo', isUrgent: false };
    if (totalMinutes === 1) return { text: '1 minuto', isUrgent: false };
    if (hours === 0) return { text: `${minutes} minutos`, isUrgent: false };
    if (hours === 1) return { text: `1 hora e ${minutes} min`, isUrgent: true };
    
    // Alertar se está próximo de 12 horas
    const isCritical = hours >= 11;
    return { 
      text: `${hours} horas e ${minutes} min`, 
      isUrgent: true,
      isCritical
    };
  };

  const waitTime = getWaitTime();

  return (
    <Card className={cn(
      "transition-all duration-300",
      isEmergency && "border-red-500 bg-red-50/50 shadow-lg"
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                isEmergency ? "bg-red-100" : "bg-primary/10"
              )}>
                {isEmergency ? (
                  <ShieldAlert className="h-6 w-6 text-red-600 animate-pulse" />
                ) : appointment.patientProfileImage ? (
                  <img 
                    src={appointment.patientProfileImage} 
                    alt={appointment.patientName || "Paciente"} 
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
            
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold">
                  {appointment.patientName || "Paciente"}
                </h3>
                {isEmergency ? (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    EMERGÊNCIA
                  </Badge>
                ) : (
                  <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                    {appointment.status === 'confirmed' ? 'Confirmada' : 'Agendada'}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-col mt-2 gap-1 text-sm text-muted-foreground">
                {isEmergency && waitTime ? (
                  <div className={cn(
                    "flex items-center font-medium",
                    waitTime.isCritical ? "text-red-800 animate-pulse" : 
                    waitTime.isUrgent ? "text-orange-600" : "text-red-600"
                  )}>
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Aguardando há {waitTime.text}</span>
                    {waitTime.isCritical && (
                      <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                        CRÍTICO - Expira em breve
                      </span>
                    )}
                  </div>
                ) : appointment.date ? (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(new Date(appointment.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{format(new Date(appointment.date), "HH:mm", { locale: ptBR })}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEmergency && isWaiting ? (
              <Button
                onClick={onJoin}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Atender Emergência
              </Button>
            ) : appointment.status === 'confirmed' && appointment.telemedRoomUrl ? (
              <Button
                onClick={onJoin}
                variant="default"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Entrar na Consulta
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}