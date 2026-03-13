import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 3: The Pain (4.8s)
 *
 * Two phases:
 * Phase 1 (0–1.5s): Quick flash of "30 min call → 1 hr writeup"
 * Phase 2 (1.5–4.8s): Action items dropping off, "you're behind" feeling
 *
 * Audio: "Action items fall through the cracks, and you constantly
 *  have the feeling that you're behind." (9.14–13.20s)
 */
export const ThePain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Quick time comparison (0–1.5s)
  const showPhase2 = frame > fps * 1.5;

  // Call duration counter (fast count 0–0.6s)
  const callMinutes = Math.min(
    Math.floor(interpolate(frame, [fps * 0.1, fps * 0.6], [0, 30], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
    30
  );

  // Writeup duration counter (appears after call, 0.5–1.2s)
  const writeupMinutes = Math.min(
    Math.floor(interpolate(frame, [fps * 0.7, fps * 1.2], [0, 63], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
    63
  );
  const writeupOpacity = interpolate(frame, [fps * 0.5, fps * 0.7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Arrow between them
  const arrowOpacity = interpolate(frame, [fps * 0.4, fps * 0.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 1 fade out
  const phase1Fade = interpolate(frame, [fps * 1.2, fps * 1.5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 2: Falling action items
  const actionItems = [
    'Send follow-up to client',
    'Update CRM with call notes',
    'Share summary with team',
    'Schedule next review',
    'Draft proposal changes',
  ];

  // "Behind" text (appears at ~3.5s to match "you're behind" in audio)
  const behindOpacity = interpolate(frame, [fps * 3.5, fps * 4.0], [0, 1], {
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
      }}
    >
      {/* Phase 1: Time comparison */}
      {!showPhase2 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: sp(48),
            opacity: phase1Fade,
          }}
        >
          {/* Call duration */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: fonts.heading,
                fontSize: sz(64),
                fontWeight: 900,
                color: colors.textPrimary,
                lineHeight: 1,
              }}
            >
              {callMinutes}<span style={{ fontSize: sz(28), color: colors.textMuted }}>min</span>
            </div>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: sz(12),
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginTop: sp(10),
              }}
            >
              Client Call
            </div>
          </div>

          {/* Arrow */}
          <div
            style={{
              opacity: arrowOpacity,
              fontFamily: fonts.body,
              fontSize: sz(32),
              color: colors.textMuted,
            }}
          >
            →
          </div>

          {/* Writeup duration */}
          <div style={{ textAlign: 'center', opacity: writeupOpacity }}>
            <div
              style={{
                fontFamily: fonts.heading,
                fontSize: sz(64),
                fontWeight: 900,
                color: '#ef4444',
                lineHeight: 1,
              }}
            >
              {writeupMinutes}<span style={{ fontSize: sz(28), color: 'rgba(239, 68, 68, 0.6)' }}>min</span>
            </div>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: sz(12),
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginTop: sp(10),
              }}
            >
              Writing It Up
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Action items falling through */}
      {showPhase2 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: sp(24),
          }}
        >
          {/* Action items with strikethrough / red X */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp(10), width: 800 }}>
            {actionItems.map((item, i) => {
              const itemStart = fps * 1.5 + i * 5;
              const itemOpacity = interpolate(frame, [itemStart, itemStart + 4], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              // Items fade to red and get crossed out
              const fadeRed = interpolate(
                frame,
                [itemStart + 6, itemStart + 10],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );

              return (
                <div
                  key={i}
                  style={{
                    opacity: itemOpacity,
                    display: 'flex',
                    alignItems: 'center',
                    gap: sp(12),
                    background: `rgba(239, 68, 68, ${fadeRed * 0.08})`,
                    border: `1px solid rgba(239, 68, 68, ${0.1 + fadeRed * 0.2})`,
                    borderRadius: 8,
                    padding: `${sp(10)}px ${sp(20)}px`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.body,
                      fontSize: sz(16),
                      color: `rgba(255, 255, 255, ${1 - fadeRed * 0.5})`,
                      textDecoration: fadeRed > 0.5 ? 'line-through' : 'none',
                      textDecorationColor: 'rgba(239, 68, 68, 0.6)',
                      flex: 1,
                    }}
                  >
                    {item}
                  </span>
                  {fadeRed > 0.3 && (
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: sz(11),
                        color: '#ef4444',
                        opacity: fadeRed,
                      }}
                    >
                      Missed
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* "You're behind" text */}
          <div
            style={{
              opacity: behindOpacity,
              fontFamily: fonts.heading,
              fontStyle: 'italic',
              fontSize: sz(24),
              fontWeight: 300,
              color: 'rgba(239, 68, 68, 0.8)',
              marginTop: sp(16),
            }}
          >
            You&apos;re always behind.
          </div>
        </div>
      )}
    </div>
  );
};
