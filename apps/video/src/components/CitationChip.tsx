import React from 'react';
import { colors, sz, sp } from '@/lib/design-tokens';

interface CitationChipProps {
  /** Timestamp label, e.g. "33:47" */
  timestamp: string;
  /** Speaker name, e.g. "Investor A" */
  speaker: string;
  /** Optional scale factor (for responsive sizing) */
  scale?: number;
}

/**
 * Inline citation chip — matching the ChatMock component's chip styling.
 * Cyan text on a subtle cyan-tinted background with thin border.
 */
export const CitationChip: React.FC<CitationChipProps> = ({
  timestamp,
  speaker,
  scale = 1,
}) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sp(4) * scale,
        backgroundColor: 'rgba(20, 208, 220, 0.12)',
        border: '1px solid rgba(20, 208, 220, 0.3)',
        borderRadius: 6 * scale,
        padding: `${sp(4) * scale}px ${sp(12) * scale}px`,
        fontFamily: '"DM Mono", monospace',
        fontSize: sz(13) * scale,
        color: colors.cyan,
        whiteSpace: 'nowrap',
      }}
    >
      ⏱ {timestamp} · {speaker}
    </span>
  );
};
