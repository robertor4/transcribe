'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { User as FirebaseUser } from 'firebase/auth';
import { Camera, Upload, Trash2, Loader2, ChevronDown, X } from 'lucide-react';
import { Button } from './Button';
import { PhotoCropperModal } from './PhotoCropperModal';

interface ProfilePhotoUploaderProps {
  currentPhotoURL?: string;
  displayName?: string;
  email?: string;
  authUser: FirebaseUser | null;
  onPhotoChange: (photoURL: string) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete: () => Promise<void>;
}

export function ProfilePhotoUploader({
  currentPhotoURL,
  displayName,
  email,
  authUser,
  onPhotoChange,
  onUpload,
  onDelete,
}: ProfilePhotoUploaderProps) {
  const t = useTranslations('settings.profilePage');
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user has Google provider
  const googleProvider = authUser?.providerData?.find(
    (provider) => provider?.providerId === 'google.com'
  );
  const hasGooglePhoto = !!googleProvider?.photoURL;

  // Get initials for fallback avatar
  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleUseGooglePhoto = async () => {
    if (!googleProvider?.photoURL) return;

    setError(null);
    setIsOpen(false);

    // Simply update the profile with Google's photo URL
    onPhotoChange(googleProvider.photoURL);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError(t('photoTypeError'));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('photoSizeError'));
      return;
    }

    setError(null);
    setIsOpen(false);

    // Open cropper modal instead of uploading directly
    setSelectedFile(file);
    setShowCropper(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCroppedImage = async (croppedFile: File) => {
    setShowCropper(false);
    setSelectedFile(null);
    setIsUploading(true);

    try {
      await onUpload(croppedFile);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError(t('photoUploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropperClose = () => {
    setShowCropper(false);
    setSelectedFile(null);
  };

  const handleRemovePhoto = async () => {
    setError(null);
    setIsUploading(true);
    setIsOpen(false);

    try {
      await onDelete();
    } catch (err) {
      console.error('Error removing photo:', err);
      setError(t('photoUploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          {currentPhotoURL ? (
            <img
              src={currentPhotoURL}
              alt="Profile"
              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#cc3399] flex items-center justify-center text-white text-lg font-semibold">
              {getInitials()}
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Change Photo Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isUploading}
            icon={<Camera className="h-4 w-4" />}
          >
            {t('changePhoto')}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              {/* Menu */}
              <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                {/* Use Google Photo Option */}
                {hasGooglePhoto && (
                  <button
                    onClick={handleUseGooglePhoto}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                      <img
                        src={googleProvider.photoURL}
                        alt="Google"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span>{t('useGooglePhoto')}</span>
                  </button>
                )}

                {/* Upload Photo Option */}
                <button
                  onClick={handleUploadClick}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span>{t('uploadPhoto')}</span>
                </button>

                {/* Remove Photo Option - only show if there's a current photo */}
                {currentPhotoURL && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                    <button
                      onClick={handleRemovePhoto}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                      </div>
                      <span>{t('removePhoto')}</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <X className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Photo cropper modal */}
      {selectedFile && (
        <PhotoCropperModal
          isOpen={showCropper}
          imageFile={selectedFile}
          onClose={handleCropperClose}
          onSave={handleCroppedImage}
        />
      )}
    </div>
  );
}
