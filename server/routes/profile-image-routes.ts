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

// Middleware para processar base64 quando vindo do iOS
const processBase64Upload = async (req: any, res: any, next: any) => {
  console.log('=== PROCESSBASE64UPLOAD MIDDLEWARE INICIADO ===');
  console.log('🔍 Content-Type:', req.headers['content-type']);
  console.log('🔍 Body existe?', !!req.body);
  console.log('🔍 Body keys:', req.body ? Object.keys(req.body) : 'sem body');
  
  if (req.body) {
    console.log('📊 Body detalhado:');
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      if (key === 'profileImage' || key === 'mimeType') {
        console.log(`  - ${key}: ${typeof value}, length: ${value?.length || 0}, primeiros 100 chars: ${value?.substring(0, 100)}`);
      } else {
        console.log(`  - ${key}: ${value}`);
      }
    });
  }
  
  // Se é JSON com base64 (vindo do iOS)
  if (req.headers['content-type']?.includes('application/json') && req.body?.profileImage) {
    try {
      console.log('📱 Upload base64 detectado (iOS)');
      const { profileImage: base64Data, mimeType = 'image/jpeg' } = req.body;
      
      console.log('🖼️ Base64 data info:');
      console.log('  - Tipo:', typeof base64Data);
      console.log('  - Length:', base64Data?.length || 0);
      console.log('  - Primeiros 50 chars:', base64Data?.substring(0, 50));
      console.log('  - Últimos 50 chars:', base64Data?.substring(base64Data.length - 50));
      console.log('  - mimeType recebido:', mimeType);
      
      // Verificar se o base64 está vazio
      if (!base64Data || base64Data.length === 0) {
        console.error('❌ Base64 data está vazio!');
        return res.status(400).json({ error: 'Dados da imagem estão vazios' });
      }
      
      // Converter base64 para Buffer
      const buffer = Buffer.from(base64Data, 'base64');
      console.log('✅ Buffer criado com sucesso:');
      console.log('  - Tamanho do buffer:', buffer.length, 'bytes');
      console.log('  - Buffer é válido?', Buffer.isBuffer(buffer));
      console.log('  - Primeiros 10 bytes:', buffer.slice(0, 10).toString('hex'));
      
      // Verificar se o buffer está vazio
      if (buffer.length === 0) {
        console.error('❌ Buffer está vazio após conversão!');
        return res.status(400).json({ error: 'Erro na conversão da imagem' });
      }
      
      // Simular req.file para compatibilidade
      req.file = {
        buffer: buffer,
        originalname: 'profile.jpg',
        mimetype: mimeType,
        size: buffer.length,
        fieldname: 'profileImage'
      };
      
      console.log('📦 req.file criado:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer.length
      });
      
      next();
    } catch (error) {
      console.error('❌ Erro ao processar base64:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return res.status(400).json({ error: 'Erro ao processar imagem base64' });
    }
  } else {
    console.log('📤 Upload normal via FormData detectado');
    // Upload normal via FormData
    upload.single('profileImage')(req, res, next);
  }
};

