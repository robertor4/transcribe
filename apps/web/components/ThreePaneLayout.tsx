'use client';

import { ReactNode, cloneElement, isValidElement, useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { LeftNavigationCollapsed } from './LeftNavigationCollapsed';
import { MobileAppDrawer } from './MobileAppDrawer';
import { useCollapsibleSidebar } from '@/hooks/useCollapsibleSidebar';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ThreePaneLayoutProps {
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightPanel?: ReactNode;
  showRightPanel?: boolean;
  leftSidebarWidth?: number;
  rightPanelWidth?: number;
  /** Callback for "New Conversation" action from mobile drawer */
  onNewConversation?: () => void;
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
  onNewConversation,
}: ThreePaneLayoutProps) {
  const isMobile = useIsMobile(1024); // lg breakpoint
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
    <div className="flex h-screen-safe w-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Mobile hamburger button - only visible on mobile */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 flex items-center justify-center rounded-lg bg-[#3F38A0] dark:bg-[#0f1320] text-white shadow-lg hover:bg-[#4a42b5] dark:hover:bg-[#1a1a3a] transition-colors safe-area-top"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Navigation Drawer */}
      <MobileAppDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onNewConversation={onNewConversation}
      />

      {/* Left Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
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
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-gray-900 scrollbar-subtle">
        {/* Add top padding on mobile to account for the hamburger button */}
        <div className="lg:pt-0 pt-14 min-h-full">
          {mainContent}
        </div>
      </main>

      {/* Right Panel (optional) - hidden on mobile, uses AssetMobileSheet instead */}
      {showRightPanel && rightPanel && !isMobile && (
        <div className="hidden lg:block">
          <CollapsibleSidebar
            side="right"
            isCollapsed={rightPanelState.isCollapsed}
            onToggle={rightPanelState.toggle}
            width={rightPanelWidth}
            collapsedWidth={48}
          >
            {rightPanel}
          </CollapsibleSidebar>
        </div>
      )}
    </div>
  );
}
