'use client';

import { ReactNode, cloneElement, isValidElement, useState, useCallback } from 'react';
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
 * - Left: Collapsible navigation (260px → 48px icon strip)
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
  leftSidebarWidth = 260,
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

  // Track if we should focus search after sidebar expands
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);

  // Handler for search button in collapsed state
  const handleSearchFromCollapsed = useCallback(() => {
    setShouldFocusSearch(true);
    leftSidebarState.toggle();
  }, [leftSidebarState]);

  // Called by LeftNavigation after it focuses the search input
  const clearFocusSearch = useCallback(() => {
    setShouldFocusSearch(false);
  }, []);

  // Clone leftSidebar element to inject toggle function and focus search state
  const leftSidebarWithToggle = isValidElement(leftSidebar)
    ? cloneElement(leftSidebar as React.ReactElement<{ onToggleSidebar?: () => void; focusSearch?: boolean; onSearchFocused?: () => void }>, {
        onToggleSidebar: leftSidebarState.toggle,
        focusSearch: shouldFocusSearch,
        onSearchFocused: clearFocusSearch,
      })
    : leftSidebar;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Left Sidebar */}
      <CollapsibleSidebar
        side="left"
        isCollapsed={leftSidebarState.isCollapsed}
        onToggle={leftSidebarState.toggle}
        width={leftSidebarWidth}
        collapsedWidth={48}
        collapsedContent={<LeftNavigationCollapsed onToggle={leftSidebarState.toggle} onSearch={handleSearchFromCollapsed} />}
      >
        {leftSidebarWithToggle}
      </CollapsibleSidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-gray-900 scrollbar-subtle">
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
