// @ts-nocheck
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
    const appointmentData = await storage.getAppointmentById(appointmentId);
    
    if (!appointmentData) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    
    // Buscar dados do médico e paciente
    const [doctorData, patientData] = await Promise.all([
      appointmentData.doctorId ? storage.getDoctorById(appointmentData.doctorId) : null,
      storage.getUserById(appointmentData.userId)
    ]);
    
    // Formatar dados da receita
    const prescriptionData = {
      appointmentId,
      date: recording.createdAt,
      doctor: {
        name: doctorData?.name || 'Dr(a).',
        crm: doctorData?.licenseNumber || '',
        specialization: doctorData?.specialization || ''
      },
      patient: {
        name: patientData?.fullName || 'Paciente',
        cpf: patientData?.cpf || '',
        birthDate: patientData?.birthDate || ''
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
    const appointmentData = await storage.getAppointmentById(appointmentId);
    
    if (!appointmentData) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    
    // Buscar dados do médico e paciente
    const [doctorData, patientData] = await Promise.all([
      appointmentData.doctorId ? storage.getDoctorById(appointmentData.doctorId) : null,
      storage.getUserById(appointmentData.userId)
    ]);
    
    // Gerar HTML formatado da receita
    const medications = recording.prescription as Prescription[];
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receita Médica - ${patientData?.fullName || 'Paciente'}</title>
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
    <h3>${doctorData?.name || 'Dr(a).'}</h3>
    <p>${doctorData?.specialization || ''}</p>
    <p>CRM: ${doctorData?.licenseNumber || ''}</p>
  </div>
  
  <div class="patient-info">
    <h3>Paciente: ${patientData?.fullName || 'Paciente'}</h3>
    <p>CPF: ${patientData?.cpf || ''}</p>
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
    <p>${doctorData?.name || 'Dr(a).'}</p>
    <p>CRM: ${doctorData?.licenseNumber || ''}</p>
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
