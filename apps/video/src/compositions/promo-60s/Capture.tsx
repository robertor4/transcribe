import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';
import { FadeIn, ProgressRing, LevelBars, Eyebrow } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 4: In Action — Capture (0:11–0:19)
 *
 * Upload dropzone pulses. File dragged in. Progress ring fills.
 * Metadata populates (Duration, Speakers, Confidence).
 * Level bars animate during processing. Platform icons float in.
 */
export const Capture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Dropzone (0–1.5s)
  const dropzoneOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // File drag animation (0.5s–1.5s)
  const fileY = spring({
    frame: frame - fps * 0.5,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  // Phase 2: Progress ring (1.5s–4s)
  const progress = interpolate(frame, [fps * 1.5, fps * 4.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 3: Metadata populates (4s–5s)
  const metaOpacity = interpolate(frame, [fps * 4.0, fps * 4.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 4: Platform icons (5.5s–7s)
  const platformProgress = interpolate(frame, [fps * 5.5, fps * 7.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitles
  const noBotOpacity = interpolate(frame, [fps * 5, fps * 5.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const metadata = [
    { label: 'Duration', value: '52:14' },
    { label: 'Speakers', value: '4' },
    { label: 'Confidence', value: '96%' },
  ];

  const platforms = [
    { name: 'Google Meet', logo: 'platforms/google-meet.svg' },
    { name: 'Microsoft Teams', logo: 'platforms/microsoft-teams.svg' },
    { name: 'Zoom', logo: 'platforms/zoom.svg' },
    { name: 'Any Audio', logo: null },
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
        gap: sp(32),
      }}
    >
      {/* Upload area + progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: sp(56) }}>
        {/* Left: File card */}
        <div style={{ opacity: dropzoneOpacity }}>
          <div
            style={{
              border: `2px dashed ${progress > 0 ? colors.primary : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: 20,
              padding: `${sp(40)}px ${sp(56)}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: sp(16),
              transform: `scale(${progress > 0.9 ? 1 : 1 + Math.sin(frame * 0.1) * 0.01})`,
            }}
          >
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: sz(20),
                fontWeight: 600,
                color: colors.textPrimary,
                opacity: fileY,
                transform: `translateY(${(1 - fileY) * -20}px)`,
              }}
            >
              Q2-board-review.m4a
            </div>

            {/* Level bars during processing */}
            {progress > 0 && progress < 1 && (
              <LevelBars
                width={cs(320)}
                height={cs(36)}
                audioLevel={(f) => 30 + Math.sin(f * 0.15) * 20}
                showChrome={false}
              />
            )}
          </div>
        </div>

        {/* Right: Progress ring */}
        {progress > 0 && (
          <ProgressRing progress={progress} size={cs(160)} />
        )}
      </div>

      {/* Metadata row */}
      <div
        style={{
          display: 'flex',
          gap: sp(32),
          opacity: metaOpacity,
        }}
      >
        {metadata.map((m, i) => (
          <div
            key={i}
            style={{
              background: colors.bgCard,
              border: `1px solid ${colors.bgCardBorder}`,
              borderRadius: 10,
              padding: `${sp(12)}px ${sp(24)}px`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: sz(11),
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: sp(6),
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: sz(20),
                fontWeight: 500,
                color: colors.textPrimary,
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* "No bots" callout */}
      <div
        style={{
          opacity: noBotOpacity,
          fontFamily: fonts.mono,
          fontSize: sz(14),
          color: colors.textMuted,
          letterSpacing: 1.5,
        }}
      >
        No bots. No installs. No permissions popups.
      </div>

      {/* Platform logos */}
      <div style={{ display: 'flex', gap: sp(24), alignItems: 'center', opacity: platformProgress }}>
        {platforms.map((platform, i) => {
          const stagger = interpolate(
            frame,
            [fps * 5.5 + i * 4, fps * 5.5 + i * 4 + 10],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div
              key={i}
              style={{
                opacity: stagger,
                transform: `translateY(${(1 - stagger) * 15}px)`,
                background: colors.bgCard,
                border: `1px solid ${colors.bgCardBorder}`,
                borderRadius: 12,
                padding: `${sp(12)}px ${sp(24)}px`,
                display: 'flex',
                alignItems: 'center',
                gap: sp(10),
              }}
            >
              {platform.logo ? (
                <Img
                  src={staticFile(platform.logo)}
                  style={{ width: sz(20), height: sz(20) }}
                />
              ) : (
                <svg width={sz(20)} height={sz(20)} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              )}
              <span
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: sz(12),
                  color: colors.textSecondary,
                }}
              >
                {platform.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
