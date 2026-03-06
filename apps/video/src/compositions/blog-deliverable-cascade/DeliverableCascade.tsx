import React from 'react';
import {
  Composition,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { colors, fonts, sz, sp, cs, video } from '@/lib/design-tokens';
import { FadeIn } from '@/components/FadeIn';
import { LevelBars } from '@/components/LevelBars';
import { ProgressRing } from '@/components/ProgressRing';

/* ─── Deliverable card definitions ─────────────────────────── */
const deliverables = [
  { title: 'Strategy Brief', type: 'Document', color: colors.product, icon: '📋' },
  { title: 'Action Items', type: 'Checklist', color: colors.cyan, icon: '✓' },
  { title: 'Follow-up Email', type: 'Email', color: colors.sales, icon: '✉' },
  { title: 'Status Report', type: 'Report', color: colors.tech, icon: '📊' },
];

/* Card positions — fill the full canvas */
const cardPositions = [
  { x: 280, y: 200 },   // top-left
  { x: 1640, y: 200 },  // top-right
  { x: 280, y: 880 },   // bottom-left
  { x: 1640, y: 880 },  // bottom-right
];

const CARD_WIDTH = 460;
const CARD_HEIGHT = 160;
const CENTER_X = 960;
const CENTER_Y = 540;

/* ─── Main scene ───────────────────────────────────────────── */
const DeliverableCascade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio level function for LevelBars (active during 0–60)
  const audioLevel = (f: number) => {
    if (f > 60) return 0;
    return 40 + Math.sin(f * 0.3) * 25 + Math.sin(f * 0.7) * 15;
  };

  // Processing ring progress (frames 60–105)
  const ringProgress = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase visibility
  const showVoice = frame < 105;
  const showRing = frame >= 55 && frame < 115;
  const showCards = frame >= 105;
  const showLines = frame >= 270;
  const showLogo = frame >= 315;

  // Center card opacity transitions
  const voiceOpacity = interpolate(frame, [55, 65], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOpacity = frame >= 55
    ? interpolate(frame, [55, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      * interpolate(frame, [105, 115], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  // Center label text
  const centerLabel = frame < 55
    ? '5-min voice note'
    : frame < 115
      ? 'Processing...'
      : '';

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
      {/* ─── Center card ──────────────────────────────── */}
      <FadeIn startFrame={0} durationFrames={30} useSpring style={{
        position: 'absolute',
        left: CENTER_X,
        top: CENTER_Y,
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
        width: cs(500),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Voice card with LevelBars */}
        {showVoice && (
          <div style={{ opacity: voiceOpacity }}>
            <LevelBars
              audioLevel={audioLevel}
              width={cs(400)}
              height={cs(50)}
              showChrome={false}
            />
          </div>
        )}

        {/* Processing ring */}
        {showRing && (
          <div style={{
            opacity: ringOpacity,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <ProgressRing progress={ringProgress} size={cs(100)} />
          </div>
        )}

        {/* Logo (final hold) */}
        {showLogo && (
          <div style={{
            opacity: spring({ frame: frame - 315, fps, config: { damping: 20 } }),
          }}>
            <Img
              src={staticFile('logos/neural-summary-logo-white.svg')}
              style={{ width: cs(200), height: 'auto' }}
            />
          </div>
        )}

        {/* Center label */}
        {centerLabel && (
          <div style={{
            marginTop: sp(16),
            fontFamily: fonts.mono,
            fontSize: sz(16),
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}>
            {centerLabel}
          </div>
        )}
      </FadeIn>

      {/* ─── Deliverable cards ────────────────────────── */}
      {showCards && deliverables.map((d, i) => {
        const cardFrame = frame - 105 - i * 6;
        const cardSpring = spring({
          frame: cardFrame,
          fps,
          config: { damping: 14, stiffness: 100 },
        });

        const startX = CENTER_X - CARD_WIDTH / 2;
        const startY = CENTER_Y - CARD_HEIGHT / 2;
        const endX = cardPositions[i].x - CARD_WIDTH / 2;
        const endY = cardPositions[i].y - CARD_HEIGHT / 2;

        const x = interpolate(cardSpring, [0, 1], [startX, endX]);
        const y = interpolate(cardSpring, [0, 1], [startY, endY]);

        return (
          <div
            key={d.title}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              opacity: cardSpring,
              transform: `scale(${interpolate(cardSpring, [0, 1], [0.6, 1])})`,
              zIndex: 1,
              background: '#352A6B',
              border: `1px solid ${colors.bgCardBorder}`,
              borderLeft: `6px solid ${d.color}`,
              borderRadius: 16,
              padding: `${sp(20)}px ${sp(28)}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: sp(8),
            }}
          >
            <div style={{
              fontFamily: fonts.mono,
              fontSize: sz(13),
              color: d.color,
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}>
              {d.type}
            </div>
            <div style={{
              fontFamily: fonts.heading,
              fontSize: sz(22),
              color: colors.textPrimary,
              fontWeight: 700,
            }}>
              {d.title}
            </div>
          </div>
        );
      })}

      {/* ─── Connecting lines (SVG) ───────────────────── */}
      {showLines && (
        <svg
          width={video.width}
          height={video.height}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}
        >
          {cardPositions.map((pos, i) => {
            const lineProgress = interpolate(frame, [270 + i * 4, 310 + i * 4], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            const dx = pos.x - CENTER_X;
            const dy = pos.y - CENTER_Y;
            const endX = CENTER_X + dx * lineProgress;
            const endY = CENTER_Y + dy * lineProgress;

            return (
              <line
                key={i}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={endX}
                y2={endY}
                stroke={colors.textSubtle}
                strokeWidth={2}
                strokeDasharray="8 5"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};

/* ─── Composition registration ─────────────────────────────── */
export const DeliverableCascadeComposition: React.FC = () => (
  <Composition
    id="BlogDeliverableCascade"
    component={DeliverableCascade}
    durationInFrames={360}
    fps={video.fps}
    width={video.width}
    height={video.height}
  />
);

export default DeliverableCascade;
