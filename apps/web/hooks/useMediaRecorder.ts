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
import { mergeRecoveredWithNew } from '@/utils/audioMerge';
import { HotSwapRecorder } from '@/utils/hotSwapRecorder';
import { ChunkUploader, type UploadProgress } from '@/utils/chunkUploader';

// Duration limits (defaults, can be overridden via options)
const DEFAULT_MAX_RECORDING_DURATION = 3 * 60 * 60; // 3 hours in seconds
const DEFAULT_DURATION_WARNING_THRESHOLD = 2.5 * 60 * 60; // 2.5 hours - warn user
const DURATION_WARNING_BUFFER = 4 * 60; // Warn 4 minutes before limit

export type RecordingSource = 'microphone' | 'tab-audio';

/**
 * Stored chunk format for iOS Safari compatibility.
 * Blobs stored in React state/refs can become stale on iOS Safari,
 * so we store as ArrayBuffer which is more reliable.
 */
interface StoredChunk {
  buffer: ArrayBuffer;
  type: string;
}

export type RecordingState = 'idle' | 'requesting-permission' | 'recording' | 'paused' | 'stopped';

export interface UseMediaRecorderOptions {
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: RecordingState) => void;
  onRecoveryAvailable?: (recordings: RecoverableRecording[]) => void;
  onDurationWarning?: () => void; // Called when approaching max duration
  onMaxDurationReached?: () => void; // Called when auto-stopped at max duration
  onDeviceSwapped?: (deviceId: string) => void; // Called when microphone is swapped mid-recording
  enableAutoSave?: boolean; // Default: true
  userId?: string; // Firebase user ID for scoping recordings (privacy/security)
  maxDurationSeconds?: number; // Tier-specific limit (undefined = 3 hours default)
  // Cloud upload options (Phase 4: chunked uploads to Firebase Storage)
  enableCloudUpload?: boolean; // Upload chunks to Firebase during recording
  onUploadProgress?: (progress: UploadProgress) => void; // Called on chunk upload progress
  onUploadError?: (error: Error, recoverable: boolean) => void; // Called on chunk upload error
}

export interface UseMediaRecorderReturn {
  // State
  state: RecordingState;
  duration: number;
  maxDuration: number; // Effective max duration in seconds (for countdown display)
  audioBlob: Blob | null;
  error: string | null;
  warning: string | null; // Non-blocking warning (e.g., mic unavailable for tab audio)
  isSupported: boolean;
  canUseTabAudio: boolean;
  audioFormat: AudioFormat;
  currentDeviceId: string | null; // Currently active microphone device ID
  isSwappingDevice: boolean; // True while swapping microphone
  isStopping: boolean; // True while stop is in progress (prevents double-click)
  // Cloud upload state
  uploadProgress: UploadProgress | null; // Current upload progress (if cloud upload enabled)
  cloudSessionId: string | null; // Firebase session ID for backend processing

  // Actions
  startRecording: (source: RecordingSource, deviceId?: string) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  reset: () => void;
  markAsUploaded: () => Promise<void>; // Mark recording as uploaded, removes beforeunload warning and cleans IndexedDB
  createMarkAsUploaded: () => () => Promise<void>; // Factory to create a markAsUploaded callback that captures current recording ID
  loadRecoveredRecording: (blob: Blob, recordingDuration: number) => void; // Load a recovered recording into preview
  prepareForContinue: (chunks: Blob[], previousDuration: number, source: RecordingSource, recordingId: string) => Promise<void>; // Prepare to continue from a recovered recording (async to convert Blobs to ArrayBuffer for iOS Safari)
  clearWarning: () => void; // Clear the warning message
  swapMicrophone: (deviceId: string) => Promise<void>; // Swap microphone mid-recording (microphone source only)

  // Audio stream (for visualization via useAudioVisualization)
  audioStream: MediaStream | null;

  // Recording source (for conditional UI rendering)
  recordingSource: RecordingSource | null;

