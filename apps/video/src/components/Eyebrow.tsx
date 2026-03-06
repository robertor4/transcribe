import React from 'react';
import { colors, sz } from '@/lib/design-tokens';

interface EyebrowProps {
  children: React.ReactNode;
  /** Override color (default: cyan #14D0DC) */
  color?: string;
  /** Override font size in web-px, scaled via sz(). Default: 11 */
  size?: number;
}

/**
 * DM Mono uppercase tracked eyebrow label — matching landing page section tags.
 */
export const Eyebrow: React.FC<EyebrowProps> = ({
  children,
  color = colors.cyan,
  size = 11,
}) => {
  return (
    <div
      style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: sz(size),
        fontWeight: 400,
        letterSpacing: size > 14 ? 5 : 3.5,
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  );
};
