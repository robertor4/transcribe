'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cropImage, createImageUrl } from '@/lib/cropImage';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface PhotoCropperModalProps {
  isOpen: boolean;
  imageFile: File;
  onClose: () => void;
  onSave: (croppedFile: File) => void;
}

export function PhotoCropperModal({
  isOpen,
  imageFile,
  onClose,
  onSave,
}: PhotoCropperModalProps) {
  const t = useTranslations('settings.profilePage');

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const imageUrlRef = useRef<string>('');

  // Load image URL when file changes
  useEffect(() => {
    if (imageFile) {
      createImageUrl(imageFile).then((url) => {
        setImageUrl(url);
        imageUrlRef.current = url;
      });
    }
    return () => {
      // Clean up blob URL on unmount
      if (imageUrlRef.current && imageUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, [imageFile]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageUrl) return;

    setIsSaving(true);
    try {
      const croppedFile = await cropImage(imageUrl, croppedAreaPixels);
      onSave(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="bg-white dark:bg-gray-800 rounded-xl max-w-md p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            {t('cropPhoto')}
          </DialogTitle>
        </div>

        {/* Cropper */}
        <div className="px-4 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
            {t('cropPhotoDescription')}
          </p>

          <div className="relative h-64 sm:h-80 bg-gray-900 rounded-lg overflow-hidden">
            {imageUrl && (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
              {t('zoom')}
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#8D6AFA]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
          >
            {t('cancelCrop')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !croppedAreaPixels}
            icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isSaving ? t('processingImage') : t('saveCrop')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
