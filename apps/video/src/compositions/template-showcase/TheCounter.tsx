import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, sz, sp } from '@/lib/design-tokens';

// All 40 template names with their category colors
const templates = [
  { name: 'Action Items', color: colors.light.categoryAnalysis },
  { name: 'Meeting Minutes', color: colors.light.categoryAnalysis },
  { name: 'Communication Analysis', color: colors.light.categoryAnalysis },
  { name: 'Agile Backlog', color: colors.light.categoryAnalysis },
  { name: 'Retrospective Summary', color: colors.light.categoryAnalysis },
  { name: 'Decision Document', color: colors.light.categoryAnalysis },
  { name: 'Workshop Synthesis', color: colors.light.categoryAnalysis },
  { name: 'Project Status Report', color: colors.light.categoryAnalysis },
  { name: 'Recommendations Memo', color: colors.light.categoryAnalysis },
  { name: 'Blog Post', color: colors.light.categoryContent },
  { name: 'LinkedIn Post', color: colors.light.categoryContent },
  { name: 'Newsletter', color: colors.light.categoryContent },
  { name: 'Case Study', color: colors.light.categoryContent },
  { name: 'Podcast Show Notes', color: colors.light.categoryContent },
  { name: 'Video Script', color: colors.light.categoryContent },
  { name: 'Press Release', color: colors.light.categoryContent },
  { name: 'Twitter/X Thread', color: colors.light.categoryContent },
  { name: 'Follow-Up Email', color: colors.light.categoryEmails },
  { name: 'Sales Outreach Email', color: colors.light.categoryEmails },
  { name: 'Internal Update', color: colors.light.categoryEmails },
  { name: 'Client Proposal', color: colors.light.categoryEmails },
  { name: 'PRD', color: colors.light.categoryProduct },
  { name: 'Technical Design Doc', color: colors.light.categoryProduct },
  { name: 'Architecture Decision Record', color: colors.light.categoryProduct },
  { name: 'Bug Report', color: colors.light.categoryProduct },
  { name: 'Incident Postmortem', color: colors.light.categoryProduct },
  { name: 'Statement of Work', color: colors.light.categoryProduct },
  { name: 'Deal Qualification', color: colors.light.categorySales },
  { name: 'CRM Notes', color: colors.light.categorySales },
  { name: 'Objection Handler', color: colors.light.categorySales },
  { name: 'Competitive Intel', color: colors.light.categorySales },
  { name: '1:1 Meeting Notes', color: colors.light.categoryHR },
  { name: 'Interview Assessment', color: colors.light.categoryHR },
  { name: 'Coaching Notes', color: colors.light.categoryHR },
  { name: 'Performance Review', color: colors.light.categoryHR },
  { name: 'Exit Interview', color: colors.light.categoryHR },
  { name: 'Goal Setting', color: colors.light.categoryHR },
  { name: 'Board Update', color: colors.light.categoryLeadership },
  { name: 'Investor Update', color: colors.light.categoryLeadership },
  { name: 'All-Hands Talking Points', color: colors.light.categoryLeadership },
];

const COLS = 8;
const ROWS = 5;

/**
 * Scene 5: The Counter (0:48–0:55)
 *
 * Dark branded background. Template names cascade in a grid of
 * glassy cards with category-colored top borders. Counter ticks
 * rapidly to 40. Settles into "40 templates · 7 categories · one conversation".
 */
export const TheCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Grid cascade (0–3.5s)
  // Phase 2: Counter (2–4s)
  // Phase 3: Tagline (4–7s)

  // Counter animation
  const counterProgress = interpolate(frame, [fps * 2.0, fps * 4.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Ease out for counter
  const easedCounter = 1 - Math.pow(1 - counterProgress, 3);
  const counterValue = Math.round(easedCounter * 40);

  // Grid shrinks as counter appears
  const gridScale = interpolate(frame, [fps * 2.5, fps * 3.5], [1, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gridOpacity = interpolate(frame, [fps * 3.0, fps * 4.0], [1, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gridY = interpolate(frame, [fps * 2.5, fps * 3.5], [0, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Big number appearance
  const numberOpacity = interpolate(frame, [fps * 2.0, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const numberScale = spring({
    frame: frame - fps * 3.5,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [fps * 4.5, fps * 5.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Ambient glow
  const ambientPulse = 0.6 + Math.sin(frame * 0.03) * 0.1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: ambientPulse,
          background: [
            'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(141,106,250,0.25) 0%, transparent 100%)',
            'radial-gradient(ellipse 40% 30% at 20% 80%, rgba(201,60,217,0.15) 0%, transparent 100%)',
          ].join(', '),
          filter: 'blur(48px)',
        }}
      />

      {/* Grid of template cards — centered on canvas */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: sp(8),
          width: '90%',
          maxWidth: 1700,
          opacity: gridOpacity,
          transform: `scale(${gridScale}) translateY(${gridY}px)`,
          margin: '0 auto',
        }}
      >
        {templates.slice(0, COLS * ROWS).map((tpl, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          // Cascade from top-left
          const delay = (row * 2 + col) * 1.5;
          const cardOpacity = interpolate(frame, [delay, delay + 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const cardY = interpolate(frame, [delay, delay + 8], [20, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                background: colors.bgCard,
                border: `1px solid ${colors.bgCardBorder}`,
                borderTop: `3px solid ${tpl.color}`,
                borderRadius: 10,
                padding: `${sp(10)}px ${sp(12)}px`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: sz(9),
                  fontWeight: 500,
                  color: colors.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tpl.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Counter number */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${Math.max(numberScale, 0.8)})`,
          opacity: numberOpacity,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: sz(90),
            fontWeight: 900,
            color: colors.textPrimary,
            textAlign: 'center',
            lineHeight: 1,
            textShadow: `0 0 60px ${colors.primary}40`,
          }}
        >
          {counterValue}
        </div>
      </div>

      {/* Tagline: "templates · 7 categories · one conversation" */}
      <div
        style={{
          position: 'absolute',
          bottom: sp(80),
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: taglineOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: sp(16),
          zIndex: 2,
        }}
      >
        {['templates', '7 categories', 'one conversation'].map((text, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: colors.cyan,
                }}
              />
            )}
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: sz(18),
                fontWeight: 500,
                color: colors.textSecondary,
              }}
            >
              {text}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
