import path from 'path';
import fs from 'fs';

// Detectar se estamos no Render.com
const isRender = process.env.RENDER === 'true';

// Configurar o caminho base dos uploads
export const getUploadBasePath = (): string => {
  if (isRender) {
    // No Render, usar o disco persistente
    return '/opt/render/project/src/public/uploads';
  } else {
    // Em desenvolvimento ou outros ambientes
    return path.join(process.cwd(), 'public', 'uploads');
  }
};

// Garantir que o diretório existe
export const ensureUploadDir = (subPath: string): string => {
  const fullPath = path.join(getUploadBasePath(), subPath);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  
  return fullPath;
};

// Obter URL pública do arquivo
export const getPublicUrl = (filePath: string): string => {
  // Sempre retornar caminho relativo começando com /uploads
  if (filePath.startsWith('/uploads/')) {
    return filePath;
  }
  
  // Extrair apenas a parte após 'uploads/'
  const uploadsIndex = filePath.indexOf('uploads/');
  if (uploadsIndex !== -1) {
    return '/' + filePath.substring(uploadsIndex);
  }
  
  return filePath;
};