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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log('🧹 Iniciando limpeza de emergências antigas...');
    
    // Buscar emergências antigas em waiting sem médico
    const oldWaitingEmergencies = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.isEmergency, true),
          eq(appointments.status, 'waiting'),
          lt(appointments.createdAt, twelveHoursAgo),
          isNull(appointments.doctorId)
        )
      );
    
    // Buscar emergências em in_progress há mais de 24 horas
    const oldInProgressEmergencies = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.isEmergency, true),
          eq(appointments.status, 'in_progress'),
          lt(appointments.createdAt, twentyFourHoursAgo)
        )
      );
    
    const oldEmergencies = [...oldWaitingEmergencies, ...oldInProgressEmergencies];
    
    console.log(`📊 Encontradas ${oldEmergencies.length} emergências antigas para cancelar`);
    console.log(`📊 Waiting: ${oldWaitingEmergencies.length}, In Progress: ${oldInProgressEmergencies.length}`);
    
    // Cancelar cada uma
    for (const appointment of oldEmergencies) {
      try {
        const isInProgress = appointment.status === 'in_progress';
        const reason = isInProgress 
          ? 'Consulta de emergência expirada após 24 horas em andamento'
          : 'Tempo de espera excedido (12 horas)';
        
        // Atualizar status para cancelled
        await db.update(appointments)
          .set({ 
            status: 'cancelled',
            updatedAt: new Date()
          })
          .where(eq(appointments.id, appointment.id));
        
        console.log(`❌ Emergência ${appointment.id} (${appointment.status}) cancelada por tempo excedido`);
        
        // Criar notificação para o paciente
        if (appointment.userId) {
          const isInProgress = appointment.status === 'in_progress';
          await storage.createNotification({
            userId: appointment.userId,
            type: 'appointment_cancelled',
            title: 'Consulta de emergência cancelada',
            message: isInProgress 
              ? 'Sua consulta de emergência foi cancelada por exceder o tempo limite de 24 horas em andamento.'
              : 'Sua consulta de emergência foi cancelada por exceder o tempo limite de espera de 12 horas.',
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