'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';

/**
 * Full-page skeleton for conversation detail view.
 * Mirrors the three-pane layout with left nav, main content, and right sidebar.
 */
export function ConversationSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<NavigationSkeleton />}
        rightPanel={
          <div className="hidden lg:block h-full">
            <AssetSidebarSkeleton />
          </div>
        }
        mainContent={<ConversationContentSkeleton />}
      />
    </div>
  );
}

function NavigationSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4">
      {/* Logo area */}
      <div className="mb-6">
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg mb-6" />

      {/* Folders section */}
      <div className="mb-6">
        <Skeleton className="h-3 w-16 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Recent section */}
      <div className="flex-1">
        <Skeleton className="h-3 w-20 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* User profile */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetSidebarSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-lg"
          >
            <div className="flex gap-3">
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-1.5" />
                <Skeleton className="h-4 w-24 mb-1.5" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversationContentSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        {/* Back link */}
        <Skeleton className="h-4 w-24 mb-4 lg:mb-6" />

        {/* Title */}
        <Skeleton className="h-8 lg:h-10 w-3/4 mb-3" />

        {/* Metadata row */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-1 py-1">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Summary content */}
      <div className="space-y-8">
        {/* Intro paragraph */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        {/* Key Insights section */}
        <div>
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topics section */}
        <div>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Full Summary section */}
        <div>
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { AssetSidebarSkeleton };
