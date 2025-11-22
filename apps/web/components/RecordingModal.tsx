'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';

interface RecordingModalProps {
  isOpen: boolean;
  onStop: () => void;
  onCancel: () => void;
}

/**
 * Full-screen recording modal
 * Shows elapsed time, waveform visualization, and stop button
 * Triggered when user clicks the FloatingRecordButton
 */
export function RecordingModal({ isOpen, onStop, onCancel }: RecordingModalProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  // Timer for elapsed time
  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Animated waveform bars
  useEffect(() => {
    if (!isOpen) {
      setWaveformBars([]);
      return;
    }

    // Initialize with random heights
    setWaveformBars(Array.from({ length: 40 }, () => Math.random()));

    // Animate bars randomly
    const interval = setInterval(() => {
      setWaveformBars(Array.from({ length: 40 }, () => Math.random() * 0.7 + 0.3));
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Recording...
            </span>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-center justify-center gap-1 h-32 mb-12">
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
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="brand"
            size="lg"
            onClick={onStop}
            fullWidth
          >
            Stop & Transcribe
          </Button>
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel recording
          </button>
        </div>
      </div>
    </div>
  );
}
