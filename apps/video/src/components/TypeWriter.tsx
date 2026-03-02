import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface TypeWriterProps {
  /** The text to type out */
  text: string;
  /** Frame at which typing starts (default: 0) */
  startFrame?: number;
  /** Frames per character (lower = faster typing) */
  speed?: number;
  /** CSS styles for the text container */
  style?: React.CSSProperties;
  /** Whether to show a blinking cursor */
  showCursor?: boolean;
  /** Cursor color */
  cursorColor?: string;
}

/**
 * Typewriter text reveal — types out a string character by character.
 * Used for hero headlines, Q&A questions, and closing CTA.
 */
export const TypeWriter: React.FC<TypeWriterProps> = ({
  text,
  startFrame = 0,
  speed = 2,
  style = {},
  showCursor = true,
  cursorColor = 'rgba(255, 255, 255, 0.6)',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = Math.max(0, frame - startFrame);
  const charsVisible = Math.min(text.length, Math.floor(elapsed / speed));
  const visibleText = text.slice(0, charsVisible);
  const isDone = charsVisible >= text.length;

  // Cursor blinks every 0.5s (15 frames at 30fps)
  const cursorVisible = !isDone || (Math.floor(frame / 15) % 2 === 0);

  return (
    <span style={{ ...style, whiteSpace: 'pre-wrap' }}>
      {visibleText}
      {showCursor && cursorVisible && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            backgroundColor: cursorColor,
            marginLeft: 2,
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </span>
  );
};
