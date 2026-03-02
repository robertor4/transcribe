/**
 * RecordingRecoveryDialog component
 * Shows dialog when unsaved recordings are found in IndexedDB
 * Allows users to recover, preview, continue, or discard recordings from previous sessions
 */

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  AlertCircle,
  Clock,
  HardDrive,
  Mic,
  Monitor,
  X,
  Play,
  Pause,
  ChevronDown,
  Trash2,
  Upload,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, nl, de, fr, es } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import type { RecoverableRecording } from '@/utils/recordingStorage';
import { getRecordingStorage } from '@/utils/recordingStorage';
import { useAudioWaveform, ensureAudioContextReady } from '@/hooks/useAudioWaveform';
import { Button } from './Button';

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

  return `${value} ${sizes[i]}`;
}

/**
 * Map next-intl locale to date-fns locale
 */
function getDateFnsLocale(locale: string) {
  const localeMap: Record<string, Locale> = {
    en: enUS,
    nl: nl,
    de: de,
    fr: fr,
    es: es,
  };
  return localeMap[locale] || enUS;
}

/**
 * Inline audio preview component with waveform visualization
 */
function InlineAudioPreview({
  audioBlob,
  duration: durationProp,
  onClose,
}: {
  audioBlob: Blob;
  duration: number;
  onClose: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(durationProp);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Web Audio API refs for iOS volume control
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const isAudioRoutedRef = useRef(false);

  const duration = actualDuration;

  // Create audio URL from blob
  if (!audioUrlRef.current) {
    audioUrlRef.current = URL.createObjectURL(audioBlob);
  }

  const audioUrl = audioUrlRef.current;

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Set up Web Audio API routing for iOS volume control
  const setupAudioRouting = useCallback(() => {
    if (isAudioRoutedRef.current || !audioRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const gainNode = audioContext.createGain();
      const sourceNode = audioContext.createMediaElementSource(audioRef.current);

      sourceNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      gainNode.gain.value = isMuted ? 0 : volume;

      audioContextRef.current = audioContext;
      gainNodeRef.current = gainNode;
      sourceNodeRef.current = sourceNode;
      isAudioRoutedRef.current = true;
    } catch (err) {
      console.warn('Failed to set up Web Audio routing for volume control:', err);
    }
  }, [volume, isMuted]);

  // Update gain when volume or mute changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Handle volume change from slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  // Get waveform data - using 50 bars to match RecordingPreview
  const { waveformBars, isAnalyzing } = useAudioWaveform(audioBlob, 50);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audioDuration = e.currentTarget.duration;
    if (audioDuration && isFinite(audioDuration)) {
      setActualDuration(audioDuration);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Set up Web Audio routing on first play (requires user interaction for iOS)
      setupAudioRouting();

      // Resume AudioContext if suspended (iOS requirement)
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (audioRef.current.ended || currentTime >= duration - 0.1) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Silently fail - user can try again
      }
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !audioRef.current) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-3 mx-4 mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      <div className="flex items-start gap-3">
        {/* Play/Pause button - matches RecordingPreview size */}
        <button
          onClick={handlePlayPause}
          className="flex-shrink-0 mt-1 w-11 h-11 flex items-center justify-center rounded-full bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Waveform seekbar - matches RecordingPreview layout */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Waveform with playhead */}
          <div
            ref={waveformRef}
            onClick={handleWaveformClick}
            className="relative h-14 cursor-pointer"
          >
            {/* Waveform bars */}
            <div className="absolute inset-0 flex items-center gap-[2px]">
              {isAnalyzing || waveformBars.length === 0 ? (
                Array.from({ length: 50 }).map((_, i) => (
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
          <div className="flex justify-between text-xs font-mono text-gray-500 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 mt-1 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-3 mt-3 px-1">
        <button
          onClick={handleMuteToggle}
          className="flex-shrink-0 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full appearance-none cursor-pointer accent-[#8D6AFA] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#8D6AFA] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#8D6AFA] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}

interface RecordingRecoveryDialogProps {
  recordings: RecoverableRecording[];
  onProcessImmediately: (recording: RecoverableRecording, blob: Blob) => void;
  onContinueRecording: (recording: RecoverableRecording, chunks: Blob[]) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}

export function RecordingRecoveryDialog({
  recordings,
  onProcessImmediately,
  onContinueRecording,
  onDiscard,
  onClose,
}: RecordingRecoveryDialogProps) {
  const t = useTranslations('recovery');
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  // State for preview
  const [previewRecordingId, setPreviewRecordingId] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // State for dropdown menus
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // State for discard confirmation
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openDropdownId) {
          setOpenDropdownId(null);
        } else if (previewRecordingId) {
          setPreviewRecordingId(null);
          setPreviewBlob(null);
        } else if (recordings.length > 0) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [recordings.length, onClose, openDropdownId, previewRecordingId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  // Load preview blob
  const handlePreview = useCallback(async (recording: RecoverableRecording) => {
    if (previewRecordingId === recording.id) {
      // Toggle off
      setPreviewRecordingId(null);
      setPreviewBlob(null);
      return;
    }

    // Pre-warm AudioContext on user gesture (before any async operations)
    // This ensures the AudioContext can be resumed on mobile browsers
    await ensureAudioContextReady();

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const storage = await getRecordingStorage();
      const blob = await storage.reconstructBlob(recording.id);

      if (blob) {
        setPreviewRecordingId(recording.id);
        setPreviewBlob(blob);
      } else {
        setPreviewError('Could not load recording preview');
      }
    } catch (err) {
      console.error('Failed to load preview:', err);
      setPreviewError('Failed to load recording preview');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [previewRecordingId]);

  // Handle process immediately
  const handleProcessImmediately = useCallback(async (recording: RecoverableRecording) => {
    setOpenDropdownId(null);

    try {
      const storage = await getRecordingStorage();
      const blob = await storage.reconstructBlob(recording.id);

      if (blob) {
        onProcessImmediately(recording, blob);
      } else {
        console.error('Could not reconstruct blob for processing');
      }
    } catch (err) {
      console.error('Failed to process recording:', err);
    }
  }, [onProcessImmediately]);

  // Handle continue recording
  const handleContinueRecording = useCallback((recording: RecoverableRecording) => {
    setOpenDropdownId(null);
    onContinueRecording(recording, recording.chunks);
  }, [onContinueRecording]);

  // Handle confirmed discard
  const handleConfirmDiscard = useCallback(() => {
    if (confirmDiscardId) {
      onDiscard(confirmDiscardId);
      // Clean up preview if it was for this recording
      if (previewRecordingId === confirmDiscardId) {
        setPreviewRecordingId(null);
        setPreviewBlob(null);
      }
      setConfirmDiscardId(null);
    }
  }, [confirmDiscardId, onDiscard, previewRecordingId]);

  if (recordings.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[60] pointer-events-auto animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[60] pointer-events-auto flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  {t('title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('description', { count: recordings.length })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recordings List */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {previewError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {previewError}
              </div>
            )}

            <div className="space-y-3">
              {recordings.map((recording) => {
                const totalSize = recording.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
                const relativeTime = formatDistanceToNow(new Date(recording.lastSaved), {
                  addSuffix: true,
                  locale: dateFnsLocale,
                });

                return (
                  <div
                    key={recording.id}
                    className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors overflow-visible"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4">
                      {/* Top row: Icon + Info */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Source Icon */}
                        <div className="flex-shrink-0">
                          {recording.source === 'microphone' ? (
                            <div className="w-10 h-10 rounded-full bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 flex items-center justify-center">
                              <Mic className="w-5 h-5 text-[#8D6AFA]" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                              <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                        </div>

                        {/* Recording Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {recording.source === 'microphone'
                                ? t('microphoneRecording')
                                : t('tabAudioRecording')}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(recording.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              <span>{formatFileSize(totalSize)}</span>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {relativeTime}
                          </div>
                        </div>
                      </div>

                      {/* Actions - stacks below on mobile */}
                      <div className="flex items-center gap-3 sm:gap-2 ml-[52px] sm:ml-0 sm:flex-shrink-0">
                        {/* Preview button */}
                        <button
                          type="button"
                          onClick={() => handlePreview(recording)}
                          disabled={isLoadingPreview}
                          className={`
                            px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200
                            ${previewRecordingId === recording.id
                              ? 'bg-[#8D6AFA] text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-[#8D6AFA] hover:text-[#8D6AFA]'
                            }
                          `}
                        >
                          {isLoadingPreview && previewRecordingId === recording.id ? (
                            <span className="animate-pulse">{t('preview')}</span>
                          ) : (
                            t('preview')
                          )}
                        </button>

                        {/* Recover dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === recording.id ? null : recording.id);
                            }}
                            className="
                              px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium
                              bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white
                              transition-all duration-200
                              flex items-center gap-1 whitespace-nowrap
                            "
                          >
                            {t('recover')}
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {openDropdownId === recording.id && (
                            <div
                              className="fixed right-4 sm:absolute sm:right-0 mt-1 w-52 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 py-1 z-[80]"
                              style={{ top: 'auto' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleProcessImmediately(recording)}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                {t('processImmediately')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleContinueRecording(recording)}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                {t('continueRecording')}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Discard button */}
                        <button
                          type="button"
                          onClick={() => setConfirmDiscardId(recording.id)}
                          className="
                            p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-500
                            hover:bg-red-50 dark:hover:bg-red-900/20
                            transition-all duration-200
                          "
                          title={t('discard')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preview section */}
                    {previewRecordingId === recording.id && previewBlob && (
                      <InlineAudioPreview
                        audioBlob={previewBlob}
                        duration={recording.duration}
                        onClose={() => {
                          setPreviewRecordingId(null);
                          setPreviewBlob(null);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {t('footerNote')}
            </div>
            <Button variant="ghost" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {confirmDiscardId && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] pointer-events-auto"
            onClick={() => setConfirmDiscardId(null)}
          />
          <div className="fixed inset-0 z-[70] pointer-events-auto flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('discardTitle')}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {t('discardMessage')}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDiscardId(null)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmDiscard}
                >
                  {t('discard')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
