// @ts-nocheck
import { Router, Request, Response } from 'express';
import { storage } from '../storage.js';
import { authenticateToken } from '../middleware/auth.js';

const emergencyAvailabilityRouter = Router();

/**
 * POST /api/emergency-availability/toggle
 * Alternar disponibilidade para emergência
 */
emergencyAvailabilityRouter.post('/toggle', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { available } = req.body;
    
    console.log(`🚨 Alternando disponibilidade de emergência - userId: ${userId}, available: ${available}`);
    
    // Buscar o médico
    const doctor = await storage.getDoctorByUserId(userId);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Atualizar apenas o campo availableForEmergency diretamente no banco
    const db = storage.db;
    const { doctors } = await import('../../shared/schema.js');
    const { eq } = await import('drizzle-orm');
    
    const [updatedDoctor] = await db
      .update(doctors)
      .set({ availableForEmergency: available })
      .where(eq(doctors.id, doctor.id))
      .returning({ 
        id: doctors.id,
        availableForEmergency: doctors.availableForEmergency 
      });
    
    console.log(`✅ Disponibilidade atualizada - doctorId: ${doctor.id}, availableForEmergency: ${updatedDoctor.availableForEmergency}`);
    
    return res.json({
      success: true,
      doctorId: updatedDoctor.id,
      availableForEmergency: updatedDoctor.availableForEmergency,
      message: available 
        ? 'Você está disponível para atender emergências' 
        : 'Você não está mais disponível para emergências'
    });
    
  } catch (error) {
    console.error('❌ Erro ao alternar disponibilidade de emergência:', error);
    return res.status(500).json({ 
      error: 'Erro ao atualizar disponibilidade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/emergency-availability/status
 * Verificar status de disponibilidade
 */
emergencyAvailabilityRouter.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const doctor = await storage.getDoctorByUserId(userId);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    return res.json({
      doctorId: doctor.id,
      availableForEmergency: doctor.availableForEmergency || false
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar disponibilidade:', error);
    return res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
  }
});

export default emergencyAvailabilityRouter;
