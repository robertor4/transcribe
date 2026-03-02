'use client';

import { ReactNode, cloneElement, isValidElement, useState, useCallback } from 'react';
import { Menu, PanelRight, Zap } from 'lucide-react';
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
  /** Override initial collapse state for left sidebar (does not read from localStorage) */
  initialLeftCollapsed?: boolean;
  /** Override initial collapse state for right panel (does not read from localStorage) */
  initialRightCollapsed?: boolean;
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
  initialLeftCollapsed,
  initialRightCollapsed,
}: ThreePaneLayoutProps) {
  const isMobile = useIsMobile(1024); // lg breakpoint
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const leftSidebarState = useCollapsibleSidebar({
    storageKey: 'neural-summary:left-sidebar-collapsed',
    defaultCollapsed: initialLeftCollapsed ?? false,
    forceInitial: initialLeftCollapsed !== undefined,
  });

  const rightPanelState = useCollapsibleSidebar({
    storageKey: 'neural-summary:right-panel-collapsed',
    defaultCollapsed: initialRightCollapsed ?? true,
    forceInitial: initialRightCollapsed !== undefined,
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

  // Clone rightPanel element to inject collapse function
  const rightPanelWithCollapse = isValidElement(rightPanel)
    ? cloneElement(rightPanel as React.ReactElement<{ onCollapse?: () => void }>, {
        onCollapse: rightPanelState.toggle,
      })
    : rightPanel;

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
            collapsedContent={
              <div className="h-full flex flex-col items-center py-4 gap-2">
                <button
                  onClick={rightPanelState.toggle}
                  className="group relative p-2 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
                  aria-label="Open AI Assets panel"
                >
                  <PanelRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    Open AI Assets
                  </div>
                </button>
                <div className="w-6 h-px bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={rightPanelState.toggle}
                  className="p-2 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
                  aria-label="AI Assets"
                >
                  <Zap className="w-5 h-5 text-[#8D6AFA]" />
                </button>
              </div>
            }
          >
            {rightPanelWithCollapse}
          </CollapsibleSidebar>
        </div>
      )}
    </div>
  );
}
