import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ImageCropper from '@/components/shared/ImageCropper';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

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
    sm: 'w-20 h-20',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
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

    try {
      const formData = new FormData();
      formData.append('profileImage', croppedImageBlob, 'profile.jpg');

      let endpoint = '/api/profile/upload-image';
      if (userType === 'doctor') {
        endpoint = '/api/doctor-profile-image';
      } else if (userType === 'partner') {
        endpoint = '/api/partner-profile-image';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Falha no upload');

      const result = await response.json();
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
        <Avatar className={cn(sizeClasses[size], "border-4 border-white shadow-xl transition-all duration-300 group-hover:shadow-2xl")}>
          <AvatarImage 
            src={previewImage || undefined} 
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-semibold">
            {previewImage ? (
              <User className="w-12 h-12" />
            ) : (
              getInitials(userName)
            )}
          </AvatarFallback>
        </Avatar>

        {/* Overlay de hover */}
        <div className={cn(
          "absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center",
          isUploading && "opacity-100"
        )}>
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-xs mt-2">Enviando...</span>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center text-white"
            >
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-medium">Alterar</span>
            </button>
          )}
        </div>

        {/* Badge de câmera */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute bottom-0 right-0 bg-white rounded-full p-3 shadow-lg",
            "border-2 border-gray-100 hover:border-blue-500",
            "transform transition-all duration-300 hover:scale-110",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Camera className="w-5 h-5 text-gray-700" />
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