'use client';

import { ReactNode } from 'react';
import { PanelLeft } from 'lucide-react';

interface CollapsibleSidebarProps {
  children: ReactNode;
  collapsedContent?: ReactNode;
  side: 'left' | 'right';
  isCollapsed: boolean;
  onToggle: () => void;
  width?: number;
  collapsedWidth?: number;
  className?: string;
}

/**
 * Reusable collapsible sidebar component with smooth animations
 * Follows ChatGPT/Claude 2025 patterns with persistent icon strip when collapsed
 */
export function CollapsibleSidebar({
  children,
  collapsedContent,
  side,
  isCollapsed,
  onToggle,
  width = 240,
  collapsedWidth = 48,
  className = '',
}: CollapsibleSidebarProps) {
  const currentWidth = isCollapsed ? collapsedWidth : width;
  const isLeft = side === 'left';

  return (
    <aside
      className={`
        relative flex-shrink-0 h-full
        ${isLeft ? 'bg-[#3F38A0] dark:bg-[#0f1320]' : 'bg-gray-50/50 dark:bg-[#131620]'}
        ${isLeft ? 'border-white/10' : 'border-gray-200/60 dark:border-gray-700/60'}
        transition-all duration-300 ease-in-out
        ${isLeft ? 'border-r' : 'border-l'}
        ${className}
      `}
      style={{ width: `${currentWidth}px` }}
    >
      {isCollapsed ? (
        /* Collapsed State - Show icon strip */
        <div className="h-full flex flex-col items-center">
          {collapsedContent || (
            <button
              onClick={onToggle}
              className="group relative mt-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open sidebar"
            >
              <PanelLeft className="w-5 h-5 text-white/70" />

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Open sidebar
              </div>
            </button>
          )}
        </div>
      ) : (
        /* Expanded State - Show full content */
        <div className="h-full overflow-hidden">
          {children}
        </div>
      )}
    </aside>
  );
}
