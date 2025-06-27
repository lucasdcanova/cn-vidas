import * as apn from 'apn';
import { apnsConfig } from '../config/apns-config';

/**
 * Serviço para enviar notificações push via APNs
 */
export class APNsService {
  private static provider: apn.Provider | null = null;
  
  /**
   * Inicializa o provider APNs
   */
  static async initialize(): Promise<boolean> {
    try {
      // Verificar se os certificados existem
      if (!apnsConfig.validateCertificates()) {
        console.warn('⚠️ APNs não configurado - certificados ausentes');
        return false;
      }
      
      // Configurar provider
      const options: apn.ProviderOptions = {
        production: apnsConfig.production,
      };
      
      // Usar autenticação por token se disponível
      if (apnsConfig.teamId && apnsConfig.keyId) {
        options.token = {
          teamId: apnsConfig.teamId,
          keyId: apnsConfig.keyId,
          key: process.env.APNS_AUTH_KEY_PATH || '',
        };
      } else {
        // Usar certificados
        options.cert = apnsConfig.cert;
        options.key = apnsConfig.key;
      }
      
      this.provider = new apn.Provider(options);
      console.log('✅ APNs provider inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar APNs provider:', error);
      return false;
    }
  }
  
  /**
   * Envia notificação para dispositivo iOS
   */
  static async sendNotification(
    deviceToken: string,
    notification: {
      title: string;
      body: string;
      badge?: number;
      sound?: string;
      data?: any;
    }
  ): Promise<boolean> {
    if (!this.provider) {
      console.error('APNs provider não inicializado');
      return false;
    }
    
    try {
      const apnNotification = new apn.Notification({
        alert: {
          title: notification.title,
          body: notification.body,
        },
        badge: notification.badge,
        sound: notification.sound || 'default',
        payload: notification.data || {},
        topic: apnsConfig.topic,
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hora
        priority: 10, // Alta prioridade
      });
      
      const result = await this.provider.send(apnNotification, deviceToken);
      
      if (result.failed.length > 0) {
        console.error('❌ Falha ao enviar notificação APNs:', result.failed[0]);
        return false;
      }
      
      console.log('✅ Notificação APNs enviada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação APNs:', error);
      return false;
    }
  }
  
  /**
   * Encerra a conexão com APNs
   */
  static async shutdown(): Promise<void> {
    if (this.provider) {
      await this.provider.shutdown();
      this.provider = null;
      console.log('APNs provider encerrado');
    }
  }
}

// Inicializar ao importar
APNsService.initialize();