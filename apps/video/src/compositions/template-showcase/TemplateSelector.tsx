import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

const lt = colors.light;

// ─── Template data (matches real app categories) ────────
interface TemplateItem {
  name: string;
  icon: string;
}

interface Category {
  id: string;
  label: string;
  color: string;
  icon: string;
  templates: TemplateItem[];
}

const categories: Category[] = [
  {
    id: 'analysis',
    label: 'ANALYSIS',
    color: lt.categoryAnalysis,
    icon: '📊',
    templates: [
      { name: 'Action Items', icon: '✅' },
      { name: 'Communication Analysis', icon: '💬' },
      { name: 'Agile Backlog', icon: '📋' },
      { name: 'Meeting Minutes', icon: '📝' },
      { name: 'Retrospective Summary', icon: '🔄' },
      { name: 'Decision Document', icon: '⚖️' },
      { name: 'Workshop Synthesis', icon: '🧩' },
      { name: 'Project Status Report', icon: '📈' },
      { name: 'Recommendations Memo', icon: '💡' },
    ],
  },
  {
    id: 'content',
    label: 'CONTENT',
    color: lt.categoryContent,
    icon: '📄',
    templates: [
      { name: 'Blog Post', icon: '✍️' },
      { name: 'LinkedIn Post', icon: '💼' },
      { name: 'Newsletter', icon: '📰' },
      { name: 'Case Study', icon: '🔍' },
      { name: 'Podcast Show Notes', icon: '🎙' },
      { name: 'Video Script', icon: '🎬' },
      { name: 'Press Release', icon: '📣' },
      { name: 'Twitter/X Thread', icon: '🐦' },
    ],
  },
  {
    id: 'emails',
    label: 'EMAILS',
    color: lt.categoryEmails,
    icon: '✉️',
    templates: [
      { name: 'Follow-Up Email', icon: '↩️' },
      { name: 'Sales Outreach Email', icon: '🎯' },
      { name: 'Internal Update Email', icon: '📢' },
      { name: 'Client Proposal Email', icon: '🤝' },
    ],
  },
  {
    id: 'product',
    label: 'PRODUCT & ENGINEERING',
    color: lt.categoryProduct,
    icon: '⚙️',
    templates: [
      { name: 'Product Requirements Document', icon: '📐' },
      { name: 'Technical Design Document', icon: '🏗' },
      { name: 'Architecture Decision Record', icon: '🧱' },
      { name: 'Bug Report', icon: '🐛' },
      { name: 'Incident Postmortem', icon: '🔥' },
      { name: 'Statement of Work', icon: '📑' },
    ],
  },
  {
    id: 'sales',
    label: 'SALES',
    color: lt.categorySales,
    icon: '📈',
    templates: [
      { name: 'Deal Qualification', icon: '🏆' },
      { name: 'CRM Notes', icon: '🗂' },
      { name: 'Objection Handler', icon: '🛡' },
      { name: 'Competitive Intelligence', icon: '🔎' },
    ],
  },
  {
    id: 'hr',
    label: 'HR & COACHING',
    color: lt.categoryHR,
    icon: '👥',
    templates: [
      { name: '1:1 Meeting Notes', icon: '🤝' },
      { name: 'Interview Assessment', icon: '📋' },
      { name: 'Coaching Session Notes', icon: '🎯' },
      { name: 'Performance Review', icon: '⭐' },
      { name: 'Exit Interview Analysis', icon: '🚪' },
      { name: 'Goal Setting Document', icon: '🎯' },
    ],
  },
  {
    id: 'leadership',
    label: 'LEADERSHIP',
    color: lt.categoryLeadership,
    icon: '🏢',
    templates: [
      { name: 'Board Update', icon: '📊' },
      { name: 'Investor Update', icon: '💰' },
      { name: 'All-Hands Talking Points', icon: '🎤' },
    ],
  },
];

/**
 * Scene 2: Template Selector Opens (0:09–0:15)
 *
 * Light-mode recreation. Conversation detail page visible briefly,
 * then the OutputGeneratorModal opens with the full template list.
 * Camera zooms into the category list as it scrolls.
 *
 * VO: "Now choose a template. Each one turns your conversation
 *      into a different kind of output."
 */
