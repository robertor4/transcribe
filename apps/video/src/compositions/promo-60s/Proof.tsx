import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

/**
 * Scene 7: Proof (0:39–0:47)
 *
 * Single testimonial at a time, full-width (1300px), cycling with
 * cross-fades (~2.5s each). Then compress into proof bar.
 */
export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const testimonials = [
    {
      quote: 'I run 12 client calls a week. Before Neural Summary, I was losing 3-4 hours just on post-call writeups. Now that time goes back into actual client work.',
      name: 'Wouter Chompff',
      role: 'Founder · One Man Agency',
    },
    {
      quote: "The AI chat is what sold me. I can ask 'what did we decide about the pricing model in March' and get the answer with a timestamp in 3 seconds. That's institutional memory.",
      name: 'Jurriaan Besorak',
      role: 'Managing Director · NBM Finance',
    },
    {
      quote: 'Our product team records every discovery call and turns them into feature briefs automatically. We shipped 40% faster last quarter because nobody\'s playing telephone anymore.',
      name: 'Sarah Martinez',
      role: 'Head of Product · Xili Group',
    },
  ];

  // Each testimonial shows for ~2.5s, with 0.3s cross-fade
  const cycleDuration = fps * 2.5;
  const fadeDuration = 10; // frames

  // Compress phase (7–8s): testimonials fade out, proof bar appears
  const compressStart = fps * 6.5;
  const barOpacity = interpolate(frame, [compressStart, compressStart + fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cardsOpacity = interpolate(frame, [compressStart - fps * 0.3, compressStart], [1, 0], {
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
        position: 'relative',
      }}
    >
      {/* Cycling testimonials — one at a time, centered */}
      {testimonials.map((t, i) => {
        const cardStart = i * cycleDuration + fps * 0.3;
        const cardEnd = cardStart + cycleDuration;
        const fadeIn = interpolate(frame, [cardStart, cardStart + fadeDuration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const fadeOut = i < testimonials.length - 1
          ? interpolate(frame, [cardEnd - fadeDuration, cardEnd], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 1;

        const cardOpacity = fadeIn * fadeOut * cardsOpacity;
        const slideY = interpolate(frame, [cardStart, cardStart + fadeDuration], [30, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 1300,
              opacity: cardOpacity,
              transform: `translateY(${slideY}px)`,
            }}
          >
            <div
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.bgCardBorder}`,
                borderRadius: 20,
                padding: `${sp(48)}px ${sp(56)}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: sp(28),
              }}
            >
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontStyle: 'italic',
                  fontSize: sz(24),
                  fontWeight: 300,
                  color: colors.textSecondary,
                  lineHeight: 1.7,
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </div>
              <div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: sz(16),
                    fontWeight: 600,
                    color: colors.textPrimary,
                    marginBottom: sp(4),
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: sz(11),
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  {t.role}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Compressed proof bar */}
      <div
        style={{
          opacity: barOpacity,
          background: colors.bgCard,
          border: `1px solid ${colors.bgCardBorder}`,
          borderRadius: 100,
          padding: `${sp(14)}px ${sp(44)}px`,
          fontFamily: fonts.body,
          fontSize: sz(16),
          color: colors.textSecondary,
        }}
      >
        Trusted by founders, team leads & consultants
      </div>
    </div>
  );
};
