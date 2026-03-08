'use client';

/**
 * Pixel Bar Loading Animation
 *
 * Each "bar" is a vertical stack of small colored squares (pixels) that
 * grows and shrinks by revealing/hiding squares. Uses brand colors with
 * staggered, bouncy timing for an organic feel.
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
];

interface GeneratingLoaderProps {
  className?: string;
  size?: 'xs' | 'xxs' | 'sm' | 'md' | 'lg';
}

// Size configs: pixelSize, maxPixels per bar, gap between bars
const SIZE_CONFIG = {
  xxs: { pixel: 3, maxPixels: 4, gap: 2 },
  xs: { pixel: 4, maxPixels: 4, gap: 3 },
  sm: { pixel: 5, maxPixels: 5, gap: 4 },
  md: { pixel: 7, maxPixels: 6, gap: 5 },
  lg: { pixel: 8, maxPixels: 6, gap: 6 },
};

export function GeneratingLoader({ className = '', size = 'sm' }: GeneratingLoaderProps) {
  const { pixel, maxPixels, gap } = SIZE_CONFIG[size];
  const barCount = 5;

  // Total height = maxPixels * (pixel + gap between pixels)
  const pixelGap = Math.max(1, Math.round(pixel * 0.3));
  const totalHeight = maxPixels * pixel + (maxPixels - 1) * pixelGap;

  return (
    <div
      className={`flex items-end justify-center ${className}`}
      style={{ gap: `${gap}px`, height: `${totalHeight}px` }}
    >
      {Array.from({ length: barCount }).map((_, barIdx) => (
        <div
          key={barIdx}
          className="flex flex-col-reverse items-center"
          style={{ gap: `${pixelGap}px` }}
        >
          {Array.from({ length: maxPixels }).map((_, pixelIdx) => (
            <div
              key={pixelIdx}
              className="pixel-block rounded-[1px]"
              style={{
                width: `${pixel}px`,
                height: `${pixel}px`,
                backgroundColor: BAR_COLORS[barIdx][pixelIdx % BAR_COLORS[barIdx].length],
                animationName: 'pixelReveal',
                animationDuration: `${1.6 + barIdx * 0.15}s`,
                animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                animationIterationCount: 'infinite',
                animationDelay: `${barIdx * 0.12 + pixelIdx * 0.06}s`,
              }}
            />
          ))}
        </div>
      ))}
      <style jsx>{`
        @keyframes pixelReveal {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          15% {
            opacity: 1;
            transform: scale(1.15);
          }
          25% {
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          65% {
            opacity: 1;
            transform: scale(1.1);
          }
          75% {
            opacity: 0;
            transform: scale(0);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }
      `}</style>
    </div>
  );
}

export default GeneratingLoader;
