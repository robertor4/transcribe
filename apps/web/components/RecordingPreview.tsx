'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from './Button';

interface RecordingPreviewProps {
  audioBlob: Blob;
  duration: number; // Recording duration in seconds
  onConfirm: () => void;
  onReRecord: () => void;
  onCancel: () => void;
}

/**
 * Recording preview component with audio playback
 * Shows after recording stops, before processing
 * Allows user to listen, re-record, or proceed
 */
export function RecordingPreview({
  audioBlob,
  duration,
  onConfirm,
  onReRecord,
  onCancel,
}: RecordingPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Create audio URL from blob (cleanup on unmount)
  const audioUrl = useMemo(() => URL.createObjectURL(audioBlob), [audioBlob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Confirmation handlers to prevent accidental data loss
  const handleCancelWithConfirmation = () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel? Your recording will be lost.'
    );
    if (!confirmed) return;
    onCancel();
  };

  const handleReRecordWithConfirmation = () => {
    const confirmed = window.confirm(
      'Are you sure you want to re-record? Your current recording will be lost.'
    );
    if (!confirmed) return;
    onReRecord();
  };

  // Generate static waveform visualization
  const waveformBars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      // Create a pseudo-random but consistent pattern based on index
      const height = 30 + Math.sin(i * 0.5) * 20 + Math.cos(i * 0.3) * 15;
      return Math.max(20, Math.min(100, height));
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Preview Card */}
      <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recording Preview
          </h3>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-400">
            Total: {formatTime(duration)}
          </div>
        </div>

        {/* Playback controls */}
        <div className="space-y-4">
          {/* Time display and play button */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              onClick={handlePlayPause}
              className="p-3 rounded-full bg-[#cc3399] text-white hover:bg-[#b82d89] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              )}
            </button>
          </div>

          {/* Seek bar */}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#cc3399]"
            style={{
              background: `linear-gradient(to right, #cc3399 0%, #cc3399 ${(currentTime / duration) * 100}%, rgb(229, 231, 235) ${(currentTime / duration) * 100}%, rgb(229, 231, 235) 100%)`,
            }}
          />

          {/* Static waveform visualization */}
          <div className="flex items-center justify-center gap-1 h-20 bg-white dark:bg-gray-900 rounded-lg p-4">
            {waveformBars.map((height, i) => {
              const progress = currentTime / duration;
              const barProgress = i / waveformBars.length;
              const isPast = barProgress <= progress;

              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-150"
                  style={{
                    width: '3px',
                    height: `${height}%`,
                    backgroundColor: isPast ? '#cc3399' : '#d1d5db',
                    opacity: isPast ? 1 : 0.4,
                  }}
                />
              );
            })}
          </div>

          {/* Playback tip */}
          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            Listen to your recording before proceeding to ensure quality
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={handleReRecordWithConfirmation}>
          ← Re-record
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCancelWithConfirmation}>
            Cancel
          </Button>
          <Button variant="brand" onClick={onConfirm}>
            Proceed with this recording →
          </Button>
        </div>
      </div>
    </div>
  );
}
