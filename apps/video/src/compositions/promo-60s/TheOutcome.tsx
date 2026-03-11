import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 8: The Outcome (0:40–0:46)
 *
 * Before/after comparison — time saved visualization.
 * "Save your precious time and dramatically speed up your daily workflow."
 */
export const TheOutcome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Before side fades in
  const beforeOpacity = interpolate(frame, [fps * 0.2, fps * 0.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // After side fades in
  const afterOpacity = interpolate(frame, [fps * 1.0, fps * 1.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Divider line
  const dividerOpacity = interpolate(frame, [fps * 0.8, fps * 1.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Time saved highlight
  const highlightOpacity = interpolate(frame, [fps * 2.5, fps * 3.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beforeTasks = [
    { task: 'Write meeting notes', time: '45 min' },
    { task: 'Draft follow-up email', time: '20 min' },
    { task: 'Update team briefing', time: '30 min' },
    { task: 'Create action items list', time: '15 min' },
    { task: 'File meeting summary', time: '10 min' },
  ];

  const afterTasks = [
    { task: 'Record meeting', time: '0 min' },
    { task: 'All documents generated', time: '2 min' },
  ];

  // Total time counters
  const beforeTotal = 120; // 2 hours
  const afterTotal = 2;
  const beforeCount = Math.min(
    Math.floor(interpolate(frame, [fps * 1.8, fps * 2.5], [0, beforeTotal], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
    beforeTotal
  );
  const afterCount = Math.min(
    Math.floor(interpolate(frame, [fps * 1.8, fps * 2.5], [0, afterTotal], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
    afterTotal
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
        gap: sp(40),
      }}
    >
      {/* Before */}
      <div
        style={{
          opacity: beforeOpacity,
          width: 550,
          display: 'flex',
          flexDirection: 'column',
          gap: sp(12),
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: sz(12),
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: sp(8),
          }}
        >
          Without Neural Summary
        </div>
        {beforeTasks.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: 8,
              padding: `${sp(10)}px ${sp(18)}px`,
            }}
          >
            <span style={{ fontFamily: fonts.body, fontSize: sz(13), color: colors.textSecondary }}>
              {item.task}
            </span>
            <span style={{ fontFamily: fonts.mono, fontSize: sz(11), color: 'rgba(239, 68, 68, 0.8)' }}>
              {item.time}
            </span>
          </div>
        ))}
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: sz(36),
            fontWeight: 900,
            color: '#ef4444',
            textAlign: 'center',
            marginTop: sp(8),
          }}
        >
          {beforeCount} min
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          opacity: dividerOpacity,
          width: 2,
          height: 500,
          background: `linear-gradient(180deg, transparent, ${colors.textMuted}, transparent)`,
        }}
      />

      {/* After */}
      <div
        style={{
          opacity: afterOpacity,
          width: 550,
          display: 'flex',
          flexDirection: 'column',
          gap: sp(12),
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: sz(12),
            color: colors.cyan,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: sp(8),
          }}
        >
          With Neural Summary
        </div>
        {afterTasks.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: `${colors.cyan}08`,
              border: `1px solid ${colors.cyan}25`,
              borderRadius: 8,
              padding: `${sp(10)}px ${sp(18)}px`,
            }}
          >
            <span style={{ fontFamily: fonts.body, fontSize: sz(13), color: colors.textSecondary }}>
              {item.task}
            </span>
            <span style={{ fontFamily: fonts.mono, fontSize: sz(11), color: colors.cyan }}>
              {item.time}
            </span>
          </div>
        ))}
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: sz(36),
            fontWeight: 900,
            color: colors.cyan,
            textAlign: 'center',
            marginTop: sp(8),
          }}
        >
          {afterCount} min
        </div>

        {/* Time saved callout */}
        <div
          style={{
            opacity: highlightOpacity,
            background: `${colors.cyan}15`,
            border: `1px solid ${colors.cyan}40`,
            borderRadius: 12,
            padding: `${sp(14)}px ${sp(24)}px`,
            textAlign: 'center',
            marginTop: sp(8),
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: sz(16),
              fontWeight: 600,
              color: colors.cyan,
            }}
          >
            Save 2 hours per meeting
          </span>
        </div>
      </div>
    </div>
  );
};
