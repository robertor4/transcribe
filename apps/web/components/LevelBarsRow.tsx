'use client';

import { useRef, useEffect, useCallback } from 'react';

interface LevelBarsRowProps {
  /** Overall audio level from 0-100 (fallback when no frequency data) */
  audioLevel: number;
  /** 12-band frequency spectrum, each 0-100 (low → high frequencies) */
  frequencyBands?: number[];
  /** Recording duration in seconds */
  duration: number;
  /** Whether audio is currently being recorded */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused?: boolean;
}

const BAR_COUNT = 12;

/**
 * Compact level visualization inspired by Variant B.
 * Shows: "Level" label | 12 animated vertical bars | MM:SS timer
 * in one horizontal row inside a subtle container.
 *
 * When frequencyBands are provided, each bar represents a frequency band
 * from low (left) to high (right). Otherwise falls back to overall level.
 */
export function LevelBarsRow({
  audioLevel,
  frequencyBands,
  duration,
  isPaused = false,
}: LevelBarsRowProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animationRef = useRef<number | null>(null);
  const smoothedBandsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const timeRef = useRef(0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const animate = useCallback(() => {
    timeRef.current += 0.016; // ~60fps

    const smoothed = smoothedBandsRef.current;
    const hasBands = frequencyBands && frequencyBands.length === BAR_COUNT;

    barsRef.current.forEach((bar, i) => {
      if (!bar) return;

      // Target level for this bar
      let target: number;
      if (isPaused) {
        target = 10;
      } else if (hasBands) {
        // Use real frequency band data
        target = frequencyBands[i];
      } else if (audioLevel > 0) {
        // Fallback: use overall level with slight wave variation
        target = audioLevel;
      } else {
        target = 15; // Idle ambient animation
      }

      // Smooth each band independently — fast attack, slower release
      const speed = target > smoothed[i] ? 0.35 : 0.15;
      smoothed[i] += (target - smoothed[i]) * speed;

      // Add subtle wave for organic movement (less pronounced with real frequency data)
      const phase = (i / BAR_COUNT) * Math.PI * 2;
      const waveAmount = hasBands ? 0.08 : 0.3;
      const wave = Math.sin(timeRef.current * 3.5 + phase) * waveAmount;

      // Map 0-100 level to 8%-80% bar height
      const baseHeight = 8 + (smoothed[i] / 100) * 72;
      const height = Math.max(8, baseHeight + wave * baseHeight);

      bar.style.height = `${height}%`;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [audioLevel, frequencyBands, isPaused]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] rounded-lg px-4 py-3">
      <span className="text-[11px] font-medium text-gray-500 dark:text-white/35 font-mono whitespace-nowrap uppercase tracking-wider">
        Level
      </span>
      <div className="flex items-end gap-[3px] flex-1 h-5">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          // Alternate accent color on some bars for visual interest
          const isAccent = i === 3 || i === 6 || i === 9;
          return (
            <div
              key={i}
              ref={(el) => { barsRef.current[i] = el; }}
              className={`w-[3px] rounded-sm transition-colors duration-150 ${
                isAccent
                  ? 'bg-[#14D0DC] dark:bg-[#14D0DC]'
                  : 'bg-[#8D6AFA] dark:bg-[#8D6AFA]'
              } ${isPaused ? 'opacity-40' : 'opacity-80'}`}
              style={{ height: '8%' }}
            />
          );
        })}
      </div>
      <span className="font-mono text-lg tracking-wider text-gray-400 dark:text-white/25 tabular-nums">
        {formatTime(duration)}
      </span>
    </div>
  );
}
