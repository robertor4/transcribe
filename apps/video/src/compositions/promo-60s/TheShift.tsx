import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { LevelBars } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 4: The Shift (0:15–0:20)
 *
 * Mood changes — dark chaos transitions to calm clarity.
 * A recording/mic icon appears with level bars.
 * "But what if you could get all of this done instantly?
 *  Simply — by recording your meetings."
 */
export const TheShift: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background brightens slightly
  const bgBrightness = interpolate(frame, [0, fps * 1.5], [0, 0.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // "What if" text fades in
  const whatIfOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // "What if" fades out before mic appears
  const whatIfFade = interpolate(frame, [fps * 2.0, fps * 2.5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Mic + recording UI appears
  const micScale = spring({
    frame: frame - fps * 2.5,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Recording pulse
  const pulse = Math.sin(frame * 0.12) * 0.3 + 0.7;
  const showRecording = frame > fps * 2.5;

  // Level bars audio level
  const barsLevel = (f: number) => {
    const t = f / fps;
    if (t < 0.5) return 0;
    return 25 + Math.sin(t * 6) * 20 + Math.sin(t * 11) * 10;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: `rgba(${34 + bgBrightness * 255}, ${24 + bgBrightness * 200}, ${76 + bgBrightness * 150}, 1)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sp(36),
        position: 'relative',
      }}
    >
      {/* "What if" text */}
      <div
        style={{
          opacity: whatIfOpacity * whatIfFade,
          fontFamily: fonts.heading,
          fontSize: sz(36),
          fontWeight: 300,
          fontStyle: 'italic',
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 1.5,
          position: 'absolute',
        }}
      >
        What if you could get all of this done
        <br />
        <span style={{ color: colors.cyan, fontWeight: 600 }}>instantly?</span>
      </div>

      {/* Recording UI */}
      {showRecording && (
        <div
          style={{
            transform: `scale(${micScale})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: sp(24),
          }}
        >
          {/* Mic icon with recording dot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: sp(16),
              background: colors.bgCard,
              border: `1px solid ${colors.primary}40`,
              borderRadius: 20,
              padding: `${sp(24)}px ${sp(40)}px`,
            }}
          >
            {/* Recording dot */}
            <div
              style={{
                width: cs(12),
                height: cs(12),
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                opacity: pulse,
                boxShadow: `0 0 ${12 * pulse}px rgba(239, 68, 68, 0.5)`,
              }}
            />

            {/* Mic SVG */}
            <svg
              width={sz(28)}
              height={sz(28)}
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>

            <span
              style={{
                fontFamily: fonts.body,
                fontSize: sz(18),
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              Recording your meeting...
            </span>
          </div>

          {/* Level bars */}
          <LevelBars
            width={cs(400)}
            height={cs(40)}
            audioLevel={barsLevel}
            showChrome={false}
          />
        </div>
      )}
    </div>
  );
};
