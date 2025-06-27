import { PushNotifications, PushNotificationSchema, ActionPerformed, Token } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

/**
 * Serviço de notificações push para iOS/Android
 */
export class PushNotificationService {
  private static isInitialized = false;

  /**
   * Inicializa o serviço de notificações push
   */
  static async initialize(): Promise<void> {
    // Só inicializa em plataformas nativas
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications não disponíveis na web');
      return;
    }

    if (this.isInitialized) {
      console.log('Push notifications já inicializadas');
      return;
    }

    try {
      // Solicitar permissões
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Registrar para receber notificações
        await PushNotifications.register();
        
        // Configurar listeners
        this.setupListeners();
        
        this.isInitialized = true;
        console.log('Push notifications inicializadas com sucesso');
      } else {
        console.warn('Permissão para notificações negada');
        toast.warning('Notificações desabilitadas. Você pode habilitar nas configurações do app.');
      }
    } catch (error) {
      console.error('Erro ao inicializar push notifications:', error);
    }
  }

  /**
   * Configura os listeners de notificações
   */
  private static setupListeners(): void {
    // Quando recebe o token de registro
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      
      // Enviar token para o backend
      try {
        await this.sendTokenToBackend(token.value);
      } catch (error) {
        console.error('Erro ao enviar token para backend:', error);
      }
    });

    // Erro no registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // Notificação recebida com app em foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      
      // Mostrar notificação local quando app está aberto
      if (notification.title) {
        toast.info(notification.title, {
          description: notification.body,
          duration: 5000,
        });
      }
    });

    // Ação quando usuário toca na notificação
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
      
      // Navegar para a tela apropriada baseado nos dados da notificação
      const data = notification.notification.data;
      
      // Deep linking baseado no tipo de notificação
      switch (data?.type) {
        case 'appointment':
          // Verificar se é médico ou paciente pela presença do campo role
          if (data.role === 'doctor') {
            window.location.href = '/doctor-telemedicine';
          } else {
            window.location.href = '/telemedicine';
          }
          break;
          
        case 'appointment_reminder':
        case 'appointment_confirmed':
          // Navegar para detalhes da consulta
          if (data.role === 'doctor') {
            window.location.href = '/doctor-telemedicine';
          } else {
            window.location.href = '/telemedicine';
          }
          break;
          
        case 'appointment_completed':
          // Navegar para histórico de consultas
          if (data.role === 'doctor') {
            window.location.href = '/doctor/consultation-history';
          } else {
            window.location.href = '/telemedicine';
          }
          break;
          
        case 'emergency':
          // Para médicos, navegar para tela de teleconsultas onde aparecem as emergências
          if (data.role === 'doctor' || data.priority === 'high') {
            window.location.href = '/doctor-telemedicine';
          } else if (data.appointmentId) {
            window.location.href = `/emergency-room/${data.appointmentId}`;
          } else {
            window.location.href = '/telemedicine-emergency';
          }
          break;
          
        case 'prescription':
          // Navegar para prescrições
          window.location.href = '/prescriptions';
          break;
          
        case 'medical_record':
          // Navegar para prontuário
          if (data.role === 'doctor') {
            window.location.href = '/doctor/medical-records';
          } else {
            window.location.href = '/medical-records';
          }
          break;
          
        default:
          // Navegar para dashboard por padrão
          if (data.role === 'doctor') {
            window.location.href = '/doctor-telemedicine';
          } else {
            window.location.href = '/dashboard';
          }
      }
    });
  }

  /**
   * Envia o token para o backend
   */
  private static async sendTokenToBackend(token: string): Promise<void> {
    const response = await fetch('/api/push-notifications/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform: Capacitor.getPlatform(),
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar token no backend');
    }
  }

  /**
   * Remove o token do dispositivo (logout)
   */
  static async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await PushNotifications.removeAllListeners();
      
      // Enviar requisição para remover token do backend
      await fetch('/api/push-notifications/unregister', {
        method: 'POST',
        credentials: 'include',
      });
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Erro ao desregistrar push notifications:', error);
    }
  }

  /**
   * Verifica se as notificações estão habilitadas
   */
  static async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const permission = await PushNotifications.checkPermissions();
    return permission.receive === 'granted';
  }
}