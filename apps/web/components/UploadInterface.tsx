'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Mic, Link as LinkIcon, X, FileAudio, GripVertical, Info } from 'lucide-react';
import { Button } from './Button';
import { RecordingPreview } from './RecordingPreview';

interface UploadInterfaceProps {
  onFileUpload: (files: File[], processingMode: 'individual' | 'merged') => void;
  onRecordingComplete: (blob: Blob) => void;
  onBack: () => void;
  initialMethod?: 'file' | 'record' | null;
}

type InputMethod = 'upload' | 'record' | 'url';
type RecordingState = 'idle' | 'recording' | 'preview' | 'confirmed';

/**
 * Upload interface with three input methods:
 * 1. File upload (drag-and-drop or click)
 * 2. Record audio (live recording)
 * 3. Import from URL (future feature)
 */
export function UploadInterface({
  onFileUpload,
  onRecordingComplete,
  onBack,
  initialMethod,
}: UploadInterfaceProps) {
  const [selectedMethod, setSelectedMethod] = useState<InputMethod | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingMode, setProcessingMode] = useState<'individual' | 'merged'>('individual');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Recording state machine
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Computed: is currently recording
  const isRecording = recordingState === 'recording';

  // Auto-select method based on initialMethod prop
  useEffect(() => {
    if (initialMethod && !selectedMethod) {
      if (initialMethod === 'file') {
        setSelectedMethod('upload');
      } else if (initialMethod === 'record') {
        setSelectedMethod('record');
        // Auto-start recording
        handleStartRecording();
      }
    }
  }, [initialMethod, selectedMethod]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Waveform animation
  useEffect(() => {
    if (!isRecording) {
      setWaveformBars([]);
      return;
    }

    setWaveformBars(Array.from({ length: 30 }, () => Math.random()));

    const interval = setInterval(() => {
      setWaveformBars(Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3));
    }, 150);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Recording handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // NEW: Store blob and show preview instead of immediately processing
        setRecordedBlob(audioBlob);
        setRecordingState('preview');

        // Stop media stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('idle');
      audioChunksRef.current = [];
    }
  };

  // Preview confirmation handlers
  const handleConfirmRecording = () => {
    if (recordedBlob) {
      setRecordingState('confirmed');
      onRecordingComplete(recordedBlob); // Now only called after confirmation
    }
  };

  const handleReRecord = () => {
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setRecordingState('idle');
    handleStartRecording(); // Start new recording
  };

  const handleCancelPreview = () => {
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setRecordingState('idle');
    setSelectedMethod(null); // Go back to method selection
  };

  return (
    <div className="space-y-8">
      {/* Method Selection (if no method selected yet) */}
      {!selectedMethod && !isRecording && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload File */}
            <button
              onClick={() => setSelectedMethod('upload')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#cc3399] group-hover:scale-110 transition-all duration-200">
                <Upload className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#cc3399]">
                Upload File
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import audio or video file
              </p>
            </button>

            {/* Record Audio */}
            <button
              onClick={() => {
                setSelectedMethod('record');
                handleStartRecording();
              }}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#cc3399] group-hover:scale-110 transition-all duration-200">
                <Mic className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#cc3399]">
                Record Audio
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Record live conversation
              </p>
            </button>

            {/* Import from URL */}
            <button
              disabled
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-7 h-7 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                Import from URL
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
            </button>
          </div>

          {/* Back Button */}
          <div className="flex justify-start">
            <Button variant="ghost" onClick={onBack}>
              ← Back to templates
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or click to browse (up to 3 files)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
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
                <p className="text-xs text-gray-600 dark:text-gray-400">
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
                        <p className="text-xs text-gray-600 dark:text-gray-400">
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
                <span className="text-sm text-gray-500 dark:text-gray-400">
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
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
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
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
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
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
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
            <Button variant="brand" size="lg" onClick={handleConfirmUpload}>
              Upload & Process ({selectedFiles.length})
            </Button>
          </div>
        </div>
      )}

      {/* Recording Interface */}
      {recordingState === 'recording' && (
        <div className="space-y-8">
          <div className="p-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
            {/* Recording indicator */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Recording...
                </span>
              </div>
              <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100">
                {formatTime(recordingSeconds)}
              </div>
            </div>

            {/* Waveform */}
            <div className="flex items-center justify-center gap-1 h-24 mb-8">
              {waveformBars.map((height, index) => (
                <div
                  key={index}
                  className="bg-[#cc3399] rounded-full transition-all duration-150"
                  style={{
                    width: '4px',
                    height: `${height * 100}%`,
                    opacity: 0.7 + height * 0.3,
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-3">
              <Button variant="brand" size="lg" onClick={handleStopRecording} fullWidth>
                Stop Recording
              </Button>
              <button
                onClick={handleCancelRecording}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel recording
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Preview */}
      {recordingState === 'preview' && recordedBlob && (
        <RecordingPreview
          audioBlob={recordedBlob}
          duration={recordingSeconds}
          onConfirm={handleConfirmRecording}
          onReRecord={handleReRecord}
          onCancel={handleCancelPreview}
        />
      )}
    </div>
  );
}
