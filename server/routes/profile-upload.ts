import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { users, doctors, partners } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireDoctor, requirePartner, AuthRequest } from '../middleware/auth-unified';
import { profileImageUpload, removeFile } from '../middleware/multer-config';

const router = Router();

// Middleware para garantir que sempre retornamos JSON
const ensureJson = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Interceptar res.send para garantir JSON
  const originalSend = res.send;
  res.send = function(data: any) {
    if (typeof data === 'string' && (data.startsWith('<!DOCTYPE') || data.startsWith('<html'))) {
      console.error('⚠️ Tentativa de enviar HTML em rota de upload:', req.path);
      return originalSend.call(this, JSON.stringify({
        success: false,
        message: 'Erro interno do servidor',
        error: 'Resposta HTML detectada'
      }));
    }
    return originalSend.call(this, data);
  };
  
  next();
};

// Usar a configuração centralizada do multer
const upload = profileImageUpload;

// Função para remover arquivo antigo
const removeOldImage = async (imagePath: string) => {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    try {
      await removeFile(imagePath);
      console.log('Imagem antiga removida:', imagePath);
    } catch (error) {
      console.error('Erro ao remover imagem antiga:', error);
    }
  }
};

// Upload de imagem de perfil geral (paciente) - REDIRECIONAR PARA S3
router.post('/upload-image', ensureJson, requireAuth, async (req: AuthRequest, res) => {
  // Redirecionar para o novo endpoint S3
  console.log('=== REDIRECIONANDO UPLOAD PARA S3 ===');
  console.log('User ID:', req.user?.id);
  console.log('Redirecionando de /api/profile/upload-image para /api/profile/upload-image (S3)');
  
  // O endpoint é o mesmo mas agora usa S3
  // Este arquivo será removido em breve
  res.status(404).json({
    success: false,
    message: 'Este endpoint foi migrado. Use /api/profile/upload-image com suporte S3.',
    details: 'O upload local foi desativado. Todos os uploads agora usam AWS S3.'
  });
});

// Upload de imagem para médicos
router.post('/doctors/profile-image', ensureJson, requireDoctor, upload.single('profileImage'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado' 
      });
    }

    const userId = req.user!.id;
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Buscar dados do médico
    const doctor = await db.select().from(doctors).where(eq(doctors.userId, userId)).limit(1);
    const oldImage = doctor[0]?.profileImage;

    // Atualizar tabela de médicos
    await db.update(doctors)
      .set({ 
        profileImage: imageUrl,
        updatedAt: new Date()
      })
      .where(eq(doctors.userId, userId));

    // Também atualizar tabela de usuários
    await db.update(users)
      .set({ 
        profileImage: imageUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Remover imagem antiga se existir
    if (oldImage) {
      await removeOldImage(oldImage);
    }

    res.json({
      success: true,
      message: 'Foto de perfil do médico atualizada com sucesso',
      imageUrl,
      profileImage: imageUrl
    });

  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem do médico:', error);
    
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

// Upload de imagem para parceiros
router.post('/partners/profile-image', ensureJson, requirePartner, upload.single('profileImage'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado' 
      });
    }

    const userId = req.user!.id;
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Buscar dados do parceiro
    const partner = await db.select().from(partners).where(eq(partners.userId, userId)).limit(1);
    const oldImage = partner[0]?.profileImage;

    // Atualizar tabela de parceiros
    await db.update(partners)
      .set({ 
        profileImage: imageUrl,
        updatedAt: new Date()
      })
      .where(eq(partners.userId, userId));

    // Também atualizar tabela de usuários
    await db.update(users)
      .set({ 
        profileImage: imageUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Remover imagem antiga se existir
    if (oldImage) {
      await removeOldImage(oldImage);
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

// Remover imagem de perfil geral
router.delete('/remove-image', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Buscar imagem atual
    const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const oldImage = currentUser[0]?.profileImage;

    // Remover imagem do usuário
    await db.update(users)
      .set({ 
        profileImage: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Remover arquivo físico
    if (oldImage) {
      await removeOldImage(oldImage);
    }

    res.json({
      success: true,
      message: 'Foto de perfil removida com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao remover imagem:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// Remover imagem de médico
router.delete('/doctors/remove-profile-image', requireDoctor, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Buscar dados do médico
    const doctor = await db.select().from(doctors).where(eq(doctors.userId, userId)).limit(1);
    const oldImage = doctor[0]?.profileImage;

    // Remover de ambas as tabelas
    await db.update(doctors)
      .set({ 
        profileImage: null,
        updatedAt: new Date()
      })
      .where(eq(doctors.userId, userId));

    await db.update(users)
      .set({ 
        profileImage: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Remover arquivo físico
    if (oldImage) {
      await removeOldImage(oldImage);
    }

    res.json({
      success: true,
      message: 'Foto de perfil do médico removida com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao remover imagem do médico:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// Remover imagem de parceiro
router.delete('/partners/remove-profile-image', requirePartner, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Buscar dados do parceiro
    const partner = await db.select().from(partners).where(eq(partners.userId, userId)).limit(1);
    const oldImage = partner[0]?.profileImage;

    // Remover de ambas as tabelas
    await db.update(partners)
      .set({ 
        profileImage: null,
        updatedAt: new Date()
      })
      .where(eq(partners.userId, userId));

    await db.update(users)
      .set({ 
        profileImage: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Remover arquivo físico
    if (oldImage) {
      await removeOldImage(oldImage);
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

// Rota de teste para verificar se a API está respondendo JSON
router.get('/test-json', ensureJson, (req, res) => {
  res.json({
    success: true,
    message: 'API respondendo corretamente em JSON',
    timestamp: new Date().toISOString()
  });
});

export default router; 