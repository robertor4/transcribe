'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Upload, Mic, Monitor, X, FileAudio, GripVertical, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SimpleAudioRecorder } from './SimpleAudioRecorder';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RecordingSource } from '@/hooks/useMediaRecorder';
import type { ContinueRecordingData } from './ConversationCreateModal';
import type { PreviewActions } from './SimpleAudioRecorder';

export type InputMethod = 'upload' | 'record-microphone' | 'record-tab-audio';

interface UploadInterfaceProps {
  selectedFiles: File[];
  onSelectedFilesChange: (files: File[]) => void;
  processingMode: 'individual' | 'merged';
  onProcessingModeChange: (mode: 'individual' | 'merged') => void;
  selectedMethod: InputMethod | null;
  onMethodChange: (method: InputMethod | null) => void;
  onRecordingComplete: (blob: Blob, markAsUploaded: () => Promise<void>) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onPreviewStateChange?: (isPreviewing: boolean, actions?: PreviewActions) => void;
  continueRecordingData?: ContinueRecordingData | null;
}

/**
 * Upload interface with two input methods:
 * 1. File upload (drag-and-drop or click)
 * 2. Record audio (live recording via SimpleAudioRecorder)
 *
 * This is a controlled component — all state is owned by the parent modal.
 * Footers/action buttons are rendered by the parent modal.
 */
