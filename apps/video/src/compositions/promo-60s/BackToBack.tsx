import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 1: Back-to-Back (0:00–0:03)
 *
 * Packed calendar view with meetings stacked wall-to-wall.
 * Storm/lightning symbols float around to convey stress.
 * Sets the emotional hook: "Your days are full of back-to-back meetings."
 */
export const BackToBack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const meetings = [
    { time: '08:00', title: 'Team Standup', duration: 1 },
    { time: '08:30', title: 'Sprint Planning', duration: 2 },
    { time: '09:30', title: 'Client Call — Acme Corp', duration: 2, highlight: true },
    { time: '10:30', title: '1:1 with Sarah', duration: 1 },
    { time: '11:00', title: 'Product Review', duration: 2, highlight: true },
    { time: '12:00', title: 'Lunch & Learn: Q3 Strategy', duration: 1 },
    { time: '13:00', title: 'Design Critique', duration: 1 },
    { time: '13:30', title: 'Investor Update Prep', duration: 2, highlight: true },
    { time: '14:30', title: 'Cross-team Sync', duration: 1 },
    { time: '15:00', title: 'Client Call — Zeta Inc', duration: 2 },
    { time: '16:00', title: 'Hiring Debrief', duration: 1 },
    { time: '16:30', title: 'All-Hands', duration: 2 },
  ];

  // Storm symbols that float around the calendar
  const storms = [
    { x: 120, y: 80, symbol: '⚡', delay: 0 },
    { x: 1680, y: 160, symbol: '⛈', delay: 0.3 },
    { x: 200, y: 780, symbol: '⚡', delay: 0.6 },
    { x: 1600, y: 700, symbol: '⛈', delay: 0.9 },
    { x: 960, y: 60, symbol: '⚡', delay: 0.4 },
    { x: 1750, y: 500, symbol: '⚡', delay: 0.7 },
  ];

  // Calendar fades in quickly
  const calendarOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Calendar slides up slightly
  const calendarY = interpolate(frame, [0, fps * 0.5], [30, 0], {
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
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Storm symbols */}
      {storms.map((storm, i) => {
        const stormOpacity = interpolate(
          frame,
          [fps * storm.delay, fps * (storm.delay + 0.3)],
          [0, 0.6],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const float = Math.sin((frame + i * 20) * 0.06) * 12;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: storm.x,
              top: storm.y + float,
              fontSize: sz(24),
              opacity: stormOpacity,
              filter: 'brightness(0.8)',
            }}
          >
            {storm.symbol}
          </div>
        );
      })}

      {/* Calendar */}
      <div
        style={{
          opacity: calendarOpacity,
          transform: `translateY(${calendarY}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: sp(4),
          width: 1100,
        }}
      >
        {/* Day header */}
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: sz(14),
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: sp(8),
            textAlign: 'center',
          }}
        >
          Tuesday
        </div>

        {meetings.map((meeting, i) => {
          const stagger = interpolate(
            frame,
            [fps * 0.1 + i * 2, fps * 0.1 + i * 2 + 6],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const heightMultiplier = meeting.duration === 2 ? 1.6 : 1;

          return (
            <div
              key={i}
              style={{
                opacity: stagger,
                display: 'flex',
                alignItems: 'center',
                gap: sp(12),
              }}
            >
              {/* Time label */}
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: sz(10),
                  color: colors.textMuted,
                  width: cs(50),
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {meeting.time}
              </div>

              {/* Meeting block */}
              <div
                style={{
                  flex: 1,
                  background: meeting.highlight
                    ? `${colors.primary}25`
                    : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${meeting.highlight ? `${colors.primary}40` : colors.bgCardBorder}`,
                  borderLeft: `4px solid ${meeting.highlight ? colors.primary : colors.textMuted}`,
                  borderRadius: 8,
                  padding: `${sp(8 * heightMultiplier)}px ${sp(16)}px`,
                  fontFamily: fonts.body,
                  fontSize: sz(13),
                  color: colors.textSecondary,
                }}
              >
                {meeting.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
