'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { FileAudio, MessageSquare, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { transcriptionApi } from '@/lib/api';
import { websocketService } from '@/lib/websocket';
import { WEBSOCKET_EVENTS } from '@transcribe/shared';

interface RealProcessingViewProps {
  file: File;
  context?: string;
  selectedTemplates?: string[]; // V2: Template IDs to control which analyses are generated
  folderId?: string; // Optional folder to assign the conversation to
  onComplete: (transcriptionId: string) => void;
  onError: (error: string) => void;
}

type ProcessingStage = 'uploading' | 'processing' | 'summarizing' | 'complete' | 'error';

interface ProgressData {
  transcriptionId: string;
  progress: number;
  stage: string;
  message?: string;
}

interface CompletedData {
  transcriptionId: string;
}

interface FailedData {
  transcriptionId: string;
  error: string;
}

/**
 * Real processing view that uploads files and tracks progress via WebSocket
 * Replaces the simulated ProcessingSimulator with actual backend integration
 */
export function RealProcessingView({
  file,
  context,
  selectedTemplates,
  folderId,
  onComplete,
  onError,
}: RealProcessingViewProps) {
  const [stage, setStage] = useState<ProcessingStage>('uploading');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing upload...');
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Track if upload has been initiated to prevent double uploads
  const uploadInitiated = useRef(false);
  // Track cleanup functions for WebSocket listeners
  const cleanupFns = useRef<(() => void)[]>([]);

  // Cleanup WebSocket listeners on unmount
  useEffect(() => {
    return () => {
      cleanupFns.current.forEach(fn => fn());
      cleanupFns.current = [];
    };
  }, []);

  // Handle completion with countdown
  const handleCompletion = useCallback((completedTranscriptionId: string) => {
    setStage('complete');
    setProgress(100);
    setStatusMessage('Processing complete!');
    setCountdown(3);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          onComplete(completedTranscriptionId);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // Store cleanup for countdown
    cleanupFns.current.push(() => clearInterval(countdownInterval));
  }, [onComplete]);

  // Handle error
  const handleError = useCallback((error: string) => {
    setStage('error');
    setErrorMessage(error);
    setStatusMessage('Processing failed');
    onError(error);
  }, [onError]);

  // Track the transcription ID in a ref for polling fallback
  const transcriptionIdRef = useRef<string | null>(null);
  // Track if we've already completed to prevent double-completion
  const completedRef = useRef(false);

  // Upload file and setup WebSocket listeners
  useEffect(() => {
    if (uploadInitiated.current) return;
    uploadInitiated.current = true;

    const upload = async () => {
      try {
        // Connect WebSocket if not already connected
        await websocketService.connect();

        // Start upload
        setStage('uploading');
        setProgress(10);
        setStatusMessage('Uploading audio file...');

        const response = await transcriptionApi.upload(file, undefined, context, undefined, selectedTemplates);

        if (!response?.success || !response.data) {
          throw new Error('Upload failed - no response data');
        }

        // The API returns a Transcription object with 'id', not 'transcriptionId'
        // Handle both cases for compatibility
        const responseData = response.data as { id?: string; transcriptionId?: string };
        const newTranscriptionId = responseData.id || responseData.transcriptionId;

        if (!newTranscriptionId) {
          throw new Error('Upload failed - no transcription ID in response');
        }

        setTranscriptionId(newTranscriptionId);
        transcriptionIdRef.current = newTranscriptionId;

        // If a folder was specified, assign the conversation to it immediately
        if (folderId) {
          try {
            await transcriptionApi.moveToFolder(newTranscriptionId, folderId);
          } catch (err) {
            console.error('[RealProcessingView] Failed to assign to folder:', err);
            // Don't fail the upload - folder assignment is not critical
          }
        }

        setProgress(25);
        setStage('processing');
        setStatusMessage('Transcribing audio...');

        // Subscribe to transcription updates
        websocketService.subscribeToTranscription(newTranscriptionId);

        // Listen for progress updates
        const unsubProgress = websocketService.on(
          WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS,
          (data: unknown) => {
            const progressData = data as ProgressData;
            if (progressData.transcriptionId !== newTranscriptionId) return;

            // Map backend progress (0-100) to our progress bar
            // Reserve 0-25 for upload, 25-90 for transcription, 90-100 for completion
            const mappedProgress = 25 + (progressData.progress * 0.65);
            setProgress(Math.min(mappedProgress, 90));

            // Update stage based on backend stage
            if (progressData.stage === 'summarizing') {
              setStage('summarizing');
              setStatusMessage('Generating summary and insights...');
            } else if (progressData.stage === 'processing') {
              setStage('processing');
              setStatusMessage(progressData.message || 'Transcribing audio...');
            }
          }
        );
        cleanupFns.current.push(unsubProgress);

        // Listen for completion
        const unsubCompleted = websocketService.on(
          WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
          (data: unknown) => {
            const completedData = data as CompletedData;
            if (completedData.transcriptionId !== newTranscriptionId) return;
            if (completedRef.current) return; // Already completed
            completedRef.current = true;

            // Unsubscribe from updates
            websocketService.unsubscribeFromTranscription(newTranscriptionId);
            handleCompletion(newTranscriptionId);
          }
        );
        cleanupFns.current.push(unsubCompleted);

        // Listen for failure
        const unsubFailed = websocketService.on(
          WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED,
          (data: unknown) => {
            const failedData = data as FailedData;
            if (failedData.transcriptionId !== newTranscriptionId) return;
            if (completedRef.current) return; // Already handled

            // Unsubscribe from updates
            websocketService.unsubscribeFromTranscription(newTranscriptionId);
            handleError(failedData.error || 'Transcription failed');
          }
        );
        cleanupFns.current.push(unsubFailed);

        // Fallback: Poll for status every 10 seconds if WebSocket fails
        // This is more aggressive than before to handle WebSocket issues
        const startPolling = () => {
          const pollInterval = setInterval(async () => {
            const currentId = transcriptionIdRef.current;
            if (!currentId || completedRef.current) {
              clearInterval(pollInterval);
              return;
            }

            try {
              const statusResponse = await transcriptionApi.get(currentId);
              const transcription = statusResponse.data as { status: string; progress?: number };

              if (transcription.status === 'COMPLETED') {
                if (completedRef.current) return;
                completedRef.current = true;
                clearInterval(pollInterval);
                websocketService.unsubscribeFromTranscription(currentId);
                handleCompletion(currentId);
              } else if (transcription.status === 'FAILED') {
                clearInterval(pollInterval);
                websocketService.unsubscribeFromTranscription(currentId);
                handleError('Transcription failed');
              } else if (transcription.status === 'PROCESSING' && transcription.progress) {
                // Update progress from polling if WebSocket isn't working
                const mappedProgress = 25 + (transcription.progress * 0.65);
                setProgress(Math.min(mappedProgress, 90));
              }
            } catch {
              // Polling failed, will retry on next interval
            }
          }, 10000); // Poll every 10 seconds

          cleanupFns.current.push(() => clearInterval(pollInterval));
        };

        // Start polling after a short delay (give WebSocket a chance first)
        const pollStartTimeout = setTimeout(startPolling, 5000);
        cleanupFns.current.push(() => clearTimeout(pollStartTimeout));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        handleError(errorMsg);
      }
    };

    upload();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Upload runs once on mount, selectedTemplates is captured at that time
  }, [file, context, folderId, handleCompletion, handleError]);

  const getStageIcon = (stageName: ProcessingStage) => {
    switch (stageName) {
      case 'uploading':
        return FileAudio;
      case 'processing':
        return MessageSquare;
      case 'summarizing':
        return Sparkles;
      case 'complete':
        return CheckCircle2;
      case 'error':
        return AlertCircle;
    }
  };

  const getStageLabel = (stageName: ProcessingStage) => {
    switch (stageName) {
      case 'uploading':
        return 'Uploading';
      case 'processing':
        return 'Transcribing';
      case 'summarizing':
        return 'Analyzing';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Failed';
    }
  };

  const stages: ProcessingStage[] = ['uploading', 'processing', 'summarizing', 'complete'];
  const stageOrder = { uploading: 0, processing: 1, summarizing: 2, complete: 3, error: -1 };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* File Info */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 max-w-full">
          <FileAudio className="w-4 h-4 flex-shrink-0 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {file.name}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              stage === 'error'
                ? 'bg-red-500'
                : 'bg-[#8D6AFA]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Stage Indicators */}
      {stage !== 'error' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {stages.map((stageName) => {
            const Icon = getStageIcon(stageName);
            const currentStageOrder = stageOrder[stage];
            const thisStageOrder = stageOrder[stageName];
            const isActive = stageName === stage;
            const isPast = thisStageOrder < currentStageOrder;
            const isComplete = stage === 'complete' && stageName === 'complete';

            return (
              <div
                key={stageName}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 scale-105'
                    : isPast
                    ? 'bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-[#14D0DC] text-white'
                      : isActive
                      ? 'bg-[#8D6AFA] text-white'
                      : isPast
                      ? 'bg-[#14D0DC] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {isActive && stage !== 'complete' ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center ${
                    isActive || isPast
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {getStageLabel(stageName)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {statusMessage}
        </p>
      </div>

      {/* Error State */}
      {stage === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">
                Processing Failed
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300">
                {errorMessage || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Complete State */}
      {stage === 'complete' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Redirecting to your conversation in{' '}
              <span className="font-bold text-[#8D6AFA]">{countdown}</span>{' '}
              second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              variant="brand"
              onClick={() => {
                setCountdown(null);
                if (transcriptionId) {
                  onComplete(transcriptionId);
                }
              }}
            >
              View Conversation Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