export function UploadInterface({
  selectedFiles,
  onSelectedFilesChange,
  processingMode,
  onProcessingModeChange,
  selectedMethod,
  onMethodChange,
  onRecordingComplete,
  onRecordingStateChange,
  onPreviewStateChange,
  continueRecordingData,
}: UploadInterfaceProps) {
  // Compute initialSource to pass to SimpleAudioRecorder
  const initialRecordingSource: RecordingSource | null = useMemo(() => {
    if (selectedMethod === 'record-microphone') return 'microphone';
    if (selectedMethod === 'record-tab-audio') return 'tab-audio';
    return null;
  }, [selectedMethod]);

  const t = useTranslations('dashboard');
  const tc = useTranslations('conversationCreate');
  const tUpload = useTranslations('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup: notify parent on unmount that recording is no longer active
  useEffect(() => {
    return () => {
      onRecordingStateChange?.(false);
    };
  }, [onRecordingStateChange]);

  // Drag state (local, not lifted — only affects visual feedback)
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // File upload handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingState(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingState(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingState(false);

      const droppedFiles = Array.from(e.dataTransfer.files);

      if (selectedFiles.length >= 3) {
        alert('Maximum 3 files allowed');
        return;
      }

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

      const filesToAdd = validFiles.slice(0, 3 - selectedFiles.length);
      if (validFiles.length > filesToAdd.length) {
        alert('Only 3 files can be uploaded at once');
      }

      onSelectedFilesChange([...selectedFiles, ...filesToAdd]);
    },
    [selectedFiles, onSelectedFilesChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (selectedFiles.length >= 3) {
        alert('Maximum 3 files allowed');
        return;
      }

      const newFiles = Array.from(files);
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

      const filesToAdd = validFiles.slice(0, 3 - selectedFiles.length);
      if (validFiles.length > filesToAdd.length) {
        alert('Only 3 files can be uploaded at once');
      }

      onSelectedFilesChange([...selectedFiles, ...filesToAdd]);
    },
    [selectedFiles, onSelectedFilesChange]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    onSelectedFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...selectedFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    onSelectedFilesChange(newFiles);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleFileItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveFile(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Recording handlers
  const handleRecordingComplete = (blob: Blob, markAsUploaded: () => Promise<void>) => {
    onRecordingComplete(blob, markAsUploaded);
  };

  const handleRecordingCancel = () => {
    onMethodChange(null);
  };

  // Show recording interface when a recording method is selected
  if (selectedMethod === 'record-microphone' || selectedMethod === 'record-tab-audio') {
    return (
      <SimpleAudioRecorder
        onComplete={handleRecordingComplete}
        onCancel={handleRecordingCancel}
        onRecordingStateChange={onRecordingStateChange}
        onPreviewStateChange={onPreviewStateChange}
        initialSource={initialRecordingSource}
        continueRecordingData={continueRecordingData}
      />
    );
  }

  return (
    <div>
      {/* Method Selection */}
      {!selectedMethod && (
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => onMethodChange('record-microphone')}
            className="group relative flex items-center gap-3.5 p-4 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 transition-all duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] transition-all duration-150">
              <Mic className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors duration-150" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-150">
                {t('recordRoom')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('recordRoomDesc')}
              </div>
            </div>
          </button>

          <button
            onClick={() => onMethodChange('record-tab-audio')}
            className="group relative flex items-center gap-3.5 p-4 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 transition-all duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] transition-all duration-150">
              <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors duration-150" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-150">
                {t('recordTab')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('recordTabDesc')}
              </div>
            </div>
          </button>

          <button
            onClick={() => onMethodChange('upload')}
            className="group relative flex items-center gap-3.5 p-4 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 transition-all duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] transition-all duration-150">
              <Upload className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors duration-150" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-150">
                {t('uploadFileLabel')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('uploadFileDesc')}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Upload File Interface — Dropzone */}
      {selectedMethod === 'upload' && selectedFiles.length === 0 && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          className={`group relative rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
            isDraggingState
              ? 'border-2 border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/10 scale-[1.02] shadow-lg shadow-purple-500/10'
              : 'border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-all duration-300 ${
            isDraggingState
              ? 'bg-[#8D6AFA] scale-110'
              : 'bg-[#8D6AFA]/10 group-hover:bg-[#8D6AFA]/20'
          }`}>
            <Upload className={`w-6 h-6 transition-colors duration-300 ${
              isDraggingState ? 'text-white' : 'text-[#8D6AFA]'
            }`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
            {isDraggingState ? tc('dropFilesHereActive') : tc('dropFilesHere')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {tc('orClickToBrowse')}
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-default">
                  <Info className="w-3.5 h-3.5" />
                  {tc('supportedFormatsLabel')}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {tc('supportedFormatsTooltip')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedMethod === 'upload' && selectedFiles.length > 0 && (
        <div className="space-y-4">
          {/* File list header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {tc('selectedFiles', { count: selectedFiles.length })}
            </h3>
            <div className="flex items-center gap-3">
              {selectedFiles.length > 1 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tc('dragToReorder')}
                </p>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#8D6AFA]/10 text-[#8D6AFA]">
                {tc('filesCount', { current: selectedFiles.length, max: 3 })}
              </span>
            </div>
          </div>

          {/* File cards */}
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
                  title={tc('removeFile')}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
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
                isDraggingState
                  ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-[#8D6AFA] bg-white dark:bg-gray-700 hover:bg-purple-50/20 dark:hover:bg-purple-900/10'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5 text-[#8D6AFA]" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tUpload('dropMoreFiles')}
                </p>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {tUpload('orClickToAddMore')}
                </span>
              </div>
            </div>
          )}

          {/* Processing Mode Toggle — only for multiple files */}
          {selectedFiles.length > 1 && (
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {tUpload('processingMode')}
              </label>
              {processingMode === 'merged' && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border-2 border-[#8D6AFA]/30 dark:border-[#8D6AFA]/50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-[#8D6AFA] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-800 dark:text-gray-300">
                      {tUpload('mergeOrderMatters')}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onProcessingModeChange('individual')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    processingMode === 'individual'
                      ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#8D6AFA] hover:bg-purple-50/20 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <FileAudio className={`h-5 w-5 ${processingMode === 'individual' ? 'text-[#8D6AFA]' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{tUpload('processIndividually')}</span>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-400 text-center">{tUpload('processIndividuallyDesc')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onProcessingModeChange('merged')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    processingMode === 'merged'
                      ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#8D6AFA] hover:bg-purple-50/20 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Upload className={`h-5 w-5 ${processingMode === 'merged' ? 'text-[#8D6AFA]' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{tUpload('processMerged')}</span>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-400 text-center">{tUpload('processMergedDesc')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
