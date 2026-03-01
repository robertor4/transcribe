'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMediaRecorder, RecordingSource } from '@/hooks/useMediaRecorder';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
import { RecordingPreview } from './RecordingPreview';
import { LevelBarsRow } from './LevelBarsRow';
import { Button } from './Button';
import { ensureAudioContextReady } from '@/hooks/useAudioWaveform';
import { Mic, Monitor, AlertCircle, AlertTriangle, Pause, Square, ChevronDown, Volume2, X, Play } from 'lucide-react';
import { Link } from '@/i18n/navigation';
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
  const { usageStats } = useUsage();

  // Free users get 59 minutes max (1 min buffer before 60 min backend limit)
  const isFreeUser = usageStats?.tier === 'free';
  const maxDurationForTier = isFreeUser ? 59 * 60 : undefined;

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
    maxDuration,
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
    createMarkAsUploaded,
    prepareForContinue,
    clearWarning,
    swapMicrophone,
    currentDeviceId,
    isSwappingDevice,
    isStopping,
    audioStream,
    canResumeAfterInterruption,
    resumeAfterInterruption,
  } = useMediaRecorder({
    enableAutoSave: true, // Auto-save to IndexedDB for crash recovery
    userId: user?.uid, // Scope recordings to user for privacy/security
    maxDurationSeconds: maxDurationForTier, // Free tier: 59 min, Paid: unlimited (3h default)
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

  // Auto-switch notification
  const [deviceSwitchNotification, setDeviceSwitchNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show device switch notification with auto-dismiss
  const showDeviceSwitchNotification = useCallback((deviceLabel: string) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setDeviceSwitchNotification(deviceLabel);
    // Auto-dismiss after 3 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setDeviceSwitchNotification(null);
    }, 3000);
  }, []);

  // Audio visualization for preview (before recording starts)
  const { audioLevel: previewAudioLevel, frequencyBands: previewBands } = useAudioVisualization(previewStream);

  // Audio visualization during recording (both microphone and tab audio)
  // Web Audio API analyzes the audio stream in real-time for reactive waveform
  const { audioLevel: recordingAudioLevel, frequencyBands: recordingBands } = useAudioVisualization(audioStream);

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
            if (autoSwapDebounceRef.current) {
              clearTimeout(autoSwapDebounceRef.current);
            }
            autoSwapDebounceRef.current = setTimeout(() => {
              swapMicrophone(resolveRealDeviceId('default')).then(() => {
                setSelectedDeviceId('default');
                // Show notification with new default device name
                const deviceName = newDefaultLabel?.replace(/^Default\s*-\s*/i, '') || 'Default';
                showDeviceSwitchNotification(deviceName);
              }).catch(() => {
                // Swap failed - user can manually select device from dropdown
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

              if (autoSwapDebounceRef.current) {
                clearTimeout(autoSwapDebounceRef.current);
              }
              autoSwapDebounceRef.current = setTimeout(() => {
                swapMicrophone(deviceToSwitch.deviceId).then(() => {
                  setSelectedDeviceId(deviceToSwitch.deviceId);
                  showDeviceSwitchNotification(deviceToSwitch.label);
                }).catch(() => {
                  // Swap failed - user can manually select device from dropdown
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
              if (autoSwapDebounceRef.current) {
                clearTimeout(autoSwapDebounceRef.current);
              }
              autoSwapDebounceRef.current = setTimeout(() => {
                swapMicrophone(resolveRealDeviceId('default')).then(() => {
                  setSelectedDeviceId('default');
                  // Show notification with new default device name
                  const deviceName = newDefaultLabel?.replace(/^Default\s*-\s*/i, '') || 'Default';
                  showDeviceSwitchNotification(deviceName);
                }).catch(() => {
                  // Swap failed - user can manually select device from dropdown
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
      return matchingRealDevice.deviceId;
    }

    // Fallback: return first non-default device
    const firstReal = audioDevices.find(d => d.deviceId !== 'default');
    if (firstReal) {
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

    await startRecording(selectedSource, deviceIdToUse);
  }, [startRecording, selectedSource, selectedDeviceId, includeMicWithTabAudio, resolveRealDeviceId]);

  // Start microphone preview test
  const startMicPreview = useCallback(async (deviceId?: string) => {
    // Guard against concurrent preview starts (race condition prevention)
    if (isStartingPreviewRef.current) {
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
      (showSourceSelector || initialSource === 'microphone' || selectedSource === 'microphone') &&
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
  }, [showSourceSelector, initialSource, selectedSource, state, selectedDeviceId, isTestingMic, startMicPreview, audioDevices]);

  // Cleanup preview stream and notification timeout on unmount
  useEffect(() => {
    return () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
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
      // Create the markAsUploaded callback BEFORE reset() clears the recording ID
      // This captures the current recording ID in a closure
      const markAsUploaded = createMarkAsUploaded();
      // Pass blob and markAsUploaded callback to parent
      // Parent should call markAsUploaded() after successful upload to clean up IndexedDB
      onComplete(audioBlob, markAsUploaded);
      reset();
    }
  }, [audioBlob, onComplete, createMarkAsUploaded, reset, trackEvent, duration, selectedSource]);

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
      <div className="space-y-4">
        <RecordingPreview
          audioBlob={audioBlob}
          duration={duration}
          onConfirm={handleConfirm}
          onReRecord={handleReRecord}
          onCancel={handleCancelPreview}
        />
      </div>
    );
  }

  // Source selection screen — compact for narrower modal
  if (showSourceSelector && state === 'idle') {
    return (
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-3">
          {/* Microphone option */}
          <div className="group flex flex-col gap-3 p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] transition-colors">
                <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] transition-colors">
                  {t('source.microphone')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('source.microphoneDescription')}
                </p>
              </div>
            </div>

            {/* Microphone selector dropdown */}
            {audioDevices.length > 1 && (
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1">
                  {t('source.selectMicrophone')}
                </label>
                <div className="relative">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      if (isTestingMic) stopMicPreview();
                      setSelectedDeviceId(e.target.value);
                      setHasDetectedAudio(false);
                      setShowNoAudioWarning(false);
                    }}
                    className="w-full appearance-none bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 pr-8 text-[13px] text-gray-900 dark:text-white/85 focus:outline-none focus:border-[#8D6AFA] cursor-pointer transition-colors"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 pointer-events-none" />
                </div>
              </div>
            )}

            {isLoadingDevices && (
              <p className="text-xs text-gray-400">{t('source.loadingMicrophones')}</p>
            )}

            {/* Audio level indicator */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Volume2 className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                <span className="text-[11px] text-gray-500 dark:text-white/40">
                  {isTestingMic ? t('source.inputLevel') : t('source.initializing')}
                </span>
              </div>
              <div className="flex items-center gap-[3px]">
                {Array.from({ length: 12 }).map((_, index) => {
                  const threshold = (index + 1) * 8.33;
                  const isActive = isTestingMic && displayedAudioLevel >= threshold;
                  return (
                    <div
                      key={index}
                      className={`h-2.5 flex-1 rounded-sm transition-colors duration-75 ${
                        isActive ? 'bg-[#8D6AFA]' : 'bg-gray-200 dark:bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>
              {showNoAudioWarning && !hasDetectedAudio && (
                <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">{t('source.noAudioDetected')}</span>
                </div>
              )}
            </div>

            <Button
              variant="brand"
              size="sm"
              fullWidth
              onClick={() => handleSourceSelect('microphone')}
            >
              {t('source.useThisMicrophone')}
            </Button>
          </div>

          {/* Tab Audio option */}
          <div
            className={`group flex flex-col gap-3 p-4 rounded-lg border transition-colors ${
              canUseTabAudio
                ? 'border-gray-200 dark:border-white/10 hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA]/50'
                : 'border-gray-200 dark:border-white/10 opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 ${
                canUseTabAudio ? 'group-hover:bg-[#8D6AFA] transition-colors' : ''
              }`}>
                <Monitor className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${canUseTabAudio ? 'group-hover:text-white' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold text-gray-900 dark:text-gray-100 ${canUseTabAudio ? 'group-hover:text-[#8D6AFA]' : ''} transition-colors`}>
                  {t('source.tabAudio')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {canUseTabAudio ? t('source.tabAudioDescription') : t('source.tabAudioNotSupported')}
                </p>
              </div>
            </div>

            {canUseTabAudio && (
              <>
                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={includeMicWithTabAudio}
                    onChange={(e) => setIncludeMicWithTabAudio(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#8D6AFA] focus:ring-[#8D6AFA] cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 block">{t('source.includeMicrophone')}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('source.recommendedForCalls')}</span>
                  </div>
                </label>

                {includeMicWithTabAudio && selectedDeviceId && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Mic className="w-3.5 h-3.5" />
                    <span className="truncate">
                      {t('source.usingMicrophone')} {audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || t('source.microphone')}
                    </span>
                  </div>
                )}

                <Button
                  variant="brand"
                  size="sm"
                  fullWidth
                  onClick={() => handleSourceSelect('tab-audio')}
                >
                  {t('source.recordTabAudio')}
                </Button>
              </>
            )}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onCancel}>
          ← {t('source.changeMethod')}
        </Button>
      </div>
    );
  }

  // Determine the audio level and frequency bands to show in the level bars
  // Use preview data when idle/testing mic, recording data when recording
  const displayLevel = (state === 'idle' && isTestingMic)
    ? displayedAudioLevel
    : recordingAudioLevel;
  const displayBands = (state === 'idle' && isTestingMic)
    ? previewBands
    : recordingBands;

  // Shared microphone selector component to avoid duplication
  const micSelector = selectedSource === 'microphone' && audioDevices.length > 1 && (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1.5">
        {t('source.selectMicrophone')}
      </label>
      <div className="relative">
        <select
          value={selectedDeviceId}
          onChange={(e) => {
            if (state === 'idle') {
              if (isTestingMic) stopMicPreview();
              setSelectedDeviceId(e.target.value);
              setHasDetectedAudio(false);
              setShowNoAudioWarning(false);
            } else {
              handleDeviceSwap(e.target.value);
            }
          }}
          disabled={isSwappingDevice}
          className="w-full appearance-none bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 pr-8 text-[13px] text-gray-900 dark:text-white/85 focus:outline-none focus:border-[#8D6AFA] dark:focus:border-[#8D6AFA]/60 focus:ring-1 focus:ring-[#8D6AFA]/20 cursor-pointer disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          {audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 pointer-events-none" />
      </div>
      {isSwappingDevice && (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#8D6AFA] border-t-transparent" />
          <span className="text-xs text-gray-500 dark:text-white/40">Switching...</span>
        </div>
      )}
      {/* No audio detected warning */}
      {state === 'idle' && showNoAudioWarning && !hasDetectedAudio && (
        <div className="flex items-center gap-2 mt-1.5 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs">{t('source.noAudioDetected')}</span>
        </div>
      )}
    </div>
  );

  // Recording interface — Variant B compact layout
  return (
    <div className="flex flex-col gap-3.5">
      {/* Error message */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => { reset(); onCancel(); }}>
            {t('controls.cancel')}
          </Button>
        </div>
      )}

      {/* Warning display */}
      {(warning || storageWarning) && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {warning || storageWarning}
            </p>
            {canResumeAfterInterruption && (
              <div className="mt-2">
                <Button variant="primary" size="sm" onClick={resumeAfterInterruption} icon={<Play className="w-3.5 h-3.5" />}>
                  {t('controls.resumeRecording')}
                </Button>
              </div>
            )}
          </div>
          {warning && !canResumeAfterInterruption && (
            <button type="button" onClick={clearWarning} className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 p-0.5" aria-label={t('controls.dismissWarning')}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Device switch notification */}
      {deviceSwitchNotification && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 border border-[#8D6AFA]/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <Mic className="w-3.5 h-3.5 text-[#8D6AFA] flex-shrink-0" />
          <span className="text-xs text-[#8D6AFA] dark:text-[#a78bfa]">
            {t('source.switchedToDevice', { device: deviceSwitchNotification })}
          </span>
        </div>
      )}

      {/* Microphone selector — shown in idle when coming from direct action, or during recording/paused */}
      {(state === 'idle' || state === 'recording' || state === 'paused') && micSelector}

      {/* Level bars row — replaces waveform with compact Variant B visualization */}
      {(state === 'idle' || state === 'recording' || state === 'paused') && (
        <LevelBarsRow
          audioLevel={displayLevel}
          frequencyBands={displayBands}
          duration={duration}
          isRecording={state === 'recording'}
          isPaused={state === 'paused'}
        />
      )}

      {/* Status badge + free tier countdown — below level bars/timer */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10">
          <div className={`w-1.5 h-1.5 rounded-full ${
            state === 'recording' ? 'bg-red-500 animate-pulse' :
            state === 'paused' ? 'bg-yellow-500' :
            'bg-emerald-500 animate-pulse'
          }`} />
          <span className="text-gray-600 dark:text-gray-300">
            {state === 'recording' && t('status.recording')}
            {state === 'paused' && t('status.paused')}
            {state === 'requesting-permission' && t('status.requesting')}
            {state === 'idle' && t('status.ready')}
          </span>
        </div>

        {/* Free tier remaining time */}
        {isFreeUser && (state === 'recording' || state === 'paused') && (
          <Link
            href="/pricing"
            target="_blank"
            className={`text-xs font-mono ${
              maxDuration - duration < 5 * 60
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-500 dark:text-gray-400'
            } hover:text-[#8D6AFA] transition-colors`}
          >
            {t('limits.remaining', { time: formatTime(Math.max(0, maxDuration - duration)) })}
          </Link>
        )}

        {/* File size estimate during recording */}
        {!isFreeUser && duration > 0 && (state === 'recording' || state === 'paused') && (
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
            {formatFileSize(estimateFileSize(duration))}
          </span>
        )}
      </div>

      {/* Controls — footer area with darker background */}
      <div className="flex items-center gap-2 pt-3 pb-3 -mx-6 px-6 -mb-5 mt-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
        {/* Idle state */}
        {state === 'idle' && (
          <>
            <Button variant="ghost" size="sm" onClick={handleBackToSourceSelection}>
              {t('controls.cancel')}
            </Button>
            <div className="flex-1" />
            <Button variant="brand" size="sm" onClick={handleStart} icon={<Mic className="w-4 h-4" />}>
              {t('controls.start')}
            </Button>
          </>
        )}

        {/* Recording state */}
        {state === 'recording' && (
          <>
            <Button variant="ghost" size="sm" onClick={handleCancelRecording}>
              {t('controls.cancel')}
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" onClick={pauseRecording} icon={<Pause className="w-4 h-4" />}>
              {t('controls.pause')}
            </Button>
            <Button variant="brand" size="sm" onClick={handleStopRecording} disabled={isStopping} icon={
              isStopping
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Square className="w-4 h-4" />
            }>
              {isStopping ? t('controls.finishing') : t('controls.stop')}
            </Button>
          </>
        )}

        {/* Paused state */}
        {state === 'paused' && (
          <>
            <Button variant="ghost" size="sm" onClick={handleCancelRecording}>
              {t('controls.cancel')}
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" onClick={handleStopRecording} disabled={isStopping} icon={
              isStopping
                ? <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                : <Square className="w-4 h-4" />
            }>
              {isStopping ? t('controls.finishing') : t('controls.stop')}
            </Button>
            <Button variant="brand" size="sm" onClick={resumeRecording} icon={<Mic className="w-4 h-4" />}>
              {t('controls.resume')}
            </Button>
          </>
        )}

        {/* Requesting permission */}
        {state === 'requesting-permission' && (
          <div className="flex items-center gap-3 w-full justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#8D6AFA] border-t-transparent" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('status.requesting')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
