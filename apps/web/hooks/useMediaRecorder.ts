/**
 * useMediaRecorder hook
 * Handles browser-based audio recording with MediaRecorder API
 * Supports both microphone and tab audio capture
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import fixWebmDuration from 'webm-duration-fix';
import {
  detectBestAudioFormat,
  isRecordingSupported,
  isTabAudioSupported,
  getPermissionErrorMessage,
  requestWakeLock,
  releaseWakeLock,
  type AudioFormat,
} from '@/utils/audio';
import { getRecordingStorage, type RecoverableRecording } from '@/utils/recordingStorage';
import { mixAudioStreams } from '@/utils/audioMixer';

export type RecordingSource = 'microphone' | 'tab-audio';

export type RecordingState = 'idle' | 'requesting-permission' | 'recording' | 'paused' | 'stopped';

export interface UseMediaRecorderOptions {
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: RecordingState) => void;
  onRecoveryAvailable?: (recordings: RecoverableRecording[]) => void;
  enableAutoSave?: boolean; // Default: true
}

export interface UseMediaRecorderReturn {
  // State
  state: RecordingState;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  warning: string | null; // Non-blocking warning (e.g., mic unavailable for tab audio)
  isSupported: boolean;
  canUseTabAudio: boolean;
  audioFormat: AudioFormat;

  // Actions
  startRecording: (source: RecordingSource, deviceId?: string) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  reset: () => void;
  markAsUploaded: () => Promise<void>; // Mark recording as uploaded, removes beforeunload warning and cleans IndexedDB
  loadRecoveredRecording: (blob: Blob, recordingDuration: number) => void; // Load a recovered recording into preview
  clearWarning: () => void; // Clear the warning message

  // Audio stream (for visualization)
  audioStream: MediaStream | null;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderReturn {
  const {
    onDataAvailable,
    onError,
    onStateChange,
    onRecoveryAvailable,
    enableAutoSave = true,
  } = options;

  // State
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-save refs
  const recordingIdRef = useRef<string | null>(null);
  const recordingSourceRef = useRef<RecordingSource | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasUploadedRef = useRef<boolean>(false);
  const durationRef = useRef<number>(0); // Track duration in ref for accurate storage

  // Audio mixer refs (for tab audio + microphone mixing)
  const mixerCleanupRef = useRef<(() => void) | null>(null);
  const originalStreamsRef = useRef<MediaStream[]>([]);

  // Capabilities
  const isSupported = isRecordingSupported();
  const canUseTabAudio = isTabAudioSupported();
  const audioFormat = detectBestAudioFormat();

  // Update state with callback
  const updateState = useCallback(
    (newState: RecordingState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  // Start duration timer (reset: true on initial start, false on resume)
  const startTimer = useCallback((reset: boolean = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (reset) {
      setDuration(0);
      durationRef.current = 0;
    }

    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const newDuration = prev + 1;
        durationRef.current = newDuration;
        return newDuration;
      });
    }, 1000);
  }, []);

  // Stop duration timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup mixer resources (AudioContext and original streams)
  const cleanupMixer = useCallback(() => {
    // Call mixer cleanup function (disconnects nodes, closes AudioContext)
    if (mixerCleanupRef.current) {
      mixerCleanupRef.current();
      mixerCleanupRef.current = null;
    }
    // Stop tracks from original streams (tab audio and microphone)
    originalStreamsRef.current.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    originalStreamsRef.current = [];
  }, []);

  // Clear warning message
  const clearWarning = useCallback(() => {
    setWarning(null);
  }, []);

  // Get media stream based on source
  const getMediaStream = useCallback(
    async (source: RecordingSource, deviceId?: string): Promise<MediaStream> => {
      if (source === 'microphone') {
        // Request microphone access with optional device selection
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        };

        // Add device ID if specified
        if (deviceId) {
          audioConstraints.deviceId = { exact: deviceId };
        }

        return await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
      } else {
        // Request tab audio capture (getDisplayMedia) with microphone mixing
        if (!canUseTabAudio) {
          throw new Error(
            'Tab audio capture is not supported in your browser. Please use Chrome or Edge.'
          );
        }

        // Step 1: Request screen/tab sharing with audio
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // Required, but we'll only use audio
          audio: true,
        });

        // Stop video track immediately (we only want audio)
        const videoTrack = displayStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          displayStream.removeTrack(videoTrack);
        }

        // Check if audio track exists
        const tabAudioTrack = displayStream.getAudioTracks()[0];
        if (!tabAudioTrack) {
          throw new Error(
            'No audio track available. Make sure to check "Share tab audio" when selecting the tab.'
          );
        }

        // Step 2: Try to get microphone for mixing (graceful failure)
        let micStream: MediaStream | null = null;
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
          });
          console.log('[useMediaRecorder] Microphone acquired for mixing with tab audio');
        } catch (micError) {
          // Microphone denied or unavailable - continue with tab audio only
          const errorMessage =
            micError instanceof Error && micError.name === 'NotAllowedError'
              ? 'Microphone access denied - recording tab audio only. Your voice won\'t be included.'
              : 'Microphone unavailable - recording tab audio only. Your voice won\'t be included.';
          console.warn('[useMediaRecorder] Microphone unavailable for mixing:', micError);
          setWarning(errorMessage);
          return displayStream;
        }

        // Step 3: Mix both streams using Web Audio API
        try {
          const { mixedStream, cleanup } = await mixAudioStreams([displayStream, micStream]);

          // Store references for cleanup
          mixerCleanupRef.current = cleanup;
          originalStreamsRef.current = [displayStream, micStream];

          console.log('[useMediaRecorder] Tab audio + microphone mixed successfully');
          return mixedStream;
        } catch (mixError) {
          // Mixing failed - fall back to tab audio only
          console.error('[useMediaRecorder] Audio mixing failed, using tab audio only:', mixError);
          setWarning('Audio mixing failed - recording tab audio only. Your voice won\'t be included.');
          // Stop mic stream since we can't use it
          micStream.getTracks().forEach((track) => track.stop());
          return displayStream;
        }
      }
    },
    [canUseTabAudio]
  );

  // Start recording
  const startRecording = useCallback(
    async (source: RecordingSource, deviceId?: string) => {
      try {
        // Reset previous state
        setError(null);
        setWarning(null);
        setAudioBlob(null);
        chunksRef.current = [];
        hasUploadedRef.current = false;

        // Generate unique recording ID for auto-save
        recordingIdRef.current = `recording-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        recordingSourceRef.current = source;

        // Check support
        if (!isSupported) {
          throw new Error('Audio recording is not supported in your browser.');
        }

        updateState('requesting-permission');

        // Get media stream (with optional device ID for microphone selection)
        const stream = await getMediaStream(source, deviceId);
        streamRef.current = stream;
        setAudioStream(stream);

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: audioFormat.mimeType,
        });

        mediaRecorderRef.current = mediaRecorder;

        // Handle data available
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        // Handle recording stop
        mediaRecorder.onstop = async () => {
          const rawBlob = new Blob(chunksRef.current, { type: audioFormat.mimeType });

          // Fix WebM duration metadata bug
          // MediaRecorder creates WebM files without duration metadata because the header
          // is written before recording ends. This causes audio to stop early during playback.
          // See: https://bugs.chromium.org/p/chromium/issues/detail?id=642012
          // Using webm-duration-fix which auto-calculates duration from blob content
          let blob: Blob;
          try {
            const fixedBlob = await fixWebmDuration(rawBlob);

            // Ensure the fixed blob has the correct MIME type
            // webm-duration-fix may return a blob without proper type
            if (!fixedBlob.type || fixedBlob.type !== audioFormat.mimeType) {
              blob = new Blob([fixedBlob], { type: audioFormat.mimeType });
            } else {
              blob = fixedBlob;
            }
          } catch (err) {
            console.warn('[useMediaRecorder] Failed to fix WebM duration, using raw blob:', err);
            blob = rawBlob;
          }

          setAudioBlob(blob);
          onDataAvailable?.(blob);

          // DO NOT clean up IndexedDB here - keep the backup until upload/transcription succeeds
          // The backup will be cleaned up by markAsUploaded() after successful upload
          // This protects against: upload failures, transcription failures, accidental tab close, etc.

          // Cleanup
          stopTimer();
          releaseWakeLock(wakeLockRef.current);
          wakeLockRef.current = null;

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setAudioStream(null);

          // Clean up audio mixer resources (if used for tab audio + mic mixing)
          cleanupMixer();

          updateState('stopped');
        };

        // Handle errors
        mediaRecorder.onerror = (event) => {
          const error = new Error('Recording failed');
          setError(getPermissionErrorMessage(error));
          onError?.(error);
          updateState('idle');
        };

        // Start recording
        // Use smaller timeslice (100ms) to ensure we don't lose audio at the end
        // Larger timeslices (1000ms) can cause the last partial chunk to be lost
        mediaRecorder.start(100);
        updateState('recording');
        startTimer();

        // Request wake lock (prevent screen sleep on mobile)
        wakeLockRef.current = await requestWakeLock();
      } catch (err) {
        const error = err as Error;
        const errorMessage = getPermissionErrorMessage(error);
        setError(errorMessage);
        onError?.(error);
        updateState('idle');

        // Clean up any partially initialized resources
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setAudioStream(null);
        cleanupMixer();
      }
    },
    [
      isSupported,
      audioFormat,
      getMediaStream,
      onDataAvailable,
      onError,
      startTimer,
      stopTimer,
      updateState,
      cleanupMixer,
    ]
  );

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state !== 'idle' && state !== 'stopped') {
      // Simply call stop() - MediaRecorder will automatically fire one final
      // ondataavailable event with any remaining data before onstop fires
      // Note: Do NOT call requestData() before stop() - this can cause race conditions
      // where the blob is created before the final data chunk is available
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      updateState('paused');
    }
  }, [state, stopTimer, updateState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer(false); // Don't reset duration when resuming
      updateState('recording');
    }
  }, [state, startTimer, updateState]);

  // Mark recording as uploaded (clean up IndexedDB, remove beforeunload warning)
  const markAsUploaded = useCallback(async () => {
    hasUploadedRef.current = true;

    // Clean up IndexedDB after successful upload
    if (enableAutoSave && recordingIdRef.current) {
      try {
        const storage = await getRecordingStorage();
        await storage.deleteRecording(recordingIdRef.current);
        console.log('[useMediaRecorder] Cleaned up IndexedDB after upload');
      } catch (err) {
        console.error('[useMediaRecorder] Failed to clean up IndexedDB:', err);
      }
    }
  }, [enableAutoSave]);

  // Reset to initial state
  const reset = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current && state !== 'idle' && state !== 'stopped') {
      mediaRecorderRef.current.stop();
    }

    // Clear all state
    stopTimer();
    setDuration(0);
    setAudioBlob(null);
    setError(null);
    setWarning(null);
    chunksRef.current = [];
    hasUploadedRef.current = false;
    recordingIdRef.current = null;
    recordingSourceRef.current = null;

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioStream(null);

    // Clean up audio mixer resources
    cleanupMixer();

    // Release wake lock
    releaseWakeLock(wakeLockRef.current);
    wakeLockRef.current = null;

    updateState('idle');
  }, [state, stopTimer, updateState, cleanupMixer]);

  // Load a recovered recording into preview (for recovery flow)
  const loadRecoveredRecording = useCallback(
    (blob: Blob, recordingDuration: number) => {
      // Set the audio blob and duration
      setAudioBlob(blob);
      setDuration(recordingDuration);
      durationRef.current = recordingDuration;

      // Set state to 'stopped' to trigger preview UI
      updateState('stopped');

      // Mark as not uploaded yet (will trigger beforeunload warning)
      hasUploadedRef.current = false;

      console.log(
        `[useMediaRecorder] Loaded recovered recording (${recordingDuration}s) into preview`
      );
    },
    [updateState]
  );

  // Auto-save recording chunks to IndexedDB
  const saveRecordingToStorage = useCallback(async () => {
    if (!enableAutoSave || !recordingIdRef.current || chunksRef.current.length === 0) {
      return;
    }

    try {
      const storage = await getRecordingStorage();
      const currentDuration = durationRef.current; // Use ref for accurate duration
      await storage.saveRecording({
        id: recordingIdRef.current,
        startTime: Date.now() - currentDuration * 1000,
        chunks: [...chunksRef.current],
        duration: currentDuration,
        mimeType: audioFormat.mimeType,
        source: recordingSourceRef.current || 'microphone',
        lastSaved: Date.now(),
      });
      console.log(`[useMediaRecorder] Auto-saved recording to IndexedDB (${currentDuration}s)`);
    } catch (err) {
      console.error('[useMediaRecorder] Failed to auto-save recording:', err);
      // Non-critical error, continue recording
    }
  }, [enableAutoSave, audioFormat.mimeType]);

  // Check for recoverable recordings on mount
  useEffect(() => {
    if (!enableAutoSave) return;

    const checkForRecovery = async () => {
      try {
        const storage = await getRecordingStorage();
        const allRecordings = await storage.getAllRecordings();

        // Filter out recordings that are less than 2 seconds old
        // These are likely from the current session (user just opened the page)
        // Only show recordings that are at least 2 seconds old (indicating a crash/close)
        const twoSecondsAgo = Date.now() - 2 * 1000;
        const recoverableRecordings = allRecordings.filter(
          (recording) => recording.lastSaved < twoSecondsAgo
        );

        if (recoverableRecordings && recoverableRecordings.length > 0) {
          console.log(
            `[useMediaRecorder] Found ${recoverableRecordings.length} recoverable recording(s)`
          );
          onRecoveryAvailable?.(recoverableRecordings);
        }

        // Auto-cleanup recordings older than 7 days
        await storage.cleanupOldRecordings(7);
      } catch (err) {
        console.error('[useMediaRecorder] Failed to check for recovery:', err);
      }
    };

    checkForRecovery();
  }, [enableAutoSave, onRecoveryAvailable]);

  // Auto-save interval (every 5 seconds during recording)
  useEffect(() => {
    if (!enableAutoSave) return;

    if (state === 'recording' || state === 'paused') {
      // Start auto-save interval
      autoSaveIntervalRef.current = setInterval(() => {
        saveRecordingToStorage();
      }, 5000); // Save every 5 seconds

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
          autoSaveIntervalRef.current = null;
        }
      };
    }
  }, [state, enableAutoSave, saveRecordingToStorage]);

  // beforeunload protection (warn user before closing tab/browser)
  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      // Warn if recording is active or stopped but not uploaded
      if (
        state === 'recording' ||
        state === 'paused' ||
        (state === 'stopped' && audioBlob && !hasUploadedRef.current)
      ) {
        event.preventDefault();
        event.returnValue = true; // Legacy support for older browsers
      }
    };

    if (
      state === 'recording' ||
      state === 'paused' ||
      (state === 'stopped' && audioBlob && !hasUploadedRef.current)
    ) {
      window.addEventListener('beforeunload', beforeUnloadHandler);
    }

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [state, audioBlob]);

  // Page Visibility API (auto-save when tab switches, re-acquire wake lock on return)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or minimized browser - immediate save
        if ((state === 'recording' || state === 'paused') && recordingIdRef.current) {
          console.log('[useMediaRecorder] Tab hidden, saving recording immediately');
          await saveRecordingToStorage();
        }
      } else if (document.visibilityState === 'visible') {
        // Tab became visible again - re-acquire wake lock if recording
        if (state === 'recording' && !wakeLockRef.current) {
          console.log('[useMediaRecorder] Tab visible again, re-acquiring wake lock');
          wakeLockRef.current = await requestWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, saveRecordingToStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      releaseWakeLock(wakeLockRef.current);
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      // Clean up audio mixer resources
      if (mixerCleanupRef.current) {
        mixerCleanupRef.current();
      }
      originalStreamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
    };
  }, [stopTimer]);

  return {
    // State
    state,
    duration,
    audioBlob,
    error,
    warning,
    isSupported,
    canUseTabAudio,
    audioFormat,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    markAsUploaded,
    loadRecoveredRecording,
    clearWarning,

    // Audio stream
    audioStream,
  };
}
