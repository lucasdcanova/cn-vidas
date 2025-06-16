import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, Loader2, User, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import ImageCropper from './ImageCropper';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ProfilePhotoUploaderProps {
  currentImage?: string | null;
  userName?: string;
  userType?: 'patient' | 'doctor' | 'partner';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRemoveButton?: boolean;
  onImageUpdate?: (imageUrl: string | null) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
};

const buttonSizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12'
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6'
};

export default function ProfilePhotoUploaderDebug({
  currentImage,
  userName = 'Usuário',
  userType = 'patient',
  size = 'lg',
  showRemoveButton = true,
  onImageUpdate,
  className = ''
}: ProfilePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Debug state
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    console.log(`[ProfilePhotoUploader] ${message}`);
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Manipular seleção de arquivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    addDebugLog('handleFileSelect called');
    
    const file = e.target.files?.[0];
    if (!file) {
      addDebugLog('No file selected');
      return;
    }

    addDebugLog(`File selected: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    
    setUploadError(null);
    setUploadSuccess(false);

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      const errorMsg = `Tipo de arquivo não suportado: ${file.type}. Use apenas imagens (JPG, PNG, GIF, WEBP).`;
      addDebugLog(`Error: ${errorMsg}`);
      setUploadError(errorMsg);
      toast({
        title: 'Erro - Tipo de arquivo',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    // Validação de tamanho (50MB - será comprimido)
    if (file.size > 50 * 1024 * 1024) {
      const errorMsg = `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo permitido: 50MB.`;
      addDebugLog(`Error: ${errorMsg}`);
      setUploadError(errorMsg);
      toast({
        title: 'Erro - Tamanho do arquivo',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    addDebugLog(`File validation passed. Setting selectedFile and showCropper`);
    
    // Guardar o arquivo selecionado
    setSelectedFile(file);
    setShowCropper(true);
    
    addDebugLog(`State after setting: selectedFile=${file.name}, showCropper=true`);
  }, [toast]);

  // Função para fazer upload da imagem cropada
  const handleCropComplete = useCallback(async (croppedImageBlob: Blob) => {
    addDebugLog('handleCropComplete called');
    setShowCropper(false);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Simulação de upload para debug
      addDebugLog('Starting upload simulation...');
      
      // Criar preview URL
      const previewUrl = URL.createObjectURL(croppedImageBlob);
      setPreviewImage(previewUrl);
      
      // Simular progresso
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      addDebugLog('Upload simulation complete');
      setUploadSuccess(true);
      
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 3000);

      toast({
        title: 'Debug Mode',
        description: 'Upload simulado com sucesso (modo debug).',
      });
    } catch (error) {
      addDebugLog(`Error during upload: ${error}`);
      setUploadError('Erro no modo debug');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [toast]);

  // Cancelar cropper
  const handleCropCancel = useCallback(() => {
    addDebugLog('handleCropCancel called');
    setShowCropper(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    addDebugLog('triggerFileInput called');
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  return (
    <>
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Debug info */}
            <div className="w-full text-xs bg-gray-100 p-2 rounded max-h-32 overflow-auto">
              <strong>Debug Log:</strong>
              {debugLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              <div>Current State: showCropper={String(showCropper)}, selectedFile={selectedFile?.name || 'null'}</div>
            </div>

            {/* Avatar com indicadores de status */}
            <div className="relative">
              <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
                <AvatarImage 
                  src={previewImage || undefined} 
                  alt={userName}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg font-medium">
                  {previewImage ? (
                    <User className={iconSizes[size]} />
                  ) : (
                    getInitials(userName)
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Overlay de carregamento */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-xs font-medium mb-1">
                      {uploadProgress}%
                    </div>
                    <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay de sucesso */}
              {uploadSuccess && !isUploading && (
                <div className="absolute inset-0 bg-green-500/20 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
                  <Check className={`${iconSizes[size]} text-green-600`} />
                </div>
              )}

              {/* Botão de câmera */}
              <Button
                size="icon"
                variant="secondary"
                className={`absolute bottom-0 right-0 rounded-full shadow-lg ${buttonSizes[size]}`}
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                <Camera className={iconSizes[size]} />
              </Button>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={triggerFileInput}
                disabled={isUploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {previewImage ? 'Alterar' : 'Adicionar'}
              </Button>
            </div>

            {/* Input de arquivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cropper Modal */}
      {showCropper && selectedFile && (
        <div>
          <div className="fixed inset-0 bg-red-500 opacity-20 z-50" />
          <div className="fixed top-4 left-4 bg-white p-4 z-50 shadow-lg">
            Debug: ImageCropper should be visible now!
            <br />
            File: {selectedFile.name}
          </div>
          <ImageCropper
            image={selectedFile}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={1}
            circularCrop={true}
            isOpen={showCropper}
          />
        </div>
      )}
    </>
  );
}