import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';
import { Eyebrow, FadeIn } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 9: Close — CTA (0:53–0:60)
 *
 * Everything converges into logo. Closing headline types out.
 * "assets" in Merriweather Italic #14D0DC. CTA button pulses.
 * Trust signals in DM Mono.
 */
export const CloseCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo fades in
  const logoOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline types out (0.5–2.5s)
  const headlineProgress = interpolate(frame, [fps * 0.5, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headlineWords = ['Turn', 'your', 'conversations', 'into'];
  const emphasisWord = 'assets.';
  const allWords = [...headlineWords, emphasisWord];
  const visibleCount = Math.floor(headlineProgress * allWords.length);

  // CTA button appears (3s)
  const ctaOpacity = spring({
    frame: frame - fps * 3,
    fps,
    config: { damping: 15 },
  });

  // CTA pulse
  const ctaScale = 1 + Math.sin(frame * 0.08) * 0.015 * ctaOpacity;

  // Trust signals (3.5s)
  const trustOpacity = interpolate(frame, [fps * 3.5, fps * 4.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const trustSignals = [
    'Free 14-day trial',
    'No credit card needed',
    'Cancel anytime',
  ];

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
        gap: sp(36),
      }}
    >
      {/* Neural Summary logo */}
      <Img
        src={staticFile('logos/neural-summary-logo-white.svg')}
        style={{
          opacity: logoOpacity,
          width: cs(260),
          height: 'auto',
        }}
      />

      {/* Headline */}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: sz(50),
          fontWeight: 700,
          color: colors.textPrimary,
          textAlign: 'center',
          lineHeight: 1.35,
        }}
      >
        {headlineWords.map((word, i) => (
          <span key={i} style={{ opacity: i < visibleCount ? 1 : 0 }}>
            {word}{' '}
          </span>
        ))}
        <span
          style={{
            opacity: visibleCount > headlineWords.length ? 1 : 0,
            fontStyle: 'italic',
            color: colors.cyan,
          }}
        >
          {emphasisWord}
        </span>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
        }}
      >
        <div
          style={{
            background: colors.primary,
            borderRadius: 100,
            padding: `${sp(18)}px ${sp(56)}px`,
            fontFamily: fonts.body,
            fontSize: sz(20),
            fontWeight: 600,
            color: '#ffffff',
            boxShadow: `0 0 40px ${colors.primary}40`,
          }}
        >
          Start for free
        </div>
      </div>

      {/* Trust signals */}
      <div
        style={{
          display: 'flex',
          gap: sp(28),
          opacity: trustOpacity,
        }}
      >
        {trustSignals.map((signal, i) => (
          <div
            key={i}
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: sz(13),
              color: colors.textMuted,
              letterSpacing: 1,
            }}
          >
            {signal}
          </div>
        ))}
      </div>
    </div>
  );
};
