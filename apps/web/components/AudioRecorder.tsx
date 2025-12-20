/**
 * AudioRecorder component
 * Main interface for browser-based audio recording
 * Supports microphone and tab audio capture with real-time visualization
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  Upload,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Volume2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMediaRecorder, type RecordingSource } from '@/hooks/useMediaRecorder';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { RecordingSourceSelector } from './RecordingSourceSelector';
import { RecordingRecoveryDialog } from './RecordingRecoveryDialog';
import {
  formatDuration,
  estimateFileSize,
  formatFileSize,
  blobToFile,
  detectBrowser,
} from '@/utils/audio';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import type { RecoverableRecording } from '@/utils/recordingStorage';

interface AudioRecorderProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function AudioRecorder({ onUpload, disabled = false }: AudioRecorderProps) {
  const t = useTranslations('recording');
  const { trackEvent } = useAnalytics();

  // Recording state
  const [recordingSource, setRecordingSource] = useState<RecordingSource>('microphone');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Recovery state
  const [recoverableRecordings, setRecoverableRecordings] = useState<RecoverableRecording[]>([]);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveredRecordingId, setRecoveredRecordingId] = useState<string | null>(null);

  // Audio player ref
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Track which recordings have been shown to avoid re-displaying them
  const shownRecordingIdsRef = useRef<Set<string>>(new Set());

  // Stable callback for recovery notifications (prevents useEffect re-runs)
  const handleRecoveryAvailable = useCallback((recordings: RecoverableRecording[]) => {
    // Filter out recordings that have already been shown
    const newRecordings = recordings.filter((r) => !shownRecordingIdsRef.current.has(r.id));

    if (newRecordings.length > 0) {
      // Track these recordings as shown
      newRecordings.forEach((r) => shownRecordingIdsRef.current.add(r.id));

      setRecoverableRecordings(newRecordings);
      setShowRecoveryDialog(true);
      console.log(`[AudioRecorder] Found ${newRecordings.length} new recoverable recording(s)`);
    }
  }, []);

  // Media recorder hook
  const {
    state,
    duration,
    audioBlob,
    error,
    warning,
    isSupported,
    canUseTabAudio,
    audioFormat,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    markAsUploaded,
    loadRecoveredRecording,
    clearWarning,
    audioStream,
  } = useMediaRecorder({
    onStateChange: (newState) => {
      if (newState === 'recording') {
        const browser = detectBrowser();
        trackEvent('recording_started', {
          source: recordingSource,
          browser: browser.name,
          is_mobile: browser.isMobile,
        });
      }
    },
    onDataAvailable: (blob) => {
      trackEvent('recording_stopped', {
        duration_seconds: duration,
        file_size_bytes: blob.size,
        source: recordingSource,
      });
    },
    onError: (err) => {
      trackEvent('recording_error', {
        error_message: err.message,
        error_name: err.name,
        source: recordingSource,
      });
    },
    onRecoveryAvailable: handleRecoveryAvailable,
    enableAutoSave: true,
  });

  // Audio visualization hook
  const { audioLevel, frequencyData } = useAudioVisualization(audioStream);

  // Create audio URL and load metadata when blob is available
  useEffect(() => {
    console.log('[AudioRecorder] useEffect triggered - audioBlob:', audioBlob ? `${audioBlob.size} bytes` : 'null', 'state:', state);

    if (!audioBlob) {
      console.log('[AudioRecorder] No audioBlob, skipping URL creation');
      return;
    }

    if (!audioPlayerRef.current) {
      console.log('[AudioRecorder] No audioPlayerRef.current, skipping URL creation');
      return;
    }

    // Only create URL when state is 'stopped' (after recording or recovery)
    if (state !== 'stopped') {
      console.log('[AudioRecorder] State is not stopped, skipping URL creation');
      return;
    }

    console.log('[AudioRecorder] Creating audio URL for blob:', {
      size: audioBlob.size,
      type: audioBlob.type,
      isValidBlob: audioBlob instanceof Blob,
      hasAudioMimeType: audioBlob.type.startsWith('audio/'),
    });

    // Validate blob
    if (audioBlob.size === 0) {
      console.error('[AudioRecorder] Blob is empty!');
      return;
    }

    if (!audioBlob.type) {
      console.error('[AudioRecorder] Blob has no MIME type! This will cause playback to fail.');
      return;
    }

    if (!audioBlob.type.startsWith('audio/')) {
      console.error('[AudioRecorder] Blob MIME type is not audio:', audioBlob.type);
      return;
    }

    // Revoke old URL if it exists (when blob changes)
    if (audioUrlRef.current) {
      console.log('[AudioRecorder] Revoking old URL:', audioUrlRef.current);
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    // Create object URL for the blob
    const url = URL.createObjectURL(audioBlob);
    audioUrlRef.current = url;

    console.log('[AudioRecorder] Created new audio URL:', url);
    console.log('[AudioRecorder] Audio element readyState before setting src:', audioPlayerRef.current.readyState);
    console.log('[AudioRecorder] Setting audio element src...');

    // Add event listeners to track loading progress
    const handleLoadStart = () => {
      console.log('[AudioRecorder] Load started');
    };

    const handleLoadedMetadata = () => {
      console.log('[AudioRecorder] Metadata loaded, duration:', audioPlayerRef.current?.duration);
      if (audioPlayerRef.current && isFinite(audioPlayerRef.current.duration)) {
        setAudioDuration(audioPlayerRef.current.duration);
      } else if (audioPlayerRef.current && !isFinite(audioPlayerRef.current.duration)) {
        // WebM files sometimes don't have duration metadata, use tracked duration instead
        console.log('[AudioRecorder] Metadata duration is Infinity, using tracked duration:', duration);
        setAudioDuration(duration);
      }
    };

    const handleLoadedData = () => {
      console.log('[AudioRecorder] Data loaded');
    };

    const handleCanPlay = () => {
      console.log('[AudioRecorder] Audio can play, duration:', audioPlayerRef.current?.duration);
      if (audioPlayerRef.current && isFinite(audioPlayerRef.current.duration)) {
        setAudioDuration(audioPlayerRef.current.duration);
      } else if (audioPlayerRef.current && !isFinite(audioPlayerRef.current.duration)) {
        // WebM files sometimes don't have duration metadata, use tracked duration instead
        console.log('[AudioRecorder] Audio duration is Infinity, using tracked duration:', duration);
        setAudioDuration(duration);
      }
    };

    const handleError = (e: Event) => {
      // Ignore error events that happen during cleanup (empty error object)
      const audioError = audioPlayerRef.current?.error;
      if (!audioError || !audioError.code) {
        // Silently ignore - these are cleanup artifacts from resetting the audio element
        return;
      }

      // Ignore MEDIA_ERR_SRC_NOT_SUPPORTED (code 4) when src is empty (reset artifact)
      if (audioError.code === 4 && !audioPlayerRef.current?.src) {
        return;
      }

      // Only log real errors with error codes
      console.error('[AudioRecorder] Audio element error event:', e);
      console.error('[AudioRecorder] MediaError details:', {
        code: audioError.code,
        message: audioError.message,
        // MediaError codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
        errorType: audioError.code === 1 ? 'MEDIA_ERR_ABORTED' :
                   audioError.code === 2 ? 'MEDIA_ERR_NETWORK' :
                   audioError.code === 3 ? 'MEDIA_ERR_DECODE' :
                   audioError.code === 4 ? 'MEDIA_ERR_SRC_NOT_SUPPORTED' :
                   'UNKNOWN',
      });
    };

    const handleStalled = () => {
      console.warn('[AudioRecorder] Loading stalled');
    };

    const handleSuspend = () => {
      console.warn('[AudioRecorder] Loading suspended');
    };

    // Attach event listeners before setting src
    audioPlayerRef.current.addEventListener('loadstart', handleLoadStart);
    audioPlayerRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioPlayerRef.current.addEventListener('loadeddata', handleLoadedData);
    audioPlayerRef.current.addEventListener('canplay', handleCanPlay);
    audioPlayerRef.current.addEventListener('error', handleError);
    audioPlayerRef.current.addEventListener('stalled', handleStalled);
    audioPlayerRef.current.addEventListener('suspend', handleSuspend);

    // Set src and load (no reset needed - audio element handles source changes automatically)
    audioPlayerRef.current.src = audioUrlRef.current;
    audioPlayerRef.current.load();

    // Cleanup event listeners when blob changes or component unmounts
    return () => {
      audioPlayerRef.current?.removeEventListener('loadstart', handleLoadStart);
      audioPlayerRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioPlayerRef.current?.removeEventListener('loadeddata', handleLoadedData);
      audioPlayerRef.current?.removeEventListener('canplay', handleCanPlay);
      audioPlayerRef.current?.removeEventListener('error', handleError);
      audioPlayerRef.current?.removeEventListener('stalled', handleStalled);
      audioPlayerRef.current?.removeEventListener('suspend', handleSuspend);
    };
  }, [audioBlob, state, duration]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Handle start recording
  const handleStart = useCallback(async () => {
    setUploadError(null); // Clear any previous upload errors
    await startRecording(recordingSource);
  }, [startRecording, recordingSource]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!audioBlob) return;

    try {
      setIsUploading(true);
      setUploadError(null); // Clear any previous errors

      // Convert blob to file
      const file = blobToFile(audioBlob, audioFormat);

      // Upload via parent callback
      await onUpload(file);

      // Mark as uploaded (removes beforeunload warning, cleans IndexedDB)
      await markAsUploaded();

      // If this was a recovered recording, clean it up from IndexedDB
      if (recoveredRecordingId) {
        try {
          const { getRecordingStorage } = await import('@/utils/recordingStorage');
          const storage = await getRecordingStorage();
          await storage.deleteRecording(recoveredRecordingId);
          console.log('[AudioRecorder] Cleaned up recovered recording from IndexedDB');
        } catch (err) {
          console.error('[AudioRecorder] Failed to clean up recovered recording:', err);
        }
        setRecoveredRecordingId(null);
      }

      // Track success
      trackEvent('recording_uploaded', {
        file_size_bytes: file.size,
        duration_seconds: duration,
        source: recordingSource,
        format: audioFormat.extension,
      });

      // Reset recording state
      reset();
    } catch (err: unknown) {
      console.error('[AudioRecorder] Upload failed:', err);

      // Extract user-friendly error message
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload recording. Please try again.';
      setUploadError(errorMessage);

      trackEvent('recording_upload_failed', {
        error_message: errorMessage,
        file_size_bytes: audioBlob.size,
        duration_seconds: duration,
      });
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob, audioFormat, onUpload, markAsUploaded, reset, duration, recordingSource, trackEvent, recoveredRecordingId]);

  // Handle play/pause preview
  const handlePlayPause = useCallback(() => {
    console.log('[AudioRecorder] Play/pause clicked, isPlaying:', isPlaying);
    console.log('[AudioRecorder] audioPlayerRef.current:', audioPlayerRef.current);
    console.log('[AudioRecorder] audioPlayerRef.current.src:', audioPlayerRef.current?.src);
    console.log('[AudioRecorder] audioPlayerRef.current.duration:', audioPlayerRef.current?.duration);
    console.log('[AudioRecorder] audioPlayerRef.current.readyState:', audioPlayerRef.current?.readyState);

    if (!audioPlayerRef.current) {
      console.error('[AudioRecorder] No audio player ref!');
      return;
    }

    if (isPlaying) {
      console.log('[AudioRecorder] Pausing audio');
      audioPlayerRef.current.pause();
      // State will be updated by onPause event
    } else {
      console.log('[AudioRecorder] Attempting to play audio');
      // Ensure duration is loaded before playing
      if (audioPlayerRef.current.duration && isFinite(audioPlayerRef.current.duration)) {
        console.log('[AudioRecorder] Duration is loaded, playing now');
        audioPlayerRef.current.play().catch((err) => {
          console.error('[AudioRecorder] Play failed:', err);
        });
        // State will be updated by onPlay event
      } else {
        console.log('[AudioRecorder] Duration not loaded, forcing load first');
        audioPlayerRef.current.load();
        audioPlayerRef.current.addEventListener('loadedmetadata', () => {
          console.log('[AudioRecorder] Metadata loaded after force load, now playing');
          audioPlayerRef.current?.play().catch((err) => {
            console.error('[AudioRecorder] Play failed after load:', err);
          });
          // State will be updated by onPlay event
        }, { once: true });
      }
    }
  }, [isPlaying]);

  // Handle audio player ended
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Handle time update from audio element
  const handleTimeUpdate = useCallback(() => {
    if (audioPlayerRef.current) {
      setCurrentTime(audioPlayerRef.current.currentTime);
    }
  }, []);

  // Handle audio metadata loaded (get duration)
  const handleLoadedMetadata = useCallback(() => {
    if (audioPlayerRef.current) {
      const dur = audioPlayerRef.current.duration;
      // Only set duration if it's a valid number
      if (!isNaN(dur) && isFinite(dur)) {
        setAudioDuration(dur);
      }
    }
  }, []);

  // Handle audio play event (sync state with actual playback)
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Handle audio pause event (sync state with actual playback)
  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Handle seek (click on timeline)
  const handleSeek = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioPlayerRef.current) return;

    const timeline = event.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioDuration;

    audioPlayerRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [audioDuration]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setRecoveredRecordingId(null); // Clear recovered recording ID
    reset();
  }, [reset]);

  // Handle recovery of saved recording - load into preview first
  const handleRecoverRecording = useCallback(
    async (recording: RecoverableRecording) => {
      try {
        // Reconstruct blob from saved chunks
        const recoveredBlob = new Blob(recording.chunks, { type: recording.mimeType });

        console.log('[AudioRecorder] Recovered blob details:', {
          size: recoveredBlob.size,
          type: recoveredBlob.type,
          chunks: recording.chunks.length,
          chunkSizes: recording.chunks.map(c => c.size),
          originalMimeType: recording.mimeType,
          blobIsValid: recoveredBlob instanceof Blob,
          blobHasData: recoveredBlob.size > 0,
        });

        // Load into preview player (this updates state in the hook)
        loadRecoveredRecording(recoveredBlob, recording.duration);

        // Store the recording ID so we can clean it up after upload
        setRecoveredRecordingId(recording.id);

        // Remove from list
        setRecoverableRecordings((prev) => {
          const remaining = prev.filter((r) => r.id !== recording.id);
          // Close dialog if no more recordings left
          if (remaining.length === 0) {
            setShowRecoveryDialog(false);
          }
          return remaining;
        });

        console.log('[AudioRecorder] Loaded recovered recording into preview');
      } catch (err) {
        console.error('[AudioRecorder] Failed to recover recording:', err);
      }
    },
    [loadRecoveredRecording]
  );

  // Handle discard of saved recording
  const handleDiscardRecording = useCallback(async (id: string) => {
    try {
      const { getRecordingStorage } = await import('@/utils/recordingStorage');
      const storage = await getRecordingStorage();
      await storage.deleteRecording(id);

      // Remove from UI and close dialog if no more recordings
      setRecoverableRecordings((prev) => {
        const remaining = prev.filter((r) => r.id !== id);
        // Close dialog if no more recordings left
        if (remaining.length === 0) {
          setShowRecoveryDialog(false);
        }
        return remaining;
      });

      console.log('[AudioRecorder] Discarded recording:', id);
    } catch (err) {
      console.error('[AudioRecorder] Failed to discard recording:', err);
    }
  }, []);

  // Close recovery dialog
  const handleCloseRecoveryDialog = useCallback(() => {
    setShowRecoveryDialog(false);
  }, []);

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-700 text-center max-w-md">
          {t('errors.notSupported')}
        </p>
        <p className="text-xs text-gray-600 text-center mt-2">
          {t('errors.notSupportedDetails')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Source Selector (only show when idle) */}
      {state === 'idle' && (
        <RecordingSourceSelector
          selectedSource={recordingSource}
          onSourceChange={setRecordingSource}
          canUseTabAudio={canUseTabAudio}
          disabled={disabled}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">{t('errors.title')}</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Warning Display (non-blocking, e.g., mic unavailable for tab audio) */}
      {warning && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{t('warnings.title')}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{warning}</p>
          </div>
          <button
            type="button"
            onClick={clearWarning}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1 -mr-1 -mt-1"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        {/* Recording Status & Timer */}
        <div className="flex flex-col items-center justify-center mb-8">
          {/* Status Text */}
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {state === 'idle' && t('status.ready')}
            {state === 'requesting-permission' && t('status.requesting')}
            {state === 'recording' && t('status.recording')}
            {state === 'paused' && t('status.paused')}
            {state === 'stopped' && t('status.stopped')}
          </div>

          {/* Timer */}
          <div className="text-4xl sm:text-5xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-2">
            {formatDuration(duration)}
          </div>

          {/* File Size Estimate */}
          {duration > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {t('fileSize', {
                size: formatFileSize(estimateFileSize(duration)),
              })}
            </div>
          )}
        </div>

        {/* Audio Visualization */}
        {(state === 'recording' || state === 'paused') && (
          <div className="mb-8">
            <AudioLevelVisualizer level={audioLevel} frequencyData={frequencyData} isPaused={state === 'paused'} />
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Start/Stop Recording */}
          {state === 'idle' && (
            <button
              type="button"
              onClick={handleStart}
              disabled={disabled}
              className="
                flex items-center justify-center gap-2
                bg-[#cc3399] hover:bg-[#b82d89]
                text-white font-medium
                px-8 py-4 rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-[#cc3399]/30
                disabled:opacity-50 disabled:cursor-not-allowed
                min-w-[200px] sm:min-w-[240px]
              "
            >
              <Mic className="w-5 h-5" />
              <span>{t('controls.start')}</span>
            </button>
          )}

          {state === 'requesting-permission' && (
            <button
              type="button"
              disabled
              className="
                flex items-center justify-center gap-2
                bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium
                px-8 py-4 rounded-lg
                cursor-not-allowed
                min-w-[200px] sm:min-w-[240px]
              "
            >
              <div className="w-5 h-5 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
              <span>{t('status.requesting')}</span>
            </button>
          )}

          {(state === 'recording' || state === 'paused') && (
            <>
              {/* Pause/Resume */}
              <button
                type="button"
                onClick={state === 'recording' ? pauseRecording : resumeRecording}
                className="
                  flex items-center justify-center
                  bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
                  text-gray-800 dark:text-gray-200 font-medium
                  w-14 h-14 rounded-full
                  transition-all duration-200
                  focus:outline-none focus:ring-4 focus:ring-gray-300/50 dark:focus:ring-gray-600/50
                "
              >
                {state === 'recording' ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              {/* Stop */}
              <button
                type="button"
                onClick={stopRecording}
                className="
                  flex items-center justify-center gap-2
                  bg-red-600 hover:bg-red-700
                  text-white font-medium
                  px-8 py-4 rounded-lg
                  transition-all duration-200
                  focus:outline-none focus:ring-4 focus:ring-red-600/30
                  min-w-[160px]
                "
              >
                <Square className="w-5 h-5 fill-current" />
                <span>{t('controls.stop')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview & Upload (after recording stopped) */}
      {state === 'stopped' && audioBlob && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">{t('preview.title')}</h3>

          {/* Enhanced Audio Player with Timeline */}
          <div className="space-y-4 mb-6">
            {/* Play/Pause Button and Timeline */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handlePlayPause}
                className="
                  flex items-center justify-center
                  bg-[#cc3399] hover:bg-[#b82d89]
                  text-white
                  w-12 h-12 rounded-full flex-shrink-0
                  transition-all duration-200
                  focus:outline-none focus:ring-4 focus:ring-[#cc3399]/30
                "
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              {/* Timeline Container */}
              <div className="flex-1 flex items-center gap-3">
                {/* Timeline Bar */}
                <div
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative group"
                  onClick={handleSeek}
                >
                  {/* Progress Bar */}
                  <div
                    className="absolute top-0 left-0 h-full bg-[#cc3399] rounded-full transition-all duration-100"
                    style={{
                      width: `${
                        (audioDuration > 0 || duration > 0)
                          ? (currentTime / (audioDuration > 0 ? audioDuration : duration)) * 100
                          : 0
                      }%`,
                    }}
                  />

                  {/* Playhead - Always visible, positioned based on current time */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#cc3399] rounded-full shadow-lg transition-all duration-100"
                    style={{
                      left: `calc(${
                        (audioDuration > 0 || duration > 0)
                          ? (currentTime / (audioDuration > 0 ? audioDuration : duration)) * 100
                          : 0
                      }% - 8px)`,
                      opacity: 1,
                    }}
                  />
                </div>

                {/* Time Display */}
                <div className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(audioDuration > 0 && isFinite(audioDuration) ? audioDuration : duration))}
                </div>
              </div>
            </div>

            {/* File Info */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 pl-16">
              <Volume2 className="w-3 h-3" />
              <span>{formatFileSize(audioBlob.size)}</span>
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioPlayerRef}
              onEnded={handleAudioEnded}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onDurationChange={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              preload="metadata"
              className="hidden"
              controls={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isUploading}
              className="
                flex items-center justify-center gap-2
                bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
                text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100
                border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500
                font-medium px-6 py-3 rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-gray-300/30 dark:focus:ring-gray-600/30
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('controls.reset')}</span>
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-[#cc3399] hover:bg-[#b82d89]
                text-white font-medium
                px-6 py-3 rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-[#cc3399]/30
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('controls.uploading')}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{t('controls.upload')}</span>
                </>
              )}
            </button>
          </div>

          {/* Upload Error Message */}
          {uploadError && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Upload Failed</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{uploadError}</p>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recovery Dialog */}
      {showRecoveryDialog && recoverableRecordings.length > 0 && (
        <RecordingRecoveryDialog
          recordings={recoverableRecordings}
          onRecover={handleRecoverRecording}
          onDiscard={handleDiscardRecording}
          onClose={handleCloseRecoveryDialog}
        />
      )}
    </div>
  );
}

/**
 * Audio Level Visualizer Component
 * Frequency-based waveform visualization using real audio data
 */
interface AudioLevelVisualizerProps {
  level: number; // 0-100 (fallback when no frequency data)
  frequencyData: Uint8Array | null; // Raw frequency data from analyzer
  isPaused?: boolean;
}

function AudioLevelVisualizer({ level, frequencyData, isPaused = false }: AudioLevelVisualizerProps) {
  const bars = 60; // Number of bars to display
  const barHeight = 48; // Max height in pixels

  return (
    <div className="flex items-end justify-center gap-0.5 h-16">
      {Array.from({ length: bars }).map((_, index) => {
        let calculatedHeight = 4; // Minimum height

        if (!isPaused) {
          if (frequencyData && frequencyData.length > 0) {
            // Focus on voice frequency range where actual audio data exists
            // Human voice is typically 300-3400 Hz, which corresponds to lower frequency bins
            // For fftSize=256 at 48kHz: bins 2-18 contain most voice frequencies
            const voiceStartBin = Math.floor(frequencyData.length * 0.02); // ~300 Hz
            const voiceEndBin = Math.floor(frequencyData.length * 0.15); // ~3600 Hz
            const voiceRange = voiceEndBin - voiceStartBin;

            // Map each bar to a position within the voice frequency range
            // This ensures all 60 bars visualize frequencies where voice audio exists
            const binIndex = voiceStartBin + Math.floor((index / bars) * voiceRange);
            const frequencyValue = frequencyData[binIndex] || 0; // 0-255

            // Normalize to bar height (0-255 → 4-48px)
            // Apply boost for better visibility
            calculatedHeight = Math.max(4, (frequencyValue / 255) * barHeight * 1.3);
          } else {
            // Fallback to uniform level if no frequency data available
            calculatedHeight = Math.max(4, (level / 100) * barHeight);
          }
        }

        return (
          <div
            key={index}
            className={`
              w-0.5 rounded-full transition-all duration-100 ease-out
              ${isPaused ? 'bg-gray-300 dark:bg-gray-600' : 'bg-[#cc3399]'}
            `}
            style={{
              height: `${calculatedHeight}px`,
            }}
          />
        );
      })}
    </div>
  );
}
