import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Sequence } from 'remotion';
import { FadeIn } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 2: The Cost (0:03–0:07)
 *
 * Quick rhythm — three shots, one second each:
 * 1. Slack message: "Can someone send me the notes from Tuesday?"
 * 2. Empty Google Doc with blinking cursor
 * 3. Calendar full of meetings, no time left
 */
export const TheCost: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shots = [
    {
      // Slack-style message
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp(12) }}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: sz(13),
              color: colors.textMuted,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            #product-team
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${colors.bgCardBorder}`,
              borderRadius: 12,
              padding: `${sp(24)}px ${sp(32)}px`,
              fontFamily: fonts.body,
              fontSize: sz(26),
              color: colors.textPrimary,
              maxWidth: 1100,
              lineHeight: 1.5,
            }}
          >
            Can someone send me the notes from Tuesday?
          </div>
        </div>
      ),
    },
    {
      // Empty doc with blinking cursor
      content: (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${colors.bgCardBorder}`,
            borderRadius: 12,
            padding: `${sp(40)}px ${sp(48)}px`,
            width: 1000,
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: sz(16),
              color: colors.textMuted,
              marginBottom: sp(20),
            }}
          >
            Client Call Notes — Q2
          </div>
          <div
            style={{
              width: 3,
              height: sz(28),
              backgroundColor: colors.textSecondary,
              opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
            }}
          />
        </div>
      ),
    },
    {
      // Calendar wall — solid blocks, no time left
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp(6), width: 900 }}>
          {['09:00 – Product Sync', '10:00 – Client Review', '11:00 – Sprint Planning', '12:00 – Lunch & Learn', '13:30 – 1:1 with Sarah', '14:30 – Board Prep', '15:30 – Design Review', '16:30 – All-Hands'].map(
            (event, i) => (
              <div
                key={i}
                style={{
                  background: i % 3 === 0 ? `${colors.primary}30` : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${i % 3 === 0 ? `${colors.primary}40` : colors.bgCardBorder}`,
                  borderRadius: 6,
                  padding: `${sp(10)}px ${sp(20)}px`,
                  fontFamily: fonts.mono,
                  fontSize: sz(14),
                  color: colors.textSecondary,
                }}
              >
                {event}
              </div>
            )
          )}
        </div>
      ),
    },
  ];

  // Each shot lasts ~1.3 seconds with cross-fade
  const shotDuration = fps * 1.33;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {shots.map((shot, i) => {
        const shotStart = i * shotDuration;
        const opacity = interpolate(
          frame,
          [shotStart, shotStart + 8, shotStart + shotDuration - 8, shotStart + shotDuration],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              opacity,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {shot.content}
          </div>
        );
      })}
    </div>
  );
};
