import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { colors, fonts, sz, sp } from '@/lib/design-tokens';

interface SubtitleLine {
  startFrame: number;
  endFrame: number;
  text: string;
}

interface SubtitleProps {
  lines: SubtitleLine[];
  fontSize?: number;
  bottomOffset?: number;
}

/**
 * Subtitle overlay — renders VO text at the bottom of the frame.
 * Fades in/out smoothly. Styled in Geist Sans on a semi-transparent backdrop.
 */
export const Subtitle: React.FC<SubtitleProps> = ({
  lines,
  fontSize = sz(15),
  bottomOffset = sp(60),
}) => {
  const frame = useCurrentFrame();

  const activeLine = lines.find(
    (line) => frame >= line.startFrame && frame < line.endFrame
  );

  if (!activeLine) return null;

  const fadeInEnd = activeLine.startFrame + 6;
  const fadeOutStart = activeLine.endFrame - 6;

  const opacity = interpolate(
    frame,
    [activeLine.startFrame, fadeInEnd, fadeOutStart, activeLine.endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(6px)',
          borderRadius: 8,
          padding: `${sp(8)}px ${sp(24)}px`,
          maxWidth: '70%',
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 1.5,
            textAlign: 'center',
            display: 'block',
          }}
        >
          {activeLine.text}
        </span>
      </div>
    </div>
  );
};
