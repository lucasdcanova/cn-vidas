import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { consultationRecordings, appointments, doctors, users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Interface para prescrição
interface Prescription {
  medicamento: string;
  dosagem: string;
  posologia: string;
  duracao: string;
  orientacoes?: string;
}

// Buscar receita médica por ID da consulta
router.get('/appointment/:appointmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    
    console.log(`💊 [Prescription] Buscando receita para consulta ${appointmentId}`);
    
    // Buscar gravação da consulta
    const [recording] = await db.select()
      .from(consultationRecordings)
      .where(eq(consultationRecordings.appointmentId, appointmentId))
      .limit(1);
    
    if (!recording) {
      return res.status(404).json({ 
        error: 'Nenhuma gravação encontrada para esta consulta' 
      });
    }
    
    if (!recording.prescription || (recording.prescription as any[]).length === 0) {
      return res.status(404).json({ 
        error: 'Nenhuma prescrição encontrada para esta consulta' 
      });
    }
    
    // Buscar informações da consulta
    const [appointment] = await db.select({
      appointment: appointments,
      doctor: doctors,
      patient: users
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(users, eq(appointments.userId, users.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    
    // Formatar dados da receita
    const prescriptionData = {
      appointmentId,
      date: recording.createdAt,
      doctor: {
        name: appointment.doctor?.fullName || appointment.doctor?.name || 'Dr(a).',
        crm: appointment.doctor?.licenseNumber || '',
        specialization: appointment.doctor?.specialization || ''
      },
      patient: {
        name: appointment.patient?.fullName || 'Paciente',
        cpf: appointment.patient?.cpf || '',
        birthDate: appointment.patient?.birthDate || ''
      },
      medications: recording.prescription as Prescription[],
      notes: recording.summary || ''
    };
    
    console.log(`✅ [Prescription] Receita encontrada com ${prescriptionData.medications.length} medicamentos`);
    
    res.json(prescriptionData);
    
  } catch (error) {
    console.error('❌ [Prescription] Erro ao buscar receita:', error);
    res.status(500).json({ error: 'Erro ao buscar receita médica' });
  }
});

// Formatar receita para impressão/PDF
router.get('/appointment/:appointmentId/formatted', authenticateToken, async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    
    // Buscar dados completos da receita
    const [recording] = await db.select()
      .from(consultationRecordings)
      .where(eq(consultationRecordings.appointmentId, appointmentId))
      .limit(1);
    
    if (!recording || !recording.prescription) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }
    
    // Buscar informações completas
    const [appointment] = await db.select({
      appointment: appointments,
      doctor: doctors,
      patient: users
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(users, eq(appointments.userId, users.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);
    
    // Gerar HTML formatado da receita
    const medications = recording.prescription as Prescription[];
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receita Médica - ${appointment?.patient?.fullName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .doctor-info { margin-bottom: 20px; }
    .patient-info { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
    .prescription { margin-bottom: 30px; }
    .medication { margin-bottom: 20px; padding: 15px; background: #f5f5f5; }
    .footer { margin-top: 50px; text-align: center; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>RECEITA MÉDICA</h1>
    <p>Data: ${new Date(recording.createdAt).toLocaleDateString('pt-BR')}</p>
  </div>
  
  <div class="doctor-info">
    <h3>${appointment?.doctor?.fullName || appointment?.doctor?.name}</h3>
    <p>${appointment?.doctor?.specialization || ''}</p>
    <p>CRM: ${appointment?.doctor?.licenseNumber || ''}</p>
  </div>
  
  <div class="patient-info">
    <h3>Paciente: ${appointment?.patient?.fullName}</h3>
    <p>CPF: ${appointment?.patient?.cpf || ''}</p>
  </div>
  
  <div class="prescription">
    <h3>PRESCRIÇÃO:</h3>
    ${medications.map((med, index) => `
      <div class="medication">
        <h4>${index + 1}. ${med.medicamento}</h4>
        <p><strong>Dosagem:</strong> ${med.dosagem}</p>
        <p><strong>Posologia:</strong> ${med.posologia}</p>
        <p><strong>Duração:</strong> ${med.duracao}</p>
        ${med.orientacoes ? `<p><strong>Orientações:</strong> ${med.orientacoes}</p>` : ''}
      </div>
    `).join('')}
  </div>
  
  <div class="footer">
    <p>_________________________________</p>
    <p>${appointment?.doctor?.fullName || appointment?.doctor?.name}</p>
    <p>CRM: ${appointment?.doctor?.licenseNumber || ''}</p>
  </div>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error) {
    console.error('❌ [Prescription] Erro ao formatar receita:', error);
    res.status(500).json({ error: 'Erro ao formatar receita' });
  }
});

export default router;