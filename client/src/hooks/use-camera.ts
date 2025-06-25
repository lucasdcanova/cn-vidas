import { useState, useCallback } from 'react';
import { cameraService, CameraOptions, CameraResult } from '@/services/camera-service';
import { useToast } from '@/hooks/use-toast';

export interface UseCameraReturn {
  isCapturing: boolean;
  lastPhoto: string | null;
  takePicture: (options?: CameraOptions) => Promise<CameraResult>;
  takePhotoFromCamera: () => Promise<CameraResult>;
  selectFromGallery: () => Promise<CameraResult>;
  checkAndRequestPermissions: () => Promise<boolean>;
  convertToFile: (dataUrl: string, filename: string) => File;
  clearLastPhoto: () => void;
}

export function useCamera(): UseCameraReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  const takePicture = useCallback(async (options?: CameraOptions): Promise<CameraResult> => {
    setIsCapturing(true);
    try {
      const result = await cameraService.takePicture(options);
      
      if (result.success && result.data) {
        setLastPhoto(result.data.dataUrl);
      } else if (result.error && result.error !== 'Operação cancelada') {
        toast({
          title: 'Erro ao capturar imagem',
          description: result.error,
          variant: 'destructive'
        });
      }
      
      return result;
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  const takePhotoFromCamera = useCallback(async (): Promise<CameraResult> => {
    return takePicture({ source: 'camera', quality: 85 });
  }, [takePicture]);

  const selectFromGallery = useCallback(async (): Promise<CameraResult> => {
    return takePicture({ source: 'photos', quality: 90 });
  }, [takePicture]);

  const checkAndRequestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Primeiro verifica se já tem permissões
      const hasPermissions = await cameraService.checkPermissions();
      
      if (!hasPermissions) {
        // Se não tem, solicita
        const granted = await cameraService.requestPermissions();
        
        if (!granted) {
          toast({
            title: 'Permissões necessárias',
            description: 'Por favor, habilite as permissões de câmera e galeria nas configurações do app.',
            variant: 'destructive'
          });
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar/solicitar permissões:', error);
      return false;
    }
  }, [toast]);

  const convertToFile = useCallback((dataUrl: string, filename: string): File => {
    return cameraService.dataUrlToFile(dataUrl, filename);
  }, []);

  const clearLastPhoto = useCallback(() => {
    setLastPhoto(null);
  }, []);

  return {
    isCapturing,
    lastPhoto,
    takePicture,
    takePhotoFromCamera,
    selectFromGallery,
    checkAndRequestPermissions,
    convertToFile,
    clearLastPhoto
  };
}