import express, { Response } from 'express';
import { storage } from '../storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../utils/app-error';

const doctorRouter = express.Router();

// Middleware para verificar se o usuário é médico
const requireDoctorRole = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Acesso restrito a médicos' });
  }
  
  next();
};

/**
 * Obter perfil do médico autenticado
 * GET /api/doctors/profile
 */
doctorRouter.get('/profile', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /profile - Buscando perfil do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      console.log('❌ Doctor /profile - Médico não encontrado para user ID:', req.user?.id);
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    console.log('✅ Doctor /profile - Perfil encontrado:', doctor.id);
    console.log('📋 Doctor /profile - onboardingCompleted:', doctor.onboardingCompleted);
    console.log('📋 Doctor /profile - welcomeCompleted:', doctor.welcomeCompleted);
    console.log('📋 Doctor /profile - Dados completos:', {
      id: doctor.id,
      userId: doctor.userId,
      fullName: doctor.name,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      education: doctor.education,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      biography: doctor.biography,
      fullBio: doctor.fullBio,
      areasOfExpertise: doctor.areasOfExpertise,
      languagesSpoken: doctor.languagesSpoken,
      achievements: doctor.achievements,
      profileImage: doctor.profileImage,
      pixKeyType: doctor.pixKeyType,
      pixKey: doctor.pixKey,
      bankName: doctor.bankName,
      accountType: doctor.accountType
    });
    res.json(doctor);
  } catch (error) {
    console.error('❌ Erro ao obter perfil do médico:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter médico por user ID
 * GET /api/doctors/user/:userId
 */
doctorRouter.get('/user/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    console.log('🔍 Doctor /user/:userId - Buscando médico para user ID:', userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }
    
    // Verificar se o usuário pode acessar este perfil
    if (req.user?.role !== 'admin' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const doctor = await storage.getDoctorByUserId(userId);
    if (!doctor) {
      console.log('❌ Doctor /user/:userId - Médico não encontrado para user ID:', userId);
      return res.status(404).json({ error: 'Médico não encontrado' });
    }
    
    console.log('✅ Doctor /user/:userId - Médico encontrado:', doctor.id);
    console.log('📊 Doctor /user/:userId - Dados completos sendo retornados:', {
      id: doctor.id,
      userId: doctor.userId,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      biography: doctor.biography,
      education: doctor.education,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      onboardingCompleted: doctor.onboardingCompleted,
      pixKeyType: doctor.pixKeyType,
      bankName: doctor.bankName
    });
    res.json(doctor);
  } catch (error) {
    console.error('❌ Erro ao obter médico por user ID:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Atualizar perfil do médico
 * PUT /api/doctors/profile
 */
doctorRouter.put('/profile', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor PUT /profile - Atualizando perfil do médico ID:', req.user?.id);
    console.log('🔍 Doctor PUT /profile - Dados recebidos:', req.body);
    
    const { 
      specialization, 
      licenseNumber, 
      biography, 
      education,
      experienceYears,
      availableForEmergency,
      consultationFee,
      consultationPrice, // Campo alternativo do frontend
      profileImage,
      welcomeCompleted,
      pixKeyType,
      pixKey,
      bankName,
      accountType,
      // New onboarding fields
      onboardingCompleted,
      consultationPriceDescription,
      fullBio,
      areasOfExpertise,
      languagesSpoken,
      achievements,
      // Campos alternativos para compatibilidade
      specialty, 
      crm, 
      bio, 
      phone, 
      address 
    } = req.body;
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Mapear campos para o formato correto do banco
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Usar os nomes corretos dos campos ou os alternativos
    if (specialization !== undefined || specialty !== undefined) {
      updateData.specialization = specialization || specialty;
    }
    if (licenseNumber !== undefined || crm !== undefined) {
      updateData.licenseNumber = licenseNumber || crm;
    }
    if (biography !== undefined || bio !== undefined) {
      updateData.biography = biography || bio;
      // If no fullBio is provided, use biography as fallback
      if (fullBio === undefined && (biography || bio)) {
        updateData.fullBio = biography || bio;
      }
    }
    if (education !== undefined) {
      updateData.education = education;
    }
    if (experienceYears !== undefined) {
      updateData.experienceYears = parseInt(experienceYears) || 0;
    }
    if (availableForEmergency !== undefined) {
      updateData.availableForEmergency = Boolean(availableForEmergency);
    }
    if (consultationFee !== undefined || consultationPrice !== undefined) {
      updateData.consultationFee = parseFloat(consultationFee || consultationPrice) || 0;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }
    if (welcomeCompleted !== undefined) {
      updateData.welcomeCompleted = Boolean(welcomeCompleted);
    }
    if (pixKeyType !== undefined) {
      updateData.pixKeyType = pixKeyType;
    }
    if (pixKey !== undefined) {
      updateData.pixKey = pixKey;
    }
    if (bankName !== undefined) {
      updateData.bankName = bankName;
    }
    if (accountType !== undefined) {
      updateData.accountType = accountType;
    }
    // New onboarding fields
    if (onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = Boolean(onboardingCompleted);
    }
    if (consultationPriceDescription !== undefined) {
      updateData.consultationPriceDescription = consultationPriceDescription;
    }
    if (fullBio !== undefined) {
      updateData.fullBio = fullBio;
      // Também salvar no campo biography para compatibilidade
      updateData.biography = fullBio;
    }
    if (areasOfExpertise !== undefined) {
      updateData.areasOfExpertise = Array.isArray(areasOfExpertise) ? areasOfExpertise : [];
    }
    if (languagesSpoken !== undefined) {
      updateData.languagesSpoken = Array.isArray(languagesSpoken) ? languagesSpoken : [];
    }
    if (achievements !== undefined) {
      updateData.achievements = achievements;
    }
    
    console.log('🔍 Doctor PUT /profile - Dados para atualização:', updateData);
    console.log('🔍 Doctor PUT /profile - onboardingCompleted value:', updateData.onboardingCompleted);
    console.log('🔍 Doctor PUT /profile - consultationFee value:', updateData.consultationFee);
    console.log('🔍 Doctor PUT /profile - biography/fullBio value:', updateData.biography || updateData.fullBio);
    
    const updatedDoctor = await storage.updateDoctor(doctor.id, updateData);
    
    console.log('✅ Doctor PUT /profile - Perfil atualizado:', updatedDoctor.id);
    console.log('✅ Doctor PUT /profile - onboardingCompleted após update:', updatedDoctor.onboardingCompleted);
    console.log('✅ Doctor PUT /profile - Dados completos retornados:', {
      id: updatedDoctor.id,
      specialization: updatedDoctor.specialization,
      licenseNumber: updatedDoctor.licenseNumber,
      biography: updatedDoctor.biography,
      education: updatedDoctor.education,
      experienceYears: updatedDoctor.experienceYears,
      consultationFee: updatedDoctor.consultationFee,
      onboardingCompleted: updatedDoctor.onboardingCompleted
    });
    res.json(updatedDoctor);
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil do médico:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter disponibilidade de um médico específico por data
 * GET /api/doctors/:id/availability
 */
doctorRouter.get('/:id/availability', async (req: any, res: Response) => {
  try {
    const doctorId = parseInt(req.params.id);
    const { date } = req.query;
    
    console.log(`🔍 Doctor /:id/availability - Buscando disponibilidade do médico ID: ${doctorId} para data: ${date}`);
    
    if (isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }
    
    // Verificar se o médico existe
    const doctor = await storage.getDoctor(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }
    
    // Buscar slots de disponibilidade do médico
    const availabilitySlots = await storage.getDoctorAvailabilitySlots(doctorId);
    
    if (!date) {
      // Se não foi fornecida uma data específica, retornar todos os slots
      console.log(`✅ Doctor /:id/availability - Retornando ${availabilitySlots.length} slots de disponibilidade`);
      return res.json({ availability: availabilitySlots });
    }
    
    // Converter a data fornecida para objeto Date
    const requestedDate = new Date(date as string);
    const dayOfWeek = requestedDate.getDay(); // 0 = domingo, 1 = segunda, etc.
    
    // Filtrar slots para o dia da semana específico
    const daySlots = availabilitySlots.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );
    
    if (daySlots.length === 0) {
      console.log(`ℹ️ Doctor /:id/availability - Nenhum slot disponível para o dia ${dayOfWeek}`);
      return res.json({ times: [] });
    }
    
    // Buscar agendamentos existentes para esta data
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAppointments = await storage.getDoctorAppointments(doctorId, startOfDay, endOfDay);
    const bookedTimes = existingAppointments.map(apt => {
      const aptDate = new Date(apt.date);
      return `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
    });
    
    // Gerar horários disponíveis baseados nos slots
    const availableTimes: string[] = [];
    
    daySlots.forEach(slot => {
      const startTime = slot.startTime;
      const endTime = slot.endTime;
      
      // Converter horários para minutos para facilitar o cálculo
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Gerar slots de 30 minutos
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        // Verificar se este horário não está ocupado
        if (!bookedTimes.includes(timeSlot)) {
          // Verificar se o horário não é no passado (se for hoje)
          const now = new Date();
          const isToday = requestedDate.toDateString() === now.toDateString();
          
          if (!isToday || (hour * 60 + min) > (now.getHours() * 60 + now.getMinutes())) {
            availableTimes.push(timeSlot);
          }
        }
      }
    });
    
    console.log(`✅ Doctor /:id/availability - ${availableTimes.length} horários disponíveis para ${date}`);
    res.json({ times: availableTimes });
    
  } catch (error) {
    console.error('❌ Erro ao obter disponibilidade do médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Obter consultas do médico
 * GET /api/doctors/appointments
 */
doctorRouter.get('/appointments', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /appointments - Buscando consultas do médico ID:', req.user?.id);
    
    const { status } = req.query;
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Buscar todas as consultas do médico
    const allAppointments = await storage.getAllAppointments();
    
    // Filtrar apenas as consultas deste médico
    const doctorAppointments = allAppointments.filter(app => app.doctorId === doctor.id);
    
    console.log('🔍 Doctor /appointments - Total de consultas:', allAppointments.length);
    console.log('🔍 Doctor /appointments - Consultas do médico (ID ' + doctor.id + '):', doctorAppointments.length);
    console.log('🔍 Doctor /appointments - Consultas de emergência:', doctorAppointments.filter(app => app.isEmergency).length);
    console.log('🔍 Doctor /appointments - Consultas com status waiting:', doctorAppointments.filter(app => app.status === 'waiting').length);
    
    // Adicionar informações do paciente para cada consulta
    const appointmentsWithPatientInfo = await Promise.all(
      doctorAppointments.map(async (appointment) => {
        const patient = appointment.userId ? await storage.getUser(appointment.userId) : null;
        return {
          ...appointment,
          patientName: patient?.fullName || 'Paciente',
          patientAge: null, // Calcular idade se necessário
          patientEmail: patient?.email || '',
          patientPhone: patient?.phone || '',
          patientProfileImage: patient?.profileImage,
          patientBirthDate: patient?.birthDate,
          consultationFee: appointment.paymentAmount || 0,
          diagnosis: '', // Campo não existe no schema
          prescription: '', // Campo não existe no schema
          recordUrl: '', // Campo não existe no schema
          status: appointment.status,
          date: appointment.date
        };
      })
    );
    
    // Filtrar por status se especificado
    let filteredAppointments = appointmentsWithPatientInfo;
    if (status) {
      filteredAppointments = appointmentsWithPatientInfo.filter(app => app.status === status);
    }
    
    // Ordenar por data (mais recentes primeiro)
    filteredAppointments.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    
    console.log('✅ Doctor /appointments - Consultas encontradas:', filteredAppointments.length);
    res.json({ appointments: filteredAppointments, total: filteredAppointments.length });
  } catch (error) {
    console.error('❌ Erro ao obter consultas do médico:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter histórico de consultas
 * GET /api/doctors/appointments/history
 */
doctorRouter.get('/appointments/history', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /appointments/history - Buscando histórico do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Buscar histórico de consultas (implementar quando houver tabela de appointments)
    const history = []; // Placeholder
    
    console.log('✅ Doctor /appointments/history - Histórico encontrado:', history.length);
    res.json({ history, total: history.length });
  } catch (error) {
    console.error('❌ Erro ao obter histórico de consultas:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter pagamentos do médico
 * GET /api/doctors/payments
 */
doctorRouter.get('/payments', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /payments - Buscando pagamentos do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Buscar pagamentos do médico (implementar quando houver sistema de pagamentos)
    const payments = []; // Placeholder
    
    console.log('✅ Doctor /payments - Pagamentos encontrados:', payments.length);
    res.json({ payments, total: payments.length });
  } catch (error) {
    console.error('❌ Erro ao obter pagamentos do médico:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter estatísticas de ganhos
 * GET /api/doctors/earnings
 */
doctorRouter.get('/earnings', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /earnings - Buscando ganhos do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Calcular estatísticas de ganhos (implementar quando houver sistema de pagamentos)
    const earnings = {
      totalEarnings: 0,
      monthlyEarnings: 0,
      pendingPayments: 0,
      totalAppointments: 0
    };
    
    console.log('✅ Doctor /earnings - Estatísticas calculadas');
    res.json(earnings);
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de ganhos:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter configurações de pagamento
 * GET /api/doctors/payment-settings
 */
doctorRouter.get('/payment-settings', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /payment-settings - Buscando configurações do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Retornar apenas dados de pagamento (sem informações sensíveis)
    const paymentSettings = {
      pixKeyType: doctor.pixKeyType,
      pixKey: doctor.pixKey ? doctor.pixKey.substring(0, 5) + '***' : null,
      bankName: doctor.bankName,
      accountType: doctor.accountType
    };
    
    console.log('✅ Doctor /payment-settings - Configurações encontradas');
    res.json(paymentSettings);
  } catch (error) {
    console.error('❌ Erro ao obter configurações de pagamento:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Atualizar configurações de pagamento
 * PUT /api/doctors/payment-settings
 */
doctorRouter.put('/payment-settings', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor PUT /payment-settings - Atualizando configurações do médico ID:', req.user?.id);
    
    const { pixKey, pixKeyType, bankName, accountType } = req.body;
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    const updatedDoctor = await storage.updateDoctor(doctor.id, {
      pixKey,
      pixKeyType,
      bankName,
      accountType,
      updatedAt: new Date()
    });
    
    console.log('✅ Doctor PUT /payment-settings - Configurações atualizadas');
    res.json({ message: 'Configurações de pagamento atualizadas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações de pagamento:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter disponibilidade do médico
 * GET /api/doctors/availability
 */
doctorRouter.get('/availability', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /availability - Buscando disponibilidade do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Buscar disponibilidade do médico
    const availability = await storage.getDoctorAvailabilitySlots(doctor.id);
    
    console.log('✅ Doctor /availability - Disponibilidade encontrada:', availability.length);
    res.json({ availability });
  } catch (error) {
    console.error('❌ Erro ao obter disponibilidade:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Definir horários de disponibilidade
 * POST /api/doctors/availability
 */
doctorRouter.post('/availability', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor POST /availability - Definindo disponibilidade do médico ID:', req.user?.id);
    
    const { slots } = req.body;
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Validar se slots é um array
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'Slots deve ser um array' });
    }
    
    // Preparar slots para salvar
    const slotsToSave = slots.map(slot => ({
      doctorId: doctor.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable !== false // default true
    }));
    
    // Salvar disponibilidade
    const savedSlots = await storage.saveDoctorAvailabilitySlots(slotsToSave);
    
    console.log('✅ Doctor POST /availability - Disponibilidade criada:', savedSlots.length);
    res.status(201).json({ availability: savedSlots });
  } catch (error) {
    console.error('❌ Erro ao criar disponibilidade:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Atualizar horários de disponibilidade
 * PUT /api/doctors/availability
 */
doctorRouter.put('/availability', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor PUT /availability - Atualizando disponibilidade do médico ID:', req.user?.id);
    
    const { dayOfWeek, startTime, endTime, available } = req.body;
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Atualizar disponibilidade (implementar quando houver tabela de availability)
    const updatedAvailability = {
      id: Date.now(), // Placeholder
      doctorId: doctor.id,
      dayOfWeek,
      startTime,
      endTime,
      available
    };
    
    console.log('✅ Doctor PUT /availability - Disponibilidade atualizada');
    res.json(updatedAvailability);
  } catch (error) {
    console.error('❌ Erro ao atualizar disponibilidade:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter estatísticas do dashboard
 * GET /api/doctors/dashboard
 */
doctorRouter.get('/dashboard', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /dashboard - Buscando estatísticas do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Calcular estatísticas do dashboard
    const stats = {
      totalAppointments: 0,
      pendingAppointments: 0,
      completedAppointments: 0,
      monthlyEarnings: 0,
      totalPatients: 0,
      avgRating: 0
    };
    
    console.log('✅ Doctor /dashboard - Estatísticas calculadas');
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas do dashboard:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Verificar status de boas-vindas
 * GET /api/doctors/welcome-status
 */
doctorRouter.get('/welcome-status', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /welcome-status - Verificando status do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    console.log('✅ Doctor /welcome-status - Status verificado');
    res.json({
      isFirstLogin: !doctor.welcomeCompleted,
      welcomeCompleted: doctor.welcomeCompleted || false
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status de boas-vindas:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Completar boas-vindas
 * POST /api/doctors/complete-welcome
 */
doctorRouter.post('/complete-welcome', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor POST /complete-welcome - Completando boas-vindas do médico ID:', req.user?.id);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    await storage.updateDoctor(doctor.id, {
      welcomeCompleted: true,
      updatedAt: new Date()
    });
    
    console.log('✅ Doctor POST /complete-welcome - Boas-vindas completadas');
    res.json({ success: true, message: 'Boas-vindas completadas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao completar boas-vindas:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Toggle disponibilidade para emergência
 * POST /api/doctors/toggle-availability
 */
doctorRouter.post('/toggle-availability', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor POST /toggle-availability - Alternando disponibilidade do médico ID:', req.user?.id);
    console.log('📦 Request body:', req.body);
    
    const { isAvailable, availableForEmergency } = req.body;
    
    // Support both field names for compatibility
    const available = isAvailable !== undefined ? isAvailable : availableForEmergency;
    
    console.log('🔄 Available value:', available);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Atualizar disponibilidade para emergência
    const updatedDoctor = await storage.toggleDoctorAvailability(doctor.id, available);
    
    console.log(`✅ Doctor POST /toggle-availability - Disponibilidade alterada para: ${available}`);
    console.log('📋 Updated doctor:', updatedDoctor.availableForEmergency);
    
    res.json({ 
      success: true, 
      isAvailable: available,
      availableForEmergency: available,
      message: available ? 'Você está disponível para emergências' : 'Você não está mais disponível para emergências'
    });
  } catch (error) {
    console.error('❌ Erro ao alternar disponibilidade:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter histórico de consultas do médico
 * GET /api/doctors/consultations/history
 */
doctorRouter.get('/consultations/history', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /consultations/history - Buscando histórico do médico ID:', req.user?.id);
    
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
    }
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Buscar consultas no período
    const appointments = await storage.getAppointmentsByDoctorIdAndDateRange(
      doctor.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    // Mapear para o formato esperado pelo frontend
    const consultations = appointments.map(apt => ({
      id: apt.id,
      date: apt.date,
      patientName: apt.patientName || 'Paciente',
      patientAge: apt.patientAge,
      patientEmail: apt.patientEmail,
      patientPhone: apt.patientPhone,
      type: apt.type,
      status: apt.status,
      duration: apt.duration || 30,
      amount: apt.consultationFee || 0,
      paymentStatus: apt.paymentStatus || 'pending',
      notes: apt.notes,
      diagnosis: apt.diagnosis,
      prescription: apt.prescription,
      isEmergency: apt.isEmergency || false,
      recordUrl: apt.recordUrl
    }));
    
    // Calcular estatísticas
    const stats = {
      totalConsultations: consultations.length,
      totalEarnings: consultations.reduce((sum, c) => sum + c.amount, 0),
      averageDuration: consultations.length > 0 
        ? Math.round(consultations.reduce((sum, c) => sum + c.duration, 0) / consultations.length)
        : 0,
      completionRate: consultations.length > 0
        ? Math.round((consultations.filter(c => c.status === 'completed').length / consultations.length) * 100)
        : 0,
      emergencyCount: consultations.filter(c => c.isEmergency).length,
      telemedicineCount: consultations.filter(c => c.type === 'telemedicine').length
    };
    
    console.log('✅ Doctor /consultations/history - Encontradas', consultations.length, 'consultas');
    res.json({ consultations, stats });
  } catch (error) {
    console.error('❌ Erro ao obter histórico de consultas:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Exportar relatório de consultas
 * GET /api/doctors/consultations/export
 */
doctorRouter.get('/consultations/export', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Doctor /consultations/export - Exportando relatório do médico ID:', req.user?.id);
    
    const { startDate, endDate, format = 'pdf' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
    }
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Por enquanto, retornar um erro indicando que a funcionalidade está em desenvolvimento
    return res.status(501).json({ error: 'Exportação de relatórios em desenvolvimento' });
    
    // TODO: Implementar geração de PDF/Excel com as consultas
  } catch (error) {
    console.error('❌ Erro ao exportar relatório:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Salvar notas de uma consulta
 * POST /api/appointments/:id/notes
 */
doctorRouter.post('/appointments/:id/notes', requireAuth, requireDoctorRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const { notes } = req.body;
    
    console.log('🔍 Doctor /appointments/:id/notes - Salvando notas da consulta:', appointmentId);
    
    const doctor = await storage.getDoctorByUserId(req.user!.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    // Verificar se a consulta pertence ao médico
    const appointment = await storage.getAppointmentById(appointmentId);
    if (!appointment || appointment.doctorId !== doctor.id) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    
    // Atualizar notas
    await storage.updateAppointment(appointmentId, {
      notes,
      updatedAt: new Date()
    });
    
    console.log('✅ Doctor /appointments/:id/notes - Notas salvas com sucesso');
    res.json({ message: 'Notas salvas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao salvar notas:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

export default doctorRouter; 