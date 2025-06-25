import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraResult {
  success: boolean;
  data?: {
    dataUrl: string;
    format: string;
  };
  error?: string;
}

export interface CameraOptions {
  source?: 'camera' | 'photos' | 'prompt';
  quality?: number;
  allowEditing?: boolean;
  saveToGallery?: boolean;
}

class CameraService {
  private isNative = Capacitor.isNativePlatform();

  async takePicture(options: CameraOptions = {}): Promise<CameraResult> {
    try {
      // Verificar se estamos em ambiente nativo
      if (!this.isNative) {
        return {
          success: false,
          error: 'Câmera disponível apenas no app móvel'
        };
      }

      // Mapear source para o enum correto
      let cameraSource: CameraSource;
      switch (options.source) {
        case 'camera':
          cameraSource = CameraSource.Camera;
          break;
        case 'photos':
          cameraSource = CameraSource.Photos;
          break;
        case 'prompt':
        default:
          cameraSource = CameraSource.Prompt;
          break;
      }

      // Tirar foto ou selecionar da galeria
      const photo: Photo = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.DataUrl,
        source: cameraSource,
        saveToGallery: options.saveToGallery || false,
        promptLabelHeader: 'Selecionar imagem',
        promptLabelCancel: 'Cancelar',
        promptLabelPhoto: 'Da Galeria',
        promptLabelPicture: 'Tirar Foto'
      });

      if (photo.dataUrl) {
        return {
          success: true,
          data: {
            dataUrl: photo.dataUrl,
            format: photo.format
          }
        };
      }

      return {
        success: false,
        error: 'Nenhuma imagem foi capturada'
      };
    } catch (error: any) {
      console.error('Erro ao capturar imagem:', error);
      
      // Tratar erros específicos
      if (error.message?.includes('User cancelled')) {
        return {
          success: false,
          error: 'Operação cancelada'
        };
      }
      
      if (error.message?.includes('No camera')) {
        return {
          success: false,
          error: 'Câmera não disponível'
        };
      }
      
      if (error.message?.includes('Permission')) {
        return {
          success: false,
          error: 'Permissão de câmera negada. Por favor, habilite nas configurações.'
        };
      }

      return {
        success: false,
        error: error.message || 'Erro ao acessar câmera'
      };
    }
  }

  // Verificar permissões de câmera
  async checkPermissions(): Promise<boolean> {
    if (!this.isNative) {
      return false;
    }

    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  // Solicitar permissões de câmera
  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) {
      return false;
    }

    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }

  // Converter dataUrl para Blob (útil para upload)
  dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  // Converter dataUrl para File (útil para formulários)
  dataUrlToFile(dataUrl: string, filename: string): File {
    const blob = this.dataUrlToBlob(dataUrl);
    return new File([blob], filename, { type: blob.type });
  }
}

export const cameraService = new CameraService();