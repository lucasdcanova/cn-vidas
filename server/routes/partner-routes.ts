import express, { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../utils/app-error';
import { upload } from '../middleware/upload';
import { db } from '../db';
import { users, partners } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

const partnerRouter = express.Router();

// Middleware de log para todas as rotas de parceiro
partnerRouter.use((req: Request, res: Response, next: NextFunction) => {
  console.log('📨 [Partner Router] Requisição recebida:', {
    method: req.method,
    path: req.path,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'x-auth-token': req.headers['x-auth-token'] ? 'presente' : 'ausente',
      'authorization': req.headers.authorization ? 'presente' : 'ausente'
    }
  });
  next();
});

/**
 * Rota de teste para debug
 * GET /api/partners/test
 */
partnerRouter.get('/test', (req: Request, res: Response) => {
  console.log('🧪 [Partner /test] Rota de teste acessada');
  res.json({ 
    message: 'Rota de parceiro funcionando',
    timestamp: new Date().toISOString()
  });
});

/**
 * Middleware para verificar se o usuário é um parceiro
 */
const requirePartner = (req: Request, res: Response, next: Function) => {
  const authReq = req as AuthenticatedRequest;
  console.log('🔐 [requirePartner] Verificando permissão - User:', authReq.user ? {
    id: authReq.user.id,
    email: authReq.user.email,
    role: authReq.user.role
  } : 'No user');
  
  if (!authReq.user || authReq.user.role !== 'partner') {
    console.log('❌ [requirePartner] Acesso negado - role:', authReq.user?.role);
    return res.status(403).json({ error: 'Acesso negado. Apenas parceiros podem acessar esta funcionalidade.' });
  }
  
  console.log('✅ [requirePartner] Acesso permitido para parceiro');
  next();
};

/**
 * Rota de debug para verificar autenticação
 * GET /api/partners/debug-auth
 */
partnerRouter.get('/debug-auth', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  console.log('🐛 [Partner /debug-auth] Debug de autenticação');
  res.json({
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName
    } : null,
    headers: {
      authorization: req.headers.authorization,
      'x-auth-token': req.headers['x-auth-token'],
      'x-session-id': req.headers['x-session-id']
    }
  });
});

/**
 * Debug endpoint sem requirePartner
 * GET /api/partners/debug-me
 */
