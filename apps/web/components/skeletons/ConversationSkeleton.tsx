'use client';

import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
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

/**
 * Skeleton for left navigation (reused from dashboard).
 */
function NavigationSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4">
      {/* Logo area */}
      <div className="mb-6">
        <Skeleton variant="rounded" className="h-8 w-32" />
      </div>

      {/* Search */}
      <Skeleton variant="rounded" className="h-10 w-full mb-6" />

      {/* Folders section */}
      <div className="mb-6">
        <Skeleton variant="text" className="h-3 w-16 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" className="h-9 w-full" />
          ))}
        </div>
      </div>

      {/* Recent section */}
      <div className="flex-1">
        <Skeleton variant="text" className="h-3 w-20 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" className="h-9 w-full" />
          ))}
        </div>
      </div>

      {/* User profile */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={36} height={36} />
          <div className="flex-1">
            <Skeleton variant="text" className="h-4 w-24 mb-1" />
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the right asset sidebar.
 */
function AssetSidebarSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <Skeleton variant="text" className="h-5 w-24" />
          <Skeleton variant="rounded" className="h-8 w-8" />
        </div>
        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" className="w-4 h-4" />
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" className="w-4 h-4" />
            <Skeleton variant="text" className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-lg animate-pulse"
          >
            <div className="flex gap-3">
              <Skeleton variant="rounded" className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton variant="text" className="h-3 w-20 mb-1" />
                <Skeleton variant="text" className="h-4 w-24 mb-1" />
                <Skeleton variant="text" className="h-3 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main content skeleton for conversation detail.
 */
function ConversationContentSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8 animate-pulse">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        {/* Back link */}
        <Skeleton variant="text" className="h-4 w-24 mb-4 lg:mb-6" />

        {/* Title */}
        <Skeleton variant="text" className="h-8 lg:h-10 w-3/4 mb-3" />

        {/* Metadata row */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="text" className="h-4 w-16" />
            <Skeleton variant="text" className="h-4 w-4" />
            <Skeleton variant="text" className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" className="h-8 w-28" />
            <Skeleton variant="rounded" className="h-8 w-20" />
            <Skeleton variant="rounded" className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        <Skeleton variant="rounded" className="h-10 w-24" />
        <Skeleton variant="rounded" className="h-10 w-28" />
      </div>

      {/* Summary content */}
      <div className="space-y-6">
        {/* Key Insights section */}
        <div>
          <Skeleton variant="text" className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton variant="circular" width={24} height={24} className="flex-shrink-0 mt-0.5" />
                <SkeletonText lines={2} lastLineWidth="80%" />
              </div>
            ))}
          </div>
        </div>

        {/* Topics section */}
        <div>
          <Skeleton variant="text" className="h-5 w-32 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Full Summary section */}
        <div>
          <Skeleton variant="text" className="h-5 w-28 mb-4" />
          <SkeletonText lines={6} lastLineWidth="70%" gap="gap-3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Export AssetSidebarSkeleton for reuse in other components.
 */
export { AssetSidebarSkeleton };
