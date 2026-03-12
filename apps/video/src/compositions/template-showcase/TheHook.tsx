import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Eyebrow, FadeIn } from '@/components';
import { colors, fonts, sz, sp } from '@/lib/design-tokens';

/**
 * Scene 1: The Hook (0:00–0:05)
 *
 * Dark branded screen (#22184C) with ambient glow.
 * "You recorded a conversation." fades in (Merriweather 900, white).
 * Beat, then "Now what?" in cyan italic.
 * DM Mono eyebrow floats above.
 */
export const TheHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ambient gradient opacity pulse
  const ambientPulse = 0.6 + Math.sin(frame * 0.04) * 0.15;

  // Eyebrow fades in first (0–0.4s)
  const eyebrowOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Main headline fades in (0.3–1.0s)
  const headlineOpacity = interpolate(frame, [fps * 0.3, fps * 1.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headlineY = interpolate(frame, [fps * 0.3, fps * 1.0], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // "Now what?" fades in (1.8–2.4s)
  const nowWhatOpacity = interpolate(frame, [fps * 1.8, fps * 2.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const nowWhatY = interpolate(frame, [fps * 1.8, fps * 2.4], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Everything fades out at end (4.0–5.0s)
  const exitFade = interpolate(frame, [fps * 4.0, fps * 5.0], [1, 0], {
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
        position: 'relative',
        overflow: 'hidden',
        opacity: exitFade,
      }}
    >
      {/* Ambient gradient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: ambientPulse,
          background: [
            'radial-gradient(ellipse 55% 40% at 15% 20%, rgba(138,136,232,0.28) 0%, transparent 100%)',
            'radial-gradient(ellipse 45% 35% at 85% 75%, rgba(201,60,217,0.22) 0%, transparent 100%)',
            'radial-gradient(ellipse 35% 30% at 70% 10%, rgba(138,136,232,0.15) 0%, transparent 100%)',
          ].join(', '),
          filter: 'blur(48px)',
        }}
      />

      {/* Content container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: sp(28),
        }}
      >
        {/* Eyebrow tag */}
        <div
          style={{
            opacity: eyebrowOpacity,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            border: `1px solid rgba(20, 208, 220, 0.3)`,
            borderRadius: 20,
            padding: `${sp(4)}px ${sp(14)}px`,
          }}
        >
          {/* Cyan dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: colors.cyan,
            }}
          />
          <Eyebrow size={12}>NEURAL SUMMARY</Eyebrow>
        </div>

        {/* Main headline */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
            fontFamily: fonts.heading,
            fontSize: sz(48),
            fontWeight: 900,
            color: colors.textPrimary,
            textAlign: 'center',
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          You recorded a conversation.
        </div>

        {/* "Now what?" */}
        <div
          style={{
            opacity: nowWhatOpacity,
            transform: `translateY(${nowWhatY}px)`,
            fontFamily: fonts.heading,
            fontSize: sz(42),
            fontWeight: 700,
            fontStyle: 'italic',
            color: colors.cyan,
            textAlign: 'center',
          }}
        >
          Now what?
        </div>
      </div>
    </div>
  );
};