partnerRouter.get('/debug-me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🐛 [Partner /debug-me] Debug sem requirePartner');
    console.log('🐛 [Partner /debug-me] User:', req.user);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Buscar parceiro
    const partnerResult = await db.select().from(partners).where(eq(partners.userId, req.user.id));
    console.log('🐛 [Partner /debug-me] Resultado da query:', partnerResult);
    
    // Log address fields specifically
    if (partnerResult[0]) {
      console.log('🏠 [Partner /debug-me] Address fields:');
      console.log('  - street:', partnerResult[0].street);
      console.log('  - number:', partnerResult[0].number);
      console.log('  - complement:', partnerResult[0].complement);
      console.log('  - neighborhood:', partnerResult[0].neighborhood);
      console.log('  - city:', partnerResult[0].city);
      console.log('  - state:', partnerResult[0].state);
      console.log('  - zipcode:', partnerResult[0].zipcode);
      console.log('  - postalCode:', partnerResult[0].postalCode);
      console.log('  - address:', partnerResult[0].address);
    }
    
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        fullName: req.user.fullName
      },
      partner: partnerResult[0] || null,
      partnerCount: partnerResult.length,
      addressFields: partnerResult[0] ? {
        street: partnerResult[0].street,
        number: partnerResult[0].number,
        complement: partnerResult[0].complement,
        neighborhood: partnerResult[0].neighborhood,
        city: partnerResult[0].city,
        state: partnerResult[0].state,
        zipcode: partnerResult[0].zipcode,
        postalCode: partnerResult[0].postalCode,
        address: partnerResult[0].address
      } : null
    });
  } catch (error) {
    console.error('🐛 [Partner /debug-me] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Obter parceiro pelo userId do usuário logado
 * GET /api/partners/me
 */
partnerRouter.get('/me', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 [Partner /me] Buscando parceiro para user ID:', req.user!.id);
    console.log('🔍 [Partner /me] Dados do usuário:', {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      fullName: req.user!.fullName
    });
    
    // Debug: Buscar diretamente do banco para verificar
    const directPartnerQuery = await db.select().from(partners).where(eq(partners.userId, req.user!.id));
    console.log('🔍 [Partner /me] Query direta do banco:', directPartnerQuery);
    
    const partner = await storage.getPartnerByUserId(req.user!.id);
    
    console.log('📊 [Partner /me] Resultado da busca:', partner ? {
      id: partner.id,
      userId: partner.userId,
      businessName: partner.businessName,
      tradingName: partner.tradingName,
      // Log all address fields
      street: partner.street,
      number: partner.number,
      complement: partner.complement,
      neighborhood: partner.neighborhood,
      city: partner.city,
      state: partner.state,
      zipcode: partner.zipcode,
      postalCode: partner.postalCode,
      address: partner.address
    } : 'Parceiro não encontrado');
    
    // Log the complete partner object
    if (partner) {
      console.log('🔍 [Partner /me] Dados completos do parceiro:', JSON.stringify(partner, null, 2));
    }
    
    if (!partner) {
      console.log('❌ [Partner /me] Perfil de parceiro não encontrado para userId:', req.user!.id);
      
      // Se a query direta encontrou mas o storage não, há um problema
      if (directPartnerQuery.length > 0) {
        console.log('⚠️ [Partner /me] ATENÇÃO: Query direta encontrou parceiro mas storage não!');
        console.log('⚠️ [Partner /me] Retornando dados da query direta:', directPartnerQuery[0]);
        return res.json(directPartnerQuery[0]);
      }
      
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    console.log('✅ [Partner /me] Parceiro encontrado, retornando dados');
    res.json(partner);
  } catch (error) {
    console.error('❌ [Partner /me] Erro ao obter dados do parceiro:', error);
    console.error('❌ [Partner /me] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Obter serviços do parceiro logado
 * GET /api/partners/my-services
 */
partnerRouter.get('/my-services', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 [Partner /my-services] Buscando serviços para user ID:', req.user!.id);
    
    // Primeiro, buscar o parceiro pelo userId
    const partner = await storage.getPartnerByUserId(req.user!.id);
    
    console.log('📊 [Partner /my-services] Parceiro encontrado?', !!partner);
    
    if (!partner) {
      console.log('❌ [Partner /my-services] Perfil de parceiro não encontrado para userId:', req.user!.id);
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    console.log('🔎 [Partner /my-services] Buscando serviços do parceiro ID:', partner.id);
    
    // Buscar apenas os serviços deste parceiro
    const services = await storage.getPartnerServicesByPartnerId(partner.id);
    
    console.log('✅ [Partner /my-services] Retornando', services.length, 'serviços');
    
    res.json(services);
  } catch (error) {
    console.error('❌ [Partner /my-services] Erro ao buscar serviços do parceiro:', error);
    console.error('❌ [Partner /my-services] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Criar um novo serviço para o parceiro logado
 * POST /api/partners/services
 */
partnerRouter.post('/services', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Primeiro, buscar o parceiro pelo userId
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    const { name, description, category, regularPrice, discountPrice, duration, discountPercentage, isFeatured, isActive, serviceImage, isNational } = req.body;

    // Validações básicas
    if (!name || !description || !category) {
      return res.status(400).json({ error: 'Nome, descrição e categoria são obrigatórios' });
    }

    const serviceData = {
      partnerId: partner.id,
      name,
      description,
      category,
      regularPrice: parseInt(regularPrice) || 0,
      discountPrice: parseInt(discountPrice) || 0,
      duration: duration ? parseInt(duration) : null,
      discountPercentage: parseInt(discountPercentage) || 0,
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true,
      serviceImage: serviceImage || null,
      isNational: isNational || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newService = await storage.createPartnerService(serviceData);
    
    res.status(201).json(newService);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Atualizar um serviço do parceiro logado
 * PUT /api/partners/services/:id
 */
partnerRouter.put('/services/:id', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== UPDATE SERVICE REQUEST ===');
    console.log('Service ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user!.id);
    
    const serviceId = parseInt(req.params.id);
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'ID do serviço inválido' });
    }

    // Primeiro, buscar o parceiro pelo userId
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Verificar se o serviço existe e pertence ao parceiro
    const existingService = await storage.getPartnerService(serviceId);
    if (!existingService) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    if (existingService.partnerId !== partner.id) {
      return res.status(403).json({ error: 'Você só pode editar seus próprios serviços' });
    }

    const { name, description, category, regularPrice, discountPrice, duration, discountPercentage, isFeatured, isActive, serviceImage, isNational } = req.body;

    // Garantir que valores numéricos sejam convertidos corretamente
    const parsePrice = (value: any): number => {
      if (typeof value === 'string') {
        // Remove caracteres não numéricos e converte para número
        const cleaned = value.replace(/[^\d]/g, '');
        return parseInt(cleaned) || 0;
      }
      return parseInt(value) || 0;
    };

    const updateData = {
      name: name || existingService.name,
      description: description || existingService.description,
      category: category || existingService.category,
      regularPrice: regularPrice !== undefined ? parsePrice(regularPrice) : existingService.regularPrice,
      discountPrice: discountPrice !== undefined ? parsePrice(discountPrice) : existingService.discountPrice,
      duration: duration !== undefined ? parseInt(duration) : existingService.duration,
      discountPercentage: discountPercentage !== undefined ? parseInt(discountPercentage) : existingService.discountPercentage,
      isFeatured: isFeatured !== undefined ? isFeatured : existingService.isFeatured,
      isActive: isActive !== undefined ? isActive : existingService.isActive,
      serviceImage: serviceImage !== undefined ? serviceImage : existingService.serviceImage,
      isNational: isNational !== undefined ? isNational : existingService.isNational,
      updatedAt: new Date()
    };

    console.log('Update data:', JSON.stringify(updateData, null, 2));
    console.log('Data types:', {
      regularPrice: typeof updateData.regularPrice,
      discountPrice: typeof updateData.discountPrice,
      duration: typeof updateData.duration,
      discountPercentage: typeof updateData.discountPercentage
    });

    const updatedService = await storage.updatePartnerService(serviceId, updateData);
    
    res.json(updatedService);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Excluir um serviço do parceiro logado
 * DELETE /api/partners/services/:id
 */
partnerRouter.delete('/services/:id', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id);
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'ID do serviço inválido' });
    }

    // Primeiro, buscar o parceiro pelo userId
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Verificar se o serviço existe e pertence ao parceiro
    const existingService = await storage.getPartnerService(serviceId);
    if (!existingService) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    if (existingService.partnerId !== partner.id) {
      return res.status(403).json({ error: 'Você só pode excluir seus próprios serviços' });
    }

    await storage.deletePartnerService(serviceId);
    
    res.json({ message: 'Serviço excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Atualizar perfil do parceiro logado
 * PUT /api/partners/me
 */
partnerRouter.put('/me', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Primeiro, buscar o parceiro pelo userId
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    const { 
      businessName,
      businessType,
      tradingName, 
      description, 
      phone, 
      website, 
      address,
      zipcode,
      street,
      number,
      complement,
      neighborhood,
      city, 
      state, 
      postalCode,
      cnpj,
      nationwideService
    } = req.body;

    const updateData = {
      businessName: businessName || partner.businessName,
      businessType: businessType || partner.businessType,
      tradingName: tradingName || partner.tradingName,
      description: description || partner.description,
      phone: phone || partner.phone,
      website: website || partner.website,
      address: address || partner.address,
      zipcode: zipcode || partner.zipcode,
      street: street || partner.street,
      number: number || partner.number,
      complement: complement || partner.complement,
      neighborhood: neighborhood || partner.neighborhood,
      city: city || partner.city,
      state: state || partner.state,
      postalCode: postalCode || partner.postalCode,
      cnpj: cnpj || partner.cnpj,
      nationwideService: nationwideService !== undefined ? nationwideService : partner.nationwideService,
      updatedAt: new Date()
    };

    const updatedPartner = await storage.updatePartner(partner.id, updateData);
    
    res.json(updatedPartner);
  } catch (error) {
    console.error('Erro ao atualizar perfil do parceiro:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

/**
 * Upload de imagem de perfil do parceiro
 * POST /api/partners/profile-image
 */
partnerRouter.post('/profile-image', requireAuth, requirePartner, upload.single('profileImage'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado' 
      });
    }

    const userId = req.user!.id;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Buscar parceiro atual
    const partner = await storage.getPartnerByUserId(userId);
    if (!partner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Perfil de parceiro não encontrado' 
      });
    }

    const oldImage = partner.profileImage;

    // Atualizar imagem no perfil do usuário
    await db
      .update(users)
      .set({ 
        profileImage: imageUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Atualizar imagem no perfil do parceiro
    await storage.updatePartner(partner.id, {
      profileImage: imageUrl,
      updatedAt: new Date()
    });

    // Remover imagem antiga se existir
    if (oldImage && oldImage.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), 'public', oldImage);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
          console.log('Imagem antiga removida:', oldPath);
        } catch (error) {
          console.error('Erro ao remover imagem antiga:', error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Foto de perfil do parceiro atualizada com sucesso',
      imageUrl,
      profileImage: imageUrl
    });

  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem do parceiro:', error);
    
    // Remover arquivo se houve erro
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * Remover imagem de perfil do parceiro
 * DELETE /api/partners/remove-profile-image
 */
partnerRouter.delete('/remove-profile-image', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Buscar parceiro atual
    const partner = await storage.getPartnerByUserId(userId);
    if (!partner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Perfil de parceiro não encontrado' 
      });
    }

    const oldImage = partner.profileImage;

    // Remover imagem do perfil do usuário
    await db
      .update(users)
      .set({ 
        profileImage: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Remover imagem do perfil do parceiro
    await storage.updatePartner(partner.id, {
      profileImage: null,
      updatedAt: new Date()
    });

    // Remover arquivo físico
    if (oldImage && oldImage.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), 'public', oldImage);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
          console.log('Imagem removida:', oldPath);
        } catch (error) {
          console.error('Erro ao remover arquivo:', error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Foto de perfil do parceiro removida com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao remover imagem do parceiro:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * Rotas de gerenciamento de endereços do parceiro
 */

/**
 * Obter todos os endereços do parceiro logado
 * GET /api/partners/addresses
 */
partnerRouter.get('/addresses', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    const addresses = await storage.getPartnerAddresses(partner.id);
    res.json(addresses);
  } catch (error) {
    console.error('Erro ao obter endereços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Criar novo endereço para o parceiro
 * POST /api/partners/addresses
 */
partnerRouter.post('/addresses', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    const {
      name,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      isPrimary,
      phone,
      email,
      openingHours
    } = req.body;

    // Validação básica
    if (!name || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Mapear campos do português para inglês para o banco de dados
    const addressData = {
      partnerId: partner.id,
      name,
      cep,
      address: logradouro,
      number: numero,
      complement: complemento,
      neighborhood: bairro,
      city: cidade,
      state: estado,
      isPrimary: isPrimary || false,
      isActive: true,
      phone,
      email,
      openingHours
    };

    const newAddress = await storage.createPartnerAddress(addressData);
    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Atualizar endereço do parceiro
 * PUT /api/partners/addresses/:id
 */
partnerRouter.put('/addresses/:id', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: 'ID do endereço inválido' });
    }

    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Verificar se o endereço pertence ao parceiro
    const existingAddress = await storage.getPartnerAddress(addressId);
    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    if (existingAddress.partnerId !== partner.id) {
      return res.status(403).json({ error: 'Você só pode editar seus próprios endereços' });
    }

    // Mapear campos do português para inglês se necessário
    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.cep !== undefined) updateData.cep = req.body.cep;
    if (req.body.logradouro !== undefined) updateData.address = req.body.logradouro;
    if (req.body.numero !== undefined) updateData.number = req.body.numero;
    if (req.body.complemento !== undefined) updateData.complement = req.body.complemento;
    if (req.body.bairro !== undefined) updateData.neighborhood = req.body.bairro;
    if (req.body.cidade !== undefined) updateData.city = req.body.cidade;
    if (req.body.estado !== undefined) updateData.state = req.body.estado;
    if (req.body.isPrimary !== undefined) updateData.isPrimary = req.body.isPrimary;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.openingHours !== undefined) updateData.openingHours = req.body.openingHours;

    const updatedAddress = await storage.updatePartnerAddress(addressId, updateData);
    res.json(updatedAddress);
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Excluir endereço do parceiro
 * DELETE /api/partners/addresses/:id
 */
partnerRouter.delete('/addresses/:id', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: 'ID do endereço inválido' });
    }

    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Verificar se o endereço pertence ao parceiro
    const existingAddress = await storage.getPartnerAddress(addressId);
    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    if (existingAddress.partnerId !== partner.id) {
      return res.status(403).json({ error: 'Você só pode excluir seus próprios endereços' });
    }

    // Não permitir excluir se for o único endereço
    const allAddresses = await storage.getPartnerAddresses(partner.id);
    if (allAddresses.length === 1) {
      return res.status(400).json({ error: 'Você deve manter pelo menos um endereço cadastrado' });
    }

    await storage.deletePartnerAddress(addressId);
    res.json({ message: 'Endereço excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Definir endereço como principal
 * PUT /api/partners/addresses/:id/set-primary
 */
partnerRouter.put('/addresses/:id/set-primary', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: 'ID do endereço inválido' });
    }

    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Verificar se o endereço pertence ao parceiro
    const existingAddress = await storage.getPartnerAddress(addressId);
    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    if (existingAddress.partnerId !== partner.id) {
      return res.status(403).json({ error: 'Você só pode gerenciar seus próprios endereços' });
    }

    await storage.setPartnerAddressPrimary(partner.id, addressId);
    res.json({ message: 'Endereço definido como principal' });
  } catch (error) {
    console.error('Erro ao definir endereço principal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Obter endereços associados a um serviço
 * GET /api/partners/services/:serviceId/addresses
 */
partnerRouter.get('/services/:serviceId/addresses', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const serviceId = parseInt(req.params.serviceId);

    const partner = await storage.getPartnerByUserId(userId);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Verificar se o serviço pertence ao parceiro
    const service = await storage.getPartnerService(serviceId);
    if (!service || service.partnerId !== partner.id) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const addresses = await storage.getServiceAddresses(serviceId);
    res.json(addresses);
  } catch (error) {
    console.error('Erro ao buscar endereços do serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Atualizar endereços associados a um serviço
 * PUT /api/partners/services/:serviceId/addresses
 */
partnerRouter.put('/services/:serviceId/addresses', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 [PUT /services/:serviceId/addresses] Iniciando atualização de endereços');
    const userId = req.user!.id;
    const serviceId = parseInt(req.params.serviceId);
    const { addressIds } = req.body;
    
    console.log('📝 [PUT /services/:serviceId/addresses] Dados recebidos:', {
      userId,
      serviceId,
      addressIds,
      bodyType: typeof req.body,
      body: req.body
    });

    if (!Array.isArray(addressIds)) {
      console.log('❌ [PUT /services/:serviceId/addresses] addressIds não é array:', addressIds);
      return res.status(400).json({ error: 'addressIds deve ser um array' });
    }

    const partner = await storage.getPartnerByUserId(userId);
    if (!partner) {
      console.log('❌ [PUT /services/:serviceId/addresses] Parceiro não encontrado para userId:', userId);
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Verificar se o serviço pertence ao parceiro
    const service = await storage.getPartnerService(serviceId);
    if (!service || service.partnerId !== partner.id) {
      console.log('❌ [PUT /services/:serviceId/addresses] Serviço não encontrado ou não pertence ao parceiro');
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Verificar se todos os endereços pertencem ao parceiro
    if (addressIds.length > 0) {
      const partnerAddresses = await storage.getPartnerAddresses(partner.id);
      const validAddressIds = partnerAddresses.map(addr => addr.id);
      const invalidIds = addressIds.filter(id => !validAddressIds.includes(id));
      
      if (invalidIds.length > 0) {
        console.log('❌ [PUT /services/:serviceId/addresses] Endereços inválidos:', invalidIds);
        return res.status(400).json({ error: 'Um ou mais endereços inválidos' });
      }
    }

    console.log('✅ [PUT /services/:serviceId/addresses] Chamando updateServiceAddresses');
    await storage.updateServiceAddresses(serviceId, addressIds);
    console.log('✅ [PUT /services/:serviceId/addresses] Endereços atualizados com sucesso');
    
    res.json({ message: 'Endereços do serviço atualizados com sucesso' });
  } catch (error) {
    console.error('❌ [PUT /services/:serviceId/addresses] Erro ao atualizar endereços do serviço:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Obter analytics dos colaboradores
 * GET /api/partners/analytics
 */
partnerRouter.get('/analytics', requireAuth, requirePartner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { period = 'month' } = req.query;

    const partner = await storage.getPartnerByUserId(userId);
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Buscar dados reais do banco
    const analyticsData = await storage.getPartnerAnalytics(partner.id, period as string);

    res.json(analyticsData);
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de tratamento de erros para rotas de parceiro
partnerRouter.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ [Partner Router] Erro não tratado:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default partnerRouter; 