// Configuração de políticas de bucket S3 para conformidade LGPD/Médica

export const S3_BUCKET_POLICIES = {
  // Política para imagens de perfil
  PROFILE_IMAGES_POLICY: {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'DenyUnencryptedObjectUploads',
        Effect: 'Deny',
        Principal: '*',
        Action: 's3:PutObject',
        Resource: 'arn:aws:s3:::cnvidas-profile-images/*',
        Condition: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'AES256'
          }
        }
      },
      {
        Sid: 'DenyInsecureConnections',
        Effect: 'Deny',
        Principal: '*',
        Action: 's3:*',
        Resource: 'arn:aws:s3:::cnvidas-profile-images/*',
        Condition: {
          Bool: {
            'aws:SecureTransport': 'false'
          }
        }
      }
    ]
  },

  // Política para dados médicos (mais restritiva)
  MEDICAL_RECORDS_POLICY: {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'DenyUnencryptedObjectUploads',
        Effect: 'Deny',
        Principal: '*',
        Action: 's3:PutObject',
        Resource: 'arn:aws:s3:::cnvidas-medical-records/*',
        Condition: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms'
          }
        }
      },
      {
        Sid: 'DenyInsecureConnections',
        Effect: 'Deny',
        Principal: '*',
        Action: 's3:*',
        Resource: 'arn:aws:s3:::cnvidas-medical-records/*',
        Condition: {
          Bool: {
            'aws:SecureTransport': 'false'
          }
        }
      },
      {
        Sid: 'RequireMFADelete',
        Effect: 'Deny',
        Principal: '*',
        Action: [
          's3:DeleteObject',
          's3:DeleteBucket'
        ],
        Resource: 'arn:aws:s3:::cnvidas-medical-records/*',
        Condition: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false'
          }
        }
      }
    ]
  }
};

// Configuração de CORS para acesso seguro
export const S3_CORS_CONFIG = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST'],
      AllowedOrigins: [
        'https://www.homologacao.cnvidas.com.br',
        'capacitor://localhost', // iOS
        'http://localhost' // Android
      ],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3000
    }
  ]
};

// Configuração de ciclo de vida
export const S3_LIFECYCLE_CONFIG = {
  Rules: [
    {
      Id: 'ArchiveMedicalRecords',
      Status: 'Enabled',
      Prefix: 'medical-records/',
      Transitions: [
        {
          Days: 90,
          StorageClass: 'STANDARD_IA'
        },
        {
          Days: 365,
          StorageClass: 'GLACIER'
        }
      ]
    },
    {
      Id: 'DeleteOldProfileImages',
      Status: 'Enabled',
      Prefix: 'profile-images/',
      Expiration: {
        Days: 730 // 2 anos
      },
      NoncurrentVersionExpiration: {
        NoncurrentDays: 30
      }
    },
    {
      Id: 'DeleteAnonymizedData',
      Status: 'Enabled',
      Prefix: 'anonymized/',
      Expiration: {
        Days: 3650 // 10 anos conforme legislação médica
      }
    }
  ]
};

// Configuração de versionamento
export const S3_VERSIONING_CONFIG = {
  Status: 'Enabled',
  MFADelete: 'Enabled' // Para dados médicos
};

// Tags para classificação de dados
export const DATA_CLASSIFICATION_TAGS = {
  PUBLIC: { Classification: 'Public', Sensitivity: 'Low' },
  INTERNAL: { Classification: 'Internal', Sensitivity: 'Medium' },
  CONFIDENTIAL: { Classification: 'Confidential', Sensitivity: 'High' },
  MEDICAL: { Classification: 'Medical', Sensitivity: 'Critical', Compliance: 'LGPD,CFM' }
};

// Configuração de backup
export const BACKUP_CONFIG = {
  MEDICAL_RECORDS: {
    frequency: 'DAILY',
    retention: 3650, // 10 anos
    destination: 'cnvidas-medical-backup',
    encryption: 'aws:kms'
  },
  PROFILE_IMAGES: {
    frequency: 'WEEKLY',
    retention: 730, // 2 anos
    destination: 'cnvidas-profile-backup',
    encryption: 'AES256'
  }
};

// Endpoints CDN para distribuição global
export const CDN_CONFIG = {
  CLOUDFRONT_DISTRIBUTION: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN || 'dxxxxxxxxxxxxx.cloudfront.net',
  CACHE_BEHAVIORS: {
    'profile-images/*': {
      TTL: 86400 * 7, // 7 dias
      compress: true,
      viewerProtocolPolicy: 'redirect-to-https'
    },
    'medical-records/*': {
      TTL: 0, // Sem cache
      compress: false,
      viewerProtocolPolicy: 'https-only',
      trustedSigners: ['self']
    }
  }
};

export default {
  S3_BUCKET_POLICIES,
  S3_CORS_CONFIG,
  S3_LIFECYCLE_CONFIG,
  S3_VERSIONING_CONFIG,
  DATA_CLASSIFICATION_TAGS,
  BACKUP_CONFIG,
  CDN_CONFIG
};