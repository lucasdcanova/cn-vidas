const AWS = require('aws-sdk');
require('dotenv').config();

// Configurar AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'sa-east-1'
});

const s3 = new AWS.S3();

const buckets = [
  {
    name: process.env.S3_BUCKET_PROFILE || 'cnvidas-profile-images',
    encryption: 'AES256',
    lifecycleRules: [
      {
        id: 'delete-old-images',
        status: 'Enabled',
        expiration: { days: 730 } // 2 anos
      }
    ]
  },
  {
    name: process.env.S3_BUCKET_MEDICAL || 'cnvidas-medical-records',
    encryption: 'aws:kms',
    kmsKeyId: process.env.AWS_KMS_KEY_ID,
    lifecycleRules: [
      {
        id: 'archive-old-records',
        status: 'Enabled',
        transitions: [
          { days: 90, storageClass: 'STANDARD_IA' },
          { days: 365, storageClass: 'GLACIER' }
        ]
      }
    ]
  },
  {
    name: process.env.S3_BUCKET_RECORDINGS || 'cnvidas-consultations',
    encryption: 'aws:kms',
    kmsKeyId: process.env.AWS_KMS_KEY_ID,
    lifecycleRules: [
      {
        id: 'delete-old-recordings',
        status: 'Enabled',
        expiration: { days: 365 } // 1 ano
      }
    ]
  },
  {
    name: process.env.S3_BUCKET_SENSITIVE || 'cnvidas-sensitive-docs',
    encryption: 'aws:kms',
    kmsKeyId: process.env.AWS_KMS_KEY_ID
  }
];

async function setupBuckets() {
  console.log('🚀 Configurando buckets S3 para CNVidas...\n');

  for (const bucket of buckets) {
    try {
      // Verificar se o bucket já existe
      try {
        await s3.headBucket({ Bucket: bucket.name }).promise();
        console.log(`✅ Bucket ${bucket.name} já existe`);
      } catch (err) {
        if (err.code === 'NotFound') {
          // Criar bucket
          console.log(`📦 Criando bucket ${bucket.name}...`);
          await s3.createBucket({
            Bucket: bucket.name,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION || 'sa-east-1'
            }
          }).promise();
          console.log(`✅ Bucket ${bucket.name} criado com sucesso`);
        } else {
          throw err;
        }
      }

      // Configurar versionamento
      console.log(`🔄 Habilitando versionamento...`);
      await s3.putBucketVersioning({
        Bucket: bucket.name,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }).promise();

      // Configurar criptografia
      console.log(`🔐 Configurando criptografia...`);
      const encryptionConfig = {
        Bucket: bucket.name,
        ServerSideEncryptionConfiguration: {
          Rules: [{
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: bucket.encryption
            }
          }]
        }
      };

      if (bucket.kmsKeyId && bucket.encryption === 'aws:kms') {
        encryptionConfig.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSMasterKeyID = bucket.kmsKeyId;
      }

      await s3.putBucketEncryption(encryptionConfig).promise();

      // Configurar CORS
      console.log(`🌐 Configurando CORS...`);
      await s3.putBucketCors({
        Bucket: bucket.name,
        CORSConfiguration: {
          CORSRules: [{
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
            AllowedOrigins: [
              'https://www.homologacao.cnvidas.com.br',
              'http://localhost:3000',
              'capacitor://localhost',
              'http://localhost'
            ],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }]
        }
      }).promise();

      // Configurar lifecycle rules se existirem
      if (bucket.lifecycleRules && bucket.lifecycleRules.length > 0) {
        console.log(`⏰ Configurando regras de ciclo de vida...`);
        const lifecycleConfig = {
          Bucket: bucket.name,
          LifecycleConfiguration: {
            Rules: bucket.lifecycleRules.map(rule => ({
              ID: rule.id,
              Status: rule.status,
              ...(rule.expiration && { Expiration: { Days: rule.expiration.days } }),
              ...(rule.transitions && { 
                Transitions: rule.transitions.map(t => ({
                  Days: t.days,
                  StorageClass: t.storageClass
                }))
              })
            }))
          }
        };
        await s3.putBucketLifecycleConfiguration(lifecycleConfig).promise();
      }

      // Bloquear acesso público
      console.log(`🚫 Bloqueando acesso público...`);
      await s3.putPublicAccessBlock({
        Bucket: bucket.name,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      }).promise();

      console.log(`✅ Bucket ${bucket.name} configurado com sucesso!\n`);

    } catch (error) {
      console.error(`❌ Erro ao configurar bucket ${bucket.name}:`, error.message);
      if (error.code === 'BucketAlreadyExists' || error.code === 'BucketAlreadyOwnedByYou') {
        console.log(`ℹ️  O nome do bucket ${bucket.name} já está em uso. Tente um nome diferente.`);
      }
    }
  }

  console.log('\n🎉 Configuração dos buckets S3 concluída!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Execute as migrações do banco: npm run db:migrate');
  console.log('2. Atualize o código para usar o novo serviço de storage');
  console.log('3. Teste o upload de imagens');
}

// Executar setup
setupBuckets().catch(console.error);