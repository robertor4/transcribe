'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useUsage } from '@/contexts/UsageContext';
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
  Zap,
  GripVertical,
  Loader2
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import {
  SUPPORTED_AUDIO_FORMATS,
  MAX_FILE_SIZE,
  formatFileSize,
  isValidAudioFile
} from '@transcribe/shared';
import { QuotaExceededModal } from '@/components/paywall/QuotaExceededModal';
import axios from 'axios';

interface FileUploaderProps {
  onUploadComplete?: (transcriptionId: string, fileName?: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const t = useTranslations('upload');
  const { trackEvent } = useAnalytics();
  const { usageStats } = useUsage();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [context, setContext] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [processingMode, setProcessingMode] = useState<'individual' | 'merged'>('individual');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [quotaModal, setQuotaModal] = useState<{
    isOpen: boolean;
    quotaType: 'on_demand_analyses' | 'transcriptions' | 'duration' | 'filesize' | 'payg_credits';
    details?: { current?: number; limit?: number; required?: number };
  }>({ isOpen: false, quotaType: 'transcriptions' });

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

  const moveFile = (fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Move the file while dragging for visual feedback
    moveFile(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      // Use batch upload API for multiple files
      if (files.length > 1) {
        const mergeFiles = processingMode === 'merged';

        // Track batch transcription start
        trackEvent('batch_transcription_started', {
          file_count: files.length,
          merge_files: mergeFiles,
          has_context: !!context
        });

        const response = await transcriptionApi.uploadBatch(files, mergeFiles, undefined, context);

        if (response?.success && response.data && onUploadComplete) {
          const { transcriptionIds, fileNames, merged } = response.data;

          // Call onUploadComplete for each transcription with delays to prevent race conditions
          // This ensures UI state updates happen sequentially rather than all at once
          for (let i = 0; i < transcriptionIds.length; i++) {
            if (i > 0) {
              // Add 150ms delay between callbacks (except for first one)
              await new Promise(resolve => setTimeout(resolve, 150));
            }
            onUploadComplete(transcriptionIds[i], fileNames[i]);
          }

          // Track successful upload
          trackEvent('batch_transcription_completed', {
            transcription_count: transcriptionIds.length,
            merged: merged,
            file_count: files.length
          });
        }
      } else {
        // Single file - use existing upload method
        const file = files[0];

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
      setProcessingMode('individual');
    } catch (error) {
      // Check if this is a quota exceeded error (HTTP 402)
      if (axios.isAxiosError(error) && error.response?.status === 402) {
        const errorCode = error.response?.data?.errorCode;
        const errorDetails = error.response?.data?.details;

        // Map error code to quota type
        let quotaType: 'on_demand_analyses' | 'transcriptions' | 'duration' | 'filesize' | 'payg_credits' = 'transcriptions';

        if (errorCode === 'QUOTA_EXCEEDED_TRANSCRIPTIONS') {
          quotaType = 'transcriptions';
        } else if (errorCode === 'QUOTA_EXCEEDED_DURATION') {
          quotaType = 'duration';
        } else if (errorCode === 'QUOTA_EXCEEDED_FILESIZE') {
          quotaType = 'filesize';
        } else if (errorCode === 'QUOTA_EXCEEDED_PAYG_CREDITS') {
          quotaType = 'payg_credits';
        } else if (errorCode === 'QUOTA_EXCEEDED_ON_DEMAND_ANALYSES') {
          quotaType = 'on_demand_analyses';
        }

        // Show quota exceeded modal
        setQuotaModal({
          isOpen: true,
          quotaType,
          details: errorDetails,
        });

        // Track upload failure with quota info
        trackEvent('upload_failed', {
          error_message: `Quota exceeded: ${quotaType}`,
          file_count: files.length,
          processing_mode: processingMode
        });
      } else {
        // Show generic error for other errors
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setErrors([errorMessage]);

        // Track upload failure
        trackEvent('upload_failed', {
          error_message: errorMessage,
          file_count: files.length,
          processing_mode: processingMode
        });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{t('uploadErrors')}</h3>
              <ul className="mt-1 text-sm text-red-700 dark:text-red-400 list-disc list-inside">
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
                ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20 scale-[1.02] shadow-xl'
                : 'border-gray-300 dark:border-gray-600 hover:border-[#cc3399] bg-white dark:bg-gray-800 hover:bg-pink-50/20 dark:hover:bg-pink-900/10 hover:shadow-lg hover:scale-[1.01]'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex justify-center mb-4">
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-full shadow-md">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[#cc3399]" />
              </div>
            </div>
            {isDragActive ? (
              <>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#cc3399] mb-2">{t('releaseToUpload')}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('transcriptionStartsImmediately')}</p>
              </>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t('dropAudioHere')}
                </p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                  {t('orClickToBrowse')}
                </p>
                <button className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-[#cc3399] text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-[#b82d89] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2">
                  {t('selectAudioFile')}
                </button>
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('selectedFiles')} ({files.length})
              </h3>
              {files.length > 1 && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('dragToReorder') || 'Drag to reorder'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  draggable={files.length > 1}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center justify-between bg-white dark:bg-gray-700 border rounded-lg p-3 transition-all
                    ${draggedIndex === index
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-[#cc3399]'
                    }
                    ${files.length > 1 ? 'cursor-move' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {files.length > 1 && (
                      <div className="flex flex-col">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileAudio className="h-5 w-5 text-[#cc3399] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          {files.length > 1 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#cc3399] text-white text-xs font-semibold flex-shrink-0">
                              {index + 1}
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center ml-3">
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      title={t('removeFile') || 'Remove file'}
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
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
                  ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-[#cc3399] bg-white dark:bg-gray-700 hover:bg-pink-50/20 dark:hover:bg-pink-900/10'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5 text-[#cc3399]" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dropMoreFiles') || 'Add more files'}
                </p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('orClickToAddMore') || 'or click to browse'}
                </span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('maxFilesSelected') || 'Maximum files selected (3)'}
                </p>
              </div>
            </div>
          )}

          {/* Processing Mode Toggle - Only shown when multiple files */}
          {files.length > 1 && (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('processingMode')}
              </label>
              {processingMode === 'merged' && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      {t('mergeOrderMatters') || 'Files will be merged in the order shown above. Drag to reorder them chronologically.'}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProcessingMode('individual')}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
                    ${processingMode === 'individual'
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#cc3399] hover:bg-pink-50/20 dark:hover:bg-pink-900/10'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <FileAudio className={`h-5 w-5 ${processingMode === 'individual' ? 'text-[#cc3399]' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t('processIndividually')}</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{t('processIndividuallyDesc')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProcessingMode('merged')}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
                    ${processingMode === 'merged'
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#cc3399] hover:bg-pink-50/20 dark:hover:bg-pink-900/10'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Upload className={`h-5 w-5 ${processingMode === 'merged' ? 'text-[#cc3399]' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t('processMerged')}</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{t('processMergedDesc')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Context Input - Simplified */}
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {files.length > 1
                ? (processingMode === 'merged' ? t('contextForMerged') : t('contextForAll'))
                : t('addContext')}
            </label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t('contextPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#cc3399] focus:border-[#cc3399] text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm bg-white dark:bg-gray-700 transition-all duration-200 hover:border-[#cc3399]"
              rows={3}
            />
          </div>

          {/* Upload Button - Full width */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center
              ${uploading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-[#cc3399] text-white hover:bg-[#b82d89]'
              }
            `}
          >
            {uploading && (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            )}
            {uploading
              ? (files.length > 1 && processingMode === 'merged'
                  ? t('mergingFiles', { count: files.length })
                  : t('uploading'))
              : t('uploadFiles', { count: files.length })}
          </button>
        </div>
      )}

      {/* Secondary Information - Collapsed by Default */}
      <details className="group">
        <summary className="cursor-pointer flex items-center justify-between py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            {t('howItWorksAndTips')}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform" />
        </summary>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Features */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">{t('features')}</h4>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">{t('security')}</h4>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">{t('proTips')}</h4>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>• {t('recordQuietEnvironment')}</li>
              <li>• {t('speakClearlyNormalPace')}</li>
              <li>• {t('addContextForTechnicalTerms')}</li>
              <li>• {t('uploadMultipleFilesAtOnce')}</li>
            </ul>
          </div>
        </div>
      </details>

      {/* Quota Exceeded Modal */}
      <QuotaExceededModal
        isOpen={quotaModal.isOpen}
        onClose={() => setQuotaModal({ ...quotaModal, isOpen: false })}
        quotaType={quotaModal.quotaType}
        currentTier={(usageStats?.tier as 'free' | 'professional' | 'payg') || 'free'}
        details={quotaModal.details}
      />
    </div>
  );
};