export const TemplateSelector: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Conversation page (0–1.2s)
  const showModal = frame > fps * 1.0;
  const pageFade = interpolate(frame, [fps * 1.0, fps * 1.4], [1, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Modal entrance
  const modalScale = showModal
    ? spring({ frame: frame - fps * 1.0, fps, config: { damping: 18 } })
    : 0;

  // Template list scroll (2–5s) — scroll position in px
  const scrollOffset = interpolate(frame, [fps * 2.0, fps * 5.0], [0, 650], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // "Choose from 50+ templates." overlay
  const overlayOpacity = interpolate(frame, [fps * 4.8, fps * 5.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit fade
  const exitFade = interpolate(frame, [fps * 5.5, fps * 6.0], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Flatten all templates for counting
  const totalTemplates = categories.reduce((sum, c) => sum + c.templates.length, 0);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: lt.bg,
        position: 'relative',
        overflow: 'hidden',
        opacity: exitFade,
      }}
    >
      {/* ─── Conversation detail page (background) ─────── */}
      <div style={{ position: 'absolute', inset: 0, opacity: pageFade, padding: `${sp(40)}px ${sp(56)}px` }}>
        {/* Page title */}
        <div style={{ fontFamily: fonts.heading, fontSize: sz(24), fontWeight: 700, color: lt.textPrimary, marginBottom: sp(8) }}>
          Team Strategy Session
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: sz(12), color: lt.textMuted, marginBottom: sp(24) }}>
          4 speakers · 1h 12m · Mar 10, 2026
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: sp(24), borderBottom: `1px solid ${lt.border}`, marginBottom: sp(20) }}>
          {['Summary', 'Transcript', 'AI Assets'].map((tab, i) => (
            <div
              key={i}
              style={{
                paddingBottom: sp(10),
                fontFamily: fonts.body,
                fontSize: sz(13),
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? lt.textPrimary : lt.textMuted,
                borderBottom: i === 0 ? `2px solid ${colors.primary}` : 'none',
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Summary content placeholder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp(12) }}>
          {[
            { label: 'Key Topics', text: 'Q3 pricing strategy, Enterprise expansion, Competitive positioning against Salesforce' },
            { label: 'Decisions', text: 'Approved 15% price increase for enterprise tier effective Q4. Marketing to lead competitive response.' },
            { label: 'Next Steps', text: '• Sarah: Finalize pricing deck by Friday\n• Mike: Draft competitive analysis\n• Team: Review enterprise pipeline' },
          ].map((section, i) => (
            <div key={i} style={{ padding: `${sp(14)}px ${sp(18)}px`, backgroundColor: lt.bgSecondary, borderRadius: 10, border: `1px solid ${lt.border}` }}>
              <div style={{ fontFamily: fonts.body, fontSize: sz(10), fontWeight: 600, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: sp(6) }}>
                {section.label}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: sz(12), color: lt.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {section.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Modal overlay ───────────────────────────────── */}
      {showModal && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              opacity: interpolate(frame, [fps * 1.0, fps * 1.4], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />

          {/* OutputGeneratorModal */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${modalScale})`,
              width: '65%',
              maxWidth: 1050,
              height: '75%',
              maxHeight: 750,
              backgroundColor: lt.bg,
              borderRadius: 16,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: `${sp(14)}px ${sp(24)}px`,
                borderBottom: `1px solid ${lt.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ fontFamily: fonts.body, fontSize: sz(14), fontWeight: 700, color: lt.textPrimary, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Generate AI Asset
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: sz(10), color: lt.textMuted, marginTop: sp(2) }}>
                  Choose a template to generate content
                </div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: lt.textMuted, fontSize: sz(12) }}>
                ✕
              </div>
            </div>

            {/* Modal body with sidebar + templates */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Step sidebar — matches real OutputGeneratorModal: w-48 */}
              <div
                style={{
                  width: cs(192),
                  backgroundColor: lt.bgSecondary,
                  borderRight: `1px solid ${lt.border}`,
                  padding: `${sp(12)}px ${sp(12)}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: sp(4),
                  flexShrink: 0,
                }}
              >
                {['Select Template', 'Instructions', 'Generate'].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: sp(10),
                      padding: `${sp(8)}px ${sp(10)}px`,
                      borderRadius: 8,
                      backgroundColor: i === 0 ? lt.bgSelected : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        width: cs(28),
                        height: cs(28),
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: sz(10),
                        fontWeight: 700,
                        fontFamily: fonts.body,
                        backgroundColor: i === 0 ? lt.stepActive : lt.stepInactive,
                        color: i === 0 ? '#fff' : lt.textMuted,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      style={{
                        fontFamily: fonts.body,
                        fontSize: sz(11),
                        fontWeight: i === 0 ? 600 : 500,
                        color: i === 0 ? colors.primary : lt.textMuted,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Template list (scrollable) */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* Search bar */}
                <div
                  style={{
                    padding: `${sp(12)}px ${sp(16)}px`,
                    borderBottom: `1px solid ${lt.border}`,
                    position: 'sticky',
                    top: 0,
                    backgroundColor: lt.bg,
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      border: `1px solid ${lt.border}`,
                      borderRadius: 8,
                      padding: `${sp(7)}px ${sp(12)}px`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: sp(8),
                    }}
                  >
                    <span style={{ color: lt.textHint, fontSize: sz(12) }}>🔍</span>
                    <span style={{ fontFamily: fonts.body, fontSize: sz(11), color: lt.textHint }}>Search 50+ templates...</span>
                  </div>
                </div>

                {/* Scrolling template list */}
                <div
                  style={{
                    transform: `translateY(-${scrollOffset}px)`,
                    padding: `${sp(8)}px ${sp(16)}px`,
                  }}
                >
                  {categories.map((cat, catIdx) => {
                    // Stagger category appearance
                    const catStart = fps * 1.4 + catIdx * 5;
                    const catOpacity = interpolate(frame, [catStart, catStart + 10], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });

                    return (
                      <div key={cat.id} style={{ opacity: catOpacity, marginBottom: sp(6) }}>
                        {/* Category header */}
                        <div
                          style={{
                            backgroundColor: lt.bgSecondary,
                            borderRadius: 8,
                            padding: `${sp(6)}px ${sp(12)}px`,
                            marginBottom: sp(4),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp(6) }}>
                            <span style={{ fontSize: sz(10) }}>{cat.icon}</span>
                            <span
                              style={{
                                fontFamily: fonts.body,
                                fontSize: sz(9),
                                fontWeight: 700,
                                color: lt.textMuted,
                                textTransform: 'uppercase',
                                letterSpacing: 1.5,
                              }}
                            >
                              {cat.label}
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: fonts.mono,
                              fontSize: sz(8),
                              color: lt.textHint,
                            }}
                          >
                            {cat.templates.length}
                          </span>
                        </div>

                        {/* Template items */}
                        {cat.templates.map((tpl, tplIdx) => {
                          const tplStart = catStart + 4 + tplIdx * 2;
                          const tplOpacity = interpolate(frame, [tplStart, tplStart + 8], [0, 1], {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp',
                          });

                          return (
                            <div
                              key={tplIdx}
                              style={{
                                opacity: tplOpacity,
                                display: 'flex',
                                alignItems: 'center',
                                gap: sp(10),
                                padding: `${sp(7)}px ${sp(12)}px`,
                                borderRadius: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: sz(18),
                                  height: sz(18),
                                  borderRadius: 6,
                                  backgroundColor: lt.bgSecondary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: sz(10),
                                  flexShrink: 0,
                                }}
                              >
                                {tpl.icon}
                              </div>
                              <span
                                style={{
                                  fontFamily: fonts.body,
                                  fontSize: sz(11),
                                  fontWeight: 500,
                                  color: lt.textPrimary,
                                }}
                              >
                                {tpl.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── "Choose from 50+ templates." overlay ─────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: sp(48),
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: overlayOpacity,
          fontFamily: fonts.body,
          fontSize: sz(30),
          fontWeight: 700,
          color: lt.textPrimary,
          textAlign: 'center',
          textShadow: '0 2px 20px rgba(255,255,255,0.9)',
        }}
      >
        Choose from 50+ templates.
      </div>
    </div>
  );
};
