import { Request, Response, NextFunction } from 'express';
import SecureStorageService from '../services/secure-storage-service';
import { storage } from '../storage';

// Verifica se uma URL S3 está expirada
function isS3UrlExpired(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const expires = urlObj.searchParams.get('X-Amz-Expires');
    const date = urlObj.searchParams.get('X-Amz-Date');
    
    if (!expires || !date) return false;
    
    // Parse da data no formato ISO 8601 básico
    const dateStr = date.replace(/T/, ' ').replace(/Z/, '');
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(9, 11));
    const minute = parseInt(dateStr.substring(11, 13));
    const second = parseInt(dateStr.substring(13, 15));
    
    const startDate = new Date(Date.UTC(year, month, day, hour, minute, second));
    const expiresInSeconds = parseInt(expires);
    const expirationDate = new Date(startDate.getTime() + (expiresInSeconds * 1000));
    
    // Verificar se está expirado ou prestes a expirar (menos de 1 hora)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
    
    return expirationDate <= oneHourFromNow;
  } catch (error) {
    console.error('Erro ao verificar expiração da URL:', error);
    return true; // Assumir expirado em caso de erro
  }
}

// Middleware para renovar URLs de imagem de perfil expiradas
export async function refreshProfileImages(req: Request, res: Response, next: NextFunction) {
  try {
    // Só processar se houver usuário autenticado
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const user = await storage.getUserById(userId);
    
    if (!user?.profileImage) {
      return next();
    }
    
    // Verificar se é uma URL S3 e se está expirada
    if (user.profileImage.includes('amazonaws.com') && isS3UrlExpired(user.profileImage)) {
      console.log('🔄 Renovando URL expirada para usuário:', userId);
      
      // Encontrar o arquivo no banco
      const secureFile = await storage.getSecureFileByUrl(user.profileImage);
      
      if (secureFile) {
        // Gerar nova URL assinada
        const newUrl = await SecureStorageService.generateSignedUrl(
          secureFile.bucketName,
          secureFile.fileKey,
          'profile'
        );
        
        // Atualizar no banco
        await storage.updateUser(userId, { profileImage: newUrl });
        
        // Atualizar também no objeto do request para esta requisição
        req.user.profileImage = newUrl;
        
        console.log('✅ URL renovada com sucesso');
      }
    }
    
    // Para médicos, verificar também a imagem do perfil de médico
    if (user.role === 'doctor') {
      const doctor = await storage.getDoctorByUserId(userId);
      
      if (doctor?.profileImage && doctor.profileImage.includes('amazonaws.com') && isS3UrlExpired(doctor.profileImage)) {
        console.log('🔄 Renovando URL expirada para médico:', doctor.id);
        
        const secureFile = await storage.getSecureFileByUrl(doctor.profileImage);
        
        if (secureFile) {
          const newUrl = await SecureStorageService.generateSignedUrl(
            secureFile.bucketName,
            secureFile.fileKey,
            'profile'
          );
          
          await storage.updateDoctor(doctor.id, { profileImage: newUrl });
          await storage.updateUser(userId, { profileImage: newUrl });
        }
      }
    }
    
    // Para parceiros
    if (user.role === 'partner') {
      const partner = await storage.getPartnerByUserId(userId);
      
      if (partner?.profileImage && partner.profileImage.includes('amazonaws.com') && isS3UrlExpired(partner.profileImage)) {
        console.log('🔄 Renovando URL expirada para parceiro:', partner.id);
        
        const secureFile = await storage.getSecureFileByUrl(partner.profileImage);
        
        if (secureFile) {
          const newUrl = await SecureStorageService.generateSignedUrl(
            secureFile.bucketName,
            secureFile.fileKey,
            'profile'
          );
          
          await storage.updatePartner(partner.id, { profileImage: newUrl });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware de refresh de imagens:', error);
    next(); // Continuar mesmo com erro
  }
}

// Função para renovar URL de uma imagem específica
export async function refreshSingleImageUrl(currentUrl: string, userId: number, fileType: string = 'profile'): Promise<string | null> {
  try {
    if (!currentUrl || !currentUrl.includes('amazonaws.com')) {
      return currentUrl;
    }
    
    // Verificar se está expirada
    if (!isS3UrlExpired(currentUrl)) {
      return currentUrl;
    }
    
    // Encontrar o arquivo no banco
    const secureFile = await storage.getSecureFileByUrl(currentUrl);
    
    if (!secureFile) {
      console.error('Arquivo não encontrado no banco para URL:', currentUrl);
      return null;
    }
    
    // Gerar nova URL assinada
    const newUrl = await SecureStorageService.generateSignedUrl(
      secureFile.bucketName,
      secureFile.fileKey,
      fileType
    );
    
    return newUrl;
  } catch (error) {
    console.error('Erro ao renovar URL:', error);
    return null;
  }
}