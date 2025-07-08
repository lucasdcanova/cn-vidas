import { db } from '../db';
import { appointments, doctors, users } from '../../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { NotificationService } from '../utils/notification-service';
import { addMinutes, subMinutes, addHours } from 'date-fns';

/**
 * Job para enviar lembretes de consultas agendadas
 */
export async function sendAppointmentReminders() {
  try {
    const now = new Date();
    const oneHourFromNow = addMinutes(now, 60);
    const oneHourPlusFive = addMinutes(now, 65); // Margem de 5 minutos

    // Buscar consultas que começam em aproximadamente 1 hora
    const upcomingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.date, oneHourFromNow),
          lte(appointments.date, oneHourPlusFive),
          eq(appointments.status, 'scheduled')
        )
      );

    console.log(`📅 Encontradas ${upcomingAppointments.length} consultas para lembrete`);

    for (const appointment of upcomingAppointments) {
      try {
        // Buscar informações do paciente
        const [patient] = await db
          .select()
          .from(users)
          .where(eq(users.id, appointment.userId));

        // Buscar informações do médico
        const [doctor] = appointment.doctorId ? 
          await db.select().from(doctors).where(eq(doctors.id, appointment.doctorId)) : 
          [null];
          
        const [doctorUser] = doctor?.userId ? 
          await db.select().from(users).where(eq(users.id, doctor.userId)) : 
          [null];

        if (!patient || !doctor || !doctorUser) {
          console.error(`⚠️ Dados incompletos para consulta ${appointment.id}`);
          continue;
        }

        // Enviar lembrete para o paciente
        await NotificationService.createAppointmentReminderNotification(
          patient.id,
          appointment.id,
          doctorUser.fullName || doctorUser.username || 'Médico',
          appointment.date,
          false
        );

        // Enviar lembrete para o médico
        await NotificationService.createAppointmentReminderNotification(
          doctorUser.id,
          appointment.id,
          patient.fullName || patient.username || 'Paciente',
          appointment.date,
          true
        );

        console.log(`✅ Lembretes enviados para consulta ${appointment.id}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar lembrete para consulta ${appointment.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Erro no job de lembretes:', error);
  }
}

/**
 * Job para enviar lembretes de 24 horas antes das consultas
 */
export async function send24HourReminders() {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = addHours(now, 24);
    const twentyFourHoursPlusFive = addMinutes(twentyFourHoursFromNow, 5); // Margem de 5 minutos

    // Buscar consultas que começam em aproximadamente 24 horas
    const upcomingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.date, twentyFourHoursFromNow),
          lte(appointments.date, twentyFourHoursPlusFive),
          eq(appointments.status, 'scheduled')
        )
      );

    console.log(`📅 Encontradas ${upcomingAppointments.length} consultas para lembrete de 24h`);

    for (const appointment of upcomingAppointments) {
      try {
        // Buscar informações do paciente
        const [patient] = await db
          .select()
          .from(users)
          .where(eq(users.id, appointment.userId));

        // Buscar informações do médico
        const [doctor] = appointment.doctorId ? 
          await db.select().from(doctors).where(eq(doctors.id, appointment.doctorId)) : 
          [null];
          
        const [doctorUser] = doctor?.userId ? 
          await db.select().from(users).where(eq(users.id, doctor.userId)) : 
          [null];

        if (!patient || !doctor || !doctorUser) {
          console.error(`⚠️ Dados incompletos para consulta ${appointment.id}`);
          continue;
        }

        // Criar notificação customizada para 24h
        await NotificationService.createSystemNotification(
          patient.id,
          '📅 Lembrete de Consulta - Amanhã',
          `Sua consulta com Dr(a). ${doctorUser.fullName || doctorUser.username || 'Médico'} está marcada para amanhã às ${appointment.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          { appointmentId: appointment.id, reminder24h: true }
        );

        console.log(`✅ Lembrete de 24h enviado para consulta ${appointment.id}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar lembrete de 24h para consulta ${appointment.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Erro no job de lembretes de 24h:', error);
  }
}

/**
 * Job para verificar consultas de emergência sem atendimento
 */
export async function checkUnattendedEmergencies() {
  try {
    const now = new Date();
    const fiveMinutesAgo = subMinutes(now, 5);

    // Buscar consultas de emergência não atendidas há mais de 5 minutos
    const unattendedEmergencies = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.type, 'emergency'),
          eq(appointments.status, 'scheduled'),
          lte(appointments.date, fiveMinutesAgo)
        )
      );

    console.log(`🚨 Encontradas ${unattendedEmergencies.length} emergências não atendidas`);

    // Para cada emergência não atendida, reenviar notificação aos médicos
    for (const emergency of unattendedEmergencies) {
      try {
        const [patient] = await db
          .select()
          .from(users)
          .where(eq(users.id, emergency.userId));

        if (patient) {
          await NotificationService.createEmergencyNotificationForDoctors(
            patient.fullName || patient.username || 'Paciente',
            emergency.id
          );
        }
      } catch (error) {
        console.error(`❌ Erro ao reenviar notificação de emergência ${emergency.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Erro no job de emergências não atendidas:', error);
  }
}