'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMediaRecorder, RecordingSource } from '@/hooks/useMediaRecorder';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useAuth } from '@/contexts/AuthContext';
import { RecordingPreview } from './RecordingPreview';
import { RecordingWaveform } from './RecordingWaveform';
import { Button } from './Button';
import { ensureAudioContextReady } from '@/hooks/useAudioWaveform';
import { Mic, Monitor, AlertCircle, AlertTriangle, Pause, Square, ChevronDown, Volume2, X } from 'lucide-react';
import { estimateFileSize, formatFileSize } from '@/utils/audio';
import { checkStorageQuota, getStorageWarningLevel, getStorageWarningMessage } from '@/utils/storageQuota';
import type { ContinueRecordingData } from './ConversationCreateModal';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface SimpleAudioRecorderProps {
  /**
   * Called when user confirms the recording.
   * @param blob - The recorded audio blob
   * @param markAsUploaded - Call this after successful upload to clean up IndexedDB backup
   */
  onComplete: (blob: Blob, markAsUploaded: () => Promise<void>) => void;
  onCancel: () => void;
  /** Called when actual recording state changes (recording/paused vs idle/stopped) */
  onRecordingStateChange?: (isRecording: boolean) => void;
  /** When set, skips source selection and starts with this source */
  initialSource?: RecordingSource | null;
  /** Data for continuing a recovered recording */
  continueRecordingData?: ContinueRecordingData | null;
}

/**
 * SimpleAudioRecorder - Lightweight recording component for prototype flow
 *
 * Features:
 * - Reuses production useMediaRecorder hook (gets all robustness)
 * - Supports both microphone and tab audio
 * - Pause/resume functionality
 * - Real-time audio visualization using Web Audio API
 * - Integration with RecordingPreview component
 *
 * Production features inherited via useMediaRecorder:
 * - Recording recovery (IndexedDB auto-save)
 * - Wake lock (prevents screen sleep)
 * - Better error handling
 * - Browser compatibility checks
 * - Proper stream cleanup
 */
