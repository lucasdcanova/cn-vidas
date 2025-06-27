import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage';
import SecureStorageService from '../services/secure-storage-service';

const router = Router();

// Configuração do multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'));
      return;
    }
    cb(null, true);
  }
});

// Upload de imagem de perfil (paciente)
router.post('/api/profile/upload-image', requireAuth, upload.single('profileImage'), async (req, res) => {
  console.log('=== UPLOAD DE IMAGEM S3 INICIADO ===');
  console.log('Headers recebidos:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? 'PRESENTE' : 'AUSENTE',
    'x-auth-token': req.headers['x-auth-token'] ? 'PRESENTE' : 'AUSENTE',
    'x-session-id': req.headers['x-session-id']
  });
  console.log('User autenticado:', req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'NÃO AUTENTICADO');
  console.log('File recebido:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'NENHUM ARQUIVO');

  try {
    if (!req.file) {
      console.error('❌ Nenhum arquivo foi enviado');
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const userId = req.user!.id;
    console.log(`📸 Processando upload para usuário ${userId}`);
    
    // Fazer upload seguro para S3
    const { url, key } = await SecureStorageService.uploadSecure(
      req.file.buffer,
      {
        userId,
        fileType: 'profile',
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        metadata: {
          uploadSource: 'profile_update',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      },
      {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    // Salvar referência no banco de dados local
    await storage.updateUser(userId, { profileImage: url });
    
    // Registrar arquivo no banco
    await storage.createSecureFile({
      userId,
      fileKey: key,
      fileType: 'profile',
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      sizeBytes: req.file.size,
      bucketName: 'cnvidas-profile-images',
      storageClass: 'STANDARD_IA',
      encryptionType: 'AES256',
      isEncrypted: false,
      lgpdConsent: true,
      consentDate: new Date()
    });

    console.log(`✅ Upload concluído com sucesso. URL: ${url}`);
    res.json({ 
      success: true, 
      imageUrl: url,
      message: 'Imagem de perfil atualizada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload da imagem:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    res.status(500).json({ 
      error: 'Erro ao fazer upload da imagem',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Upload de imagem de perfil (médico)
router.post('/api/doctor-profile-image', requireAuth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const userId = req.user!.id;
    const doctor = await storage.getDoctorByUserId(userId);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }

    // Fazer upload seguro para S3
    const { url, key } = await SecureStorageService.uploadSecure(
      req.file.buffer,
      {
        userId,
        fileType: 'profile',
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        metadata: {
          uploadSource: 'doctor_profile_update',
          doctorId: doctor.id.toString(),
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      },
      {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    // Atualizar no banco
    await storage.updateDoctor(doctor.id, { profileImage: url });
    await storage.updateUser(userId, { profileImage: url });
    
    // Registrar arquivo no banco
    await storage.createSecureFile({
      userId,
      fileKey: key,
      fileType: 'profile',
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      sizeBytes: req.file.size,
      bucketName: 'cnvidas-profile-images',
      storageClass: 'STANDARD_IA',
      encryptionType: 'AES256',
      isEncrypted: false,
      lgpdConsent: true,
      consentDate: new Date(),
      metadata: { doctorId: doctor.id }
    });

    res.json({ 
      success: true, 
      imageUrl: url,
      message: 'Imagem de perfil do médico atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem do médico:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Upload de imagem de perfil (parceiro)  
router.post('/api/partner-profile-image', requireAuth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const userId = req.user!.id;
    const partner = await storage.getPartnerByUserId(userId);
    
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }

    // Fazer upload seguro para S3
    const { url, key } = await SecureStorageService.uploadSecure(
      req.file.buffer,
      {
        userId,
        fileType: 'profile',
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        metadata: {
          uploadSource: 'partner_profile_update',
          partnerId: partner.id.toString(),
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      },
      {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    // Atualizar no banco
    await storage.updatePartner(partner.id, { logo: url });
    
    // Registrar arquivo no banco
    await storage.createSecureFile({
      userId,
      fileKey: key,
      fileType: 'profile',
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      sizeBytes: req.file.size,
      bucketName: 'cnvidas-profile-images',
      storageClass: 'STANDARD_IA',
      encryptionType: 'AES256',
      isEncrypted: false,
      lgpdConsent: true,
      consentDate: new Date(),
      metadata: { partnerId: partner.id }
    });

    res.json({ 
      success: true, 
      imageUrl: url,
      message: 'Logo do parceiro atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do logo' });
  }
});

// Remover imagem de perfil
router.delete('/api/profile/remove-image', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUserById(userId);
    
    if (user?.profileImage) {
      // Encontrar o arquivo no banco
      const secureFile = await storage.getSecureFileByUrl(user.profileImage);
      
      if (secureFile) {
        // Deletar do S3
        await SecureStorageService.deleteSecure(
          secureFile.fileKey,
          userId,
          'profile',
          {
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        );
        
        // Marcar como deletado no banco
        await storage.softDeleteSecureFile(secureFile.id);
      }
    }
    
    // Remover URL do perfil
    await storage.updateUser(userId, { profileImage: null });
    
    res.json({ 
      success: true,
      message: 'Imagem de perfil removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    res.status(500).json({ error: 'Erro ao remover imagem' });
  }
});

// Endpoint para gerar nova URL assinada (quando a atual expirar)
router.get('/api/profile/refresh-image-url', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUserById(userId);
    
    if (!user?.profileImage) {
      return res.status(404).json({ error: 'Usuário não possui imagem de perfil' });
    }
    
    // Encontrar o arquivo no banco
    const secureFile = await storage.getSecureFileByUrl(user.profileImage);
    
    if (!secureFile) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    // Gerar nova URL assinada
    const newUrl = await SecureStorageService.generateSignedUrl(
      secureFile.bucketName,
      secureFile.fileKey,
      'profile'
    );
    
    // Atualizar no banco
    await storage.updateUser(userId, { profileImage: newUrl });
    
    res.json({ 
      success: true,
      imageUrl: newUrl
    });
  } catch (error) {
    console.error('Erro ao renovar URL da imagem:', error);
    res.status(500).json({ error: 'Erro ao renovar URL da imagem' });
  }
});

// Endpoint LGPD - Exportar dados do usuário
router.get('/api/profile/export-my-data', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Registrar solicitação LGPD
    await storage.createLGPDRequest({
      userId,
      requestType: 'portability',
      status: 'processing'
    });
    
    // Exportar dados
    const userData = await SecureStorageService.exportUserData(userId);
    
    res.json({
      success: true,
      data: userData,
      message: 'Seus dados foram exportados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

export default router;