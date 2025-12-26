'use client';

interface GeneratingLoaderProps {
  /** Additional CSS classes */
  className?: string;
  /** Size variant: 'xs', 'xxs', 'sm' (default), 'md', 'lg' */
  size?: 'xs' | 'xxs' | 'sm' | 'md' | 'lg';
}

/**
 * Vertical Pulse Bars Loading Animation
 *
 * An on-brand loading animation featuring 5 vertical bars that pulse
 * up and down in a smooth, staggered sequence. Designed to match the
 * aesthetic of the RecordingWaveform component.
 *
 * Used in the AI Asset generation modal during processing.
 */
export function GeneratingLoader({ className = '', size = 'sm' }: GeneratingLoaderProps) {
  const bars = [0, 1, 2, 3, 4];

  // Size configurations
  const sizeConfig = {
    xxs: { barWidth: 'w-0.5', barHeight: '12px', gap: 'gap-0.5' },
    xs: { barWidth: 'w-0.5', barHeight: '18px', gap: 'gap-1' },
    sm: { barWidth: 'w-1', barHeight: '28px', gap: 'gap-1.5' },
    md: { barWidth: 'w-1.5', barHeight: '48px', gap: 'gap-2' },
    lg: { barWidth: 'w-1.5', barHeight: '56px', gap: 'gap-2.5' },
  };

  const { barWidth, barHeight, gap } = sizeConfig[size];

  return (
    <div className={`flex items-center justify-center ${gap} ${className}`}>
      {bars.map((i) => (
        <div
          key={i}
          className={`${barWidth} rounded-full bg-gradient-to-t from-[#7A5AE0] to-[#8D6AFA]`}
          style={{
            height: barHeight,
            animation: 'pulseBar 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulseBar {
          0%,
          100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}

export default GeneratingLoader;
