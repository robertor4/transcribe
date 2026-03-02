import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Inline SVG icons matching the Lucide icons used on the landing page security section.
 * Rendered as cyan (#14D0DC) stroked icons, same as the web app.
 */
const ShieldIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
);

const LockIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Trash2Icon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const UserIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Scene 8: Trust (0:47–0:53)
 *
 * Security badges glow in one by one (matching landing page security section).
 * Stats count up beneath.
 */
export const Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconSize = sz(28);

  const badges = [
    { Icon: ShieldIcon, title: 'GDPR Compliant', desc: 'EU data residency available' },
    { Icon: LockIcon, title: 'Encrypted at rest', desc: 'AES-256 encryption' },
    { Icon: Trash2Icon, title: 'Auto-delete policy', desc: 'On your schedule' },
    { Icon: UserIcon, title: 'You own your data', desc: 'Never used to train AI' },
  ];

  const stats = [
    { number: 99, suffix: '+', label: 'Languages' },
    { number: 96, suffix: '%', label: 'Accuracy' },
    { number: 4, suffix: '×', label: 'Faster than real-time' },
  ];

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
        gap: sp(56),
      }}
    >
      {/* Security badges */}
      <div style={{ display: 'flex', gap: sp(28) }}>
        {badges.map((badge, i) => {
          const badgeStart = fps * 0.3 + i * fps * 0.35;
          const badgeOpacity = interpolate(frame, [badgeStart, badgeStart + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // Glow pulse on entrance
          const glow = interpolate(
            frame,
            [badgeStart + 5, badgeStart + 12, badgeStart + 20],
            [0, 1, 0.2],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={i}
              style={{
                opacity: badgeOpacity,
                background: colors.bgCard,
                border: `1px solid ${colors.bgCardBorder}`,
                borderRadius: 16,
                padding: `${sp(28)}px ${sp(28)}px`,
                textAlign: 'center',
                width: cs(200),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: sp(10),
                boxShadow: `0 0 ${20 * glow}px ${colors.cyan}30`,
              }}
            >
              <badge.Icon size={iconSize} />
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: sz(14),
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                {badge.title}
              </div>
              <div
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: sz(10),
                  color: colors.textMuted,
                  lineHeight: 1.4,
                }}
              >
                {badge.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats counter */}
      <div style={{ display: 'flex', gap: sp(80) }}>
        {stats.map((stat, i) => {
          const countStart = fps * 2;
          const countDuration = fps * 1.5;
          const countValue = interpolate(
            frame,
            [countStart, countStart + countDuration],
            [0, stat.number],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const statOpacity = interpolate(frame, [fps * 1.8, fps * 2.2], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div key={i} style={{ textAlign: 'center', opacity: statOpacity }}>
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontSize: sz(56),
                  fontWeight: 900,
                  color: colors.cyan,
                  lineHeight: 1,
                  marginBottom: sp(8),
                }}
              >
                {Math.round(countValue)}
                {stat.suffix}
              </div>
              <div
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: sz(13),
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
