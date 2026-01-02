import { ReactNode } from 'react';

interface DetailRightPanelProps {
  children: ReactNode;
}

/**
 * Wrapper for detail page right panels
 * Provides consistent padding - content remains page-specific
 */
export function DetailRightPanel({ children }: DetailRightPanelProps) {
  return (
    <div className="p-6">
      {children}
    </div>
  );
}