  // Chunk count for tab audio visualization (increments on each ondataavailable)
  chunkCount: number;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderReturn {
  const {
    onDataAvailable,
    onError,
    onStateChange,
    onRecoveryAvailable,
    onDurationWarning,
    onMaxDurationReached,
    onDeviceSwapped,
    enableAutoSave = true,
    userId,
    maxDurationSeconds,
    enableCloudUpload = false,
    onUploadProgress,
    onUploadError,
  } = options;

  // Calculate effective limits based on options
  const effectiveMaxDuration = maxDurationSeconds ?? DEFAULT_MAX_RECORDING_DURATION;
  const effectiveWarningThreshold = maxDurationSeconds
    ? maxDurationSeconds - DURATION_WARNING_BUFFER // Warn 4 mins before custom limit
    : DEFAULT_DURATION_WARNING_THRESHOLD;

  // State
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [recordingSource, setRecordingSource] = useState<RecordingSource | null>(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isSwappingDevice, setIsSwappingDevice] = useState(false);
  const [isStopping, setIsStopping] = useState(false); // Prevents double-click on stop button
  // Cloud upload state
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [cloudSessionId, setCloudSessionId] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const hotSwapRecorderRef = useRef<HotSwapRecorder | null>(null);
  const chunkUploaderRef = useRef<ChunkUploader | null>(null);
  const stateRef = useRef<RecordingState>(state); // Ref for state to avoid stale closure in swapMicrophone
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

  // Chunk count ref to avoid frequent state updates from ondataavailable (fires every 100ms)
  const chunkCountRef = useRef<number>(0);

  // Duration warning ref (to avoid showing warning multiple times)
  const durationWarningShownRef = useRef<boolean>(false);

  // Continue recording refs (for recovery flow)
  // We store as StoredChunk[] (ArrayBuffer) instead of Blob[] for iOS Safari compatibility
  // iOS Safari's Blob references can become stale when stored in React state/refs
  const recoveredChunksRef = useRef<StoredChunk[]>([]);
  const recoveredDurationRef = useRef<number>(0);
  const isContinueModeRef = useRef<boolean>(false);
  const recoveredRecordingIdRef = useRef<string | null>(null);
  // Track if current recording session is a continuation (set when recording starts, used in onstop)
  const wasInContinueModeRef = useRef<boolean>(false);
  // Store a copy of recovered chunks for merging in onstop (separate from chunksRef which gets new chunks appended)
  const recoveredChunksCopyRef = useRef<StoredChunk[]>([]);

  // Capabilities
  const isSupported = isRecordingSupported();
  const canUseTabAudio = isTabAudioSupported();
  const audioFormat = detectBestAudioFormat();

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Update state with callback
  const updateState = useCallback(
    (newState: RecordingState) => {
      setState(newState);
      stateRef.current = newState; // Also update ref immediately
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
      durationWarningShownRef.current = false;
    }

    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const newDuration = prev + 1;
        durationRef.current = newDuration;

        // Sync chunkCount ref to state once per second (avoids 10x/sec updates from ondataavailable)
        setChunkCount(chunkCountRef.current);

        // Check duration limits (using effective limits based on tier)
        if (newDuration >= effectiveMaxDuration) {
          // Auto-stop at max duration
          console.log('[useMediaRecorder] Max duration reached, auto-stopping');
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          onMaxDurationReached?.();
        } else if (newDuration >= effectiveWarningThreshold && !durationWarningShownRef.current) {
          // Warn user when approaching limit
          durationWarningShownRef.current = true;
          onDurationWarning?.();
        }

        return newDuration;
      });
    }, 1000);
  }, [onDurationWarning, onMaxDurationReached, effectiveMaxDuration, effectiveWarningThreshold]);

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
      // Check if mediaDevices API is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices) {
        throw new Error(
          'Recording is not available. Please ensure you are using HTTPS or localhost.'
        );
      }

      if (source === 'microphone') {
        if (!navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'Microphone recording is not supported in your browser.'
          );
        }

        // Request microphone access with optional device selection
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        };

        // Add deviceId if provided - use { exact: } to ensure the specific device is used
        // Without exact, Chrome may fall back to a different device
        if (deviceId) {
          audioConstraints.deviceId = { exact: deviceId };
        }

        return await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
      } else {
        // Tab audio recording - auto-gain is NOT applied here
        // Auto-gain is designed for microphone normalization, not for mixed/tab audio
        // Request tab audio capture (getDisplayMedia) with microphone mixing
        if (!canUseTabAudio) {
          throw new Error(
            'Tab audio capture is not supported in your browser. Please use Chrome or Edge.'
          );
        }

        // Step 1: Request microphone FIRST (before tab selection) - only if deviceId provided
        // When deviceId is undefined, user opted out of microphone mixing (tab audio only)
        let micStream: MediaStream | null = null;
        if (deviceId) {
          try {
            // Use exact deviceId to ensure the specific device is used
            const micConstraints: MediaTrackConstraints = {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
              deviceId: { exact: deviceId }, // Use selected microphone device
            };

            micStream = await navigator.mediaDevices.getUserMedia({
              audio: micConstraints,
            });
            const micTrack = micStream.getAudioTracks()[0];
            console.log(`[useMediaRecorder] Microphone acquired for mixing: "${micTrack?.label}"`);
          } catch (micError) {
            // Microphone denied or unavailable - warn but continue
            const errorMessage =
              micError instanceof Error && micError.name === 'NotAllowedError'
                ? 'Microphone access denied - recording tab audio only. Your voice won\'t be included.'
                : 'Microphone unavailable - recording tab audio only. Your voice won\'t be included.';
            console.warn('[useMediaRecorder] Microphone unavailable for mixing:', micError);
            setWarning(errorMessage);
          }
        } else {
          console.log('[useMediaRecorder] Tab audio only mode (microphone not requested)');
        }

        // Step 2: Request screen/tab sharing with audio
        let displayStream: MediaStream;
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true, // Required, but we'll only use audio
            audio: true,
          });
        } catch (displayError) {
          // User cancelled tab selection - clean up mic stream if it was acquired
          if (micStream) {
            micStream.getTracks().forEach((track) => track.stop());
          }
          throw displayError;
        }

        // Stop video track immediately (we only want audio)
        const videoTrack = displayStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          displayStream.removeTrack(videoTrack);
        }

        // Check if audio track exists
        const tabAudioTrack = displayStream.getAudioTracks()[0];
        if (!tabAudioTrack) {
          // Clean up mic stream if no tab audio
          if (micStream) {
            micStream.getTracks().forEach((track) => track.stop());
          }
          throw new Error(
            'No audio track available. Make sure to check "Share tab audio" when selecting the tab.'
          );
        }

        // Step 3: If we have microphone, mix both streams using Web Audio API
        if (micStream) {
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

        // No microphone available - return tab audio only
        return displayStream;
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
        hasUploadedRef.current = false;

        // Check if we're in continue mode (recovering from previous recording)
        if (isContinueModeRef.current) {
          // Continue mode: store recovered chunks separately for proper merging in onstop
          // We DON'T add recovered chunks to chunksRef - instead we'll merge them later
          // This avoids the WebM header concatenation problem
          wasInContinueModeRef.current = true;
          recoveredChunksCopyRef.current = [...recoveredChunksRef.current];
          chunksRef.current = []; // Start fresh - new chunks only
          setDuration(recoveredDurationRef.current);
          durationRef.current = recoveredDurationRef.current;
          // Use the original recording ID for IndexedDB updates
          recordingIdRef.current = recoveredRecordingIdRef.current;
          console.log(
            `[useMediaRecorder] Continue mode: will merge ${recoveredChunksCopyRef.current.length} recovered chunks with new recording`
          );
        } else {
          // Fresh recording: reset everything
          chunksRef.current = [];
          setDuration(0);
          durationRef.current = 0;
          // Generate unique recording ID for auto-save
          recordingIdRef.current = `recording-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        }

        // Reset audio visualization state
        chunkCountRef.current = 0;
        setChunkCount(0);
        setRecordingSource(source);
        recordingSourceRef.current = source;

        // Reset cloud upload state
        setUploadProgress(null);
        setCloudSessionId(null);

        // Initialize ChunkUploader if cloud upload is enabled
        if (enableCloudUpload && userId) {
          const uploader = new ChunkUploader(userId, source, 'audio/webm');
          uploader.setOnProgress((progress) => {
            setUploadProgress(progress);
            onUploadProgress?.(progress);
          });
          uploader.setOnError((error, recoverable) => {
            onUploadError?.(error, recoverable);
          });
          chunkUploaderRef.current = uploader;
          setCloudSessionId(uploader.currentSessionId);
          console.log(`[useMediaRecorder] ChunkUploader initialized: ${uploader.currentSessionId}`);
        }

        // Check support
        if (!isSupported) {
          throw new Error('Audio recording is not supported in your browser.');
        }

        updateState('requesting-permission');

        let mediaRecorder: MediaRecorder;

        // For microphone recordings, use HotSwapRecorder to enable mid-recording device switching
        if (source === 'microphone') {
          // Create and initialize HotSwapRecorder
          const hotSwapRecorder = new HotSwapRecorder({
            onDataAvailable: (event) => {
              if (event.data && event.data.size > 0) {
                chunksRef.current.push(event.data);
                chunkCountRef.current += 1;
                // Upload chunk to Firebase Storage if cloud upload is enabled
                if (chunkUploaderRef.current) {
                  chunkUploaderRef.current.addData(event.data);
                }
              }
            },
            onError: (err) => {
              setError(getPermissionErrorMessage(err));
              onError?.(err);
              updateState('idle');
            },
            onDeviceSwapped: (newDeviceId) => {
              setCurrentDeviceId(newDeviceId);
              onDeviceSwapped?.(newDeviceId);
            },
            timeslice: 10000,
          });

          await hotSwapRecorder.initialize(deviceId);
          hotSwapRecorderRef.current = hotSwapRecorder;

          // Use the output stream for visualization
          const outputStream = hotSwapRecorder.outputStream;
          if (outputStream) {
            streamRef.current = outputStream;
            setAudioStream(outputStream);
          }

          // Track the current device
          setCurrentDeviceId(deviceId || null);

          // Get the internal MediaRecorder for event handling
          const internalRecorder = hotSwapRecorder.recorder;
          if (!internalRecorder) {
            throw new Error('HotSwapRecorder internal MediaRecorder not available');
          }
          mediaRecorder = internalRecorder;
          mediaRecorderRef.current = mediaRecorder;
        } else {
          // For tab audio, use standard MediaRecorder (hot-swap not applicable)
          const stream = await getMediaStream(source, deviceId);
          streamRef.current = stream;
          setAudioStream(stream);

          // Create MediaRecorder
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: audioFormat.mimeType,
          });

          mediaRecorderRef.current = mediaRecorder;

          // Handle data available for tab audio
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              chunksRef.current.push(event.data);
              chunkCountRef.current += 1;
              // Upload chunk to Firebase Storage if cloud upload is enabled
              if (chunkUploaderRef.current) {
                chunkUploaderRef.current.addData(event.data);
              }
            }
          };
        }

        // Handle recording stop
        mediaRecorder.onstop = async () => {
          let blob: Blob;

          console.log('[useMediaRecorder] onstop fired');
          console.log(`  - wasInContinueModeRef: ${wasInContinueModeRef.current}`);
          console.log(`  - recoveredChunksCopyRef: ${recoveredChunksCopyRef.current.length} chunks`);
          console.log(`  - chunksRef (new): ${chunksRef.current.length} chunks`);

          // Check if this was a continued recording (has recovered chunks to merge)
          if (wasInContinueModeRef.current && recoveredChunksCopyRef.current.length > 0) {
            // Convert StoredChunks (ArrayBuffer) back to Blobs for merging
            // We stored as ArrayBuffer to avoid iOS Safari stale Blob reference issue
            const recoveredBlobs = recoveredChunksCopyRef.current.map(
              (chunk) => new Blob([chunk.buffer], { type: chunk.type })
            );

            // Merge recovered chunks with new chunks using proper audio decoding/encoding
            // This creates a properly-formatted audio file that Web Audio API can decode fully
            const recoveredTotalSize = recoveredBlobs.reduce((s, c) => s + c.size, 0);
            const newTotalSize = chunksRef.current.reduce((s, c) => s + c.size, 0);
            console.log(
              `[useMediaRecorder] Merging ${recoveredBlobs.length} recovered chunks (${recoveredTotalSize} bytes) with ${chunksRef.current.length} new chunks (${newTotalSize} bytes)`
            );

            try {
              const { blob: mergedBlob } = await mergeRecoveredWithNew(
                recoveredBlobs,
                chunksRef.current,
                audioFormat.mimeType
              );
              blob = mergedBlob;
              console.log('[useMediaRecorder] Audio merge successful');
            } catch (err) {
              console.error('[useMediaRecorder] Audio merge failed, falling back to concatenation:', err);
              // Fallback: concatenate chunks (waveform may not work, but audio should play)
              const rawBlob = new Blob(
                [...recoveredBlobs, ...chunksRef.current],
                { type: audioFormat.mimeType }
              );
              try {
                const fixedBlob = await fixWebmDuration(rawBlob);
                blob = fixedBlob.type === audioFormat.mimeType
                  ? fixedBlob
                  : new Blob([fixedBlob], { type: audioFormat.mimeType });
              } catch {
                blob = rawBlob;
              }
            }

            // Clear continue mode state
            wasInContinueModeRef.current = false;
            recoveredChunksCopyRef.current = [];
          } else {
            // Normal recording (not continued) - use standard WebM duration fix
            const rawBlob = new Blob(chunksRef.current, { type: audioFormat.mimeType });

            // Fix WebM duration metadata bug
            // MediaRecorder creates WebM files without duration metadata because the header
            // is written before recording ends. This causes audio to stop early during playback.
            // See: https://bugs.chromium.org/p/chromium/issues/detail?id=642012
            // Using webm-duration-fix which auto-calculates duration from blob content
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
          }

          setAudioBlob(blob);
          onDataAvailable?.(blob);

          // Finalize cloud upload if enabled
          if (chunkUploaderRef.current) {
            try {
              const sessionId = await chunkUploaderRef.current.finalize(durationRef.current);
              setCloudSessionId(sessionId);
              console.log(`[useMediaRecorder] Cloud upload finalized: ${sessionId}`);
            } catch (err) {
              console.error('[useMediaRecorder] Failed to finalize cloud upload:', err);
              // Don't block - local blob is still available
            }
            chunkUploaderRef.current = null;
          }

          // DO NOT clean up IndexedDB here - keep the backup until upload/transcription succeeds
          // The backup will be cleaned up by markAsUploaded() after successful upload
          // This protects against: upload failures, transcription failures, accidental tab close, etc.

          // Cleanup
          stopTimer();
          releaseWakeLock(wakeLockRef.current);
          wakeLockRef.current = null;

          // Clean up HotSwapRecorder if used (for microphone source)
          if (hotSwapRecorderRef.current) {
            hotSwapRecorderRef.current.dispose();
            hotSwapRecorderRef.current = null;
          }

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setAudioStream(null);

          // Reset device tracking
          setCurrentDeviceId(null);

          // Clean up audio mixer resources (if used for tab audio + mic mixing)
          cleanupMixer();

          // Reset stopping flag now that we're done
          setIsStopping(false);

          updateState('stopped');
        };

        // Handle errors
        mediaRecorder.onerror = () => {
          const error = new Error('Recording failed');
          setError(getPermissionErrorMessage(error));
          onError?.(error);
          updateState('idle');
        };

        // Start recording with 10 second timeslice
        // Larger timeslice = fewer callbacks = less resource pressure for long recordings
        // Worst case data loss on crash: ~10 seconds (acceptable for meeting recordings)
        mediaRecorder.start(10000);
        updateState('recording');
        // Don't reset timer in continue mode - duration was already set from recovered recording
        startTimer(!isContinueModeRef.current);
        // Clear continue mode after starting (it's a one-time setup)
        isContinueModeRef.current = false;
        recoveredChunksRef.current = [];
        recoveredDurationRef.current = 0;
        recoveredRecordingIdRef.current = null;

        // Request wake lock (prevent screen sleep on mobile)
        wakeLockRef.current = await requestWakeLock();
      } catch (err) {
        const error = err as Error;
        const errorMessage = getPermissionErrorMessage(error);
        setError(errorMessage);
        onError?.(error);
        updateState('idle');

        // Clean up any partially initialized resources
        if (hotSwapRecorderRef.current) {
          hotSwapRecorderRef.current.dispose();
          hotSwapRecorderRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setAudioStream(null);
        setCurrentDeviceId(null);
        cleanupMixer();
      }
    },
    [
      isSupported,
      audioFormat,
      getMediaStream,
      onDataAvailable,
      onDeviceSwapped,
      onError,
      startTimer,
      stopTimer,
      updateState,
      cleanupMixer,
      enableCloudUpload,
      userId,
      onUploadProgress,
      onUploadError,
    ]
  );

  // Stop recording
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    // Prevent double-clicks - if we're already stopping, ignore
    if (isStopping) {
      console.log('[useMediaRecorder] Already stopping, ignoring duplicate stop request');
      return;
    }

    // Check the ACTUAL MediaRecorder state, not just React state
    // This is critical for iOS Safari where the recorder can become 'inactive'
    // unexpectedly (e.g., due to audio session interruptions, tab backgrounding)
    if (recorder.state === 'inactive') {
      console.warn('[useMediaRecorder] MediaRecorder already inactive, cannot call stop()');
      // Don't do anything here - if the recorder is inactive, onstop should have
      // already fired and handled the blob creation. Creating a new blob here
      // would overwrite the correctly merged audio in continue mode.
      return;
    }

    // Also verify React state as a secondary check
    if (state === 'idle' || state === 'stopped') {
      return;
    }

    // Mark as stopping to prevent double-clicks
    setIsStopping(true);

    // Clear auto-save interval immediately - don't wait for state change
    // This prevents unnecessary saves during the async merge process
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    // Simply call stop() - MediaRecorder will automatically fire one final
    // ondataavailable event with any remaining data before onstop fires
    // Note: Do NOT call requestData() before stop() - this can cause race conditions
    // where the blob is created before the final data chunk is available
    recorder.stop();
  }, [state, isStopping]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || state !== 'recording') return;

    // Check actual MediaRecorder state (iOS Safari can have unexpected state changes)
    if (recorder.state !== 'recording') {
      console.warn(`[useMediaRecorder] Cannot pause: MediaRecorder state is '${recorder.state}'`);
      return;
    }

    recorder.pause();
    stopTimer();
    updateState('paused');
  }, [state, stopTimer, updateState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || state !== 'paused') return;

    // Check actual MediaRecorder state (iOS Safari can have unexpected state changes)
    if (recorder.state !== 'paused') {
      console.warn(`[useMediaRecorder] Cannot resume: MediaRecorder state is '${recorder.state}'`);
      return;
    }

    recorder.resume();
    startTimer(false); // Don't reset duration when resuming
    updateState('recording');
  }, [state, startTimer, updateState]);

  // Create a markAsUploaded callback that captures the current recording ID
  // This is necessary because reset() clears recordingIdRef.current, but we need
  // to delete the recording from IndexedDB after processing completes (which happens later)
  const createMarkAsUploaded = useCallback(() => {
    // Capture the recording ID at the time this callback is created
    const capturedRecordingId = recordingIdRef.current;

    return async () => {
      hasUploadedRef.current = true;

      // Clean up IndexedDB after successful upload
      if (enableAutoSave && capturedRecordingId) {
        try {
          const storage = await getRecordingStorage();
          await storage.deleteRecording(capturedRecordingId);
          console.log('[useMediaRecorder] Cleaned up IndexedDB after upload, recordingId:', capturedRecordingId);
        } catch (err) {
          console.error('[useMediaRecorder] Failed to clean up IndexedDB:', err);
        }
      }
    };
  }, [enableAutoSave]);

  // Legacy markAsUploaded for backwards compatibility (uses current ref value)
  const markAsUploaded = useCallback(async () => {
    const callback = createMarkAsUploaded();
    await callback();
  }, [createMarkAsUploaded]);

  // Reset to initial state
  const reset = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current && state !== 'idle' && state !== 'stopped') {
      mediaRecorderRef.current.stop();
    }

    // Clean up HotSwapRecorder if used
    if (hotSwapRecorderRef.current) {
      hotSwapRecorderRef.current.dispose();
      hotSwapRecorderRef.current = null;
    }

    // Clean up ChunkUploader if used
    if (chunkUploaderRef.current) {
      chunkUploaderRef.current.abort();
      chunkUploaderRef.current = null;
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

    // Reset audio visualization state
    chunkCountRef.current = 0;
    setChunkCount(0);
    setRecordingSource(null);

    // Reset device tracking state
    setCurrentDeviceId(null);
    setIsSwappingDevice(false);
    setIsStopping(false);

    // Reset cloud upload state
    setUploadProgress(null);
    setCloudSessionId(null);

    // Reset continue mode state
    recoveredChunksRef.current = [];
    recoveredDurationRef.current = 0;
    isContinueModeRef.current = false;
    recoveredRecordingIdRef.current = null;
    wasInContinueModeRef.current = false;
    recoveredChunksCopyRef.current = [];

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

  // Prepare for continue recording (from recovery flow)
  // Must be called BEFORE startRecording when continuing from a recovered recording
  // IMPORTANT: We immediately convert Blobs to ArrayBuffers to prevent iOS Safari stale reference issues
  const prepareForContinue = useCallback(
    async (chunks: Blob[], previousDuration: number, source: RecordingSource, recordingId: string) => {
      // Convert Blobs to StoredChunks immediately to avoid iOS Safari stale Blob issue
      // On iOS Safari, Blobs from IndexedDB can become empty after being stored in React state
      console.log(
        `[useMediaRecorder] Converting ${chunks.length} chunks to ArrayBuffer for iOS Safari compatibility...`
      );
      const storedChunks: StoredChunk[] = [];
      for (const chunk of chunks) {
        const buffer = await chunk.arrayBuffer();
        storedChunks.push({ buffer, type: chunk.type });
      }
      const totalSize = storedChunks.reduce((s, c) => s + c.buffer.byteLength, 0);
      console.log(
        `[useMediaRecorder] Converted ${storedChunks.length} chunks, total size: ${totalSize} bytes`
      );

      recoveredChunksRef.current = storedChunks;
      recoveredDurationRef.current = previousDuration;
      isContinueModeRef.current = true;
      recoveredRecordingIdRef.current = recordingId;
      setRecordingSource(source);
      console.log(
        `[useMediaRecorder] Prepared for continue mode: ${previousDuration}s, ${storedChunks.length} chunks, recordingId: ${recordingId}`
      );
    },
    []
  );

  // Auto-save recording chunks to IndexedDB
  const saveRecordingToStorage = useCallback(async () => {
    // Require userId to save - ensures recordings are always scoped to a user
    if (!enableAutoSave || !recordingIdRef.current || chunksRef.current.length === 0 || !userId) {
      return;
    }

    try {
      const storage = await getRecordingStorage();
      const currentDuration = durationRef.current; // Use ref for accurate duration
      const isCloudEnabled = !!chunkUploaderRef.current;
      await storage.saveRecording({
        id: recordingIdRef.current,
        userId, // Scope recording to user for privacy
        startTime: Date.now() - currentDuration * 1000,
        chunks: [...chunksRef.current],
        duration: currentDuration,
        mimeType: audioFormat.mimeType,
        source: recordingSourceRef.current || 'microphone',
        lastSaved: Date.now(),
        cloudUploadEnabled: isCloudEnabled,
        cloudSessionId: isCloudEnabled ? chunkUploaderRef.current?.currentSessionId : undefined,
      });
      console.log(
        `[useMediaRecorder] Auto-saved recording to IndexedDB (${currentDuration}s)${isCloudEnabled ? ' [rolling buffer]' : ''}`
      );
    } catch (err) {
      console.error('[useMediaRecorder] Failed to auto-save recording:', err);
      // Non-critical error, continue recording
    }
  }, [enableAutoSave, audioFormat.mimeType, userId]);

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

  // Swap microphone mid-recording (microphone source only)
  const swapMicrophone = useCallback(
    async (deviceId: string) => {
      // Only works for microphone source during recording or paused state
      // Use refs to get current values (avoids stale closure from debounced calls)
      const currentState = stateRef.current;
      const currentSource = recordingSourceRef.current;

      if (!hotSwapRecorderRef.current) {
        return;
      }

      if (currentState !== 'recording' && currentState !== 'paused') {
        return;
      }

      if (currentSource !== 'microphone') {
        return;
      }

      try {
        setIsSwappingDevice(true);
        setError(null);

        await hotSwapRecorderRef.current.swapMicrophone(deviceId);

        // Update the audio stream for visualization
        const newStream = hotSwapRecorderRef.current.outputStream;
        if (newStream) {
          setAudioStream(newStream);
        }

        setCurrentDeviceId(deviceId);
        onDeviceSwapped?.(deviceId);
      } catch (err) {
        const error = err as Error;
        console.error('[useMediaRecorder] Failed to swap microphone:', error);
        setError(`Failed to switch microphone: ${error.message}`);
        onError?.(error);
      } finally {
        setIsSwappingDevice(false);
      }
    },
    [onDeviceSwapped, onError]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Clean up HotSwapRecorder
      if (hotSwapRecorderRef.current) {
        hotSwapRecorderRef.current.dispose();
        hotSwapRecorderRef.current = null;
      }
      releaseWakeLock(wakeLockRef.current);
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      // Clean up ChunkUploader
      if (chunkUploaderRef.current) {
        chunkUploaderRef.current.abort();
        chunkUploaderRef.current = null;
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
    maxDuration: effectiveMaxDuration,
    audioBlob,
    error,
    warning,
    isSupported,
    canUseTabAudio,
    audioFormat,
    currentDeviceId,
    isSwappingDevice,
    isStopping,
    // Cloud upload state
    uploadProgress,
    cloudSessionId,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    markAsUploaded,
    createMarkAsUploaded,
    loadRecoveredRecording,
    prepareForContinue,
    clearWarning,
    swapMicrophone,

    // Audio stream (for visualization via useAudioVisualization)
    audioStream,

    // Recording source (for conditional UI rendering)
    recordingSource,

    // Chunk count for tab audio visualization
    chunkCount,
  };
}
