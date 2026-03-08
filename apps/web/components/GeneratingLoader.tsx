'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Pixel Bar Loading Animation
 *
 * 9 bars that grow into a wave shape. Each cycle, bars get randomly
 * assigned heights (2-6 pixels) so the wave silhouette shifts every loop.
 */

// Brand color palette for pixels
const PIXEL_COLORS = [
  '#8D6AFA', // primary purple
  '#14D0DC', // cyan
  '#7A5AE0', // mid purple
  '#3F38A0', // deep purple
  '#A78BFA', // light purple
  '#14D0DC', // cyan
  '#8D6AFA', // primary purple
  '#3F38A0', // deep purple
];

// Each bar has a unique color sequence (bottom to top)
const BAR_COLORS = [
  [PIXEL_COLORS[0], PIXEL_COLORS[1], PIXEL_COLORS[2], PIXEL_COLORS[3], PIXEL_COLORS[4], PIXEL_COLORS[5]],
  [PIXEL_COLORS[1], PIXEL_COLORS[3], PIXEL_COLORS[0], PIXEL_COLORS[5], PIXEL_COLORS[2], PIXEL_COLORS[4]],
  [PIXEL_COLORS[2], PIXEL_COLORS[0], PIXEL_COLORS[5], PIXEL_COLORS[1], PIXEL_COLORS[3], PIXEL_COLORS[6]],
  [PIXEL_COLORS[3], PIXEL_COLORS[5], PIXEL_COLORS[1], PIXEL_COLORS[4], PIXEL_COLORS[0], PIXEL_COLORS[2]],
  [PIXEL_COLORS[5], PIXEL_COLORS[2], PIXEL_COLORS[4], PIXEL_COLORS[0], PIXEL_COLORS[7], PIXEL_COLORS[1]],
  [PIXEL_COLORS[4], PIXEL_COLORS[0], PIXEL_COLORS[3], PIXEL_COLORS[1], PIXEL_COLORS[5], PIXEL_COLORS[2]],
  [PIXEL_COLORS[1], PIXEL_COLORS[5], PIXEL_COLORS[0], PIXEL_COLORS[2], PIXEL_COLORS[3], PIXEL_COLORS[4]],
  [PIXEL_COLORS[3], PIXEL_COLORS[2], PIXEL_COLORS[5], PIXEL_COLORS[0], PIXEL_COLORS[1], PIXEL_COLORS[6]],
  [PIXEL_COLORS[0], PIXEL_COLORS[4], PIXEL_COLORS[1], PIXEL_COLORS[5], PIXEL_COLORS[2], PIXEL_COLORS[3]],
];

const BAR_COUNT = 9;
const MAX_PIXELS = 6;
const MIN_PIXELS = 2;

// Generate a random wave-shaped set of bar heights
function randomWave(): number[] {
  return Array.from({ length: BAR_COUNT }, () =>
    MIN_PIXELS + Math.floor(Math.random() * (MAX_PIXELS - MIN_PIXELS + 1))
  );
}

interface GeneratingLoaderProps {
  className?: string;
  size?: 'xs' | 'xxs' | 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  xxs: { pixel: 3, gap: 2 },
  xs: { pixel: 4, gap: 3 },
  sm: { pixel: 5, gap: 4 },
  md: { pixel: 7, gap: 5 },
  lg: { pixel: 8, gap: 6 },
};

// Animation phases per pixel
type PixelPhase = 'hidden' | 'growing' | 'visible' | 'shrinking';

const GROW_MS = 200;
const VISIBLE_MS = 800;
const SHRINK_MS = 200;
const PAUSE_MS = 300;
const STAGGER_BAR_MS = 80;
const STAGGER_PIXEL_MS = 50;

