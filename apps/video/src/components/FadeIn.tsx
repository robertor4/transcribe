import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { sp } from '@/lib/design-tokens';

interface FadeInProps {
  children: React.ReactNode;
  /** Frame at which the animation starts */
  startFrame?: number;
  /** Duration of the fade in frames */
  durationFrames?: number;
  /** Direction: 'up' slides up from below, 'left'/'right' from sides, 'none' for pure opacity */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Distance to travel in px (default: 40) */
  distance?: number;
  /** Use spring physics instead of linear interpolation */
  useSpring?: boolean;
  /** Additional styles on the wrapper */
  style?: React.CSSProperties;
}

/**
 * Fade-in wrapper — matches the fadeUp/fadeIn animations from the landing page.
 * Supports directional slide + opacity with optional spring physics.
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  startFrame = 0,
  durationFrames = 18,
  direction = 'up',
  distance = sp(40),
  useSpring: useSpringPhysics = false,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = useSpringPhysics
    ? spring({ frame: frame - startFrame, fps, durationInFrames: durationFrames, config: { damping: 20 } })
    : interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const opacity = progress;

  const translateMap: Record<string, string> = {
    up: `translateY(${(1 - progress) * distance}px)`,
    down: `translateY(${-(1 - progress) * distance}px)`,
    left: `translateX(${(1 - progress) * distance}px)`,
    right: `translateX(${-(1 - progress) * distance}px)`,
    none: '',
  };

  return (
    <div
      style={{
        opacity,
        transform: translateMap[direction],
        ...style,
      }}
    >
      {children}
    </div>
  );
};
