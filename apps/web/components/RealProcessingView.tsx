'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { FileAudio, AlertCircle, RotateCcw, Download, ArrowUpCircle, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Button } from './Button';
import { GeneratingLoader } from './GeneratingLoader';
import { transcriptionApi } from '@/lib/api';
import { websocketService } from '@/lib/websocket';
import { uploadFileDirect } from '@/utils/directUpload';
import { useAuth } from '@/contexts/AuthContext';
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

const PROCESSING_MESSAGES = [
  'This may take a few moments',
  'Listening to every word...',
  'Teaching AI to understand your conversation...',
  'Transcribing at the speed of sound...',
  'Our AI is typing so you don\'t have to...',
  'Turning audio into insights...',
  'Almost there. Probably. Maybe.',
  'Making sense of it all...',
  'Converting speech to structured text...',
];

function RotatingSubtext() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className="text-sm font-medium bg-[length:250%_100%] bg-clip-text transition-opacity duration-400"
      style={{
        opacity: visible ? 1 : 0,
        backgroundImage:
          'linear-gradient(90deg, transparent calc(50% - 4em), #d1d5db 50%, transparent calc(50% + 4em)), linear-gradient(#6b7280, #6b7280)',
        backgroundRepeat: 'no-repeat, padding-box',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'shimmer 3s linear infinite reverse',
      }}
    >
      {PROCESSING_MESSAGES[index]}
    </p>
  );
}

/**
 * Real processing view that uploads files and tracks progress via WebSocket.
 * Redesigned to match the OutputGeneratorModal's step 3 layout with
 * GeneratingLoader waveform animation, RotatingSubtext shimmer, and centered states.
 */
