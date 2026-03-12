import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';
import { Eyebrow } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 5: CTA (1:03–1:08, 5s / 150 frames)
 *
 * VO: "Create with your voice. Try Neural Summary free
 *      at neuralsummary.com."
 *
 * Dark branded background at peak ambient warmth.
 * Wave divider, logo, "Create with your voice." headline,
 * CTA button with pulse, neuralsummary.com in DM Mono.
 */
export const ShowcaseCloseCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wave divider fades in (0–0.2s)
  const waveOpacity = interpolate(frame, [0, fps * 0.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Logo fades in (0.1–0.5s)
  const logoOpacity = interpolate(frame, [fps * 0.1, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoY = interpolate(frame, [fps * 0.1, fps * 0.5], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline fades in (0.5–1.0s)
  const headlineOpacity = interpolate(frame, [fps * 0.5, fps * 1.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headlineY = interpolate(frame, [fps * 0.5, fps * 1.0], [25, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // CTA button springs in (1.2s)
  const ctaProgress = spring({
    frame: frame - fps * 1.2,
    fps,
    config: { damping: 15 },
  });
  const ctaPulse = 1 + Math.sin(frame * 0.08) * 0.015 * ctaProgress;

  // URL fades in (1.5–2.0s)
  const urlOpacity = interpolate(frame, [fps * 1.5, fps * 2.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Ambient glow
  const ambientPulse = 0.7 + Math.sin(frame * 0.035) * 0.15;

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient gradient — peak warmth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: ambientPulse,
          background: [
            'radial-gradient(ellipse 55% 40% at 50% 40%, rgba(141,106,250,0.3) 0%, transparent 100%)',
            'radial-gradient(ellipse 45% 35% at 30% 70%, rgba(201,60,217,0.2) 0%, transparent 100%)',
            'radial-gradient(ellipse 35% 30% at 75% 25%, rgba(20,208,220,0.12) 0%, transparent 100%)',
          ].join(', '),
          filter: 'blur(48px)',
        }}
      />

      {/* Wave divider */}
      <div
        style={{
          position: 'absolute',
          top: sp(80),
          left: '10%',
          right: '10%',
          height: 2,
          opacity: waveOpacity,
          background: 'linear-gradient(90deg, transparent 0%, rgba(20,208,220,0.4) 20%, rgba(141,106,250,0.6) 50%, rgba(20,208,220,0.4) 80%, transparent 100%)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: logoOpacity,
          transform: `translateY(${logoY}px)`,
        }}
      >
        <Img
          src={staticFile('logos/neural-summary-logo-white.svg')}
          style={{
            width: cs(280),
            height: 'auto',
          }}
        />
      </div>

      {/* Headline: "Create with your voice." */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          fontFamily: fonts.heading,
          fontSize: sz(46),
          fontWeight: 700,
          color: colors.textPrimary,
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        Create with your{' '}
        <span style={{ fontStyle: 'italic', color: colors.cyan }}>
          voice.
        </span>
      </div>

      {/* CTA Button */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: ctaProgress,
          transform: `scale(${ctaPulse})`,
        }}
      >
        <div
          style={{
            background: colors.primary,
            borderRadius: 10,
            padding: `${sp(16)}px ${sp(48)}px`,
            fontFamily: fonts.body,
            fontSize: sz(18),
            fontWeight: 600,
            color: '#ffffff',
            boxShadow: `0 0 40px ${colors.primary}40`,
          }}
        >
          Try it free
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: urlOpacity,
          fontFamily: '"DM Mono", monospace',
          fontSize: sz(12),
          color: colors.textMuted,
          letterSpacing: 2.5,
          textTransform: 'uppercase',
        }}
      >
        neuralsummary.com
      </div>
    </div>
  );
};
