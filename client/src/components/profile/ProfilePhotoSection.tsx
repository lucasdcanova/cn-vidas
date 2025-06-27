import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ImageCropper from '@/components/shared/ImageCropper';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

interface ProfilePhotoSectionProps {
  currentImage?: string | null;
  userName?: string;
  userType?: 'patient' | 'doctor' | 'partner';
  onImageUpdate?: (imageUrl: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function ProfilePhotoSection({
  currentImage,
  userName = 'Usuário',
  userType = 'patient',
  onImageUpdate,
  className,
  size = 'xl'
}: ProfilePhotoSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-24 h-24'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione apenas imagens.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setShowCropper(false);
    setIsUploading(true);

    console.log('[ProfilePhotoSection] handleCropComplete iniciado');
    console.log('[ProfilePhotoSection] Blob size:', croppedImageBlob.size);
    console.log('[ProfilePhotoSection] Blob type:', croppedImageBlob.type);
    console.log('[ProfilePhotoSection] User type:', userType);
    console.log('[ProfilePhotoSection] Is native platform:', Capacitor.isNativePlatform());

    try {
      const formData = new FormData();
      formData.append('profileImage', croppedImageBlob, 'profile.jpg');

      let endpoint = '/api/profile/upload-image';
      if (userType === 'doctor') {
        endpoint = '/api/doctor-profile-image';
      } else if (userType === 'partner') {
        endpoint = '/api/partner-profile-image';
      }

      console.log('[ProfilePhotoSection] Endpoint:', endpoint);
      console.log('[ProfilePhotoSection] FormData criado, iniciando upload...');

      const response = await apiRequest('POST', endpoint, formData);
      
      console.log('[ProfilePhotoSection] Response status:', response.status);
      console.log('[ProfilePhotoSection] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ProfilePhotoSection] Upload error:', errorText);
        throw new Error(errorText || 'Falha no upload');
      }

      const result = await response.json();
      console.log('[ProfilePhotoSection] Upload result:', result);
      
      const imageUrl = result.imageUrl || result.url;

      if (imageUrl) {
        setPreviewImage(imageUrl);
        onImageUpdate?.(imageUrl);

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
        
        if (userType === 'doctor') {
          queryClient.invalidateQueries({ queryKey: ['/api/doctors/user'] });
        } else if (userType === 'partner') {
          queryClient.invalidateQueries({ queryKey: ['/api/partners/me'] });
        }

        toast({
          title: 'Foto atualizada!',
          description: 'Sua foto de perfil foi atualizada com sucesso.',
        });
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível atualizar sua foto.',
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
    try {
      setIsUploading(true);

      let endpoint = '/api/profile/remove-image';
      if (userType === 'doctor') {
        endpoint = '/api/doctor-profile-image';
      } else if (userType === 'partner') {
        endpoint = '/api/partner-profile-image';
      }

      const response = await apiRequest('DELETE', endpoint);

      if (response.ok) {
        setPreviewImage(null);
        onImageUpdate?.(null);
        toast({
          title: 'Foto removida',
          description: 'Sua foto de perfil foi removida.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a foto.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className={cn("relative group", className)}>
        {/* Avatar */}
        <Avatar className={cn(sizeClasses[size], "border-2 border-gray-200 shadow-sm transition-all duration-200 group-hover:shadow-md")}>
          <AvatarImage 
            src={previewImage || undefined} 
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
            {previewImage ? (
              <User className="w-6 h-6" />
            ) : (
              getInitials(userName)
            )}
          </AvatarFallback>
        </Avatar>

        {/* Overlay de hover */}
        <div className={cn(
          "absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center",
          isUploading && "opacity-100"
        )}>
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center text-white"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Badge de câmera */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md",
            "border border-gray-200 hover:border-blue-500",
            "transform transition-all duration-200 hover:scale-110",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Camera className="w-3 h-3 text-gray-600" />
        </button>

        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Cropper Modal */}
      {showCropper && selectedFile && (
        <ImageCropper
          image={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
          aspectRatio={1}
          circularCrop={true}
          isOpen={showCropper}
        />
      )}
    </>
  );
}