export function SimpleAudioRecorder({
  onComplete,
  onCancel,
  onRecordingStateChange,
  initialSource,
  continueRecordingData,
}: SimpleAudioRecorderProps) {
  const t = useTranslations('recording');
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();

  // Recording source state (declared early for analytics callbacks)
  // If initialSource is provided, use it and skip source selection
  // If continueRecordingData is provided, use its source
  const [selectedSource, setSelectedSource] = useState<RecordingSource>(
    continueRecordingData?.source || initialSource || 'microphone'
  );

  // Track if we've already prepared continue mode
  const continueModePreparedRef = useRef(false);

  const {
    state,
    duration,
    audioBlob,
    error,
    warning,
    isSupported,
    canUseTabAudio,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    markAsUploaded,
    prepareForContinue,
    clearWarning,
    swapMicrophone,
    currentDeviceId,
    isSwappingDevice,
    audioStream,
  } = useMediaRecorder({
    enableAutoSave: true, // Auto-save to IndexedDB for crash recovery
    userId: user?.uid, // Scope recordings to user for privacy/security
    onStateChange: (newState) => {
      if (newState === 'recording') {
        trackEvent('recording_started', {
          source: selectedSource,
        });
      }
    },
    onDataAvailable: (blob) => {
      trackEvent('recording_stopped', {
        duration_seconds: duration,
        file_size_bytes: blob.size,
        source: selectedSource,
      });
    },
    onError: (err) => {
      trackEvent('recording_error', {
        error_message: err.message,
        source: selectedSource,
      });
    },
  });

  // Skip source selection if initialSource was provided
  const [showSourceSelector, setShowSourceSelector] = useState(!initialSource);

  // Tab audio options
  const [includeMicWithTabAudio, setIncludeMicWithTabAudio] = useState(true);

  // Microphone device selection
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Microphone preview (test before recording)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const isStartingPreviewRef = useRef(false); // Guards against concurrent preview starts

  // Auto-follow default device tracking
  const previousDefaultLabelRef = useRef<string | null>(null);
  const autoSwapDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track previous device IDs to detect newly connected devices
  const previousDeviceIdsRef = useRef<Set<string>>(new Set());

  // No audio detection warning
  const [hasDetectedAudio, setHasDetectedAudio] = useState(false);
  const [showNoAudioWarning, setShowNoAudioWarning] = useState(false);

  // Audio visualization for preview (before recording starts)
  const { audioLevel: previewAudioLevel } = useAudioVisualization(previewStream);

  // Audio visualization during recording (both microphone and tab audio)
  // Web Audio API analyzes the audio stream in real-time for reactive waveform
  const { audioLevel: recordingAudioLevel } = useAudioVisualization(audioStream);

  // Use raw audio level directly (no decay/smoothing)
  const displayedAudioLevel = isTestingMic ? previewAudioLevel : 0;

  // Track when audio is detected (threshold > 5 to avoid noise)
  useEffect(() => {
    if (isTestingMic && previewAudioLevel > 5) {
      setHasDetectedAudio(true);
      setShowNoAudioWarning(false);
    }
  }, [isTestingMic, previewAudioLevel]);

  // Show warning after 3 seconds if no audio detected
  useEffect(() => {
    if (!isTestingMic) {
      setShowNoAudioWarning(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!hasDetectedAudio) {
        setShowNoAudioWarning(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isTestingMic, hasDetectedAudio]);

  // Notify parent when actual recording state changes
  useEffect(() => {
    const isActivelyRecording = state === 'recording' || state === 'paused';
    onRecordingStateChange?.(isActivelyRecording);
  }, [state, onRecordingStateChange]);

  // Prepare for continue mode when continueRecordingData is provided
  useEffect(() => {
    if (continueRecordingData && !continueModePreparedRef.current) {
      prepareForContinue(
        continueRecordingData.chunks,
        continueRecordingData.duration,
        continueRecordingData.source,
        continueRecordingData.recordingId
      );
      continueModePreparedRef.current = true;
      console.log(
        `[SimpleAudioRecorder] Prepared continue mode: ${continueRecordingData.duration}s, ${continueRecordingData.chunks.length} chunks`
      );
    }
  }, [continueRecordingData, prepareForContinue]);

  // Track if we've already pre-selected a device (prevents re-running on selectedDeviceId change)
  const hasPreselectedDeviceRef = useRef(false);

  // Refs for auto-follow logic (to access current values in devicechange callback)
  const stateRef = useRef(state);
  const selectedSourceRef = useRef(selectedSource);
  const currentDeviceIdRef = useRef(currentDeviceId);

  // Keep refs in sync with state
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { selectedSourceRef.current = selectedSource; }, [selectedSource]);
  useEffect(() => { currentDeviceIdRef.current = currentDeviceId; }, [currentDeviceId]);

  // Fetch available audio input devices
  // Note: We now enumerate during recording too, to detect newly plugged devices for hot-swap
  useEffect(() => {

    // Check if mediaDevices API is available (requires HTTPS or localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[SimpleAudioRecorder] mediaDevices API not available. Recording requires HTTPS.');
      setIsLoadingDevices(false);
      return;
    }

    const getAudioDevices = async () => {
      setIsLoadingDevices(true);
      try {
        // Request permission first to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(() => {
            // Permission denied - we'll still try to enumerate devices
          });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 8)}...`,
          }));

        setAudioDevices(audioInputs);

        // Get the current default device label
        const newDefaultDevice = audioInputs.find(d => d.deviceId === 'default');
        const newDefaultLabel = newDefaultDevice?.label || null;

        // Get current device IDs (excluding 'default' pseudo-device)
        const currentDeviceIds = new Set(audioInputs.filter(d => d.deviceId !== 'default').map(d => d.deviceId));

        // Check if we're recording with microphone and should auto-follow
        const isRecordingMic =
          (stateRef.current === 'recording' || stateRef.current === 'paused') &&
          selectedSourceRef.current === 'microphone';

        if (isRecordingMic) {
          // Strategy 1: Check if system default changed (rare for Bluetooth on macOS)
          const defaultLabelChanged = previousDefaultLabelRef.current && newDefaultLabel && newDefaultLabel !== previousDefaultLabelRef.current;

          if (defaultLabelChanged) {
            console.log(`[SimpleAudioRecorder] 🔄 AUTO-SWAP: Default device changed: "${previousDefaultLabelRef.current}" → "${newDefaultLabel}"`);

            if (autoSwapDebounceRef.current) {
              clearTimeout(autoSwapDebounceRef.current);
            }
            autoSwapDebounceRef.current = setTimeout(() => {
              swapMicrophone(resolveRealDeviceId('default')).then(() => {
                setSelectedDeviceId('default');
                console.log('[SimpleAudioRecorder] ✅ Auto-swapped to new default device');
              }).catch(err => {
                console.error('[SimpleAudioRecorder] ❌ Failed to auto-swap to default:', err);
              });
            }, 500);
          }

          // Strategy 2: Detect newly connected device and auto-switch to it
          // This handles Bluetooth headphones that macOS doesn't set as default input
          if (previousDeviceIdsRef.current.size > 0) {
            const newlyConnectedDevices = audioInputs.filter(d =>
              d.deviceId !== 'default' && !previousDeviceIdsRef.current.has(d.deviceId)
            );

            if (newlyConnectedDevices.length > 0 && !defaultLabelChanged) {
              // Prefer Bluetooth devices (user likely just connected headphones)
              const bluetoothDevice = newlyConnectedDevices.find(d =>
                d.label.toLowerCase().includes('bluetooth') ||
                d.label.toLowerCase().includes('airpods') ||
                d.label.toLowerCase().includes('wh-') ||  // Sony WH series
                d.label.toLowerCase().includes('wf-')     // Sony WF series
              );

              const deviceToSwitch = bluetoothDevice || newlyConnectedDevices[0];

              console.log(`[SimpleAudioRecorder] 🔄 AUTO-SWAP: New device connected: "${deviceToSwitch.label}"`);

              if (autoSwapDebounceRef.current) {
                clearTimeout(autoSwapDebounceRef.current);
              }
              autoSwapDebounceRef.current = setTimeout(() => {
                swapMicrophone(deviceToSwitch.deviceId).then(() => {
                  setSelectedDeviceId(deviceToSwitch.deviceId);
                  console.log(`[SimpleAudioRecorder] ✅ Auto-swapped to newly connected: "${deviceToSwitch.label}"`);
                }).catch(err => {
                  console.error('[SimpleAudioRecorder] ❌ Failed to auto-swap to new device:', err);
                });
              }, 500);
            }
          }

          // Check if current device was disconnected
          const currentId = currentDeviceIdRef.current;
          if (currentId) {
            const currentDeviceStillExists = audioInputs.some(d =>
              d.deviceId === currentId || d.label.includes(currentId.slice(0, 8))
            );

            if (!currentDeviceStillExists) {
              console.log('[SimpleAudioRecorder] Current device disconnected, switching to default');

              if (autoSwapDebounceRef.current) {
                clearTimeout(autoSwapDebounceRef.current);
              }
              autoSwapDebounceRef.current = setTimeout(() => {
                swapMicrophone(resolveRealDeviceId('default')).then(() => {
                  setSelectedDeviceId('default');
                  console.log('[SimpleAudioRecorder] Auto-swapped to default after device disconnect');
                }).catch(err => {
                  console.error('[SimpleAudioRecorder] Failed to auto-swap after disconnect:', err);
                });
              }, 500);
            }
          }
        }

        // Update tracking refs for next comparison
        previousDefaultLabelRef.current = newDefaultLabel;
        previousDeviceIdsRef.current = currentDeviceIds;

        // Pre-select the "default" pseudo-device if it exists (shows "Default - ..." in dropdown)
        // This gives the user a clear indication of what the system default is
        // Only do this once to avoid race conditions with the auto-start preview effect
        if (audioInputs.length > 0 && !hasPreselectedDeviceRef.current) {
          hasPreselectedDeviceRef.current = true;
          const defaultPseudoDevice = audioInputs.find(d => d.deviceId === 'default');
          const deviceToSelect = defaultPseudoDevice || audioInputs[0];
          setSelectedDeviceId(deviceToSelect.deviceId);
          console.log(`[SimpleAudioRecorder] Pre-selected device: "${deviceToSelect.label}"`);
        }
      } catch (err) {
        console.error('Failed to enumerate audio devices:', err);
      } finally {
        setIsLoadingDevices(false);
      }
    };

    getAudioDevices();

    // Listen for device changes (including during recording for hot-swap)
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
      // Clean up debounce timer
      if (autoSwapDebounceRef.current) {
        clearTimeout(autoSwapDebounceRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies - run once on mount, device changes are handled by event listener

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Resolve 'default' pseudo-device to real device ID
  // Chrome's 'default' deviceId doesn't work reliably with getUserMedia,
  // so we find the actual device that corresponds to the system default
  const resolveRealDeviceId = useCallback((deviceId: string): string => {
    if (deviceId !== 'default') {
      return deviceId; // Already a real device ID
    }

    // Find the pseudo-device to get its label (e.g., "Default - Logitech StreamCam")
    const defaultPseudoDevice = audioDevices.find(d => d.deviceId === 'default');
    if (!defaultPseudoDevice) {
      return deviceId; // No pseudo-device found, return as-is
    }

    // Extract device name from "Default - Device Name"
    const defaultDeviceName = defaultPseudoDevice.label.replace(/^Default\s*-\s*/i, '').trim();

    // Find the real device with matching name
    const matchingRealDevice = audioDevices.find(
      d => d.deviceId !== 'default' && d.label.trim() === defaultDeviceName
    );

    if (matchingRealDevice) {
      console.log(`[SimpleAudioRecorder] Resolved 'default' to real device: "${matchingRealDevice.label}" (${matchingRealDevice.deviceId.slice(0, 20)}...)`);
      return matchingRealDevice.deviceId;
    }

    // Fallback: return first non-default device
    const firstReal = audioDevices.find(d => d.deviceId !== 'default');
    if (firstReal) {
      console.log(`[SimpleAudioRecorder] Fallback: using first real device: "${firstReal.label}"`);
      return firstReal.deviceId;
    }

    return deviceId; // Last resort: return as-is
  }, [audioDevices]);

  // Define handleStart before the useEffect that uses it
  const handleStart = useCallback(async () => {
    // Ensure mic preview is fully stopped before starting recording
    // This prevents having multiple AudioContexts active simultaneously
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach(track => track.stop());
      previewStreamRef.current = null;
      setPreviewStream(null);
      setIsTestingMic(false);
      // Small delay to allow AudioContext cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Resolve pseudo 'default' device ID to real device ID for reliable getUserMedia
    const realDeviceId = selectedDeviceId ? resolveRealDeviceId(selectedDeviceId) : undefined;

    // For tab audio: only pass deviceId if user wants mic included
    const deviceIdToUse = selectedSource === 'tab-audio' && !includeMicWithTabAudio
      ? undefined  // No mic - tab audio only
      : realDeviceId;

    console.log(`[SimpleAudioRecorder] handleStart - source: ${selectedSource}, includeMic: ${includeMicWithTabAudio}, deviceId: ${deviceIdToUse}`);
    await startRecording(selectedSource, deviceIdToUse);
  }, [startRecording, selectedSource, selectedDeviceId, includeMicWithTabAudio, resolveRealDeviceId]);

  // Start microphone preview test
  const startMicPreview = useCallback(async (deviceId?: string) => {
    // Guard against concurrent preview starts (race condition prevention)
    if (isStartingPreviewRef.current) {
      console.log('[SimpleAudioRecorder] Preview start already in progress, skipping');
      return;
    }

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Failed to start mic preview: mediaDevices API not available');
      return;
    }

    try {
      isStartingPreviewRef.current = true;
      setIsTestingMic(true);
      // Build audio constraints with optional device ID
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      };

      // Add deviceId if provided (use the selected microphone)
      if (deviceId) {
        audioConstraints.deviceId = { exact: deviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      previewStreamRef.current = stream;
      setPreviewStream(stream);
    } catch (err) {
      console.error('Failed to start mic preview:', err);
      setIsTestingMic(false);
    } finally {
      isStartingPreviewRef.current = false;
    }
  }, []);

  // Stop microphone preview test
  const stopMicPreview = useCallback(() => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach(track => track.stop());
      previewStreamRef.current = null;
    }
    setPreviewStream(null);
    setIsTestingMic(false);
  }, []);

  // Auto-start mic preview when device is selected and we're on source selection screen
  // OR when we came directly to microphone recording (initialSource === 'microphone')
  useEffect(() => {
    // Wait for devices to be loaded before auto-starting preview
    // This prevents the race condition where we try to resolve 'default' before devices are enumerated
    const hasDevices = audioDevices.length > 0;

    const shouldAutoStart =
      (showSourceSelector || initialSource === 'microphone') &&
      state === 'idle' &&
      selectedDeviceId &&
      hasDevices &&  // Don't start until devices are loaded
      !isTestingMic;

    if (shouldAutoStart) {
      // Resolve 'default' pseudo-device to real device ID (Chrome quirk)
      // Use audioDevices directly now that we wait for them to be loaded
      let realDeviceId = selectedDeviceId;
      if (selectedDeviceId === 'default') {
        const defaultPseudo = audioDevices.find(d => d.deviceId === 'default');
        if (defaultPseudo) {
          const defaultName = defaultPseudo.label.replace(/^Default\s*-\s*/i, '').trim();
          const matchingReal = audioDevices.find(d => d.deviceId !== 'default' && d.label.trim() === defaultName);
          if (matchingReal) {
            realDeviceId = matchingReal.deviceId;
          } else {
            const firstReal = audioDevices.find(d => d.deviceId !== 'default');
            if (firstReal) realDeviceId = firstReal.deviceId;
          }
        }
      }
      startMicPreview(realDeviceId);
    }
  }, [showSourceSelector, initialSource, state, selectedDeviceId, isTestingMic, startMicPreview, audioDevices]);

  // Cleanup preview stream on unmount
  useEffect(() => {
    return () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Storage quota monitoring during recording (5-minute interval to minimize resource usage)
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  useEffect(() => {
    if (state !== 'recording' && state !== 'paused') {
      setStorageWarning(null);
      return;
    }

    const checkStorage = async () => {
      const quota = await checkStorageQuota();
      if (quota) {
        const level = getStorageWarningLevel(quota.percentUsed);
        const message = getStorageWarningMessage(level, quota.available);
        setStorageWarning(message);
      }
    };

    // Check immediately when recording starts
    checkStorage();

    // Then check every 5 minutes
    const interval = setInterval(checkStorage, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state]);

  // Back button handler - go back to source selection or cancel if we came from direct action
  const handleBackToSourceSelection = useCallback(() => {
    stopMicPreview();
    if (initialSource) {
      // If we came from a direct action (e.g., "Record the room"), go back to cancel (close modal)
      onCancel();
    } else {
      // If we came from source selection, go back to it
      setShowSourceSelector(true);
    }
  }, [stopMicPreview, initialSource, onCancel]);

  const handleSourceSelect = useCallback((source: RecordingSource) => {
    setSelectedSource(source);
    setShowSourceSelector(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (audioBlob) {
      // Track recording upload
      trackEvent('recording_uploaded', {
        duration_seconds: duration,
        file_size_bytes: audioBlob.size,
        source: selectedSource,
      });
      // Pass blob and markAsUploaded callback to parent
      // Parent should call markAsUploaded() after successful upload to clean up IndexedDB
      onComplete(audioBlob, markAsUploaded);
      reset();
    }
  }, [audioBlob, onComplete, markAsUploaded, reset, trackEvent, duration, selectedSource]);

  const handleReRecord = useCallback(() => {
    reset();
    // If we came from a direct action, stay on the recording interface (don't show source selector)
    // Otherwise, go back to source selection
    if (!initialSource) {
      setShowSourceSelector(true);
    }
  }, [reset, initialSource]);

  // Wrap stopRecording to pre-warm AudioContext for the preview waveform
  // This ensures the AudioContext can be resumed on mobile browsers
  const handleStopRecording = useCallback(async () => {
    // Pre-warm AudioContext on user gesture (before stopRecording async operations)
    await ensureAudioContextReady();
    stopRecording();
  }, [stopRecording]);

  const handleCancelPreview = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const handleCancelRecording = useCallback(() => {
    const confirmed = window.confirm(t('confirm.cancelRecording'));
    if (!confirmed) return;

    reset();
    onCancel();
  }, [reset, onCancel, t]);

  // Handle device swap during recording (microphone source only)
  const handleDeviceSwap = useCallback(async (newDeviceId: string) => {
    // Resolve 'default' pseudo-device to real device ID
    const realDeviceId = resolveRealDeviceId(newDeviceId);
    setSelectedDeviceId(newDeviceId);

    // Swap the microphone in the active recording
    await swapMicrophone(realDeviceId);
  }, [swapMicrophone, resolveRealDeviceId]);

  // Keep selectedDeviceId in sync with currentDeviceId from the hook
  // This handles cases where the device changes through the hook (e.g., device disconnect)
  useEffect(() => {
    if (currentDeviceId && (state === 'recording' || state === 'paused')) {
      // Find the device in our list that matches the currentDeviceId
      const matchingDevice = audioDevices.find(d =>
        d.deviceId === currentDeviceId ||
        resolveRealDeviceId(d.deviceId) === currentDeviceId
      );
      if (matchingDevice && matchingDevice.deviceId !== selectedDeviceId) {
        setSelectedDeviceId(matchingDevice.deviceId);
      }
    }
  }, [currentDeviceId, state, audioDevices, selectedDeviceId, resolveRealDeviceId]);

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center mb-4">
          {t('errors.notSupported')}
        </p>
        <Button variant="ghost" onClick={onCancel}>
          ← {t('confirm.goBack')}
        </Button>
      </div>
    );
  }

  // Show preview after recording stopped
  if (state === 'stopped' && audioBlob) {
    return (
      <RecordingPreview
        audioBlob={audioBlob}
        duration={duration}
        onConfirm={handleConfirm}
        onReRecord={handleReRecord}
        onCancel={handleCancelPreview}
      />
    );
  }

  // Source selection screen
  if (showSourceSelector && state === 'idle') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
            {t('source.chooseSource')}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            {t('source.chooseSourceDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Microphone */}
          <div className="group flex flex-col p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#8D6AFA] hover:shadow-lg transition-all duration-200">
            <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#8D6AFA] group-hover:scale-110 transition-all duration-200">
              <Mic className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 text-center group-hover:text-[#8D6AFA] uppercase tracking-wide">
              {t('source.microphone')}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400 mb-4 text-center">
              {t('source.microphoneDescription')}
            </p>

            {/* Microphone selector dropdown */}
            {audioDevices.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('source.selectMicrophone')}
                </label>
                <div className="relative">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      // Stop current preview - it will auto-restart with new device
                      if (isTestingMic) {
                        stopMicPreview();
                      }
                      setSelectedDeviceId(e.target.value);
                      // Reset audio detection for new microphone
                      setHasDetectedAudio(false);
                      setShowNoAudioWarning(false);
                    }}
                    className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:border-transparent cursor-pointer"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}

            {isLoadingDevices && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t('source.loadingMicrophones')}
              </p>
            )}

            {/* Audio level indicator - macOS style segmented meter */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isTestingMic ? t('source.inputLevel') : t('source.initializing')}
                </span>
              </div>
              <div className="flex items-center gap-[3px]">
                {Array.from({ length: 12 }).map((_, index) => {
                  // Each segment represents ~8.33% of the level
                  const threshold = (index + 1) * 8.33;
                  const isActive = isTestingMic && displayedAudioLevel >= threshold;

                  return (
                    <div
                      key={index}
                      className={`h-3 flex-1 rounded-sm transition-colors duration-75 ${
                        isActive
                          ? 'bg-[#8D6AFA]'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  );
                })}
              </div>

              {/* No audio detected warning */}
              {showNoAudioWarning && !hasDetectedAudio && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">
                    {t('source.noAudioDetected')}
                  </span>
                </div>
              )}
            </div>

            {/* Spacer to push button to bottom */}
            <div className="flex-1" />

            <button
              onClick={() => {
                stopMicPreview();
                handleSourceSelect('microphone');
              }}
              className="w-full py-2.5 px-4 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white font-medium rounded-full transition-colors"
            >
              {t('source.useThisMicrophone')}
            </button>
          </div>

          {/* Tab Audio */}
          <div
            className={`group flex flex-col p-8 rounded-xl border-2 transition-all duration-200 ${
              canUseTabAudio
                ? 'border-gray-200 dark:border-gray-700 hover:border-[#8D6AFA] hover:shadow-lg'
                : 'border-gray-200 dark:border-gray-700 opacity-50'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 ${
                canUseTabAudio
                  ? 'group-hover:bg-[#8D6AFA] group-hover:scale-110 transition-all duration-200'
                  : ''
              }`}
            >
              <Monitor
                className={`w-7 h-7 text-gray-600 dark:text-gray-400 ${
                  canUseTabAudio ? 'group-hover:text-white' : ''
                }`}
              />
            </div>
            <h3
              className={`font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 text-center uppercase tracking-wide ${
                canUseTabAudio ? 'group-hover:text-[#8D6AFA]' : ''
              }`}
            >
              {t('source.tabAudio')}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400 mb-4 text-center">
              {canUseTabAudio
                ? t('source.tabAudioDescription')
                : t('source.tabAudioNotSupported')}
            </p>

            {canUseTabAudio && (
              <>
                {/* Include microphone toggle */}
                <label className="flex items-start gap-3 cursor-pointer mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeMicWithTabAudio}
                    onChange={(e) => setIncludeMicWithTabAudio(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#8D6AFA] focus:ring-[#8D6AFA] cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                      {t('source.includeMicrophone')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('source.recommendedForCalls')}
                    </span>
                  </div>
                </label>

                {/* Show selected microphone when toggle is on */}
                {includeMicWithTabAudio && selectedDeviceId && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-600 dark:text-gray-400">
                    <Mic className="w-3.5 h-3.5" />
                    <span className="truncate">
                      {t('source.usingMicrophone')} {audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || t('source.microphone')}
                    </span>
                  </div>
                )}

                {/* Spacer to push button to bottom */}
                <div className="flex-1" />

                <button
                  onClick={() => handleSourceSelect('tab-audio')}
                  className="w-full py-2.5 px-4 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white font-medium rounded-full transition-colors"
                >
                  {t('source.recordTabAudio')}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-start">
          <Button variant="ghost" onClick={onCancel}>
            ← {t('source.changeMethod')}
          </Button>
        </div>
      </div>
    );
  }

  // Recording interface
  return (
    <div className="space-y-4">
      {/* Error message with dismiss option */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                onCancel();
              }}
            >
              {t('controls.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Warning Display (recording warnings or storage warnings) */}
      {(warning || storageWarning) && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {t('warnings.title')}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {warning || storageWarning}
            </p>
          </div>
          {warning && (
            <button
              type="button"
              onClick={clearWarning}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1 -mr-1 -mt-1"
              aria-label={t('controls.dismissWarning')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Recording indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {state === 'recording' && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          {state === 'paused' && (
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          )}
          <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {state === 'recording' && t('status.recording')}
            {state === 'paused' && t('status.paused')}
            {state === 'requesting-permission' && t('status.requesting')}
            {state === 'idle' && t('status.ready')}
          </span>
        </div>
        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
          {formatTime(duration)}
        </div>
      </div>

      {/* Inline microphone selector (shown when coming from direct microphone action) */}
      {initialSource === 'microphone' && state === 'idle' && audioDevices.length > 1 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {isTestingMic ? t('source.inputLevel') : t('source.initializing')}
            </span>
          </div>
          <div className="flex items-center gap-[3px] mb-4">
            {Array.from({ length: 12 }).map((_, index) => {
              const threshold = (index + 1) * 8.33;
              const isActive = isTestingMic && displayedAudioLevel >= threshold;
              return (
                <div
                  key={index}
                  className={`h-3 flex-1 rounded-sm transition-colors duration-75 ${
                    isActive
                      ? 'bg-[#8D6AFA]'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              );
            })}
          </div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
            {t('source.selectMicrophone')}
          </label>
          <div className="relative">
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                if (isTestingMic) {
                  stopMicPreview();
                }
                setSelectedDeviceId(e.target.value);
                setHasDetectedAudio(false);
                setShowNoAudioWarning(false);
              }}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:border-transparent cursor-pointer"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          {/* No audio detected warning */}
          {showNoAudioWarning && !hasDetectedAudio && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">
                {t('source.noAudioDetected')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Waveform area */}
      {(state === 'idle' || state === 'recording' || state === 'paused') && (
        <RecordingWaveform
          isRecording={state === 'recording'}
          isPaused={state === 'paused'}
          audioLevel={recordingAudioLevel}
        />
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* Idle state - start button */}
        {state === 'idle' && (
          <>
            <Button variant="brand" onClick={handleStart} fullWidth icon={<Mic />}>
              {t('controls.start')}
            </Button>
            <Button variant="ghost" onClick={handleBackToSourceSelection} fullWidth>
              ← {initialSource ? t('controls.cancel') : t('source.changeSource')}
            </Button>
          </>
        )}

        {/* Recording state - pause and stop buttons */}
        {state === 'recording' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="secondary"
                onClick={pauseRecording}
                fullWidth
                icon={<Pause className="w-5 h-5" />}
              >
                {t('controls.pause')}
              </Button>
              <Button
                variant="brand"
                onClick={handleStopRecording}
                fullWidth
                icon={<Square className="w-5 h-5" />}
              >
                {t('controls.stop')}
              </Button>
            </div>
            {/* Microphone switcher during recording */}
            {selectedSource === 'microphone' && audioDevices.length > 1 && (
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <div className="relative flex-1">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => handleDeviceSwap(e.target.value)}
                    disabled={isSwappingDevice}
                    className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 pr-8 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
                {isSwappingDevice && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#8D6AFA] border-t-transparent" />
                )}
              </div>
            )}
            {/* File size estimate and source indicator */}
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {t('source.recordingFrom')}{' '}
                <span className="font-medium text-gray-800 dark:text-gray-300">
                  {selectedSource === 'microphone' ? t('source.microphone') : t('source.tabAudio')}
                </span>
              </span>
              {duration > 0 && (
                <span>{t('fileSize', { size: formatFileSize(estimateFileSize(duration)) })}</span>
              )}
            </div>
            <Button variant="ghost" onClick={handleCancelRecording} fullWidth>
              {t('controls.cancel')}
            </Button>
          </>
        )}

        {/* Paused state - resume and stop buttons */}
        {state === 'paused' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button variant="brand" onClick={resumeRecording} fullWidth icon={<Mic />}>
                {t('controls.resume')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleStopRecording}
                fullWidth
                icon={<Square className="w-5 h-5" />}
              >
                {t('controls.stop')}
              </Button>
            </div>
            {/* Microphone switcher during paused state */}
            {selectedSource === 'microphone' && audioDevices.length > 1 && (
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <div className="relative flex-1">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => handleDeviceSwap(e.target.value)}
                    disabled={isSwappingDevice}
                    className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 pr-8 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
                {isSwappingDevice && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#8D6AFA] border-t-transparent" />
                )}
              </div>
            )}
            {/* File size estimate and source indicator */}
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {t('source.recordingFrom')}{' '}
                <span className="font-medium text-gray-800 dark:text-gray-300">
                  {selectedSource === 'microphone' ? t('source.microphone') : t('source.tabAudio')}
                </span>
              </span>
              {duration > 0 && (
                <span>{t('fileSize', { size: formatFileSize(estimateFileSize(duration)) })}</span>
              )}
            </div>
            <Button variant="ghost" onClick={handleCancelRecording} fullWidth>
              {t('controls.cancel')}
            </Button>
          </>
        )}

        {/* Requesting permission state */}
        {state === 'requesting-permission' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D6AFA] mx-auto mb-3" />
            <p className="text-sm text-gray-700 dark:text-gray-400">
              {t('status.requesting')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
