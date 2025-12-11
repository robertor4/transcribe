'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMediaRecorder, RecordingSource } from '@/hooks/useMediaRecorder';
import { RecordingPreview } from './RecordingPreview';
import { Button } from './Button';
import { Mic, Monitor, AlertCircle, Pause, Square } from 'lucide-react';

interface SimpleAudioRecorderProps {
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

/**
 * SimpleAudioRecorder - Lightweight recording component for prototype flow
 *
 * Features:
 * - Reuses production useMediaRecorder hook (gets all robustness)
 * - Supports both microphone and tab audio
 * - Pause/resume functionality
 * - Simple waveform animation (30 random bars)
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
}: SimpleAudioRecorderProps) {
  const {
    state,
    duration,
    audioBlob,
    error,
    isSupported,
    canUseTabAudio,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
  } = useMediaRecorder({
    enableAutoSave: true, // Auto-save to IndexedDB for crash recovery
  });

  const [selectedSource, setSelectedSource] = useState<RecordingSource>('microphone');
  const [waveformBars, setWaveformBars] = useState<number[]>([]);
  const [showSourceSelector, setShowSourceSelector] = useState(true);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Define handleStart before the useEffect that uses it
  const handleStart = useCallback(async () => {
    await startRecording(selectedSource);
  }, [startRecording, selectedSource]);

  // Back button handler - go back to source selection
  const handleBackToSourceSelection = useCallback(() => {
    setShowSourceSelector(true);
  }, []);

  // Waveform animation (simple version - 30 random bars)
  useEffect(() => {
    if (state !== 'recording') {
      setWaveformBars([]);
      return;
    }

    // Initialize with random heights
    setWaveformBars(Array.from({ length: 30 }, () => Math.random()));

    // Update waveform every 150ms
    const interval = setInterval(() => {
      setWaveformBars(Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3));
    }, 150);

    return () => clearInterval(interval);
  }, [state]);

  const handleSourceSelect = useCallback((source: RecordingSource) => {
    setSelectedSource(source);
    setShowSourceSelector(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (audioBlob) {
      onComplete(audioBlob);
      reset();
    }
  }, [audioBlob, onComplete, reset]);

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
          <button
            onClick={() => handleSourceSelect('microphone')}
            className="group p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#cc3399] group-hover:scale-110 transition-all duration-200">
              <Mic className="w-7 h-7 text-gray-600 dark:text-gray-400 group-hover:text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#cc3399]">
              Microphone
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400">
              Record from your device's microphone
            </p>
          </button>

          {/* Tab Audio */}
          <button
            onClick={() => handleSourceSelect('tab-audio')}
            disabled={!canUseTabAudio}
            className={`group p-8 rounded-xl border-2 transition-all duration-200 ${
              canUseTabAudio
                ? 'border-gray-200 dark:border-gray-700 hover:border-[#cc3399] hover:shadow-lg'
                : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
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
              className={`font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 ${
                canUseTabAudio ? 'group-hover:text-[#cc3399]' : ''
              }`}
            >
              Tab Audio
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-400">
              {canUseTabAudio
                ? 'Record audio from a browser tab'
                : 'Not supported in this browser'}
            </p>
          </button>
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
