import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, sz, sp } from '@/lib/design-tokens';

// All 50+ template names organized into 5 carousel rows
const rows = [
  // Row 0 — Analysis (→ right)
  [
    { name: 'Action Items', color: colors.light.categoryAnalysis },
    { name: 'Meeting Minutes', color: colors.light.categoryAnalysis },
    { name: 'Communication Analysis', color: colors.light.categoryAnalysis },
    { name: 'Agile Backlog', color: colors.light.categoryAnalysis },
    { name: 'Retrospective Summary', color: colors.light.categoryAnalysis },
    { name: 'Decision Document', color: colors.light.categoryAnalysis },
    { name: 'Workshop Synthesis', color: colors.light.categoryAnalysis },
    { name: 'Project Status Report', color: colors.light.categoryAnalysis },
    { name: 'Recommendations Memo', color: colors.light.categoryAnalysis },
    { name: 'Stakeholder Brief', color: colors.light.categoryAnalysis },
  ],
  // Row 1 — Content (← left)
  [
    { name: 'Blog Post', color: colors.light.categoryContent },
    { name: 'LinkedIn Post', color: colors.light.categoryContent },
    { name: 'Newsletter', color: colors.light.categoryContent },
    { name: 'Case Study', color: colors.light.categoryContent },
    { name: 'Podcast Show Notes', color: colors.light.categoryContent },
    { name: 'Video Script', color: colors.light.categoryContent },
    { name: 'Press Release', color: colors.light.categoryContent },
    { name: 'Twitter/X Thread', color: colors.light.categoryContent },
    { name: 'Content Calendar', color: colors.light.categoryContent },
    { name: 'Social Media Brief', color: colors.light.categoryContent },
  ],
  // Row 2 — Emails + Product (→ right)
  [
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
  ],
  // Row 3 — Sales + HR (← left)
  [
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
  ],
  // Row 4 — Leadership (→ right)
  [
    { name: 'Board Update', color: colors.light.categoryLeadership },
    { name: 'Investor Update', color: colors.light.categoryLeadership },
    { name: 'All-Hands Talking Points', color: colors.light.categoryLeadership },
    { name: 'Quarterly Review', color: colors.light.categoryLeadership },
    { name: 'Strategy Memo', color: colors.light.categoryLeadership },
    { name: 'Team Charter', color: colors.light.categoryLeadership },
    { name: 'Roadmap Summary', color: colors.light.categoryProduct },
    { name: 'Sprint Retrospective', color: colors.light.categoryAnalysis },
    { name: 'Kickoff Notes', color: colors.light.categoryAnalysis },
    { name: 'Onboarding Guide', color: colors.light.categoryHR },
  ],
];

// Card dimensions for carousel layout
const CARD_W = 210;
const CARD_GAP = 24;
const CARD_STRIDE = CARD_W + CARD_GAP; // px per card
const SCROLL_SPEED = 1.2; // px per frame

/**
 * Scene 4: The Counter (0:55–1:03, 8s / 240 frames)
 *
 * VO: "There are more than 50 templates you can choose from
 *      across seven categories. Just one conversation is all it takes."
 *
 * Dark branded background. Template names cascade in a grid of
 * glassy cards with category-colored top borders. Counter ticks
 * rapidly to 50. Settles into "50+ templates · 7 categories · one conversation".
 */
export const TheCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Grid cascade (0–4s)
  // Phase 2: Counter (2.5–4.5s)
  // Phase 3: Tagline (5–5.5s)

  // Counter animation
  const counterProgress = interpolate(frame, [fps * 2.5, fps * 4.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Ease out for counter
  const easedCounter = 1 - Math.pow(1 - counterProgress, 3);
  const counterValue = Math.round(easedCounter * 50);

  // Grid fades behind counter (no scale/move — stays full size)
  const gridOpacity = interpolate(frame, [fps * 2.5, fps * 4.0], [1, 0.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Big number appearance
  const numberOpacity = interpolate(frame, [fps * 2.5, fps * 3.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const numberScale = spring({
    frame: frame - fps * 4.0,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [fps * 5.0, fps * 5.5], [0, 1], {
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

      {/* Carousel rows — alternating scroll directions */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: sp(14),
          opacity: gridOpacity,
          overflow: 'hidden',
        }}
      >
        {rows.map((rowTemplates, rowIdx) => {
          // Alternate direction: even rows scroll right, odd rows scroll left
          const direction = rowIdx % 2 === 0 ? 1 : -1;

          // Triple cards so the strip always covers the viewport
          const cards = [...rowTemplates, ...rowTemplates, ...rowTemplates];
          const setWidth = rowTemplates.length * CARD_STRIDE;

          // Continuous scroll: keep offset within one set-width, start
          // shifted left by one full set so there's always content on both sides
          const rawOffset = (frame * SCROLL_SPEED * direction) % setWidth;
          const scrollOffset = rawOffset - setWidth;

          return (
            <div
              key={rowIdx}
              style={{
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: CARD_GAP,
                  transform: `translateX(${scrollOffset}px)`,
                  willChange: 'transform',
                }}
              >
                {cards.map((tpl, cardIdx) => (
                  <div
                    key={cardIdx}
                    style={{
                      flexShrink: 0,
                      width: CARD_W,
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
                ))}
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
        {['50+ templates', '7 categories', 'one conversation'].map((text, i) => (
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