// Upload de imagem de perfil (paciente)
router.post('/profile/upload-image', requireAuth, processBase64Upload, async (req, res) => {
  console.log('=== UPLOAD DE IMAGEM S3 INICIADO ===');
  console.log('🔍 Rota chamada:', req.path);
  console.log('🔍 Método:', req.method);
  console.log('Headers recebidos:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? 'PRESENTE' : 'AUSENTE',
    'x-auth-token': req.headers['x-auth-token'] ? 'PRESENTE' : 'AUSENTE',
    'x-session-id': req.headers['x-session-id']
  });
  console.log('User autenticado:', req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'NÃO AUTENTICADO');
  
  console.log('🔍 Estado após processBase64Upload:');
  console.log('  - req.file existe?', !!req.file);
  console.log('  - req.body existe?', !!req.body);
  
  if (req.file) {
    console.log('📦 File recebido detalhado:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      encoding: req.file.encoding || 'não definido',
      bufferLength: req.file.buffer ? req.file.buffer.length : 'sem buffer',
      hasBuffer: !!req.file.buffer
    });
    
    if (req.file.buffer) {
      console.log('🔍 Buffer details:');
      console.log('  - É Buffer?', Buffer.isBuffer(req.file.buffer));
      console.log('  - Tamanho:', req.file.buffer.length);
      console.log('  - Primeiros 20 bytes (hex):', req.file.buffer.slice(0, 20).toString('hex'));
      console.log('  - Assinatura JPEG?', req.file.buffer.slice(0, 3).toString('hex') === 'ffd8ff');
      console.log('  - Assinatura PNG?', req.file.buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a');
    }
  } else {
    console.log('❌ NENHUM ARQUIVO RECEBIDO APÓS processBase64Upload');
    console.log('🔍 Body atual:', req.body ? Object.keys(req.body) : 'sem body');
  }

  try {
    if (!req.file) {
      console.error('❌ Nenhum arquivo foi enviado - retornando erro 400');
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
router.post('/doctor-profile-image', requireAuth, upload.single('profileImage'), processBase64Upload, async (req, res) => {
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
    console.error('❌ Erro ao fazer upload da imagem do médico:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    res.status(500).json({ 
      error: 'Erro ao fazer upload da imagem',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Upload de imagem de perfil (parceiro)  
router.post('/partner-profile-image', requireAuth, processBase64Upload, async (req, res) => {
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
    console.log(`📸 [Partner Profile Image] Atualizando parceiro ${partner.id} com URL: ${url}`);
    console.log(`📸 [Partner Profile Image] URL length: ${url.length}`);
    console.log(`📸 [Partner Profile Image] URL primeiros 100 chars: ${url.substring(0, 100)}`);
    
    await storage.updatePartner(partner.id, { profileImage: url });
    
    // Verificar se foi salvo corretamente
    const updatedPartner = await storage.getPartnerByUserId(userId);
    console.log(`📸 [Partner Profile Image] Verificação após update - profileImage: ${updatedPartner?.profileImage?.substring(0, 100)}`);
    
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
router.delete('/profile/remove-image', requireAuth, async (req, res) => {
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

// Remover imagem de perfil (médico)
router.delete('/doctor-profile-image', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const doctor = await storage.getDoctorByUserId(userId);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de médico não encontrado' });
    }
    
    if (doctor.profileImage) {
      // Encontrar o arquivo no banco
      const secureFile = await storage.getSecureFileByUrl(doctor.profileImage);
      
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
    
    // Remover URL do perfil do médico e do usuário
    await storage.updateDoctor(doctor.id, { profileImage: null });
    await storage.updateUser(userId, { profileImage: null });
    
    res.json({ 
      success: true,
      message: 'Imagem de perfil do médico removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover imagem do médico:', error);
    res.status(500).json({ error: 'Erro ao remover imagem' });
  }
});

// Remover imagem de perfil (parceiro)
router.delete('/partner-profile-image', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const partner = await storage.getPartnerByUserId(userId);
    
    if (!partner) {
      return res.status(404).json({ error: 'Perfil de parceiro não encontrado' });
    }
    
    if (partner.profileImage) {
      // Encontrar o arquivo no banco
      const secureFile = await storage.getSecureFileByUrl(partner.profileImage);
      
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
    
    // Remover URL do perfil do parceiro e do usuário
    await storage.updatePartner(partner.id, { profileImage: null });
    await storage.updateUser(userId, { profileImage: null });
    
    res.json({ 
      success: true,
      message: 'Imagem de perfil do parceiro removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover imagem do parceiro:', error);
    res.status(500).json({ error: 'Erro ao remover imagem' });
  }
});

// Endpoint para gerar nova URL assinada (quando a atual expirar)
router.get('/profile/refresh-image-url', requireAuth, async (req, res) => {
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
router.get('/profile/export-my-data', requireAuth, async (req, res) => {
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