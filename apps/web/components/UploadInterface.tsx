'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Mic, X, FileAudio, GripVertical, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { SimpleAudioRecorder } from './SimpleAudioRecorder';

interface UploadInterfaceProps {
  onFileUpload: (files: File[], processingMode: 'individual' | 'merged') => void;
  /**
   * Called when recording is confirmed.
   * @param blob - The recorded audio blob
   * @param markAsUploaded - Call after successful upload to clean up IndexedDB backup
   */
  onRecordingComplete: (blob: Blob, markAsUploaded: () => Promise<void>) => void;
  onBack: () => void;
  initialMethod?: 'file' | 'record' | null;
  onRecordingStateChange?: (isRecording: boolean) => void; // Notify parent of recording status
}

type InputMethod = 'upload' | 'record';

/**
 * Upload interface with two input methods:
 * 1. File upload (drag-and-drop or click)
 * 2. Record audio (live recording via SimpleAudioRecorder)
 */
export function UploadInterface({
  onFileUpload,
  onRecordingComplete,
  onBack,
  initialMethod,
  onRecordingStateChange,
}: UploadInterfaceProps) {
  // Initialize selectedMethod based on initialMethod prop
  const [selectedMethod, setSelectedMethod] = useState<InputMethod | null>(() => {
    if (initialMethod === 'record') return 'record';
    if (initialMethod === 'file') return 'upload';
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingMode, setProcessingMode] = useState<'individual' | 'merged'>('individual');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<'record' | 'upload' | null>(null);

  const t = useTranslations('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent when recording mode is active/inactive
  useEffect(() => {
    if (selectedMethod === 'record') {
      onRecordingStateChange?.(true);
    } else {
      onRecordingStateChange?.(false);
    }
  }, [selectedMethod, onRecordingStateChange]);

  // Cleanup: notify parent on unmount
  useEffect(() => {
    return () => {
      onRecordingStateChange?.(false);
    };
  }, [onRecordingStateChange]);

  // File upload handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);

      // Check maximum files limit (3)
      if (selectedFiles.length >= 3) {
        alert('Maximum 3 files allowed');
        return;
      }

      // Filter valid audio/video files and check for duplicates
      const validFiles = droppedFiles.filter((file) => {
        const isValidType =
          file.type.startsWith('audio/') || file.type.startsWith('video/');
        const isDuplicate = selectedFiles.some(
          (existing) => existing.name === file.name
        );

        if (!isValidType) {
          alert(`${file.name}: Unsupported file type`);
          return false;
        }
        if (isDuplicate) {
          alert(`${file.name}: File already selected`);
          return false;
        }
        return true;
      });

      // Only add files if we won't exceed limit
      const filesToAdd = validFiles.slice(0, 3 - selectedFiles.length);
      if (validFiles.length > filesToAdd.length) {
        alert('Only 3 files can be uploaded at once');
      }

      setSelectedFiles((prev) => [...prev, ...filesToAdd]);
    },
    [selectedFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Check maximum files limit (3)
      if (selectedFiles.length >= 3) {
        alert('Maximum 3 files allowed');
        return;
      }

      const newFiles = Array.from(files);

      // Filter valid files and check for duplicates
      const validFiles = newFiles.filter((file) => {
        const isValidType =
          file.type.startsWith('audio/') || file.type.startsWith('video/');
        const isDuplicate = selectedFiles.some(
          (existing) => existing.name === file.name
        );

        if (!isValidType) {
          alert(`${file.name}: Unsupported file type`);
          return false;
        }
        if (isDuplicate) {
          alert(`${file.name}: File already selected`);
          return false;
        }
        return true;
      });

      // Only add files if we won't exceed limit
      const filesToAdd = validFiles.slice(0, 3 - selectedFiles.length);
      if (validFiles.length > filesToAdd.length) {
        alert('Only 3 files can be uploaded at once');
      }

      setSelectedFiles((prev) => [...prev, ...filesToAdd]);
    },
    [selectedFiles]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleFileItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Move file while dragging for visual feedback
    moveFile(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleConfirmUpload = () => {
    if (selectedFiles.length > 0) {
      onFileUpload(selectedFiles, processingMode);
    }
  };

  // Recording handlers - delegated to SimpleAudioRecorder
  const handleRecordingComplete = (blob: Blob, markAsUploaded: () => Promise<void>) => {
    onRecordingComplete(blob, markAsUploaded);
  };

  const handleRecordingCancel = () => {
    setSelectedMethod(null); // Go back to method selection
  };

  // Show recording interface when record method is selected
  if (selectedMethod === 'record') {
    return (
      <SimpleAudioRecorder
        onComplete={handleRecordingComplete}
        onCancel={handleRecordingCancel}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Method Selection (if no method selected yet) */}
      {!selectedMethod && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto items-start">
            {/* Record Audio (now first) */}
            <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg transition-all duration-200 overflow-hidden">
              <button
                onClick={() => setSelectedMethod('record')}
                className="group w-full p-8"
              >
                <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#cc3399] group-hover:scale-110 transition-all duration-200">
                  <Mic className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#cc3399]">
                  {t('recordAudio')}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  {t('recordAudioDesc')}
                </p>
              </button>

              {/* Learn more toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedInfo(expandedInfo === 'record' ? null : 'record');
                }}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mx-auto pb-4"
              >
                <Info className="w-4 h-4" />
                <span>{t('learnMore')}</span>
                {expandedInfo === 'record' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Expandable content */}
              {expandedInfo === 'record' && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                  {t('recordAudioInfo')}
                </div>
              )}
            </div>

            {/* Upload File (now second) */}
            <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg transition-all duration-200 overflow-hidden">
              <button
                onClick={() => setSelectedMethod('upload')}
                className="group w-full p-8"
              >
                <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#cc3399] group-hover:scale-110 transition-all duration-200">
                  <Upload className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#cc3399]">
                  {t('importAudio')}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  {t('importAudioDesc')}
                </p>
              </button>

              {/* Learn more toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedInfo(expandedInfo === 'upload' ? null : 'upload');
                }}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mx-auto pb-4"
              >
                <Info className="w-4 h-4" />
                <span>{t('learnMore')}</span>
                {expandedInfo === 'upload' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Expandable content */}
              {expandedInfo === 'upload' && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                  {t('importAudioInfo')}
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-start">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
          </div>
        </>
      )}

      {/* Upload File Interface */}
      {selectedMethod === 'upload' && selectedFiles.length === 0 && (
        <div className="space-y-6">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleUploadClick}
            className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/10 scale-105'
                : 'border-gray-300 dark:border-gray-700 hover:border-[#cc3399] hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Upload className="w-16 h-16 mx-auto mb-6 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {isDragging ? 'Drop your files here' : 'Drop your files here'}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400 mb-4">
              or click to browse (up to 3 files)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Supports: MP3, M4A, WAV, MP4, MOV, WebM (Max 5GB per file)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
          </div>

          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => setSelectedMethod(null)}>
              ← Change method
            </Button>
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedMethod === 'upload' && selectedFiles.length > 0 && (
        <div className="space-y-6">
          {/* File list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected files ({selectedFiles.length})
              </h3>
              {selectedFiles.length > 1 && (
                <p className="text-xs text-gray-700 dark:text-gray-400">
                  Drag to reorder
                </p>
              )}
            </div>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  draggable={selectedFiles.length > 1}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleFileItemDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between bg-white dark:bg-gray-700 border-2 rounded-lg p-3 transition-all ${
                    draggedIndex === index
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-[#cc3399]'
                  } ${selectedFiles.length > 1 ? 'cursor-move' : ''}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {selectedFiles.length > 1 && (
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    )}
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileAudio className="h-5 w-5 text-[#cc3399] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          {selectedFiles.length > 1 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#cc3399] text-white text-xs font-semibold flex-shrink-0">
                              {index + 1}
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {file.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-3 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    title="Remove file"
                    type="button"
                  >
                    <X className="h-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Compact dropzone for adding more files */}
          {selectedFiles.length < 3 && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-[#cc3399] bg-white dark:bg-gray-700 hover:bg-pink-50/20 dark:hover:bg-pink-900/10'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5 text-[#cc3399]" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add more files
                </p>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  or click to browse
                </span>
              </div>
            </div>
          )}

          {/* Processing Mode Toggle - Only shown when multiple files */}
          {selectedFiles.length > 1 && (
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Processing mode
              </label>
              {processingMode === 'merged' && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399]/30 dark:border-[#cc3399]/50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-[#cc3399] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-800 dark:text-gray-300">
                      Files will be merged in the order shown above. Drag to
                      reorder them chronologically.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProcessingMode('individual')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    processingMode === 'individual'
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#cc3399] hover:bg-pink-50/20 dark:hover:bg-pink-900/10'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <FileAudio
                      className={`h-5 w-5 ${
                        processingMode === 'individual'
                          ? 'text-[#cc3399]'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Individual
                    </span>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-400 text-center">
                    Process as separate conversations
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProcessingMode('merged')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    processingMode === 'merged'
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#cc3399] hover:bg-pink-50/20 dark:hover:bg-pink-900/10'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Upload
                      className={`h-5 w-5 ${
                        processingMode === 'merged'
                          ? 'text-[#cc3399]'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Merged
                    </span>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-400 text-center">
                    Merge into one conversation
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedFiles([]);
                setProcessingMode('individual');
              }}
            >
              Clear all
            </Button>
            <Button variant="brand" onClick={handleConfirmUpload}>
              Upload & Process ({selectedFiles.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
