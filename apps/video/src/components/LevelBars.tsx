import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, levelBars, sz, sp, cs } from '@/lib/design-tokens';

interface LevelBarsProps {
  /** Container width in px */
  width?: number;
  /** Container height in px */
  height?: number;
  /**
   * Simulated audio energy per frame (0–100).
   * Provide a function that maps frame → level, or a static value.
   */
  audioLevel?: number | ((frame: number) => number);
  /** Whether the bars should appear in "paused" state (dimmed, low) */
  paused?: boolean;
  /** Whether to show the "Level" label and timer chrome */
  showChrome?: boolean;
  /** Simulated timer value in seconds (for display only) */
  timerSeconds?: number;
}

/**
 * Animated audio level bars — matching the LevelBarsRow component
 * from the Neural Summary web app.
 *
 * 12 vertical bars: purple (#8D6AFA) with cyan (#14D0DC) accents at
 * positions 3, 6, 9. Fast attack, slow release, subtle wave animation.
 */
export const LevelBars: React.FC<LevelBarsProps> = ({
  width = cs(320),
  height = cs(40),
  audioLevel = 0,
  paused = false,
  showChrome = true,
  timerSeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Resolve audio level for this frame
  const level = typeof audioLevel === 'function' ? audioLevel(frame) : audioLevel;

  // Generate bar heights with wave animation
  const barHeights = Array.from({ length: levelBars.barCount }, (_, i) => {
    const target = paused ? 10 : Math.max(level, 15);
    const phase = (i / levelBars.barCount) * Math.PI * 2;
    const waveAmount = level > 0 ? levelBars.waveAmount : levelBars.idleWaveAmount;
    const wave = Math.sin(time * levelBars.waveFrequency + phase) * waveAmount;

    // Simulate per-bar frequency variation from the overall level
    const bandVariation = Math.sin(i * 1.7 + time * 2.3) * 0.3 + 0.7;
    const bandLevel = target * bandVariation;

    const baseHeight = levelBars.barMinHeight + (bandLevel / 100) * (levelBars.barMaxHeight - levelBars.barMinHeight);
    return Math.max(levelBars.barMinHeight, baseHeight + wave * baseHeight);
  });

  const barsAreaWidth = levelBars.barCount * levelBars.barWidth + (levelBars.barCount - 1) * levelBars.barGap;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sp(16),
        background: colors.bgCard,
        border: `1px solid ${colors.bgCardBorder}`,
        borderRadius: 12,
        padding: `${sp(16)}px ${sp(28)}px`,
        width,
      }}
    >
      {showChrome && (
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: sz(11),
            fontWeight: 500,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
          }}
        >
          Level
        </span>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: levelBars.barGap,
          height,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {barHeights.map((h, i) => {
          const isAccent = levelBars.accentIndices.includes(i);
          return (
            <div
              key={i}
              style={{
                width: levelBars.barWidth,
                height: `${h * 100}%`,
                borderRadius: 2,
                backgroundColor: isAccent ? colors.barCyan : colors.barPurple,
                opacity: paused ? 0.4 : 0.8,
              }}
            />
          );
        })}
      </div>

      {showChrome && (
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: sz(20),
            letterSpacing: 3,
            color: 'rgba(255, 255, 255, 0.25)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(timerSeconds)}
        </span>
      )}
    </div>
  );
};
