import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { TypeWriter, CitationChip, FadeIn } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 7: The Memory (0:33–0:40)
 *
 * AI Agent Q&A — centered chat hero element at ~1200px wide.
 * Question about what the client said, answer with citation.
 * "And with our AI agent, if three weeks later someone asks what
 *  the client said in the meeting — you ask Neural Summary, and
 *  get the exact moment cited."
 */
export const Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel fades in
  const panelOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Q1 types out (0.3–1.5s)
  const q1Start = fps * 0.3;
  // A1 appears (1.8–2.3s)
  const a1Opacity = interpolate(frame, [fps * 1.8, fps * 2.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Citations appear staggered
  const chip1Opacity = interpolate(frame, [fps * 2.8, fps * 3.1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const chip2Opacity = interpolate(frame, [fps * 3.3, fps * 3.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Q2 (4–4.3s)
  const q2Start = fps * 4;
  const q2Opacity = interpolate(frame, [fps * 4, fps * 4.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // A2 (5.2–5.7s) — leaves ~1.5s hold before scene ends at 7.3s
  const a2Opacity = interpolate(frame, [fps * 5.2, fps * 5.7], [0, 1], {
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
      }}
    >
      {/* Centered Q&A chat */}
      <div
        style={{
          width: 1200,
          opacity: panelOpacity,
          display: 'flex',
          flexDirection: 'column',
          gap: sp(20),
        }}
      >
        {/* Panel header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp(8) }}>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: sz(16),
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            AI Agent
          </div>
          <span
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: sz(11),
              color: colors.textMuted,
            }}
          >
            Client Call — Acme Corp · 47 min
          </span>
        </div>

        {/* Q1: User question */}
        <div style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
          <div
            style={{
              background: `${colors.primary}15`,
              borderRadius: '20px 20px 6px 20px',
              padding: `${sp(16)}px ${sp(28)}px`,
              fontFamily: fonts.body,
              fontSize: sz(17),
              color: colors.textPrimary,
            }}
          >
            <TypeWriter
              text="What did the client say about the pricing model?"
              startFrame={q1Start}
              speed={1.5}
              showCursor={false}
            />
          </div>
        </div>

        {/* A1: AI answer */}
        <div style={{ opacity: a1Opacity, maxWidth: '90%' }}>
          <div
            style={{
              background: colors.bgCard,
              borderRadius: '20px 20px 20px 6px',
              padding: `${sp(20)}px ${sp(28)}px`,
              fontFamily: fonts.body,
              fontSize: sz(15),
              color: colors.textSecondary,
              lineHeight: 1.7,
            }}
          >
            The client said the current pricing feels high for mid-market.
            They suggested a usage-based tier for smaller teams.{' '}
            <span style={{ opacity: chip1Opacity }}>
              <CitationChip timestamp="23:15" speaker="Client — Sarah" />
            </span>{' '}
            They also asked about volume discounts for enterprise.{' '}
            <span style={{ opacity: chip2Opacity }}>
              <CitationChip timestamp="31:42" speaker="Client — Mark" />
            </span>
          </div>
        </div>

        {/* Q2: Second question */}
        <div style={{ alignSelf: 'flex-end', maxWidth: '80%', opacity: q2Opacity }}>
          <div
            style={{
              background: `${colors.primary}15`,
              borderRadius: '20px 20px 6px 20px',
              padding: `${sp(16)}px ${sp(28)}px`,
              fontFamily: fonts.body,
              fontSize: sz(17),
              color: colors.textPrimary,
            }}
          >
            <TypeWriter
              text="Did they mention a timeline for the decision?"
              startFrame={q2Start}
              speed={1.5}
              showCursor={false}
            />
          </div>
        </div>

        {/* A2: Second answer */}
        <div style={{ opacity: a2Opacity, maxWidth: '90%' }}>
          <div
            style={{
              background: colors.bgCard,
              borderRadius: '20px 20px 20px 6px',
              padding: `${sp(20)}px ${sp(28)}px`,
              fontFamily: fonts.body,
              fontSize: sz(15),
              color: colors.textSecondary,
              lineHeight: 1.7,
            }}
          >
            Yes — Mark said they need to finalize by end of Q2. He wants a revised proposal by next Friday.{' '}
            <CitationChip timestamp="38:50" speaker="Client — Mark" />
          </div>
        </div>
      </div>
    </div>
  );
};
