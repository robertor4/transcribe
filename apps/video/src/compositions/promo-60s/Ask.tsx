import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { TypeWriter, CitationChip, FadeIn } from '@/components';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 6: In Action — Ask (0:30–0:39)
 *
 * Centered Q&A chat — hero element at ~1200px wide.
 * No split layout. Question types, answer fades in with citations.
 * Second Q&A pair. Citation click highlights.
 */
export const Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel fades in
  const panelOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Q1 types out (0.5–2s)
  const q1Start = fps * 0.5;
  // A1 appears (2.5–3.5s)
  const a1Opacity = interpolate(frame, [fps * 2.5, fps * 3.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Citations appear staggered
  const chip1Opacity = interpolate(frame, [fps * 3.5, fps * 3.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const chip2Opacity = interpolate(frame, [fps * 4.0, fps * 4.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Q2 (5–6s)
  const q2Start = fps * 5;
  const q2Opacity = interpolate(frame, [fps * 5, fps * 5.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // A2 (6.5–7.5s)
  const a2Opacity = interpolate(frame, [fps * 6.5, fps * 7.0], [0, 1], {
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
            Ask about this meeting
          </div>
          <span
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: sz(11),
              color: colors.textMuted,
            }}
          >
            Q2 Board Review · 52 min
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
              text="What did the investors raise as objections?"
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
            Two main objections: concerns about CAC in the enterprise segment{' '}
            <span style={{ opacity: chip1Opacity }}>
              <CitationChip timestamp="33:47" speaker="Investor A" />
            </span>{' '}
            and a question about the competitive moat against Otter and Fireflies.{' '}
            <span style={{ opacity: chip2Opacity }}>
              <CitationChip timestamp="38:12" speaker="Investor B" />
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
              text="Who owns the launch timeline?"
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
            Sarah owns the launch timeline. She committed to having the go-to-market plan finalized by end of Q2.{' '}
            <CitationChip timestamp="41:55" speaker="Sarah" />
          </div>
        </div>
      </div>
    </div>
  );
};
