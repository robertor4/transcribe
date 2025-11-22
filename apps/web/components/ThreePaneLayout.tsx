'use client';

import { ReactNode, cloneElement, isValidElement } from 'react';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { LeftNavigationCollapsed } from './LeftNavigationCollapsed';
import { useCollapsibleSidebar } from '@/hooks/useCollapsibleSidebar';

interface ThreePaneLayoutProps {
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightPanel?: ReactNode;
  showRightPanel?: boolean;
  leftSidebarWidth?: number;
  rightPanelWidth?: number;
}

/**
 * Modern three-pane layout following 2025 best practices
 * - Left: Collapsible navigation (240px → 48px icon strip)
 * - Middle: Main content (flex-grow)
 * - Right: Optional contextual panel (360px → 48px)
 *
 * State persisted in localStorage
 * Responsive: Collapses appropriately on smaller screens
 */
export function ThreePaneLayout({
  leftSidebar,
  mainContent,
  rightPanel,
  showRightPanel = true,
  leftSidebarWidth = 240,
  rightPanelWidth = 360,
}: ThreePaneLayoutProps) {
  const leftSidebarState = useCollapsibleSidebar({
    storageKey: 'neural-summary:left-sidebar-collapsed',
    defaultCollapsed: false,
  });

  const rightPanelState = useCollapsibleSidebar({
    storageKey: 'neural-summary:right-panel-collapsed',
    defaultCollapsed: false,
  });

  // Clone leftSidebar element to inject toggle function
  const leftSidebarWithToggle = isValidElement(leftSidebar)
    ? cloneElement(leftSidebar as React.ReactElement<any>, {
        onToggleSidebar: leftSidebarState.toggle,
      })
    : leftSidebar;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-950">
      {/* Left Sidebar */}
      <CollapsibleSidebar
        side="left"
        isCollapsed={leftSidebarState.isCollapsed}
        onToggle={leftSidebarState.toggle}
        width={leftSidebarWidth}
        collapsedWidth={48}
        collapsedContent={<LeftNavigationCollapsed onToggle={leftSidebarState.toggle} />}
      >
        {leftSidebarWithToggle}
      </CollapsibleSidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-gray-950">
        {mainContent}
      </main>

      {/* Right Panel (optional) */}
      {showRightPanel && rightPanel && (
        <CollapsibleSidebar
          side="right"
          isCollapsed={rightPanelState.isCollapsed}
          onToggle={rightPanelState.toggle}
          width={rightPanelWidth}
          collapsedWidth={48}
        >
          {rightPanel}
        </CollapsibleSidebar>
      )}
    </div>
  );
}
