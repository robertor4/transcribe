'use client';

import { useState, useEffect, useRef } from 'react';

interface TranslatingBannerProps {
  /** Whether translation is currently active */
  isActive: boolean;
  /** Estimated total translation time in seconds */
  estimatedSeconds: number;
  /** Label to display (e.g., "Translating...") */
  label: string;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '';
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return secs > 0 ? `~${mins}m ${secs}s` : `~${mins}m`;
}

/**
 * Inline banner with a time-based progress bar for translation operations.
 *
 * Progress fills linearly to ~90% over the estimated time, then crawls
 * slowly toward 98% if translation takes longer than expected.
 */
export function TranslatingBanner({ isActive, estimatedSeconds, label }: TranslatingBannerProps) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      setProgress(0);
      setElapsed(0);

      intervalRef.current = setInterval(() => {
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        setElapsed(elapsedSec);
        const ratio = elapsedSec / estimatedSeconds;

        if (ratio < 1) {
          setProgress(ratio * 90);
        } else {
          const overageRatio = (elapsedSec - estimatedSeconds) / estimatedSeconds;
          setProgress(90 + 8 * (1 - Math.exp(-overageRatio * 2)));
        }
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (startTimeRef.current > 0) {
        setProgress(100);
        const timeout = setTimeout(() => setProgress(0), 400);
        startTimeRef.current = 0;
        return () => clearTimeout(timeout);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, estimatedSeconds]);

  if (!isActive && progress === 0) return null;

  const remaining = Math.max(0, estimatedSeconds - elapsed);
  const timeLabel = elapsed < estimatedSeconds
    ? formatTimeRemaining(remaining)
    : 'Almost done...';

  return (
    <div className="mb-4 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{label}</span>
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {timeLabel}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-purple-100 dark:bg-purple-900/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8D6AFA] to-[#14D0DC] transition-all duration-500 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
