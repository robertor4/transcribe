import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { FadeIn } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 5: In Action — Transform (0:19–0:30)
 *
 * Centered layout (no three-pane). Two phases:
 * Phase 1 (0–4s): Summary content — cards stacked vertically at 75% width
 * Phase 2 (4–11s): Persona output cards appear one at a time, centered,
 * each with category-color border.
 */
export const Transform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Summary phase (0–4s)
  const showOutputs = frame > fps * 4;

  // Summary lines stagger in (0.5–3s)
  const summaryLines = [
    { label: 'Key Topics', text: 'Q3 pricing strategy, Enterprise expansion, Competitive positioning' },
    { label: 'Decisions', text: 'Approved 15% price increase for enterprise tier' },
    { label: 'Action Items', text: 'Sarah: finalize pricing deck by Friday' },
  ];

  // Phase 2: Output cards cascade (4–10s) — one at a time, centered
  const outputs = [
    { role: 'Sales', color: colors.sales, title: 'Re: Next steps on the enterprise deal', type: 'Follow-up email' },
    { role: 'Product', color: colors.product, title: 'Feature Brief: SSO Integration', type: 'PRD' },
    { role: 'Marketing', color: colors.marketing, title: 'What We Learned from 200 Customer Interviews', type: 'Blog post' },
    { role: 'Consulting', color: colors.tech, title: 'Workshop Synthesis: Q3 Roadmap Alignment', type: 'Client debrief' },
  ];

  // Summary fade-out before outputs
  const summaryFade = interpolate(frame, [fps * 3.5, fps * 4.0], [1, 0], {
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
      {/* Phase 1: Summary — centered, stacked */}
      {!showOutputs && (
        <div
          style={{
            width: '75%',
            maxWidth: 1400,
            display: 'flex',
            flexDirection: 'column',
            gap: sp(20),
            opacity: summaryFade,
          }}
        >
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: sp(32), marginBottom: sp(12) }}>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: sz(16),
                fontWeight: 600,
                color: colors.textPrimary,
                borderBottom: `3px solid ${colors.primary}`,
                paddingBottom: sp(8),
              }}
            >
              Summary
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: sz(16),
                color: colors.textMuted,
                paddingBottom: sp(8),
              }}
            >
              Transcript
            </div>
          </div>

          {/* Summary sections */}
          {summaryLines.map((line, i) => {
            const lineStart = fps * 0.5 + i * 14;
            const lineOpacity = interpolate(frame, [lineStart, lineStart + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const lineY = interpolate(frame, [lineStart, lineStart + 12], [25, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={i}
                style={{
                  opacity: lineOpacity,
                  transform: `translateY(${lineY}px)`,
                  padding: `${sp(20)}px ${sp(28)}px`,
                  background: colors.bgCard,
                  border: `1px solid ${colors.bgCardBorder}`,
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: sz(11),
                    fontWeight: 600,
                    color: colors.primary,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: sp(8),
                  }}
                >
                  {line.label}
                </div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: sz(16),
                    color: colors.textSecondary,
                    lineHeight: 1.6,
                  }}
                >
                  {line.text}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 2: Output cards — one at a time, centered */}
      {showOutputs &&
        outputs.map((output, i) => {
          const cardStart = fps * 4 + i * fps * 1.5;
          const cardOpacity = interpolate(
            frame,
            [cardStart, cardStart + 10, cardStart + fps * 1.2, cardStart + fps * 1.5],
            [0, 1, 1, i < outputs.length - 1 ? 0 : 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const cardScale = interpolate(frame, [cardStart, cardStart + 14], [0.93, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${cardScale})`,
                opacity: cardOpacity,
                width: '70%',
                maxWidth: 1300,
              }}
            >
              <div
                style={{
                  background: colors.bgCard,
                  border: `2px solid ${output.color}50`,
                  borderLeft: `4px solid ${output.color}`,
                  borderRadius: 16,
                  padding: `${sp(36)}px ${sp(44)}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: sz(12),
                    color: output.color,
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                    marginBottom: sp(12),
                  }}
                >
                  {output.role} · {output.type}
                </div>
                <div
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: sz(28),
                    fontWeight: 700,
                    color: colors.textPrimary,
                    lineHeight: 1.4,
                  }}
                >
                  {output.title}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
