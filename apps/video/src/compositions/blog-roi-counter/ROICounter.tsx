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

/* ─── Layout constants (widened, taller bars) ─────────────── */
const CHART_LEFT = 360;
const CHART_BOTTOM = 780;
const CHART_HEIGHT = 560;
const BAR_WIDTH = 280;
const BAR_GAP = 200;
const BAR_RADIUS = 16;

/* ─── Main scene ───────────────────────────────────────────── */
const ROICounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Before bar growth (frames 30–120): 0 → 500 hours
  const beforeProgress = interpolate(frame, [30, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const beforeValue = Math.round(beforeProgress * 500);
  const beforeHeight = CHART_HEIGHT * beforeProgress;

  // After bar growth (frames 120–180): 0 → 100 hours
  const afterProgress = interpolate(frame, [120, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const afterValue = Math.round(afterProgress * 100);
  const afterHeight = CHART_HEIGHT * (afterProgress * 0.2);

  // Delta annotation (frames 180–240)
  const deltaSpring = spring({
    frame: frame - 190,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Dollar pulse (frames 240–300)
  const dollarPulse = frame >= 240
    ? interpolate(Math.sin((frame - 240) * 0.12), [-1, 1], [0.92, 1])
    : 1;

  // Bar X positions
  const bar1X = CHART_LEFT;
  const bar2X = CHART_LEFT + BAR_WIDTH + BAR_GAP;

  return (
    <div
      style={{
        width: video.width,
        height: video.height,
        backgroundColor: '#2E2266',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Eyebrow title */}
      <FadeIn startFrame={0} durationFrames={24} style={{ position: 'absolute', top: sp(40), left: 0, right: 0, textAlign: 'center' }}>
        <Eyebrow size={20}>Annual Impact</Eyebrow>
      </FadeIn>

      {/* Y-axis label */}
      <FadeIn startFrame={5} durationFrames={20} style={{
        position: 'absolute',
        left: CHART_LEFT - sp(100),
        top: CHART_BOTTOM - CHART_HEIGHT / 2,
        transform: 'rotate(-90deg)',
        transformOrigin: 'center',
      }}>
        <div style={{
          fontFamily: fonts.mono,
          fontSize: sz(14),
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 3,
        }}>
          Hours / year
        </div>
      </FadeIn>

      {/* ─── Before bar ───────────────────────────────── */}
      {/* Track */}
      <div style={{
        position: 'absolute',
        left: bar1X,
        bottom: video.height - CHART_BOTTOM,
        width: BAR_WIDTH,
        height: CHART_HEIGHT,
        borderRadius: BAR_RADIUS,
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
      }} />

      {/* Fill */}
      <div style={{
        position: 'absolute',
        left: bar1X,
        bottom: video.height - CHART_BOTTOM,
        width: BAR_WIDTH,
        height: beforeHeight,
        borderRadius: BAR_RADIUS,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        border: `1px solid ${colors.bgCardBorder}`,
      }} />

      {/* Counter above bar */}
      {frame >= 30 && (
        <div style={{
          position: 'absolute',
          left: bar1X,
          bottom: video.height - CHART_BOTTOM + beforeHeight + sp(12),
          width: BAR_WIDTH,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: sz(36),
          color: colors.textPrimary,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
        }}>
          {beforeValue}
        </div>
      )}

      {/* X-axis label */}
      <FadeIn startFrame={10} durationFrames={20} style={{
        position: 'absolute',
        left: bar1X,
        top: CHART_BOTTOM + sp(16),
        width: BAR_WIDTH,
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: fonts.body, fontSize: sz(18), color: colors.textSecondary }}>
          Before
        </div>
      </FadeIn>

      {/* ─── After bar ────────────────────────────────── */}
      {/* Track */}
      <div style={{
        position: 'absolute',
        left: bar2X,
        bottom: video.height - CHART_BOTTOM,
        width: BAR_WIDTH,
        height: CHART_HEIGHT,
        borderRadius: BAR_RADIUS,
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
      }} />

      {/* Fill */}
      {frame >= 120 && (
        <div style={{
          position: 'absolute',
          left: bar2X,
          bottom: video.height - CHART_BOTTOM,
          width: BAR_WIDTH,
          height: afterHeight,
          borderRadius: BAR_RADIUS,
          backgroundColor: colors.cyan,
          boxShadow: `0 0 40px ${colors.cyan}30`,
        }} />
      )}

      {/* Counter above bar */}
      {frame >= 120 && (
        <div style={{
          position: 'absolute',
          left: bar2X,
          bottom: video.height - CHART_BOTTOM + afterHeight + sp(12),
          width: BAR_WIDTH,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: sz(36),
          color: colors.cyan,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
        }}>
          {afterValue}
        </div>
      )}

      {/* X-axis label */}
      <FadeIn startFrame={10} durationFrames={20} style={{
        position: 'absolute',
        left: bar2X,
        top: CHART_BOTTOM + sp(16),
        width: BAR_WIDTH,
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: fonts.body, fontSize: sz(18), color: colors.textSecondary }}>
          After
        </div>
      </FadeIn>

      {/* ─── Delta annotation ─────────────────────────── */}
      {frame >= 190 && (
        <div
          style={{
            position: 'absolute',
            left: bar2X + BAR_WIDTH + sp(60),
            top: CHART_BOTTOM - CHART_HEIGHT / 2 - sp(40),
            opacity: deltaSpring,
            transform: `translateX(${(1 - deltaSpring) * 40}px)`,
          }}
        >
          {/* Bracket line */}
          <div style={{
            position: 'absolute',
            left: -sp(30),
            top: -sp(20),
            width: 4,
            height: sp(140),
            backgroundColor: colors.textSubtle,
            borderRadius: 2,
          }} />

          <div style={{
            fontFamily: fonts.heading,
            fontSize: sz(40),
            color: colors.textPrimary,
            fontWeight: 700,
            lineHeight: 1.3,
          }}>
            400 hours
          </div>
          <div style={{
            fontFamily: fonts.body,
            fontSize: sz(20),
            color: colors.textSecondary,
            marginTop: sp(4),
          }}>
            recovered per year
          </div>

          <div style={{
            fontFamily: fonts.heading,
            fontSize: sz(32),
            color: colors.cyan,
            fontWeight: 700,
            fontStyle: 'italic',
            marginTop: sp(20),
            transform: `scale(${dollarPulse})`,
            transformOrigin: 'left center',
          }}>
            $50,000 in value
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Composition registration ─────────────────────────────── */
export const ROICounterComposition: React.FC = () => (
  <Composition
    id="BlogROICounter"
    component={ROICounter}
    durationInFrames={300}
    fps={video.fps}
    width={video.width}
    height={video.height}
  />
);

export default ROICounter;
