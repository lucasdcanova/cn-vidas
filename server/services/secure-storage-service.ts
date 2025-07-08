import AWS from 'aws-sdk';
import crypto from 'crypto';
import { promisify } from 'util';
import sharp from 'sharp';

// Configuração do S3 para conformidade LGPD/Médica
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'sa-east-1', // São Paulo para dados brasileiros
  signatureVersion: 'v4',
  s3ForcePathStyle: true,
  sslEnabled: true,
});

// Detectar região da chave KMS se usar ARN completo
let kmsRegion = process.env.AWS_REGION || 'sa-east-1';
const kmsKeyId = process.env.AWS_KMS_KEY_ID;
if (kmsKeyId && kmsKeyId.startsWith('arn:aws:kms:')) {
  const arnParts = kmsKeyId.split(':');
  if (arnParts.length >= 4) {
    kmsRegion = arnParts[3];
  }
}

// Buckets separados por tipo de dado
const BUCKETS = {
  PROFILE_IMAGES: process.env.S3_BUCKET_PROFILE || 'cnvidas-profile-images',
  MEDICAL_RECORDS: process.env.S3_BUCKET_MEDICAL || 'cnvidas-medical-records',
  CONSULTATION_RECORDINGS: process.env.S3_BUCKET_RECORDINGS || 'cnvidas-consultations',
  SENSITIVE_DOCUMENTS: process.env.S3_BUCKET_SENSITIVE || 'cnvidas-sensitive-docs'
};

// Configurações de segurança por tipo de dado
const SECURITY_CONFIGS = {
  PROFILE_IMAGES: {
    encryption: 'AES256',
    acl: 'private',
    cacheControl: 'max-age=31536000',
    storageClass: 'STANDARD_IA',
    publicRead: false
  },
  MEDICAL_RECORDS: {
    encryption: 'aws:kms',
    kmsKeyId: process.env.AWS_KMS_KEY_ID,
    acl: 'private',
    storageClass: 'STANDARD',
    versioning: true,
    publicRead: false
  },
  CONSULTATION_RECORDINGS: {
    encryption: 'aws:kms',
    kmsKeyId: process.env.AWS_KMS_KEY_ID,
    acl: 'private',
    storageClass: 'GLACIER_FLEXIBLE_RETRIEVAL',
    lifecycle: 90, // dias
    publicRead: false
  }
};

interface UploadOptions {
  userId: number;
  fileType: 'profile' | 'medical' | 'consultation' | 'document';
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
  requiresEncryption?: boolean;
}