export function GeneratingLoader({ className = '', size = 'sm' }: GeneratingLoaderProps) {
  const { pixel, gap } = SIZE_CONFIG[size];
  const pixelGap = Math.max(1, Math.round(pixel * 0.3));
  const totalHeight = MAX_PIXELS * pixel + (MAX_PIXELS - 1) * pixelGap;

  const [barHeights, setBarHeights] = useState<number[]>(randomWave);
  const [phases, setPhases] = useState<PixelPhase[][]>(() =>
    Array.from({ length: BAR_COUNT }, () =>
      Array.from({ length: MAX_PIXELS }, () => 'hidden' as PixelPhase)
    )
  );

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const runCycle = useCallback(() => {
    clearAllTimeouts();
    const heights = randomWave();
    setBarHeights(heights);

    // Reset all to hidden
    setPhases(
      Array.from({ length: BAR_COUNT }, () =>
        Array.from({ length: MAX_PIXELS }, () => 'hidden' as PixelPhase)
      )
    );

    let maxEndTime = 0;

    // Grow phase: stagger each bar and pixel
    for (let bar = 0; bar < BAR_COUNT; bar++) {
      for (let px = 0; px < heights[bar]; px++) {
        const delay = bar * STAGGER_BAR_MS + px * STAGGER_PIXEL_MS;

        // Start growing
        const t1 = setTimeout(() => {
          setPhases(prev => {
            const next = prev.map(row => [...row]);
            next[bar][px] = 'growing';
            return next;
          });
        }, delay);

        // Become visible
        const t2 = setTimeout(() => {
          setPhases(prev => {
            const next = prev.map(row => [...row]);
            next[bar][px] = 'visible';
            return next;
          });
        }, delay + GROW_MS);

        // Start shrinking
        const shrinkStart = delay + GROW_MS + VISIBLE_MS;
        const t3 = setTimeout(() => {
          setPhases(prev => {
            const next = prev.map(row => [...row]);
            next[bar][px] = 'shrinking';
            return next;
          });
        }, shrinkStart);

        // Become hidden
        const endTime = shrinkStart + SHRINK_MS;
        const t4 = setTimeout(() => {
          setPhases(prev => {
            const next = prev.map(row => [...row]);
            next[bar][px] = 'hidden';
            return next;
          });
        }, endTime);

        timeoutsRef.current.push(t1, t2, t3, t4);
        if (endTime > maxEndTime) maxEndTime = endTime;
      }
    }

    // Schedule next cycle
    const tNext = setTimeout(runCycle, maxEndTime + PAUSE_MS);
    timeoutsRef.current.push(tNext);
  }, [clearAllTimeouts]);

  useEffect(() => {
    runCycle();
    return clearAllTimeouts;
  }, [runCycle, clearAllTimeouts]);

  return (
    <div
      className={`flex items-end justify-center ${className}`}
      style={{ gap: `${gap}px`, height: `${totalHeight}px` }}
    >
      {Array.from({ length: BAR_COUNT }).map((_, barIdx) => (
        <div
          key={barIdx}
          className="flex flex-col-reverse items-center"
          style={{ gap: `${pixelGap}px` }}
        >
          {Array.from({ length: barHeights[barIdx] }).map((_, pixelIdx) => {
            const phase = phases[barIdx]?.[pixelIdx] ?? 'hidden';
            return (
              <div
                key={pixelIdx}
                style={{
                  width: `${pixel}px`,
                  height: `${pixel}px`,
                  borderRadius: '1px',
                  backgroundColor: BAR_COLORS[barIdx][pixelIdx % BAR_COLORS[barIdx].length],
                  opacity: phase === 'hidden' ? 0 : 1,
                  transform:
                    phase === 'growing'
                      ? 'scale(1.15)'
                      : phase === 'shrinking'
                        ? 'scale(0)'
                        : phase === 'visible'
                          ? 'scale(1)'
                          : 'scale(0)',
                  transition: `opacity ${phase === 'growing' ? GROW_MS : SHRINK_MS}ms ease-out, transform ${phase === 'growing' ? GROW_MS : SHRINK_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default GeneratingLoader;
