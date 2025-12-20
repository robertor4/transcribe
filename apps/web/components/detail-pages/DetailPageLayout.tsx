'use client';

import { ReactNode } from 'react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';

interface DetailPageLayoutProps {
  conversationId: string;
  rightPanel: ReactNode;
  children: ReactNode;
}

/**
 * Standard layout wrapper for all detail pages (outputs, transcript, etc.)
 * Provides consistent structure with ThreePaneLayout and LeftNavigation
 */
export function DetailPageLayout({ conversationId, rightPanel, children }: DetailPageLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        rightPanel={rightPanel}
        mainContent={children}
      />
    </div>
  );
}
