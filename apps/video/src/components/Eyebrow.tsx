import React from 'react';
import { colors, sz } from '@/lib/design-tokens';

interface EyebrowProps {
  children: React.ReactNode;
  /** Override color (default: cyan #14D0DC) */
  color?: string;
}

/**
 * DM Mono uppercase tracked eyebrow label — matching landing page section tags.
 */
export const Eyebrow: React.FC<EyebrowProps> = ({
  children,
  color = colors.cyan,
}) => {
  return (
    <div
      style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: sz(11),
        fontWeight: 400,
        letterSpacing: 3.5,
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  );
};
