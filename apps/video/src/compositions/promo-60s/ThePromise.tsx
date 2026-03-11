import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';
import { Eyebrow, FadeIn } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 3: The Promise (0:07–0:11)
 *
 * Hard cut to black. Logo fades in.
 * Eyebrow: "THE MEETING INTELLIGENCE PLATFORM" (DM Mono, cyan)
 * Headline types out in Merriweather Black:
 *   "Every conversation, a *strategic asset.*"
 * "strategic asset" glows in #14D0DC italic.
 */
export const ThePromise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo fades in first
  const logoOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Eyebrow appears after logo
  const eyebrowOpacity = interpolate(frame, [fps * 0.6, fps * 1.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline reveals word by word
  const headlineProgress = interpolate(frame, [fps * 1.2, fps * 2.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const words = ['Turn', 'conversations', 'into'];
  const emphasisWords = ['work-ready', 'documents.'];
  const allWords = [...words, ...emphasisWords];
  const visibleCount = Math.floor(headlineProgress * allWords.length);

  // Emphasis glow pulses after full reveal
  const glowIntensity = interpolate(frame, [fps * 3.0, fps * 3.3, fps * 3.8], [0, 1, 0.3], {
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
        gap: sp(32),
      }}
    >
      {/* Neural Summary logo */}
      <Img
        src={staticFile('logos/neural-summary-logo-white.svg')}
        style={{
          opacity: logoOpacity,
          width: cs(280),
          height: 'auto',
        }}
      />

      {/* Eyebrow */}
      <div style={{ opacity: eyebrowOpacity }}>
        <Eyebrow>The meeting intelligence platform</Eyebrow>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: sz(52),
          fontWeight: 900,
          color: colors.textPrimary,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: 1300,
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transition: 'opacity 0.1s',
            }}
          >
            {word}{' '}
          </span>
        ))}
        {emphasisWords.map((word, i) => {
          const idx = words.length + i;
          return (
            <span
              key={`em-${i}`}
              style={{
                opacity: idx < visibleCount ? 1 : 0,
                fontStyle: 'italic',
                color: colors.cyan,
                textShadow:
                  idx < visibleCount
                    ? `0 0 ${20 * glowIntensity}px ${colors.cyan}60`
                    : 'none',
              }}
            >
              {word}{' '}
            </span>
          );
        })}
      </div>
    </div>
  );
};
