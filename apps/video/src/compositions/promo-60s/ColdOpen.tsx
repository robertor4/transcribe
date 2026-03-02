import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from 'remotion';
import { TypeWriter, LevelBars } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 1: Cold Open — The Loss (0:00–0:03)
 *
 * Audio level bars animate, then flatline to silence.
 * Text fades in: "What was decided about the pricing model in March?"
 * Beat. Text dissolves. Sets the emotional hook.
 */
export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Level bars: active for first 1.5s, then flatline
  const barsLevel = (f: number) => {
    const t = f / fps;
    if (t < 1.2) return 40 + Math.sin(t * 8) * 25; // Active audio
    return interpolate(t, [1.2, 1.8], [40, 0], { extrapolateRight: 'clamp' }); // Flatline
  };

  // Question text appears after bars flatline
  const textOpacity = interpolate(frame, [fps * 1.5, fps * 1.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Text dissolves at the end
  const textFade = interpolate(frame, [fps * 2.5, fps * 3], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sp(48),
      }}
    >
      {/* Audio level bars — flatline animation */}
      <LevelBars
        width={cs(480)}
        height={cs(48)}
        audioLevel={barsLevel}
        showChrome={false}
      />

      {/* The question that goes unanswered */}
      <div
        style={{
          opacity: textOpacity * textFade,
          fontFamily: fonts.heading,
          fontStyle: 'italic',
          fontSize: sz(28),
          fontWeight: 300,
          color: colors.textSecondary,
          textAlign: 'center',
          maxWidth: 1200,
          lineHeight: 1.6,
        }}
      >
        "What was decided about the pricing model in March?"
      </div>
    </div>
  );
};
