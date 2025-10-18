'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { 
  Upload, 
  X, 
  FileAudio, 
  AlertCircle, 
  Shield, 
  CheckCircle,
  Info,
  ChevronDown,
  Lock,
  Zap
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import { 
  SUPPORTED_AUDIO_FORMATS, 
  MAX_FILE_SIZE,
  formatFileSize,
  isValidAudioFile
} from '@transcribe/shared';

interface FileUploaderProps {
  onUploadComplete?: (transcriptionId: string, fileName?: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const t = useTranslations('upload');
  const { trackEvent } = useAnalytics();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [context, setContext] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Clear previous errors
    setErrors([]);
    
    // Check for maximum files limit (3)
    const currentFileCount = files.length;
    if (currentFileCount >= 3) {
      setErrors([t('error.maxFilesReached') || 'Maximum 3 files allowed']);
      return;
    }
    
    const newErrors: string[] = [];
    const validFiles = acceptedFiles.filter(file => {
      // Track file drop attempt
      trackEvent('audio_uploaded', {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        method: 'drop'
      });
      
      // Check for duplicate file names
      const isDuplicate = files.some(existingFile => existingFile.name === file.name);
      if (isDuplicate) {
        newErrors.push(`${file.name}: ${t('error.duplicateFile') || 'This file has already been selected'}`);
        return false;
      }
      
      if (!isValidAudioFile(file.name, file.type)) {
        newErrors.push(`${file.name}: ${t('error.unsupportedFormat', { type: file.type })}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`${file.name}: ${t('error.fileTooLarge')}`);
        return false;
      }
      return true;
    });

    // Only add files if we won't exceed the limit
    const filesToAdd = validFiles.slice(0, 3 - currentFileCount);
    if (validFiles.length > filesToAdd.length) {
      newErrors.push(t('error.tooManyFiles', { max: 3 }) || 'Only 3 files can be uploaded at once');
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
    }
    
    setFiles(prev => [...prev, ...filesToAdd]);
    
    if (rejectedFiles.length > 0) {
      const rejectedErrors: string[] = [];
      rejectedFiles.forEach(rejection => {
        const file = rejection.file;
        const error = rejection.errors[0];
        let errorMessage = '';
        
        if (error.code === 'file-too-large') {
          errorMessage = `${file.name}: ${t('error.fileTooLargeWhisper')}`;
        } else if (error.code === 'file-invalid-type') {
          errorMessage = `${file.name}: ${t('error.invalidFileType', { formats: SUPPORTED_AUDIO_FORMATS.join(', ') })}`;
        } else {
          errorMessage = `${file.name}: ${error.message}`;
        }
        
        rejectedErrors.push(errorMessage);
      });
      setErrors(prev => [...prev, ...rejectedErrors]);
    }
  }, [files, t, trackEvent]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': SUPPORTED_AUDIO_FORMATS,
      'video/mp4': ['.mp4'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      for (const file of files) {
        // Track transcription start
        trackEvent('transcription_started', {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          has_context: !!context
        });
        
        const response = await transcriptionApi.upload(file, undefined, context);
        if (response?.success && response.data && onUploadComplete) {
          onUploadComplete(response.data.transcriptionId, file.name);
          
          // Track successful upload
          trackEvent('transcription_completed', {
            transcription_id: response.data?.transcriptionId,
            file_name: file.name,
            file_size: file.size
          });
        }
      }
      
      setFiles([]);
      setContext('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setErrors([errorMessage]);
      
      // Track upload failure
      trackEvent('upload_failed', {
        error_message: errorMessage,
        file_count: files.length
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">{t('uploadErrors')}</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* When no files selected - show full width dropzone */}
      {files.length === 0 ? (
        <div className="space-y-4">
          {/* Main Dropzone - Primary Focus */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-2xl p-6 sm:p-8 md:p-12 text-center cursor-pointer
              transition-all duration-200 transform
              ${isDragActive 
                ? 'border-[#cc3399] bg-pink-50 scale-[1.02] shadow-xl' 
                : 'border-gray-300 hover:border-[#cc3399] bg-white hover:bg-pink-50/20 hover:shadow-lg hover:scale-[1.01]'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex justify-center mb-4">
              <div className="p-3 sm:p-4 bg-white rounded-full shadow-md">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[#cc3399]" />
              </div>
            </div>
            {isDragActive ? (
              <>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#cc3399] mb-2">{t('releaseToUpload')}</p>
                <p className="text-xs sm:text-sm text-gray-600">{t('transcriptionStartsImmediately')}</p>
              </>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  {t('dropAudioHere')}
                </p>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  {t('orClickToBrowse')}
                </p>
                <button className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-[#cc3399] text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-[#b82d89] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2">
                  {t('selectAudioFile')}
                </button>
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span>{t('instantProcessing')}</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-[#cc3399] mr-1" />
                    <span>{t('secure')}</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{t('aiPowered')}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Supported Formats - Small, Non-distracting */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {t('supportedFormatsShort', { 
                formats: SUPPORTED_AUDIO_FORMATS.join(', '),
                size: '5GB'
              })}
            </p>
          </div>
        </div>
      ) : (
        /* When files are selected - show single column layout */
        <div className="space-y-4">
          {/* Selected files */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              {t('selectedFiles')} ({files.length})
            </h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-[#cc3399] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileAudio className="h-5 w-5 text-[#cc3399]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                    title="Remove file"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Compact dropzone for adding more files */}
          {files.length < 3 ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                transition-all duration-200
                ${isDragActive 
                  ? 'border-[#cc3399] bg-pink-50' 
                  : 'border-gray-300 hover:border-[#cc3399] bg-white hover:bg-pink-50/20'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5 text-[#cc3399]" />
                <p className="text-sm font-medium text-gray-700">
                  {t('dropMoreFiles') || 'Add more files'}
                </p>
                <span className="text-sm text-gray-500">
                  {t('orClickToAddMore') || 'or click to browse'}
                </span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-gray-600">
                  {t('maxFilesSelected') || 'Maximum files selected (3)'}
                </p>
              </div>
            </div>
          )}

          {/* Context Input - Simplified */}
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
              {t('addContext') || 'Add context (optional)'}
            </label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t('contextPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cc3399] focus:border-[#cc3399] text-gray-800 placeholder:text-gray-500 text-sm bg-white transition-all duration-200 hover:border-[#cc3399]"
              rows={3}
            />
          </div>

          {/* Upload Button - Full width */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-colors
              ${uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#cc3399] text-white hover:bg-[#b82d89]'
              }
            `}
          >
            {uploading ? t('uploading') : t('uploadFiles', { count: files.length })}
          </button>
        </div>
      )}

      {/* Secondary Information - Collapsed by Default */}
      <details className="group">
        <summary className="cursor-pointer flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            {t('howItWorksAndTips')}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 group-open:rotate-180 transition-transform" />
        </summary>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">{t('features')}</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('instantProcessingOnUpload')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('multipleSpeakerDetection')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('languagesSupported')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('accuracyRate')}</span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">{t('security')}</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start">
                <Shield className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('encryption')}</span>
              </div>
              <div className="flex items-start">
                <Lock className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('gdprCompliant')}</span>
              </div>
              <div className="flex items-start">
                <Shield className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('autoDeleteAfterProcessing')}</span>
              </div>
              <div className="flex items-start">
                <Lock className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('noDataSharing')}</span>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">{t('proTips')}</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• {t('recordQuietEnvironment')}</li>
              <li>• {t('speakClearlyNormalPace')}</li>
              <li>• {t('addContextForTechnicalTerms')}</li>
              <li>• {t('uploadMultipleFilesAtOnce')}</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
};