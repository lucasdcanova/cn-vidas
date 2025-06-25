import { LocalNotifications, LocalNotificationSchema, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { format, subDays, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AppointmentNotification {
  appointmentId: number;
  patientName: string;
  doctorName: string;
  appointmentDate: Date;
  userType: 'patient' | 'doctor';
}

class LocalNotificationService {
  private isNative = Capacitor.isNativePlatform();
  private initialized = false;

  async initialize(): Promise<void> {
    if (!this.isNative || this.initialized) {
      return;
    }

    try {
      // Solicitar permissões
      const permission = await LocalNotifications.requestPermissions();
      console.log('Permissão de notificações:', permission.display);
      
      if (permission.display === 'granted') {
        // Registrar listeners
        await this.registerListeners();
        this.initialized = true;
        console.log('Serviço de notificações locais inicializado');
      }
    } catch (error) {
      console.error('Erro ao inicializar notificações locais:', error);
    }
  }

  private async registerListeners() {
    // Listener para quando uma notificação é recebida
    await LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notificação recebida:', notification);
    });

    // Listener para quando o usuário toca em uma notificação
    await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('Ação na notificação:', action);
      
      // Navegar para a consulta se houver dados
      const data = action.notification.extra;
      if (data?.appointmentId) {
        window.location.href = `/appointments/${data.appointmentId}`;
      }
    });
  }

  // Agendar notificações para uma consulta
  async scheduleAppointmentReminders(notification: AppointmentNotification): Promise<void> {
    if (!this.isNative || !this.initialized) {
      console.log('Notificações locais não disponíveis');
      return;
    }

    try {
      const { appointmentId, patientName, doctorName, appointmentDate, userType } = notification;
      
      // Formatar data da consulta
      const formattedDate = format(appointmentDate, "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
      
      // Criar notificações base
      const notifications: LocalNotificationSchema[] = [];

      if (userType === 'patient') {
        // Notificação 1 dia antes para pacientes
        const oneDayBefore = subDays(appointmentDate, 1);
        if (oneDayBefore > new Date()) {
          notifications.push({
            id: appointmentId * 100 + 1,
            title: 'Lembrete de Consulta - Amanhã',
            body: `Sua consulta com Dr(a). ${doctorName} está agendada para amanhã, ${formattedDate}`,
            schedule: { at: oneDayBefore },
            extra: { appointmentId, type: 'one_day_reminder' },
            channelId: 'appointment_reminders'
          });
        }

        // Notificação 1 hora antes para pacientes
        const oneHourBefore = subHours(appointmentDate, 1);
        if (oneHourBefore > new Date()) {
          notifications.push({
            id: appointmentId * 100 + 2,
            title: 'Consulta em 1 hora!',
            body: `Sua consulta com Dr(a). ${doctorName} começa em 1 hora. Prepare-se!`,
            schedule: { at: oneHourBefore },
            extra: { appointmentId, type: 'one_hour_reminder' },
            channelId: 'appointment_reminders'
          });
        }
      } else if (userType === 'doctor') {
        // Notificação 30 minutos antes para médicos
        const thirtyMinutesBefore = subHours(appointmentDate, 0.5);
        if (thirtyMinutesBefore > new Date()) {
          notifications.push({
            id: appointmentId * 100 + 3,
            title: 'Próxima consulta em 30 minutos',
            body: `Consulta com ${patientName} às ${format(appointmentDate, 'HH:mm')}`,
            schedule: { at: thirtyMinutesBefore },
            extra: { appointmentId, type: 'doctor_reminder' },
            channelId: 'appointment_reminders'
          });
        }
      }

      // Agendar todas as notificações
      if (notifications.length > 0) {
        await LocalNotifications.schedule({
          notifications
        });
        console.log(`${notifications.length} notificações agendadas para consulta ${appointmentId}`);
      }
    } catch (error) {
      console.error('Erro ao agendar notificações:', error);
    }
  }

  // Cancelar notificações de uma consulta
  async cancelAppointmentReminders(appointmentId: number): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      // IDs das notificações desta consulta
      const notificationIds = [
        appointmentId * 100 + 1, // 1 dia antes
        appointmentId * 100 + 2, // 1 hora antes
        appointmentId * 100 + 3  // 30 min antes (médico)
      ];

      await LocalNotifications.cancel({
        notifications: notificationIds.map(id => ({ id }))
      });

      console.log(`Notificações canceladas para consulta ${appointmentId}`);
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  }

  // Listar notificações pendentes
  async getPendingNotifications(): Promise<LocalNotificationSchema[]> {
    if (!this.isNative) {
      return [];
    }

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Erro ao listar notificações pendentes:', error);
      return [];
    }
  }

  // Verificar se tem permissão
  async checkPermissions(): Promise<boolean> {
    if (!this.isNative) {
      return false;
    }

    try {
      const permission = await LocalNotifications.checkPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  // Criar canal de notificação (Android)
  async createNotificationChannel(): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await LocalNotifications.createChannel({
        id: 'appointment_reminders',
        name: 'Lembretes de Consultas',
        description: 'Notificações sobre suas consultas no CN Vidas',
        importance: 4, // High importance
        visibility: 1, // Public
        vibration: true,
        sound: 'default'
      });
    } catch (error) {
      console.error('Erro ao criar canal de notificação:', error);
    }
  }
}

export const localNotifications = new LocalNotificationService();