'use client';

interface GeneratingLoaderProps {
  /** Additional CSS classes */
  className?: string;
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
export function GeneratingLoader({ className = '' }: GeneratingLoaderProps) {
  const bars = [0, 1, 2, 3, 4];

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {bars.map((i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-[#7A5AE0] to-[#8D6AFA]"
          style={{
            height: '28px',
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
