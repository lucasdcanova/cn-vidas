import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../utils/app-error.js';
import { sendEmail } from '../utils/email';
import { compare, hash } from 'bcrypt';
import { NotificationService } from '../utils/notification-service';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { generateQRCode } from '../utils/qr-code';

const userRouter = express.Router();

/**
 * Obter perfil do usuário
 * GET /api/users/profile
 */
userRouter.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await storage.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove campos sensíveis
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Atualizar perfil do usuário
 * PUT /api/users/profile
 */
userRouter.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { fullName, username, email, phone, birthDate, address, city, state, zipcode, number, complement, neighborhood, street } = req.body;

    console.log('📥 Dados recebidos no backend:', {
      street,
      address,
      zipcode,
      number,
      neighborhood,
      city,
      state
    });

    // **CORREÇÃO: Filtrar campos undefined/null para evitar "No values to set"**
    const updateData: any = {};
    
    // Incluir apenas campos que tenham valores válidos
    if (fullName !== undefined && fullName !== null) updateData.fullName = fullName;
    if (username !== undefined && username !== null) updateData.username = username;
    if (email !== undefined && email !== null) updateData.email = email;
    if (phone !== undefined && phone !== null) updateData.phone = phone;
    if (birthDate !== undefined && birthDate !== null) updateData.birthDate = birthDate;
    if (address !== undefined && address !== null) updateData.address = address;
    if (city !== undefined && city !== null) updateData.city = city;
    if (state !== undefined && state !== null) updateData.state = state;
    if (zipcode !== undefined && zipcode !== null) updateData.zipcode = zipcode;
    if (number !== undefined && number !== null) updateData.number = number;
    if (complement !== undefined && complement !== null) updateData.complement = complement;
    if (neighborhood !== undefined && neighborhood !== null) updateData.neighborhood = neighborhood;
    if (street !== undefined && street !== null) updateData.street = street;

    // Verificar se há pelo menos um campo para atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização' });
    }

    console.log(`🔄 Atualizando perfil do usuário ${req.user.id} com campos:`, Object.keys(updateData));
    console.log(`📦 Valores sendo salvos:`, updateData);

    const updatedUser = await storage.updateUser(req.user.id, updateData);
    
    console.log(`✅ Usuário atualizado. Dados salvos:`, {
      street: updatedUser.street,
      address: updatedUser.address,
      zipcode: updatedUser.zipcode,
      city: updatedUser.city,
      state: updatedUser.state
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove campos sensíveis
    const { password, ...userWithoutPassword } = updatedUser;
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Registrar vendedor/indicador
 * PUT /api/users/seller
 */
userRouter.put('/seller', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { sellerName } = req.body;

    if (!sellerName || sellerName.trim().length < 3) {
      return res.status(400).json({ error: 'Nome do vendedor deve ter pelo menos 3 caracteres' });
    }

    // Atualizar o campo sellerName do usuário
    await db.update(users)
      .set({ 
        sellerName: sellerName.trim(),
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user.id));

    console.log(`Vendedor registrado para usuário ${req.user.id}: ${sellerName}`);

    return res.json({ 
      message: 'Vendedor registrado com sucesso',
      sellerName: sellerName.trim()
    });
  } catch (error) {
    console.error('Erro ao registrar vendedor:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Alterar senha do usuário
 * PUT /api/users/password
 */
userRouter.put('/password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    // Buscar o usuário completo para verificar a senha atual
    const user = await storage.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar a senha atual
    let isPasswordValid = false;
    
    // Suporte para diferentes formatos de hash
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$')) {
      // Hash bcrypt padrão
      isPasswordValid = await compare(currentPassword, user.password);
    } else {
      // Tentar comparação direta se não for um hash bcrypt válido
      isPasswordValid = await compare(currentPassword, user.password);
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Verificar se a nova senha é diferente da atual
    const isSamePassword = await compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual' });
    }

    // Hash da nova senha
    const hashedPassword = await hash(newPassword, 10);

    // Atualizar a senha
    await storage.updateUserPassword(req.user.id, hashedPassword);

    console.log(`Senha alterada com sucesso para o usuário ${user.email}`);

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Gerar token QR code para o usuário
 * POST /api/users/generate-qr
 */
userRouter.post('/generate-qr', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Gerar token QR usando o storage (que salva no banco de dados)
    const { token, expiresAt } = await storage.generateQrToken(req.user.id);
    
    console.log(`QR Token gerado para usuário ${req.user.id}: ${token.substring(0, 10)}...`);
    console.log(`Expira em: ${expiresAt.toISOString()}`);
    
    return res.json({ 
      qrCode: token,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Obter QR code do usuário
 * GET /api/users/qr-code
 */
userRouter.get('/qr-code', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Gerar dados únicos para o QR code do usuário
    // Formato: CNV-{userId}-{timestamp}
    const qrData = `CNV-${req.user.id}-${Date.now()}`;
    
    // Gerar QR code como data URL
    const qrCode = await generateQRCode(qrData);
    
    res.json({ 
      qrCode,
      userId: req.user.id,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    res.status(500).json({ error: 'Erro ao gerar QR code' });
  }
});

/**
 * Verificar token QR code
 * POST /api/users/verify-qr
 */
userRouter.post('/verify-qr', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token QR não fornecido' });
    }

    const user = await storage.getUserByQrToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token QR inválido ou expirado' });
    }

    // Log da autenticação QR
    try {
      await storage.logQrAuthentication({
        token,
        scannerUserId: user.id, // Usando o próprio usuário do token como scanner por enquanto
        tokenUserId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        userAgent: req.get('User-Agent') || null,
        success: true
      });
    } catch (logError) {
      console.error('Erro ao registrar log de autenticação QR:', logError);
      // Continue mesmo se o log falhar
    }

    // Criar notificação de QR Code escaneado
    await NotificationService.createQrCodeScanNotification(
      user.id,
      'Parceiro CN Vidas', // Nome genérico, pode ser melhorado com dados do scanner
      req.ip || 'Local desconhecido'
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus
      },
      message: 'Token QR verificado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao verificar token QR:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Listar usuários (apenas para admin)
 * GET /api/users?role=patient
 */
userRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const users = await storage.getAllUsers();
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    return res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Salvar configurações do usuário
 * PUT /api/users/settings
 */
userRouter.put('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { notifications, privacy } = req.body;

    console.log(`🔧 Salvando configurações do usuário ${req.user.id}:`, { notifications, privacy });

    const settings = await storage.saveUserSettings(req.user.id, {
      notifications,
      privacy
    });

    return res.json(settings);
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Buscar configurações do usuário
 * GET /api/users/settings
 */
userRouter.get('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const settings = await storage.getUserSettings(req.user.id);
    
    if (!settings) {
      // Retornar configurações padrão se não existirem
      return res.json({
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          notificationFrequency: 'immediate',
          appointmentReminders: true,
          marketingEmails: false,
        },
        privacy: {
          shareWithDoctors: true,
          shareWithPartners: false,
          shareFullMedicalHistory: false,
          allowAnonymizedDataUse: true,
          profileVisibility: 'contacts',
        }
      });
    }

    return res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default userRouter; 