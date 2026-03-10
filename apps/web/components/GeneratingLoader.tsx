'use client';

import { useEffect, useRef } from 'react';

/**
 * Waveform Loading Animation
 *
 * 9 bars that continuously oscillate at different speeds and phases,
 * creating a flowing waveform effect like an audio equalizer.
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
const MIN_PIXELS = 1;

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

// Each bar oscillates with its own speed and phase offset
// to create a natural wave motion
const BAR_CONFIG = [
  { speed: 4.0, phase: 0 },
  { speed: 4.8, phase: 0.7 },
  { speed: 3.5, phase: 1.4 },
  { speed: 5.2, phase: 2.1 },
  { speed: 4.2, phase: 2.8 },
  { speed: 5.0, phase: 3.5 },
  { speed: 3.8, phase: 4.2 },
  { speed: 4.6, phase: 4.9 },
  { speed: 3.6, phase: 5.6 },
];

function getBarHeight(barIndex: number, time: number): number {
  const { speed, phase } = BAR_CONFIG[barIndex];
  // Use multiple sine waves for organic motion
  const wave1 = Math.sin(time * speed + phase);
  const wave2 = Math.sin(time * speed * 0.7 + phase * 1.3) * 0.4;
  const combined = (wave1 + wave2) / 1.4; // normalize to roughly -1..1
  // Map to pixel count range
  const normalized = (combined + 1) / 2; // 0..1
  return Math.round(MIN_PIXELS + normalized * (MAX_PIXELS - MIN_PIXELS));
}

export function GeneratingLoader({ className = '', size = 'sm' }: GeneratingLoaderProps) {
  const { pixel, gap } = SIZE_CONFIG[size];
  const pixelGap = Math.max(1, Math.round(pixel * 0.3));
  const totalHeight = MAX_PIXELS * pixel + (MAX_PIXELS - 1) * pixelGap;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalWidth = BAR_COUNT * pixel + (BAR_COUNT - 1) * gap;
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    const animate = (timestamp: number) => {
      const time = timestamp / 1000; // convert to seconds
      ctx.clearRect(0, 0, totalWidth, totalHeight);

      for (let bar = 0; bar < BAR_COUNT; bar++) {
        const height = getBarHeight(bar, time);
        const x = bar * (pixel + gap);
        const colors = BAR_COLORS[bar];

        for (let px = 0; px < height; px++) {
          const y = totalHeight - (px + 1) * (pixel + pixelGap);
          ctx.fillStyle = colors[px % colors.length];
          // Slight rounding via rect (canvas doesn't need border-radius for tiny pixels)
          ctx.fillRect(x, y, pixel, pixel);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [pixel, gap, pixelGap, totalHeight]);

  const totalWidth = BAR_COUNT * pixel + (BAR_COUNT - 1) * gap;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={totalWidth}
        height={totalHeight}
        style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}
      />
    </div>
  );
}

export default GeneratingLoader;
