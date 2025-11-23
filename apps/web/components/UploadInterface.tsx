'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Mic, Link as LinkIcon, X } from 'lucide-react';
import { Button } from './Button';
import { RecordingPreview } from './RecordingPreview';

interface UploadInterfaceProps {
  onFileUpload: (file: File) => void;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
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
      {selectedMethod === 'upload' && !selectedFile && (
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
              {isDragging ? 'Drop your file here' : 'Drop your file here'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports: MP3, M4A, WAV, MP4, MOV, WebM (Max 5GB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => setSelectedMethod(null)}>
              ← Change method
            </Button>
          </div>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedMethod === 'upload' && selectedFile && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border-2 border-[#cc3399] bg-pink-50 dark:bg-pink-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#cc3399] flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setSelectedFile(null)}>
              Choose different file
            </Button>
            <Button variant="brand" size="lg" onClick={handleConfirmUpload}>
              Upload & Process
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
