'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Upload, Mic, Monitor, X, FileAudio, GripVertical, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { SimpleAudioRecorder } from './SimpleAudioRecorder';
import type { RecordingSource } from '@/hooks/useMediaRecorder';

interface UploadInterfaceProps {
  onFileUpload: (files: File[], processingMode: 'individual' | 'merged') => void;
  /**
   * Called when recording is confirmed.
   * @param blob - The recorded audio blob
   * @param markAsUploaded - Call after successful upload to clean up IndexedDB backup
   */
  onRecordingComplete: (blob: Blob, markAsUploaded: () => Promise<void>) => void;
  onBack: () => void;
  initialMethod?: 'file' | 'record' | 'record-microphone' | 'record-tab-audio' | null;
  onRecordingStateChange?: (isRecording: boolean) => void; // Notify parent of recording status
}

type InputMethod = 'upload' | 'record-microphone' | 'record-tab-audio';

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
    if (initialMethod === 'record-microphone') return 'record-microphone';
    if (initialMethod === 'record-tab-audio') return 'record-tab-audio';
    if (initialMethod === 'record') return 'record-microphone'; // Legacy fallback
    if (initialMethod === 'file') return 'upload';
    return null;
  });

  // Compute initialSource to pass to SimpleAudioRecorder
  const initialRecordingSource: RecordingSource | null = useMemo(() => {
    if (selectedMethod === 'record-microphone') return 'microphone';
    if (selectedMethod === 'record-tab-audio') return 'tab-audio';
    return null;
  }, [selectedMethod]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingMode, setProcessingMode] = useState<'individual' | 'merged'>('individual');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const t = useTranslations('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup: notify parent on unmount that recording is no longer active
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

  // Show recording interface when a recording method is selected
  if (selectedMethod === 'record-microphone' || selectedMethod === 'record-tab-audio') {
    return (
      <SimpleAudioRecorder
        onComplete={handleRecordingComplete}
        onCancel={handleRecordingCancel}
        onRecordingStateChange={onRecordingStateChange}
        initialSource={initialRecordingSource}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Method Selection (if no method selected yet) */}
      {!selectedMethod && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Record the room (microphone) */}
            <button
              onClick={() => setSelectedMethod('record-microphone')}
              className="group relative flex items-center gap-4 p-5 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0 group-hover:from-[#8D6AFA] group-hover:to-[#7A5AE0] dark:group-hover:from-[#8D6AFA] dark:group-hover:to-[#7A5AE0] group-hover:scale-105 transition-all duration-200">
                <Mic className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-200">
                  {t('recordRoom')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('recordRoomDesc')}
                </div>
              </div>
            </button>

            {/* Record browser tab */}
            <button
              onClick={() => setSelectedMethod('record-tab-audio')}
              className="group relative flex items-center gap-4 p-5 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0 group-hover:from-[#8D6AFA] group-hover:to-[#7A5AE0] dark:group-hover:from-[#8D6AFA] dark:group-hover:to-[#7A5AE0] group-hover:scale-105 transition-all duration-200">
                <Monitor className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-200">
                  {t('recordTab')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('recordTabDesc')}
                </div>
              </div>
            </button>

            {/* Upload file */}
            <button
              onClick={() => setSelectedMethod('upload')}
              className="group relative flex items-center gap-4 p-5 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0 group-hover:from-[#8D6AFA] group-hover:to-[#7A5AE0] dark:group-hover:from-[#8D6AFA] dark:group-hover:to-[#7A5AE0] group-hover:scale-105 transition-all duration-200">
                <Upload className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-200">
                  {t('uploadFileLabel')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('uploadFileDesc')}
                </div>
              </div>
            </button>
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
                ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/10 scale-105'
                : 'border-gray-300 dark:border-gray-700 hover:border-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Upload className="w-16 h-16 mx-auto mb-6 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
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
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
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
                      ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-[#8D6AFA]'
                  } ${selectedFiles.length > 1 ? 'cursor-move' : ''}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {selectedFiles.length > 1 && (
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    )}
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileAudio className="h-5 w-5 text-[#8D6AFA] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          {selectedFiles.length > 1 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#8D6AFA] text-white text-xs font-semibold flex-shrink-0">
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
                  ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-[#8D6AFA] bg-white dark:bg-gray-700 hover:bg-purple-50/20 dark:hover:bg-purple-900/10'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5 text-[#8D6AFA]" />
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
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border-2 border-[#8D6AFA]/30 dark:border-[#8D6AFA]/50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-[#8D6AFA] mt-0.5 flex-shrink-0" />
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
                      ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#8D6AFA] hover:bg-purple-50/20 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <FileAudio
                      className={`h-5 w-5 ${
                        processingMode === 'individual'
                          ? 'text-[#8D6AFA]'
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
                      ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#8D6AFA] hover:bg-purple-50/20 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Upload
                      className={`h-5 w-5 ${
                        processingMode === 'merged'
                          ? 'text-[#8D6AFA]'
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
