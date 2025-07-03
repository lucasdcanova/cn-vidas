import fs from 'fs';
import path from 'path';

// AWS S3 é opcional - só carregar se estiver disponível
let s3: any = null;

try {
  // Tentar carregar AWS SDK dinamicamente
  const AWS = eval('require')('aws-sdk');
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    console.log('✅ AWS S3 configurado com sucesso');
  } else {
    console.log('⚠️ Credenciais AWS não encontradas');
  }
} catch (error) {
  console.log('ℹ️ AWS SDK não disponível, S3 upload desabilitado');
}

export async function uploadToS3(filePath: string, key: string): Promise<string> {
  // Se não tiver configuração AWS ou S3 não estiver disponível, retornar erro
  if (!s3 || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
    console.log('⚠️ AWS S3 não configurado, usando armazenamento local');
    throw new Error('S3 não configurado - usando armazenamento local');
  }

  const fileContent = fs.readFileSync(filePath);
  const fileExtension = path.extname(filePath);
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: getContentType(fileExtension)
  };

  try {
    const result = await s3.upload(params).promise();
    console.log(`✅ Upload S3 concluído: ${result.Location}`);
    return result.Location;
  } catch (error) {
    console.error('❌ Erro ao fazer upload para S3:', error);
    throw error;
  }
}

function getContentType(extension: string): string {
  const types: { [key: string]: string } = {
    // Áudio
    '.webm': 'audio/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    // Documentos
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    // Imagens
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  
  return types[extension.toLowerCase()] || 'application/octet-stream';
}

// Função para gerar chave única para uploads
export function generateS3Key(type: 'recording' | 'medical-record' | 'profile', fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${type}/${timestamp}-${randomString}-${sanitizedFileName}`;
}

// Função para fazer upload com retry
export async function uploadToS3WithRetry(filePath: string, key: string, maxRetries: number = 3): Promise<string> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToS3(filePath, key);
    } catch (error) {
      lastError = error;
      console.log(`⚠️ Tentativa ${attempt}/${maxRetries} falhou ao fazer upload para S3`);
      
      if (attempt < maxRetries) {
        // Aguardar antes de tentar novamente (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  throw lastError;
}