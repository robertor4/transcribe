import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, sz, sp } from '@/lib/design-tokens';

/**
 * Scene 6b: Templates — 54+ template grid
 *
 * Counter ticks up to 54+, then 6 category cards stagger in.
 *
 * "There are more than 50 templates to choose from — everything
 *  from emails to briefings, product requirements, sales pitches,
 *  and more."
 */

const templateCategories = [
  {
    category: 'Communication',
    color: colors.sales,
    templates: ['Follow-up Email', 'Client Briefing', 'Status Update', 'Thank You Note', 'Introduction Email'],
  },
  {
    category: 'Product',
    color: colors.product,
    templates: ['PRD', 'Feature Brief', 'User Story', 'Sprint Summary', 'Release Notes'],
  },
  {
    category: 'Sales',
    color: '#ff6b6b',
    templates: ['Sales Pitch', 'Proposal', 'Competitive Analysis', 'Deal Summary', 'Objection Handling'],
  },
  {
    category: 'Strategy',
    color: colors.cyan,
    templates: ['Executive Summary', 'Board Deck', 'Quarterly Review', 'Vision Doc', 'OKR Draft'],
  },
  {
    category: 'Content',
    color: colors.marketing,
    templates: ['Blog Post', 'Social Media', 'Newsletter', 'Case Study', 'Press Release'],
  },
  {
    category: 'Operations',
    color: colors.tech,
    templates: ['Meeting Notes', 'Action Items', 'Process Doc', 'Training Guide', 'SOP'],
  },
];

export const Templates: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Counter ticks up (0.2–1.5s)
  const templateCount = Math.min(
    Math.floor(interpolate(frame, [fps * 0.2, fps * 1.5], [0, 54], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
    54
  );

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
          flexDirection: 'column',
          alignItems: 'center',
          gap: sp(28),
        }}
      >
        {/* Counter */}
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: sz(40),
            fontWeight: 900,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          <span style={{ color: colors.cyan }}>{templateCount}+</span> Templates
        </div>

        {/* Category grid — 3 columns, 2 rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: sp(14),
            width: 1400,
          }}
        >
          {templateCategories.map((cat, ci) => {
            const catStart = fps * 0.5 + ci * 4;
            const catOpacity = interpolate(frame, [catStart, catStart + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={ci}
                style={{
                  opacity: catOpacity,
                  background: colors.bgCard,
                  border: `1px solid ${colors.bgCardBorder}`,
                  borderTop: `3px solid ${cat.color}`,
                  borderRadius: 12,
                  padding: `${sp(14)}px ${sp(18)}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: sz(9),
                    color: cat.color,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: sp(8),
                  }}
                >
                  {cat.category}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp(4) }}>
                  {cat.templates.map((tmpl, ti) => (
                    <div
                      key={ti}
                      style={{
                        fontFamily: fonts.body,
                        fontSize: sz(11),
                        color: colors.textSecondary,
                        padding: `${sp(3)}px 0`,
                      }}
                    >
                      {tmpl}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
