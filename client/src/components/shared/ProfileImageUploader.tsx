import { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, Smartphone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ImageCropper from './ImageCropper';
import { useCamera } from '@/hooks/use-camera';
import { Capacitor } from '@capacitor/core';

interface ProfileImageUploaderProps {
  currentImage?: string | null;
  userName?: string;
  userType?: 'patient' | 'doctor' | 'partner';
  onImageUpdate?: (imageUrl: string) => void;
}

export default function ProfileImageUploader({
  currentImage,
  userName = 'Usuário',
  userType = 'patient',
  onImageUpdate
}: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { takePicture, checkAndRequestPermissions } = useCamera();
  const isNative = Capacitor.isNativePlatform();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validação de tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione apenas arquivos de imagem.',
          variant: 'destructive',
        });
        return;
      }

      // Validação de tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      setShowCropper(true);
    }
  };

  const handleCameraCapture = async () => {
    // Verificar e solicitar permissões
    const hasPermissions = await checkAndRequestPermissions();
    if (!hasPermissions) {
      return;
    }

    // Capturar imagem
    const result = await takePicture({ source: 'prompt', quality: 85 });
    
    if (result.success && result.data) {
      // Converter dataUrl para File
      const response = await fetch(result.data.dataUrl);
      const blob = await response.blob();
      const filename = `photo_${Date.now()}.${result.data.format || 'jpg'}`;
      const file = new File([blob], filename, { type: blob.type });
      
      setSelectedFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    console.log('[ProfileImageUploader] handleCropComplete iniciado');
    setShowCropper(false);
    setIsUploading(true);

    try {
      console.log('[ProfileImageUploader] Iniciando upload:', {
        blobSize: croppedImageBlob.size,
        blobType: croppedImageBlob.type,
        blobExists: !!croppedImageBlob
      });

      // Verificar se o blob é válido
      if (!croppedImageBlob || croppedImageBlob.size === 0) {
        throw new Error('Imagem inválida ou vazia');
      }

      console.log('[ProfileImageUploader] Criando FormData...');
      const formData = new FormData();
      formData.append('profileImage', croppedImageBlob, 'profile.jpg');

      console.log('[ProfileImageUploader] FormData preparado, enviando requisição...');
      
      let response;
      try {
        console.log('[ProfileImageUploader] Chamando apiRequest...');
        console.log('[ProfileImageUploader] Endpoint:', '/api/upload-image');
        console.log('[ProfileImageUploader] FormData tem entradas:', Array.from((formData as any).entries ? (formData as any).entries() : []));
        
        response = await apiRequest('POST', '/api/upload-image', formData);
        console.log('[ProfileImageUploader] apiRequest retornou resposta:', {
          type: response?.constructor?.name,
          status: response?.status,
          ok: response?.ok
        });
      } catch (fetchError: any) {
        console.error('[ProfileImageUploader] Erro na requisição HTTP:', {
          message: fetchError.message,
          name: fetchError.name,
          stack: fetchError.stack,
          code: fetchError.code,
          statusCode: fetchError.statusCode,
          toString: fetchError.toString()
        });
        
        // Verificar se é um erro de rede
        if (fetchError.message?.includes('network') || fetchError.message?.includes('fetch')) {
          throw new Error('Erro de conexão. Verifique sua internet.');
        }
        
        throw new Error(`Erro na requisição: ${fetchError.message || 'Erro desconhecido'}`);
      }
      
      console.log('[ProfileImageUploader] Resposta recebida:', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        statusText: response.statusText
      });
      
      // Verificar se a resposta é JSON válida
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[ProfileImageUploader] Resposta não é JSON:', text.substring(0, 500));
        throw new Error('Resposta inválida do servidor - recebido: ' + contentType);
      }
      
      const data = await response.json();
      console.log('[ProfileImageUploader] Dados recebidos:', data);

      if (data.imageUrl) {
        // Forçar refresh dos dados do usuário primeiro
        try {
          await apiRequest('POST', '/api/auth/refresh-user');
        } catch (error) {
          console.error('Erro ao fazer refresh dos dados:', error);
        }
        
        // Atualizar cache do React Query - IMPORTANTE: usar a mesma queryKey do useAuth
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        
        // Forçar refetch imediato
        await queryClient.refetchQueries({ queryKey: ['/api/user'] });
        
        // Callback para atualizar imagem no componente pai
        if (onImageUpdate) {
          onImageUpdate(data.imageUrl);
        }

        // Mostrar indicador de sucesso
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);

        toast({
          title: 'Sucesso!',
          description: 'Foto de perfil atualizada com sucesso.',
        });
      }
    } catch (error: any) {
      console.error('[ProfileImageUploader] Erro detalhado:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response
      });
      toast({
        title: 'Erro ao fazer upload',
        description: error.message || 'Ocorreu um erro ao atualizar sua foto.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      return;
    }

    setIsUploading(true);

    try {
      await apiRequest('DELETE', '/api/profile/upload-image');

      // Forçar refresh dos dados do usuário primeiro
      try {
        await apiRequest('POST', '/api/auth/refresh-user');
      } catch (error) {
        console.error('Erro ao fazer refresh dos dados:', error);
      }
      
      // Invalidar as mesmas queries do upload
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Forçar refetch imediato
      await queryClient.refetchQueries({ queryKey: ['/api/user'] });

      if (onImageUpdate) {
        onImageUpdate('');
      }

      toast({
        title: 'Sucesso!',
        description: 'Foto de perfil removida com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao remover sua foto.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'doctor':
        return 'Médico';
      case 'partner':
        return 'Parceiro';
      default:
        return 'Paciente';
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Foto de Perfil</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={currentImage || undefined} 
                  alt={userName}
                />
                <AvatarFallback className="text-2xl">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {uploadSuccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-full">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Adicione uma foto de perfil para personalizar sua conta
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                
                {isNative ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCameraCapture}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    {currentImage ? (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Tirar Foto
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    {currentImage ? (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Foto
                      </>
                    )}
                  </Button>
                )}

                {currentImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    className="w-full sm:w-auto text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover Foto
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <ImageCropper
              image={selectedFile}
              onCropComplete={handleCropComplete}
              onCancel={() => {
                setShowCropper(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              aspectRatio={1}
              circularCrop={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}