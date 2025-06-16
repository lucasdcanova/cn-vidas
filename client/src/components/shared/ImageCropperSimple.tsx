import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';

interface ImageCropperSimpleProps {
  image?: File;
  imageUrl?: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  isOpen?: boolean;
}

export default function ImageCropperSimple({
  image,
  imageUrl: externalImageUrl,
  onCropComplete,
  onCancel,
  isOpen = true
}: ImageCropperSimpleProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Convert file to URL or use external URL
  useEffect(() => {
    console.log('[ImageCropperSimple] Setting up image URL', { hasImage: !!image, hasExternalUrl: !!externalImageUrl });
    
    if (image) {
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      console.log('[ImageCropperSimple] Created object URL:', url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (externalImageUrl) {
      setImageUrl(externalImageUrl);
      console.log('[ImageCropperSimple] Using external URL:', externalImageUrl);
    }
  }, [image, externalImageUrl]);

  const handleApply = () => {
    console.log('[ImageCropperSimple] Apply button clicked');
    setIsLoading(true);
    
    // For testing, just return the original image as a blob
    if (image) {
      image.arrayBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: image.type });
        console.log('[ImageCropperSimple] Created blob:', blob);
        onCropComplete(blob);
        setIsLoading(false);
      });
    }
  };

  console.log('[ImageCropperSimple] Render check:', { isOpen, hasImageUrl: !!imageUrl });

  if (!isOpen) {
    console.log('[ImageCropperSimple] Not rendering - isOpen is false');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('[ImageCropperSimple] Dialog open change:', open);
      if (!open) onCancel();
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Simple Image Cropper Test</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 p-4">
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm">Debug Info:</p>
            <ul className="text-xs space-y-1 mt-2">
              <li>Is Open: {String(isOpen)}</li>
              <li>Has Image: {String(!!image)}</li>
              <li>Image URL: {imageUrl ? 'Yes' : 'No'}</li>
              <li>Image Name: {image?.name || 'N/A'}</li>
            </ul>
          </div>

          {imageUrl && (
            <div className="max-h-[400px] overflow-auto border rounded">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="max-w-full"
                onError={(e) => console.error('[ImageCropperSimple] Image load error:', e)}
                onLoad={() => console.log('[ImageCropperSimple] Image loaded successfully')}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Apply (No Crop)'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}