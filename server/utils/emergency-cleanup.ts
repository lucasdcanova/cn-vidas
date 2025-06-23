import { storage } from '../storage.js';
import { appointments } from '../../shared/schema.js';
import { db } from '../db.js';
import { and, eq, lt, isNull } from 'drizzle-orm';

/**
 * Limpa consultas de emergência antigas (mais de 12 horas esperando)
 */
export async function cleanupOldEmergencyAppointments() {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    console.log('🧹 Iniciando limpeza de emergências antigas...');
    
    // Buscar emergências antigas
    const oldEmergencies = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.isEmergency, true),
          eq(appointments.status, 'waiting'),
          lt(appointments.createdAt, twelveHoursAgo),
          isNull(appointments.doctorId)
        )
      );
    
    console.log(`📊 Encontradas ${oldEmergencies.length} emergências antigas para cancelar`);
    
    // Cancelar cada uma
    for (const appointment of oldEmergencies) {
      try {
        // Atualizar status para cancelled
        await db.update(appointments)
          .set({ 
            status: 'cancelled',
            updatedAt: new Date(),
            cancellationReason: 'Tempo de espera excedido (12 horas)'
          })
          .where(eq(appointments.id, appointment.id));
        
        console.log(`❌ Emergência ${appointment.id} cancelada por tempo excedido`);
        
        // Criar notificação para o paciente
        if (appointment.userId) {
          await storage.createNotification({
            userId: appointment.userId,
            type: 'appointment_cancelled',
            title: 'Consulta de emergência cancelada',
            message: 'Sua consulta de emergência foi cancelada por exceder o tempo limite de espera de 12 horas.',
            isRead: false,
            relatedId: appointment.id
          });
        }
      } catch (error) {
        console.error(`Erro ao cancelar emergência ${appointment.id}:`, error);
      }
    }
    
    // Limpar notificações antigas de emergência
    const oldNotifications = await storage.getNotifications(null); // Get all notifications
    const emergencyNotifications = oldNotifications.filter(n => 
      n.type === 'emergency' && 
      !n.isRead && 
      n.createdAt && 
      new Date(n.createdAt) < twelveHoursAgo
    );
    
    console.log(`📊 Encontradas ${emergencyNotifications.length} notificações antigas de emergência`);
    
    // Marcar como lidas
    for (const notification of emergencyNotifications) {
      await storage.markNotificationAsRead(notification.id);
    }
    
    console.log('✅ Limpeza de emergências antigas concluída');
    
    return {
      appointmentsCancelled: oldEmergencies.length,
      notificationsCleared: emergencyNotifications.length
    };
    
  } catch (error) {
    console.error('❌ Erro na limpeza de emergências antigas:', error);
    return {
      appointmentsCancelled: 0,
      notificationsCleared: 0
    };
  }
}

// Executar limpeza a cada hora
export function startEmergencyCleanupJob() {
  // Executar imediatamente na inicialização
  cleanupOldEmergencyAppointments();
  
  // Agendar para executar a cada hora
  setInterval(() => {
    cleanupOldEmergencyAppointments();
  }, 60 * 60 * 1000); // 1 hora
  
  console.log('🕐 Job de limpeza de emergências antigas iniciado (executa a cada hora)');
}