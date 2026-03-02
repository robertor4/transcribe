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
  /** Optional title content for the mobile top bar (shown next to hamburger) */
  mobileTitle?: ReactNode;
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
  mobileTitle,
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
      {/* Mobile top bar - only visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="flex items-center gap-3 px-4 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/60 dark:border-gray-700/40">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#3F38A0] dark:bg-[#1a1540] text-white shadow-sm hover:bg-[#4a42b5] dark:hover:bg-[#241f4d] transition-colors flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {mobileTitle && (
            <div className="flex-1 min-w-0 truncate">
              {mobileTitle}
            </div>
          )}
        </div>
      </div>

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
        {/* Add top padding on mobile to account for the top bar */}
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
