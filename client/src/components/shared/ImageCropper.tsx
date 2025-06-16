import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';

interface ImageCropperProps {
  image?: File;
  imageUrl?: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  circularCrop?: boolean;
  isOpen?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropper({
  image,
  imageUrl: externalImageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  circularCrop = false,
  isOpen = true
}: ImageCropperProps) {
  console.log('[ImageCropper] Render called with props:', {
    hasImage: !!image,
    hasExternalImageUrl: !!externalImageUrl,
    isOpen,
    imageName: image?.name
  });

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageUrl, setImageUrl] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('[ImageCropper] Component mounted/updated:', {
      hasImage: !!image,
      hasExternalImageUrl: !!externalImageUrl,
      isOpen,
      imageName: image?.name,
      imageUrl
    });
  }, [isOpen, image, externalImageUrl, imageUrl]);

  // Converter arquivo para URL ou usar URL externa
  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (externalImageUrl) {
      setImageUrl(externalImageUrl);
    }
  }, [image, externalImageUrl]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }

  const generateCrop = () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    setIsLoading(true);

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsLoading(false);
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
      setIsLoading(false);
    }, 'image/jpeg', 0.95);
  };

  // Add explicit debug rendering
  if (!isOpen) {
    console.log('[ImageCropper] Not rendering - isOpen is false');
    return null;
  }

  if (!imageUrl) {
    console.log('[ImageCropper] Not rendering - no imageUrl');
    return null;
  }

  console.log('[ImageCropper] Rendering dialog with imageUrl:', imageUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden z-[9999]" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="space-y-4 overflow-auto max-h-[calc(90vh-8rem)]">
          <div className="max-h-[60vh] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={circularCrop}
              keepSelection
            >
              <img
                ref={imgRef}
                alt="Imagem para recorte"
                src={imageUrl}
                onLoad={onImageLoad}
                className="max-w-full max-h-[50vh] object-contain"
              />
            </ReactCrop>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={generateCrop}
              disabled={!completedCrop || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Aplicar Recorte'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}