interface AuditLog {
  userId: number;
  action: 'upload' | 'download' | 'delete' | 'view';
  fileKey: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

export class SecureStorageService {
  // Gerar chave única e segura para o arquivo
  private static generateSecureKey(options: UploadOptions): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256')
      .update(`${options.userId}-${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 8);
    
    const folder = this.getFolderByType(options.fileType);
    const extension = options.fileName.split('.').pop();
    
    return `${folder}/user-${options.userId}/${timestamp}-${hash}.${extension}`;
  }

  // Determinar pasta baseada no tipo
  private static getFolderByType(fileType: string): string {
    const folders: Record<string, string> = {
      profile: 'profile-images',
      medical: 'medical-records',
      consultation: 'consultations',
      document: 'documents'
    };
    return folders[fileType] || 'misc';
  }

  // Determinar bucket baseado no tipo
  private static getBucketByType(fileType: string): string {
    const buckets: Record<string, string> = {
      profile: BUCKETS.PROFILE_IMAGES,
      medical: BUCKETS.MEDICAL_RECORDS,
      consultation: BUCKETS.CONSULTATION_RECORDINGS,
      document: BUCKETS.SENSITIVE_DOCUMENTS
    };
    return buckets[fileType] || BUCKETS.PROFILE_IMAGES;
  }

  // Upload seguro com auditoria
  static async uploadSecure(
    buffer: Buffer, 
    options: UploadOptions,
    auditInfo?: { ip?: string; userAgent?: string }
  ): Promise<{ url: string; key: string }> {
    const startTime = Date.now();
    const key = this.generateSecureKey(options);
    const bucket = this.getBucketByType(options.fileType);
    const securityConfig = this.getSecurityConfig(options.fileType);

    try {
      // Para imagens de perfil, otimizar antes do upload
      if (options.fileType === 'profile') {
        buffer = await this.optimizeProfileImage(buffer);
      }

      // Criptografar dados sensíveis antes do upload
      if (options.requiresEncryption || options.fileType === 'medical') {
        buffer = await this.encryptData(buffer, options.userId);
      }

      // Parâmetros do upload
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
        ServerSideEncryption: securityConfig.encryption,
        StorageClass: securityConfig.storageClass,
        ACL: securityConfig.acl,
        CacheControl: securityConfig.cacheControl,
        Metadata: {
          ...options.metadata,
          userId: options.userId.toString(),
          uploadTimestamp: new Date().toISOString(),
          clientIp: auditInfo?.ip || 'unknown',
          lgpdConsent: 'true'
        }
      };

      // Adicionar KMS key se necessário
      if (securityConfig.kmsKeyId && securityConfig.encryption === 'aws:kms') {
        uploadParams.SSEKMSKeyId = securityConfig.kmsKeyId;
      }

      // Fazer upload
      await s3.putObject(uploadParams).promise();

      // Registrar na auditoria
      await this.logAudit({
        userId: options.userId,
        action: 'upload',
        fileKey: key,
        timestamp: new Date(),
        ip: auditInfo?.ip,
        userAgent: auditInfo?.userAgent,
        success: true
      });

      // Gerar URL assinada (não URL pública)
      const url = await this.generateSignedUrl(bucket, key, options.fileType);

      console.log(`✅ Upload seguro concluído em ${Date.now() - startTime}ms`);
      
      return { url, key };
    } catch (error) {
      // Registrar falha na auditoria
      await this.logAudit({
        userId: options.userId,
        action: 'upload',
        fileKey: key,
        timestamp: new Date(),
        ip: auditInfo?.ip,
        userAgent: auditInfo?.userAgent,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  // Gerar URL assinada temporária
  static async generateSignedUrl(
    bucket: string, 
    key: string, 
    fileType: string
  ): Promise<string> {
    try {
      // URLs assinadas com expiração
      const expirationSeconds = fileType === 'profile' ? 3600 * 24 * 7 : 3600; // 7 dias para perfil, 1 hora para médicos
      
      console.log('🔐 Gerando URL assinada:', {
        bucket,
        key,
        fileType,
        expirationSeconds,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      });
      
      const params = {
        Bucket: bucket,
        Key: key,
        Expires: expirationSeconds,
        ResponseCacheControl: 'no-cache, no-store, must-revalidate'
      };

      const signedUrl = s3.getSignedUrl('getObject', params);
      
      // Log da URL gerada (sem expor dados sensíveis)
      const urlParts = new URL(signedUrl);
      console.log('🔗 URL assinada gerada:', {
        host: urlParts.hostname,
        pathname: urlParts.pathname,
        hasSignature: urlParts.searchParams.has('X-Amz-Signature'),
        hasCredential: urlParts.searchParams.has('X-Amz-Credential'),
        expires: urlParts.searchParams.get('X-Amz-Expires')
      });
      
      return signedUrl;
    } catch (error) {
      console.error('❌ Erro ao gerar URL assinada:', error);
      throw error;
    }
  }

  // Download seguro com auditoria
  static async downloadSecure(
    key: string, 
    userId: number, 
    fileType: string,
    auditInfo?: { ip?: string; userAgent?: string }
  ): Promise<Buffer> {
    const bucket = this.getBucketByType(fileType);

    try {
      const params = {
        Bucket: bucket,
        Key: key
      };

      const data = await s3.getObject(params).promise();
      
      // Registrar acesso
      await this.logAudit({
        userId,
        action: 'download',
        fileKey: key,
        timestamp: new Date(),
        ip: auditInfo?.ip,
        userAgent: auditInfo?.userAgent,
        success: true
      });

      // Descriptografar se necessário
      if (fileType === 'medical' || data.Metadata?.encrypted === 'true') {
        return await this.decryptData(data.Body as Buffer, userId);
      }

      return data.Body as Buffer;
    } catch (error) {
      await this.logAudit({
        userId,
        action: 'download',
        fileKey: key,
        timestamp: new Date(),
        ip: auditInfo?.ip,
        userAgent: auditInfo?.userAgent,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  // Deletar com soft delete e auditoria
  static async deleteSecure(
    key: string, 
    userId: number, 
    fileType: string,
    auditInfo?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    const bucket = this.getBucketByType(fileType);

    try {
      // Para dados médicos, fazer soft delete (marcar como deletado)
      if (fileType === 'medical') {
        await s3.putObjectTagging({
          Bucket: bucket,
          Key: key,
          Tagging: {
            TagSet: [
              { Key: 'deleted', Value: 'true' },
              { Key: 'deletedAt', Value: new Date().toISOString() },
              { Key: 'deletedBy', Value: userId.toString() }
            ]
          }
        }).promise();
      } else {
        // Delete real para outros tipos
        await s3.deleteObject({
          Bucket: bucket,
          Key: key
        }).promise();
      }

      await this.logAudit({
        userId,
        action: 'delete',
        fileKey: key,
        timestamp: new Date(),
        ip: auditInfo?.ip,
        userAgent: auditInfo?.userAgent,
        success: true
      });
    } catch (error) {
      await this.logAudit({
        userId,
        action: 'delete',
        fileKey: key,
        timestamp: new Date(),
        ip: auditInfo?.ip,
        userAgent: auditInfo?.userAgent,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  // Otimizar imagem de perfil
  private static async optimizeProfileImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(800, 800, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer();
  }

  // Criptografia adicional para dados ultra-sensíveis
  private static async encryptData(buffer: Buffer, userId: number): Promise<Buffer> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY!, 
      `user-${userId}`, 
      32
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Retornar IV + authTag + encrypted data
    return Buffer.concat([iv, authTag, encrypted]);
  }

  // Descriptografar dados
  private static async decryptData(buffer: Buffer, userId: number): Promise<Buffer> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY!, 
      `user-${userId}`, 
      32
    );
    
    // Extrair IV, authTag e dados criptografados
    const iv = buffer.slice(0, 16);
    const authTag = buffer.slice(16, 32);
    const encrypted = buffer.slice(32);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  // Obter configuração de segurança
  private static getSecurityConfig(fileType: string): any {
    const configs: Record<string, any> = {
      profile: SECURITY_CONFIGS.PROFILE_IMAGES,
      medical: SECURITY_CONFIGS.MEDICAL_RECORDS,
      consultation: SECURITY_CONFIGS.CONSULTATION_RECORDINGS,
      document: SECURITY_CONFIGS.MEDICAL_RECORDS
    };
    return configs[fileType] || SECURITY_CONFIGS.PROFILE_IMAGES;
  }

  // Registrar auditoria (implementar com seu banco de dados)
  private static async logAudit(log: AuditLog): Promise<void> {
    // TODO: Implementar salvamento no banco de dados
    console.log('🔍 Auditoria:', {
      ...log,
      timestamp: log.timestamp.toISOString()
    });
    
    // Exemplo de implementação:
    // await db.insert(auditLogs).values(log);
  }

  // Verificar conformidade LGPD
  static async verifyLGPDCompliance(userId: number): Promise<{
    hasConsent: boolean;
    consentDate?: Date;
    dataRetentionDays: number;
    deletionScheduled?: Date;
  }> {
    // TODO: Implementar verificação de consentimento
    return {
      hasConsent: true,
      consentDate: new Date(),
      dataRetentionDays: 365 * 10, // 10 anos para prontuários médicos
    };
  }

  // Exportar dados do usuário (LGPD - direito de portabilidade)
  static async exportUserData(userId: number): Promise<{
    profileImages: string[];
    medicalRecords: string[];
    consultations: string[];
  }> {
    // Listar todos os arquivos do usuário
    const buckets = Object.values(BUCKETS);
    const allFiles = {
      profileImages: [],
      medicalRecords: [],
      consultations: []
    };

    for (const bucket of buckets) {
      try {
        const params = {
          Bucket: bucket,
          Prefix: `user-${userId}/`
        };
        
        const data = await s3.listObjectsV2(params).promise();
        
        if (data.Contents) {
          // Categorizar arquivos
          data.Contents.forEach(file => {
            if (file.Key?.includes('profile-images')) {
              allFiles.profileImages.push(file.Key);
            } else if (file.Key?.includes('medical-records')) {
              allFiles.medicalRecords.push(file.Key);
            } else if (file.Key?.includes('consultations')) {
              allFiles.consultations.push(file.Key);
            }
          });
        }
      } catch (error) {
        console.error(`Erro ao listar bucket ${bucket}:`, error);
      }
    }

    return allFiles;
  }

  // Anonimizar dados (LGPD - direito ao esquecimento)
  static async anonymizeUserData(userId: number): Promise<void> {
    const userFiles = await this.exportUserData(userId);
    
    // Anonimizar cada arquivo
    for (const [category, files] of Object.entries(userFiles)) {
      for (const fileKey of files) {
        if (category === 'medicalRecords') {
          // Prontuários médicos não podem ser deletados, apenas anonimizados
          await this.anonymizeMedicalRecord(fileKey, userId);
        } else {
          // Outros arquivos podem ser deletados
          await this.deleteSecure(fileKey, userId, category, {});
        }
      }
    }
  }

  // Anonimizar prontuário médico
  private static async anonymizeMedicalRecord(key: string, userId: number): Promise<void> {
    // Adicionar tags de anonimização
    await s3.putObjectTagging({
      Bucket: BUCKETS.MEDICAL_RECORDS,
      Key: key,
      Tagging: {
        TagSet: [
          { Key: 'anonymized', Value: 'true' },
          { Key: 'anonymizedAt', Value: new Date().toISOString() },
          { Key: 'originalUserId', Value: crypto.createHash('sha256').update(userId.toString()).digest('hex') }
        ]
      }
    }).promise();
  }
}

export default SecureStorageService;