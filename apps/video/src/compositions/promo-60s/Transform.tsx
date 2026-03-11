import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 6a: The Power — Recording → Documents
 *
 * Single recording icon → arrow → fan of document types.
 *
 * "With Neural Summary, one single recording helps you instantly
 *  generate work-ready documents."
 */

export const Transform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Recording icon fades in (0–0.5s)
  const recordingOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Arrow extends (1–2.5s)
  const arrowWidth = interpolate(frame, [fps * 1, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Document icons fan out (2.5–4s)
  const docsOpacity = interpolate(frame, [fps * 2.5, fps * 3.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const docTypes = ['Email', 'PRD', 'Brief', 'Blog', 'Pitch'];

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sp(40),
        }}
      >
        {/* Recording icon */}
        <div
          style={{
            opacity: recordingOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: sp(10),
          }}
        >
          <div
            style={{
              width: cs(80),
              height: cs(80),
              borderRadius: '50%',
              background: `${colors.primary}20`,
              border: `2px solid ${colors.primary}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width={sz(32)}
              height={sz(32)}
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
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: sz(11),
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            1 Recording
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            width: cs(100),
            height: 3,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.cyan})`,
            opacity: arrowWidth,
            transform: `scaleX(${arrowWidth})`,
            transformOrigin: 'left',
          }}
        />

        {/* Document fan */}
        <div
          style={{
            opacity: docsOpacity,
            display: 'flex',
            gap: sp(12),
          }}
        >
          {docTypes.map((doc, i) => {
            const docStagger = interpolate(
              frame,
              [fps * 2.5 + i * 4, fps * 2.5 + i * 4 + 8],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={i}
                style={{
                  opacity: docStagger,
                  transform: `translateY(${(1 - docStagger) * 20}px)`,
                  background: colors.bgCard,
                  border: `1px solid ${colors.bgCardBorder}`,
                  borderRadius: 10,
                  padding: `${sp(14)}px ${sp(16)}px`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: sz(18), marginBottom: sp(4) }}>📄</div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: sz(9),
                    color: colors.textSecondary,
                  }}
                >
                  {doc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
