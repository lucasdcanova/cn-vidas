import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldAlert, User, Clock, Video, AlertCircle, Loader2 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export function EmergencyAppointmentsList() {
  const [emergencyAppointments, setEmergencyAppointments] = useState<EmergencyAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Buscar consultas de emergência aguardando
  const fetchEmergencyAppointments = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as consultas do médico
      const response = await apiRequest('GET', '/api/doctors/appointments');
      if (response.ok) {
        const data = await response.json();
        console.log('🚨 EmergencyAppointmentsList - Resposta da API:', data);
        
        // A API retorna { appointments: [], total: number }
        const appointments = data.appointments || [];
        console.log('🚨 EmergencyAppointmentsList - Appointments:', appointments);
        
        // Filtrar apenas emergências aguardando
        const emergencies = appointments.filter((apt: any) => 
          apt.isEmergency && 
          (apt.status === 'waiting' || apt.status === 'scheduled' || apt.status === 'confirmed')
        );
        
        // Para cada emergência, buscar dados do paciente
        const emergenciesWithPatients = await Promise.all(
          emergencies.map(async (apt: any) => {
            try {
              const userResponse = await apiRequest('GET', `/api/users/${apt.userId}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...apt,
                  patientName: userData.fullName || userData.username || 'Paciente'
                };
              }
            } catch (error) {
              console.error('Erro ao buscar dados do paciente:', error);
            }
            return apt;
          })
        );
        
        setEmergencyAppointments(emergenciesWithPatients);
        
        // Se houver novas emergências, mostrar notificação
        if (emergenciesWithPatients.length > emergencyAppointments.length) {
          toast({
            title: "Nova consulta de emergência!",
            description: "Um paciente está aguardando atendimento de emergência",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar consultas de emergência:', error);
    } finally {
      setLoading(false);
    }
  };

  // Polling para verificar novas emergências
  useEffect(() => {
    fetchEmergencyAppointments();
    const interval = setInterval(fetchEmergencyAppointments, 5000); // A cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const handleJoinEmergency = async (appointment: EmergencyAppointment) => {
    try {
      // Entrar na consulta de emergência
      const response = await apiRequest('POST', `/api/emergency/v2/join/${appointment.id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Entrando na sala de emergência",
          description: `Conectando com ${appointment.patientName}...`,
        });
        
        // Redirecionar para a sala
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

  if (loading && emergencyAppointments.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="py-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
            <span className="text-sm text-orange-700">Verificando emergências...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (emergencyAppointments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="border-red-500 bg-red-50 shadow-lg">
        <CardHeader className="pb-3 bg-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
              <CardTitle className="text-red-700 text-lg">
                Consultas de Emergência Aguardando
              </CardTitle>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              {emergencyAppointments.length} aguardando
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {emergencyAppointments.map((appointment) => (
            <Card key={appointment.id} className="border-red-300 bg-white">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Informações do paciente */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.patientName || 'Paciente'}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>
                            Aguardando há {
                              Math.floor((Date.now() - new Date(appointment.createdAt).getTime()) / 60000)
                            } min
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Emergência
                    </Badge>
                  </div>

                  {/* Botão para atender */}
                  <Button
                    onClick={() => handleJoinEmergency(appointment)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Atender Emergência Agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}