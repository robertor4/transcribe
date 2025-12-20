'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useMediaRecorder, RecordingSource } from '@/hooks/useMediaRecorder';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { RecordingPreview } from './RecordingPreview';
import { Button } from './Button';
import { Mic, Monitor, AlertCircle, Pause, Square, ChevronDown, Volume2 } from 'lucide-react';

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
}: SimpleAudioRecorderProps) {
  const {
    state,
    duration,
    audioBlob,
    error,
    isSupported,
    canUseTabAudio,
    audioStream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    markAsUploaded,
    currentGain,
  } = useMediaRecorder({
    enableAutoSave: true, // Auto-save to IndexedDB for crash recovery
  });

  // Real audio visualization from microphone/tab audio
  const { frequencyData } = useAudioVisualization(audioStream);

  const [selectedSource, setSelectedSource] = useState<RecordingSource>('microphone');
  const [showSourceSelector, setShowSourceSelector] = useState(true);

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

  // No audio detection warning
  const [hasDetectedAudio, setHasDetectedAudio] = useState(false);
  const [showNoAudioWarning, setShowNoAudioWarning] = useState(false);

  // Audio visualization for preview (separate from recording visualization)
  const { audioLevel: previewAudioLevel } = useAudioVisualization(previewStream);

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

  // Fetch available audio input devices
  useEffect(() => {
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

        // Pre-select the "default" pseudo-device if it exists (shows "Default - ..." in dropdown)
        // This gives the user a clear indication of what the system default is
        if (audioInputs.length > 0 && !selectedDeviceId) {
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

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, [selectedDeviceId]);

  // Helper function to generate waveform bars from frequency data
  const generateWaveformBars = useCallback((data: Uint8Array | null): number[] => {
    if (!data) {
      return Array(30).fill(0.1); // Minimal bars when no data
    }

    // Check if this is time domain data (values centered around 128) or frequency data (values from 0)
    // Time domain: silence is 128, frequency: silence is 0
    const isTimeDomain = data[0] > 100 && data[0] < 156;

    const bars: number[] = [];
    const relevantBins = Math.min(64, data.length);
    const step = Math.max(1, Math.floor(relevantBins / 30));

    for (let i = 0; i < 30; i++) {
      const binIndex = Math.min(i * step, relevantBins - 1);
      const rawValue = data[binIndex] || 0;

      let normalized: number;
      if (isTimeDomain) {
        // Time domain: deviation from 128 (silence)
        // Max deviation is 128 (0 or 255), so normalize accordingly
        const deviation = Math.abs(rawValue - 128);
        normalized = Math.min(1, (deviation / 128) * 3); // 3x boost for visibility
      } else {
        // Frequency domain: 0-255 scale
        normalized = Math.min(1, (rawValue / 255) * 2);
      }

      bars.push(Math.max(0.1, normalized));
    }
    return bars;
  }, []);

  // Generate waveform bars from real frequency data (recording)
  const waveformBars = useMemo(() => {
    if (state !== 'recording') {
      return Array(30).fill(0.1); // Minimal bars when not recording
    }
    return generateWaveformBars(frequencyData);
  }, [frequencyData, state, generateWaveformBars]);


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
  const startMicPreview = useCallback(async () => {
    try {
      setIsTestingMic(true);
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      };
      if (selectedDeviceId) {
        audioConstraints.deviceId = { exact: selectedDeviceId };
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      previewStreamRef.current = stream;
      setPreviewStream(stream);
    } catch (err) {
      console.error('Failed to start mic preview:', err);
      setIsTestingMic(false);
    }
  }, [selectedDeviceId]);

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
  useEffect(() => {
    if (showSourceSelector && state === 'idle' && selectedDeviceId && !isTestingMic) {
      startMicPreview();
    }
  }, [showSourceSelector, state, selectedDeviceId, isTestingMic, startMicPreview]);

  // Cleanup preview stream on unmount
  useEffect(() => {
    return () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Back button handler - go back to source selection
  const handleBackToSourceSelection = useCallback(() => {
    stopMicPreview();
    setShowSourceSelector(true);
  }, [stopMicPreview]);

  const handleSourceSelect = useCallback((source: RecordingSource) => {
    setSelectedSource(source);
    setShowSourceSelector(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (audioBlob) {
      // Pass blob and markAsUploaded callback to parent
      // Parent should call markAsUploaded() after successful upload to clean up IndexedDB
      onComplete(audioBlob, markAsUploaded);
      reset();
    }
  }, [audioBlob, onComplete, markAsUploaded, reset]);

  const handleReRecord = useCallback(() => {
    reset();
    setShowSourceSelector(true);
  }, [reset]);

  const handleCancelPreview = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const handleCancelRecording = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel? Your recording will be lost.'
    );
    if (!confirmed) return;

    reset();
    onCancel();
  }, [reset, onCancel]);

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center mb-4">
          Recording is not supported in your browser. Please try Chrome, Firefox, or Edge.
        </p>
        <Button variant="ghost" onClick={onCancel}>
          ← Go back
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
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Choose recording source
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Select where you want to record from
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Microphone */}
          <div className="group flex flex-col p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg transition-all duration-200">
            <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#cc3399] group-hover:scale-110 transition-all duration-200">
              <Mic className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 text-center group-hover:text-[#cc3399]">
              Microphone
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400 mb-4 text-center">
              Record from your device&apos;s microphone
            </p>

            {/* Microphone selector dropdown */}
            {audioDevices.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                  Select microphone
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
                    className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:border-transparent cursor-pointer"
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
                Loading microphones...
              </p>
            )}

            {/* Audio level indicator - macOS style segmented meter */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isTestingMic ? 'Input level' : 'Initializing...'}
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
                          ? 'bg-[#cc3399]'
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
                    No audio detected. Check your microphone is working and not muted.
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
              className="w-full py-2.5 px-4 bg-[#cc3399] hover:bg-[#b82d89] text-white font-medium rounded-full transition-colors"
            >
              Use this microphone
            </button>
          </div>

          {/* Tab Audio */}
          <div
            className={`group flex flex-col p-8 rounded-xl border-2 transition-all duration-200 ${
              canUseTabAudio
                ? 'border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg'
                : 'border-gray-200 dark:border-gray-700 opacity-50'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 ${
                canUseTabAudio
                  ? 'group-hover:bg-[#cc3399] group-hover:scale-110 transition-all duration-200'
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
              className={`font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 text-center ${
                canUseTabAudio ? 'group-hover:text-[#cc3399]' : ''
              }`}
            >
              Tab Audio
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400 mb-4 text-center">
              {canUseTabAudio
                ? 'Record audio from a browser tab'
                : 'Not supported in this browser'}
            </p>

            {canUseTabAudio && (
              <>
                {/* Include microphone toggle */}
                <label className="flex items-start gap-3 cursor-pointer mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeMicWithTabAudio}
                    onChange={(e) => setIncludeMicWithTabAudio(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#cc3399] focus:ring-[#cc3399] cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                      Include my microphone
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Recommended for video calls
                    </span>
                  </div>
                </label>

                {/* Show selected microphone when toggle is on */}
                {includeMicWithTabAudio && selectedDeviceId && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-600 dark:text-gray-400">
                    <Mic className="w-3.5 h-3.5" />
                    <span className="truncate">
                      Using: {audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || 'Default microphone'}
                    </span>
                  </div>
                )}

                {/* Spacer to push button to bottom */}
                <div className="flex-1" />

                <button
                  onClick={() => handleSourceSelect('tab-audio')}
                  className="w-full py-2.5 px-4 bg-[#cc3399] hover:bg-[#b82d89] text-white font-medium rounded-full transition-colors"
                >
                  Record tab audio
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-start">
          <Button variant="ghost" onClick={onCancel}>
            ← Change method
          </Button>
        </div>
      </div>
    );
  }

  // Recording interface
  return (
    <div className="space-y-8">
      {/* Error message with dismiss option */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                onCancel();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="p-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
        {/* Recording indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {state === 'recording' && (
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            )}
            {state === 'paused' && (
              <div className="w-4 h-4 bg-yellow-500 rounded-full" />
            )}
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {state === 'recording' && 'Recording...'}
              {state === 'paused' && 'Paused'}
              {state === 'requesting-permission' && 'Requesting permission...'}
              {state === 'idle' && 'Ready to record'}
            </span>
            {/* Auto-gain boost indicator - shows when gain is actively boosting */}
            {state === 'recording' && selectedSource === 'microphone' && currentGain > 1.1 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium transition-opacity"
                title={`Input boosted to ${Math.round(currentGain * 100)}%`}
              >
                +{Math.round((currentGain - 1) * 100)}%
              </span>
            )}
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100">
            {formatTime(duration)}
          </div>
        </div>

        {/* Waveform area - maintains consistent height across states */}
        {state === 'idle' && (
          <div className="flex items-center justify-center h-24 mb-8">
            <div className="w-full max-w-md h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        )}

        {state === 'recording' && waveformBars.length > 0 && (
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
        )}

        {state === 'paused' && (
          <div className="flex items-center justify-center h-24 mb-8">
            <p className="text-gray-600 dark:text-gray-400">
              Recording paused. Click Resume to continue.
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center gap-3">
          {/* Idle state - start button */}
          {state === 'idle' && (
            <Button variant="brand" onClick={handleStart} fullWidth icon={<Mic />}>
              Start Recording
            </Button>
          )}

          {/* Recording state - pause and stop buttons */}
          {state === 'recording' && (
            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                onClick={pauseRecording}
                fullWidth
                icon={<Pause className="w-5 h-5" />}
              >
                Pause
              </Button>
              <Button
                variant="brand"
                onClick={stopRecording}
                fullWidth
                icon={<Square className="w-5 h-5" />}
              >
                Stop Recording
              </Button>
            </div>
          )}

          {/* Paused state - resume and stop buttons */}
          {state === 'paused' && (
            <div className="flex gap-3 w-full">
              <Button variant="brand" onClick={resumeRecording} fullWidth icon={<Mic />}>
                Resume
              </Button>
              <Button
                variant="secondary"
                onClick={stopRecording}
                fullWidth
                icon={<Square className="w-5 h-5" />}
              >
                Stop
              </Button>
            </div>
          )}

          {/* Requesting permission state */}
          {state === 'requesting-permission' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cc3399] mx-auto mb-3" />
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Please allow microphone access in your browser...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Back/Cancel button - left-aligned, outside the recording box */}
      {state === 'idle' && (
        <div className="flex justify-start">
          <Button variant="ghost" onClick={handleBackToSourceSelection}>
            ← Change source
          </Button>
        </div>
      )}
      {(state === 'recording' || state === 'paused') && (
        <div className="flex justify-start">
          <Button variant="ghost" onClick={handleCancelRecording}>
            Cancel
          </Button>
        </div>
      )}

      {/* Source indicator */}
      {(state === 'recording' || state === 'paused') && (
        <div className="text-center text-xs text-gray-600 dark:text-gray-400">
          Recording from:{' '}
          <span className="font-medium text-gray-800 dark:text-gray-300">
            {selectedSource === 'microphone' ? 'Microphone' : 'Tab Audio'}
          </span>
        </div>
      )}
    </div>
  );
}
