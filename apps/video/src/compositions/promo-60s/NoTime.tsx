import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 2: No Time (0:03–0:07)
 *
 * Tasks and notifications piling up — unread emails, pending docs,
 * Slack messages. Visual overwhelm. The viewer feels the pressure.
 * "And you hardly have any time to catch up on your work."
 */
export const NoTime: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tasks = [
    { icon: '📧', label: '23 unread emails', urgent: true },
    { icon: '📝', label: 'Client follow-up — overdue', urgent: true },
    { icon: '📋', label: 'Sprint retro notes — pending', urgent: false },
    { icon: '📊', label: 'Q3 report — draft', urgent: false },
    { icon: '💬', label: '8 unread Slack threads', urgent: true },
    { icon: '📄', label: 'Board deck — waiting on input', urgent: false },
    { icon: '✍️', label: 'Meeting summary — Monday call', urgent: true },
    { icon: '📧', label: '5 follow-ups due today', urgent: true },
  ];

  // Notification counter ticks up
  const notifCount = Math.min(
    Math.floor(interpolate(frame, [fps * 0.3, fps * 2.5], [0, 47], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
    47
  );

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
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: sp(10),
          width: 1000,
        }}
      >
        {/* Header with notification badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: sp(12),
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: sz(18),
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            Your Tasks
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: sp(8),
            }}
          >
            <div
              style={{
                background: '#ef4444',
                borderRadius: 100,
                padding: `${sp(4)}px ${sp(14)}px`,
                fontFamily: fonts.mono,
                fontSize: sz(12),
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {notifCount} pending
            </div>
          </div>
        </div>

        {/* Task rows stacking up */}
        {tasks.map((task, i) => {
          const taskStart = fps * 0.2 + i * 4;
          const taskOpacity = interpolate(frame, [taskStart, taskStart + 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const taskX = interpolate(frame, [taskStart, taskStart + 8], [40, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                opacity: taskOpacity,
                transform: `translateX(${taskX}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: sp(14),
                background: task.urgent
                  ? 'rgba(239, 68, 68, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${task.urgent ? 'rgba(239, 68, 68, 0.25)' : colors.bgCardBorder}`,
                borderRadius: 10,
                padding: `${sp(12)}px ${sp(20)}px`,
              }}
            >
              <span style={{ fontSize: sz(14) }}>{task.icon}</span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: sz(14),
                  color: task.urgent ? 'rgba(252, 165, 165, 1)' : colors.textSecondary,
                  flex: 1,
                }}
              >
                {task.label}
              </span>
              {task.urgent && (
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: sz(9),
                    color: '#ef4444',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  Overdue
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
