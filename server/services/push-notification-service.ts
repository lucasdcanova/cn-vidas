import { db, deviceTokens } from '../db';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Serviço para envio de push notifications
 * Por enquanto, apenas a estrutura básica. 
 * A implementação real do APNs será feita quando tiver os certificados.
 */
export class PushNotificationService {
  private static instance: PushNotificationService;

  private constructor() {
    // Singleton
  }

  static getInstance(): PushNotificationService {
    if (!this.instance) {
      this.instance = new PushNotificationService();
    }
    return this.instance;
  }

  /**
   * Envia notificação push para um usuário específico
   */
  async sendToUser(userId: number, notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: string;
  }): Promise<void> {
    try {
      // Buscar tokens ativos do usuário
      const tokens = await db
        .select()
        .from(deviceTokens)
        .where(
          and(
            eq(deviceTokens.userId, userId),
            eq(deviceTokens.isActive, true)
          )
        );

      if (tokens.length === 0) {
        console.log(`Nenhum token ativo encontrado para usuário ${userId}`);
        return;
      }

      // Enviar para cada plataforma
      for (const tokenRecord of tokens) {
        await this.sendToPlatform(tokenRecord.platform, tokenRecord.token, notification);
        
        // Atualizar lastUsedAt
        await db
          .update(deviceTokens)
          .set({ lastUsedAt: new Date() })
          .where(eq(deviceTokens.id, tokenRecord.id));
      }
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
      throw error;
    }
  }

  /**
   * Envia notificação para múltiplos usuários
   */
  async sendToUsers(userIds: number[], notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    // Processar em lotes para não sobrecarregar
    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const tokens = await db
        .select()
        .from(deviceTokens)
        .where(
          and(
            inArray(deviceTokens.userId, batch),
            eq(deviceTokens.isActive, true)
          )
        );

      // Enviar notificações em paralelo
      await Promise.all(
        tokens.map(tokenRecord => 
          this.sendToPlatform(tokenRecord.platform, tokenRecord.token, notification)
        )
      );
    }
  }

  /**
   * Envia notificação para uma plataforma específica
   */
  private async sendToPlatform(
    platform: string, 
    token: string, 
    notification: any
  ): Promise<void> {
    console.log(`Enviando notificação para ${platform}:`, {
      token: token.substring(0, 10) + '...',
      title: notification.title,
      body: notification.body,
    });

    switch (platform) {
      case 'ios':
        await this.sendToAPNs(token, notification);
        break;
      
      case 'android':
        await this.sendToFCM(token, notification);
        break;
      
      case 'web':
        // Web push notifications (PWA)
        console.log('Web push ainda não implementado');
        break;
      
      default:
        console.warn(`Plataforma desconhecida: ${platform}`);
    }
  }

  /**
   * Envia para Apple Push Notification Service (APNs)
   * TODO: Implementar quando tiver certificados
   */
  private async sendToAPNs(token: string, notification: any): Promise<void> {
    console.log('APNs ainda não implementado. Será implementado com certificados.');
    
    // Estrutura da notificação APNs:
    /*
    const apnsNotification = {
      aps: {
        alert: {
          title: notification.title,
          body: notification.body,
        },
        badge: notification.badge || 0,
        sound: notification.sound || 'default',
        'content-available': 1,
      },
      // Dados customizados
      ...notification.data,
    };
    */
  }

  /**
   * Envia para Firebase Cloud Messaging (Android)
   * TODO: Implementar quando adicionar suporte Android
   */
  private async sendToFCM(token: string, notification: any): Promise<void> {
    console.log('FCM ainda não implementado. Será implementado quando adicionar Android.');
  }

  /**
   * Envia notificação de emergência (alta prioridade)
   */
  async sendEmergencyNotification(doctorIds: number[]): Promise<void> {
    const notification = {
      title: '🚨 Consulta de Emergência',
      body: 'Um paciente precisa de atendimento urgente!',
      data: {
        type: 'emergency',
        priority: 'high',
      },
      sound: 'emergency.wav', // Som customizado para emergências
    };

    await this.sendToUsers(doctorIds, notification);
  }

  /**
   * Envia notificação de consulta agendada
   */
  async sendAppointmentNotification(userId: number, appointment: {
    doctorName: string;
    date: Date;
    type: 'reminder' | 'confirmed' | 'cancelled';
  }): Promise<void> {
    let notification;

    switch (appointment.type) {
      case 'reminder':
        notification = {
          title: '⏰ Lembrete de Consulta',
          body: `Sua consulta com Dr(a). ${appointment.doctorName} é em 30 minutos`,
          data: {
            type: 'appointment_reminder',
            date: appointment.date.toISOString(),
          },
        };
        break;
      
      case 'confirmed':
        notification = {
          title: '✅ Consulta Confirmada',
          body: `Consulta com Dr(a). ${appointment.doctorName} confirmada para ${new Date(appointment.date).toLocaleString('pt-BR')}`,
          data: {
            type: 'appointment_confirmed',
            date: appointment.date.toISOString(),
          },
        };
        break;
      
      case 'cancelled':
        notification = {
          title: '❌ Consulta Cancelada',
          body: `Sua consulta com Dr(a). ${appointment.doctorName} foi cancelada`,
          data: {
            type: 'appointment_cancelled',
            date: appointment.date.toISOString(),
          },
        };
        break;
    }

    await this.sendToUser(userId, notification);
  }

  /**
   * Remove tokens inativos ou expirados
   */
  async cleanupInactiveTokens(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await db
      .delete(deviceTokens)
      .where(
        and(
          eq(deviceTokens.isActive, false),
          eq(deviceTokens.updatedAt, thirtyDaysAgo)
        )
      );
  }
}

// Exportar instância singleton
export const pushNotificationService = PushNotificationService.getInstance();