export function RealProcessingView({
  file,
  context,
  selectedTemplates,
  folderId,
  onComplete,
  onError,
}: RealProcessingViewProps) {
  const t = useTranslations('processing');
  const tCreate = useTranslations('conversationCreate');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';
  const { user } = useAuth();

  const [stage, setStage] = useState<ProcessingStage>('uploading');
  const [progress, setProgress] = useState(0);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Track if upload has been initiated to prevent double uploads
  const uploadInitiated = useRef(false);
  // Track cleanup functions for WebSocket listeners
  const cleanupFns = useRef<(() => void)[]>([]);

  // Check if this is a quota-related error (402 status or quota/limit keywords)
  const isQuotaError = errorMessage?.includes('402') ||
    errorMessage?.toLowerCase().includes('quota') ||
    errorMessage?.toLowerCase().includes('limit') ||
    errorMessage?.toLowerCase().includes('exceeded') ||
    errorMessage?.toLowerCase().includes('upgrade');

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
    setCountdown(3);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          // Call onComplete outside the state updater to avoid
          // "Cannot update a component while rendering a different component"
          setTimeout(() => onComplete(completedTranscriptionId), 0);
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
    onError(error);
  }, [onError]);

  // Track the transcription ID in a ref for polling fallback
  const transcriptionIdRef = useRef<string | null>(null);
  // Track if we've already completed to prevent double-completion
  const completedRef = useRef(false);

  // Handle retry - reset state and re-initiate upload
  const handleRetry = useCallback(() => {
    // Clean up existing listeners
    cleanupFns.current.forEach(fn => fn());
    cleanupFns.current = [];

    // Reset all state
    setStage('uploading');
    setProgress(0);
    setTranscriptionId(null);
    setErrorMessage(null);
    setCountdown(null);
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Reset refs
    uploadInitiated.current = false;
    transcriptionIdRef.current = null;
    completedRef.current = false;
  }, []);

  // Handle save recording locally
  const handleSaveLocally = useCallback(() => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    // Generate a descriptive filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = file.name.split('.').pop() || 'webm';
    a.download = `recording_${timestamp}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [file]);

  // Handle upgrade to Pro
  const handleUpgrade = useCallback(() => {
    router.push(`/${locale}/pricing`);
  }, [router, locale]);

  // Truncate filename for display
  const truncatedName = file.name.length > 30
    ? file.name.substring(0, 27) + '...'
    : file.name;

  // Upload file and setup WebSocket listeners
  useEffect(() => {
    if (uploadInitiated.current) return;
    if (!user?.uid) return; // Wait for auth
    uploadInitiated.current = true;
    setIsRetrying(false);

    const upload = async () => {
      try {
        // Connect WebSocket if not already connected
        await websocketService.connect();

        // Start upload - using direct Firebase Storage upload
        setStage('uploading');
        setProgress(0);

        // Upload directly to Firebase Storage with progress tracking
        const { promise: uploadPromise } = uploadFileDirect(file, user.uid, {
          onProgress: (bytesTransferred, totalBytes, percentage) => {
            // Map upload progress (0-100) to 0-25% of overall progress
            const mappedProgress = Math.round(percentage * 0.25);
            setProgress(mappedProgress);
          },
          onError: (error) => {
            console.error('[RealProcessingView] Direct upload error:', error);
          },
        });

        // Wait for upload to complete
        const uploadResult = await uploadPromise;

        console.log('[RealProcessingView] Direct upload complete:', uploadResult);

        // Now notify backend to process the uploaded file
        const response = await transcriptionApi.processFromStorage(
          uploadResult.storagePath,
          uploadResult.fileName,
          uploadResult.fileSize,
          uploadResult.contentType,
          {
            context,
            selectedTemplates,
          }
        );

        if (!response?.success || !response.data) {
          throw new Error('Failed to start processing - no response data');
        }

        // The API returns a Transcription object with 'id', not 'transcriptionId'
        const responseData = response.data as { id?: string; transcriptionId?: string };
        const newTranscriptionId = responseData.id || responseData.transcriptionId;

        if (!newTranscriptionId) {
          throw new Error('Failed to start processing - no transcription ID in response');
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
            } else if (progressData.stage === 'processing') {
              setStage('processing');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Upload runs on mount and on retry, selectedTemplates is captured at that time
  }, [file, context, folderId, handleCompletion, handleError, retryCount, user?.uid]);

  // Active processing state (uploading/processing/summarizing)
  if (stage !== 'error' && stage !== 'complete') {
    return (
      <div className="py-10 text-center">
        <GeneratingLoader className="mb-6" size="lg" />

        <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
          <FileAudio className="w-4 h-4" />
          {truncatedName}
        </span>

        {/* Slim progress bar */}
        <div className="w-48 mx-auto h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-[#8D6AFA] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <RotatingSubtext />
      </div>
    );
  }

  // Error state
  if (stage === 'error') {
    return (
      <div className="py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('error.title')}
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400 mb-5">
          {errorMessage || t('error.unexpected')}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {!isQuotaError && (
            <Button
              variant="brand"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              icon={<RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />}
            >
              {isRetrying ? t('error.retrying') : t('error.retry')}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveLocally}
            icon={<Download className="w-4 h-4" />}
          >
            {t('error.saveLocally')}
          </Button>

          {isQuotaError && (
            <Button
              variant="brand"
              size="sm"
              onClick={handleUpgrade}
              icon={<ArrowUpCircle className="w-4 h-4" />}
            >
              {t('error.upgradeToPro')}
            </Button>
          )}
        </div>

        {isQuotaError && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            {t('error.quotaHint')}
          </p>
        )}
      </div>
    );
  }

  // Complete state
  return (
    <div className="py-10 text-center">
      <div className="w-16 h-16 rounded-full bg-[#14D0DC] flex items-center justify-center mx-auto mb-5">
        <Check className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {tCreate('steps.processing.complete')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {tCreate('steps.processing.redirecting', { countdown: countdown ?? 0 })}
      </p>
      <Button
        variant="brand"
        onClick={() => {
          setCountdown(null);
          if (transcriptionId) {
            onComplete(transcriptionId);
          }
        }}
      >
        {tCreate('steps.processing.viewNow')}
      </Button>
    </div>
  );
}
