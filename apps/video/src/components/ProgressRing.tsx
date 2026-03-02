import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, cs } from '@/lib/design-tokens';

interface ProgressRingProps {
  /** Ring diameter in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Progress from 0 to 1 */
  progress: number;
  /** Number of segments (gaps in the ring) */
  segments?: number;
  /** Ring color */
  color?: string;
  /** Track (background ring) color */
  trackColor?: string;
  /** Whether to show percentage text in center */
  showLabel?: boolean;
}

/**
 * Segmented progress ring — used for the upload/processing animation.
 * Fills segment by segment in #8D6AFA.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = cs(120),
  strokeWidth = 10,
  progress,
  segments = 8,
  color = colors.primary,
  trackColor = 'rgba(255, 255, 255, 0.08)',
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapSize = 4; // px gap between segments
  const gapAngle = (gapSize / circumference) * 360;

  const segmentAngle = (360 - gapAngle * segments) / segments;
  const segmentLength = (segmentAngle / 360) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track segments */}
        {Array.from({ length: segments }, (_, i) => {
          const startAngle = i * (segmentAngle + gapAngle);
          const offset = (startAngle / 360) * circumference;
          return (
            <circle
              key={`track-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={trackColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
        })}

        {/* Filled segments */}
        {Array.from({ length: segments }, (_, i) => {
          const segmentProgress = Math.max(0, Math.min(1, (progress * segments) - i));
          if (segmentProgress <= 0) return null;

          const startAngle = i * (segmentAngle + gapAngle);
          const offset = (startAngle / 360) * circumference;
          const fillLength = segmentLength * segmentProgress;

          return (
            <circle
              key={`fill-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${fillLength} ${circumference - fillLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
            />
          );
        })}
      </svg>

      {showLabel && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"DM Mono", monospace',
            fontSize: size * 0.22,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {Math.round(progress * 100)}%
        </div>
      )}
    </div>
  );
};
