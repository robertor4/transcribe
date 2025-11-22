'use client';

import { useState, ReactNode } from 'react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { FloatingRecordButton } from '@/components/FloatingRecordButton';
import { RecordingModal } from '@/components/RecordingModal';

interface DetailPageLayoutProps {
  conversationId: string;
  rightPanel: ReactNode;
  children: ReactNode;
}

/**
 * Standard layout wrapper for all detail pages (outputs, transcript, etc.)
 * Provides consistent structure with ThreePaneLayout, LeftNavigation, FAB, and RecordingModal
 */
export function DetailPageLayout({ conversationId, rightPanel, children }: DetailPageLayoutProps) {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        rightPanel={rightPanel}
        mainContent={children}
      />

      {/* Floating Action Button */}
      <FloatingRecordButton onClick={() => setIsRecording(true)} isRecording={isRecording} />

      {/* Recording Modal */}
      <RecordingModal
        isOpen={isRecording}
        onStop={() => setIsRecording(false)}
        onCancel={() => setIsRecording(false)}
      />
    </div>
  );
}
