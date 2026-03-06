import React from 'react';
import {
  Composition,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { colors, fonts, sz, sp, video } from '@/lib/design-tokens';
import { FadeIn } from '@/components/FadeIn';
import { Eyebrow } from '@/components/Eyebrow';

/* ─── Milestones on the traditional timeline ───────────────── */
const milestones = [
  { label: 'Return to office', progress: 0.15 },
  { label: 'Review notes', progress: 0.33 },
  { label: 'Draft document', progress: 0.55 },
  { label: 'Format & polish', progress: 0.78 },
  { label: 'Send', progress: 1.0 },
];

/* ─── Layout constants (expanded to fill canvas) ──────────── */
const TRACK_WIDTH = 1340;
const TRACK_HEIGHT = 28;
const TRACK_Y_TRADITIONAL = 360;
const TRACK_Y_VOICEFIRST = 580;
const TRACK_LEFT = 280;
const TRACK_RADIUS = 14;

/* ─── Main scene ───────────────────────────────────────────── */
const SpeedGap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase: Voice-first bar fills (frames 60–120)
  const voiceProgress = interpolate(frame, [60, 120], [0, 0.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase: Traditional bar fills (frames 60–195) — 2x faster
  const tradProgress = interpolate(frame, [60, 195], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase: Delta annotation (frames 210–270)
  const deltaSpring = spring({
    frame: frame - 220,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Pulse on "12 min" (frames 270–450)
  const pulse = interpolate(
    Math.sin((frame - 270) * 0.15),
    [-1, 1],
    [0.85, 1],
  );
  const showPulse = frame >= 270;

  return (
    <div
      style={{
        width: video.width,
        height: video.height,
        backgroundColor: '#2E2266',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Eyebrow title */}
      <FadeIn startFrame={0} durationFrames={30} style={{ position: 'absolute', top: sp(40) }}>
        <Eyebrow size={20}>The Speed Gap</Eyebrow>
      </FadeIn>

      {/* Meeting ends anchor */}
      <FadeIn startFrame={10} durationFrames={20} style={{ position: 'absolute', left: TRACK_LEFT - sp(10), top: TRACK_Y_TRADITIONAL - sp(90) }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.mono, fontSize: sz(18), color: colors.textSecondary, marginBottom: sp(4) }}>
            Meeting ends
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: sz(28), color: colors.textPrimary, fontWeight: 700 }}>
            2:00 PM
          </div>
        </div>
      </FadeIn>

      {/* Dotted vertical line at start */}
      <FadeIn startFrame={10} durationFrames={20} style={{ position: 'absolute', left: TRACK_LEFT, top: TRACK_Y_TRADITIONAL - sp(10), height: TRACK_Y_VOICEFIRST - TRACK_Y_TRADITIONAL + TRACK_HEIGHT + sp(10) }}>
        <div
          style={{
            width: 3,
            height: '100%',
            borderLeft: `3px dashed ${colors.textMuted}`,
          }}
        />
      </FadeIn>

      {/* ─── Traditional timeline ───────────────────────── */}
      <FadeIn startFrame={20} durationFrames={20} style={{ position: 'absolute', left: TRACK_LEFT - sp(160), top: TRACK_Y_TRADITIONAL - sp(2) }}>
        <div style={{ fontFamily: fonts.body, fontSize: sz(18), color: colors.textMuted, width: sp(140), textAlign: 'right' }}>
          Traditional
        </div>
      </FadeIn>

      {/* Traditional track background */}
      <div style={{ position: 'absolute', left: TRACK_LEFT, top: TRACK_Y_TRADITIONAL, width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_RADIUS, backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* Traditional track fill */}
      <div
        style={{
          position: 'absolute',
          left: TRACK_LEFT,
          top: TRACK_Y_TRADITIONAL,
          width: TRACK_WIDTH * tradProgress,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_RADIUS,
          backgroundColor: colors.textMuted,
        }}
      />

      {/* Traditional milestones */}
      {milestones.map((m, i) => {
        const milestoneVisible = tradProgress >= m.progress;
        const milestoneOpacity = milestoneVisible
          ? interpolate(tradProgress, [m.progress, m.progress + 0.05], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: TRACK_LEFT + TRACK_WIDTH * m.progress,
              top: TRACK_Y_TRADITIONAL + TRACK_HEIGHT + sp(10),
              opacity: milestoneOpacity,
              transform: `translateX(-50%) translateY(${(1 - milestoneOpacity) * 10}px)`,
              fontFamily: fonts.mono,
              fontSize: sz(13),
              color: colors.textMuted,
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </div>
        );
      })}

      {/* Traditional end time */}
      {frame >= 185 && (
        <div
          style={{
            position: 'absolute',
            left: TRACK_LEFT + TRACK_WIDTH + sp(20),
            top: TRACK_Y_TRADITIONAL - sp(4),
            opacity: interpolate(frame, [185, 205], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            fontFamily: fonts.mono,
            fontSize: sz(22),
            color: colors.textMuted,
            fontWeight: 700,
          }}
        >
          5:00 PM
        </div>
      )}

      {/* ─── Voice-first timeline ───────────────────────── */}
      <FadeIn startFrame={20} durationFrames={20} style={{ position: 'absolute', left: TRACK_LEFT - sp(160), top: TRACK_Y_VOICEFIRST - sp(2) }}>
        <div style={{ fontFamily: fonts.body, fontSize: sz(18), color: colors.cyan, width: sp(140), textAlign: 'right' }}>
          Voice-first
        </div>
      </FadeIn>

      {/* Voice-first track background */}
      <div style={{ position: 'absolute', left: TRACK_LEFT, top: TRACK_Y_VOICEFIRST, width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_RADIUS, backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* Voice-first track fill */}
      <div
        style={{
          position: 'absolute',
          left: TRACK_LEFT,
          top: TRACK_Y_VOICEFIRST,
          width: TRACK_WIDTH * voiceProgress,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_RADIUS,
          backgroundColor: colors.cyan,
          boxShadow: `0 0 24px ${colors.cyan}40`,
        }}
      />

      {/* Voice-first "Deliverable sent" — positioned above the track, right-aligned to bar end */}
      {frame >= 110 && (
        <div
          style={{
            position: 'absolute',
            left: TRACK_LEFT + TRACK_WIDTH * 0.15 + sp(16),
            top: TRACK_Y_VOICEFIRST - sp(36),
            opacity: spring({ frame: frame - 110, fps, config: { damping: 16 } }),
            transform: `scale(${spring({ frame: frame - 110, fps, config: { damping: 16 } })})`,
            transformOrigin: 'left bottom',
            display: 'flex',
            alignItems: 'center',
            gap: sp(8),
          }}
        >
          <div
            style={{
              width: sp(24),
              height: sp(24),
              borderRadius: '50%',
              backgroundColor: colors.cyan,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: sz(12),
              color: colors.bg,
              fontWeight: 700,
            }}
          >
            ✓
          </div>
          <span style={{ fontFamily: fonts.mono, fontSize: sz(14), color: colors.cyan }}>
            Deliverable sent
          </span>
        </div>
      )}

      {/* Voice-first end time — positioned below the track */}
      {frame >= 115 && (
        <div
          style={{
            position: 'absolute',
            left: TRACK_LEFT + TRACK_WIDTH * 0.15,
            top: TRACK_Y_VOICEFIRST + TRACK_HEIGHT + sp(10),
            opacity: spring({ frame: frame - 115, fps, config: { damping: 16 } }),
            transform: 'translateX(-50%)',
            fontFamily: fonts.mono,
            fontSize: sz(18),
            color: colors.cyan,
            fontWeight: 700,
          }}
        >
          2:12 PM
        </div>
      )}

      {/* ─── Delta annotation ───────────────────────────── */}
      {frame >= 220 && (
        <div
          style={{
            position: 'absolute',
            top: TRACK_Y_VOICEFIRST + sp(90),
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: sp(80),
            opacity: deltaSpring,
            transform: `translateY(${(1 - deltaSpring) * 30}px)`,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: fonts.heading, fontSize: sz(44), color: colors.textMuted }}>
              2h 48min
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: sz(15), color: colors.textMuted, marginTop: sp(6) }}>
              Traditional
            </div>
          </div>

          <div style={{ width: 3, height: sp(70), backgroundColor: colors.textSubtle }} />

          <div style={{ textAlign: 'center', transform: showPulse ? `scale(${pulse})` : undefined }}>
            <div style={{ fontFamily: fonts.heading, fontSize: sz(44), color: colors.cyan, fontWeight: 700 }}>
              12 min
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: sz(15), color: colors.cyan, marginTop: sp(6) }}>
              Voice-first
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Composition registration ─────────────────────────────── */
export const SpeedGapComposition: React.FC = () => (
  <Composition
    id="BlogSpeedGap"
    component={SpeedGap}
    durationInFrames={450}
    fps={video.fps}
    width={video.width}
    height={video.height}
  />
);

export default SpeedGap;
