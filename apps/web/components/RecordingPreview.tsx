'use client';

import { useEffect, useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { useAudioWaveform } from '@/hooks/useAudioWaveform';

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
  duration: durationProp,
  onConfirm,
  onReRecord,
  onCancel,
}: RecordingPreviewProps) {
  const t = useTranslations('recording');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(durationProp);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use actual audio duration once loaded, fallback to prop
  const duration = actualDuration;

  // Create audio URL from blob - use ref to ensure stability across renders
  const audioUrlRef = useRef<string | null>(null);

  // Create URL only once when blob changes
  if (!audioUrlRef.current) {
    audioUrlRef.current = URL.createObjectURL(audioBlob);
  }

  const audioUrl = audioUrlRef.current;

  // Cleanup URL only on unmount (not on re-renders)
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Get actual duration from audio element when metadata loads
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audioDuration = e.currentTarget.duration;
    if (audioDuration && isFinite(audioDuration)) {
      setActualDuration(audioDuration);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Always reset to beginning if at or near the end, or if audio has ended
      if (audioRef.current.ended || audioRef.current.currentTime >= duration - 0.1 || currentTime >= duration - 0.1) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Reset to beginning and try again (without reload which can break blob URLs)
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          // Silently fail - user can try again
        }
      }
    }
  };

  // Click on waveform to seek
  const waveformRef = useRef<HTMLDivElement>(null);

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !audioRef.current) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  // Track last known time to detect when playback stalls
  const lastTimeRef = useRef<number>(-1);
  const stallCountRef = useRef<number>(0);
  const stallCheckRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const time = e.currentTarget.currentTime;
    setCurrentTime(time);
    lastTimeRef.current = time;
    stallCountRef.current = 0; // Reset stall counter when time updates
  };

  // Detect when playback has actually ended
  // The 'ended' event doesn't fire reliably when audio is routed through Web Audio API
  // So we poll to detect when currentTime stops advancing
  useEffect(() => {
    if (!isPlaying) {
      // Clear any existing interval when not playing
      if (stallCheckRef.current) {
        clearInterval(stallCheckRef.current);
        stallCheckRef.current = null;
      }
      stallCountRef.current = 0;
      return;
    }

    // Poll every 300ms to check if playback has stalled
    stallCheckRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || !isFinite(audio.duration)) return;

      const currentAudioTime = audio.currentTime;
      const audioDuration = audio.duration;

      // Check if time hasn't advanced
      if (currentAudioTime === lastTimeRef.current && currentAudioTime > 0) {
        stallCountRef.current++;

        // Only trigger end detection if:
        // 1. Time hasn't advanced for 2+ checks (600ms+)
        // 2. We're near the end of the audio (within 1 second)
        if (
          stallCountRef.current >= 2 &&
          currentAudioTime >= audioDuration - 1
        ) {
          setIsPlaying(false);
          // First show playhead at 100% (snap to end)
          setCurrentTime(audioDuration);
          lastTimeRef.current = -1;
          stallCountRef.current = 0;
          if (stallCheckRef.current) {
            clearInterval(stallCheckRef.current);
            stallCheckRef.current = null;
          }
          // After brief pause, reset playhead to beginning for next play
          setTimeout(() => {
            setCurrentTime(0);
            if (audio) {
              audio.currentTime = 0;
            }
          }, 500);
        }
      } else {
        stallCountRef.current = 0;
      }
    }, 300);

    return () => {
      if (stallCheckRef.current) {
        clearInterval(stallCheckRef.current);
        stallCheckRef.current = null;
      }
    };
  }, [isPlaying]);

  const handleEnded = () => {
    setIsPlaying(false);
    // First show playhead at 100% (snap to end)
    setCurrentTime(duration);
    // After brief pause, reset playhead to beginning for next play
    setTimeout(() => {
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }, 500);
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

  // Generate real waveform from audio data (more bars for full-width display)
  const { waveformBars, isAnalyzing } = useAudioWaveform(audioBlob, 100);

  return (
    <div className="space-y-4">
      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Preview Card */}
      <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('preview.yourRecording')}
        </h3>

        {/* Playback controls - SoundCloud style */}
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            className="flex-shrink-0 p-3 rounded-full bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Waveform seekbar */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Waveform with playhead */}
            <div
              ref={waveformRef}
              onClick={handleWaveformClick}
              className="relative h-12 cursor-pointer"
            >
              {/* Waveform bars */}
              <div className="absolute inset-0 flex items-center gap-[2px]">
                {isAnalyzing || waveformBars.length === 0 ? (
                  // Loading placeholder
                  Array.from({ length: 100 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gray-300 dark:bg-gray-600 animate-pulse"
                      style={{
                        height: `${20 + Math.sin(i * 0.3) * 10}%`,
                        animationDelay: `${i * 10}ms`,
                      }}
                    />
                  ))
                ) : (
                  waveformBars.map((height, i) => {
                    const progress = duration > 0 ? currentTime / duration : 0;
                    const barProgress = i / waveformBars.length;
                    const isPast = barProgress <= progress;

                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-colors duration-100"
                        style={{
                          height: `${height}%`,
                          backgroundColor: isPast ? '#8D6AFA' : '#d1d5db',
                          opacity: isPast ? 1 : 0.5,
                        }}
                      />
                    );
                  })
                )}
              </div>

              {/* Playhead line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#8D6AFA] pointer-events-none"
                style={{
                  left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Time display - current left, total right */}
            <div className="flex justify-between text-xs font-mono text-gray-600 dark:text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - mobile-friendly stacked layout */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={handleCancelWithConfirmation} fullWidth>
            {t('controls.cancel')}
          </Button>
          <Button variant="brand" onClick={onConfirm} fullWidth>
            {t('preview.proceed')} →
          </Button>
        </div>
        <Button variant="ghost" onClick={handleReRecordWithConfirmation} fullWidth>
          ← {t('preview.reRecord')}
        </Button>
      </div>
    </div>
  );
}
