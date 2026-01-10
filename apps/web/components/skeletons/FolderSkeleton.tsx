'use client';

import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';

/**
 * Full-page skeleton for folder view.
 * Uses actual LeftNavigation for smoother transition, skeleton for main content.
 */
export function FolderSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={true}
        rightPanel={<FolderAssetsSkeleton />}
        mainContent={<FolderContentSkeleton />}
      />
    </div>
  );
}

/**
 * Skeleton for the right panel (AI Assets sidebar).
 */
function FolderAssetsSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="w-8 h-8 rounded-lg" />
          <div>
            <Skeleton variant="text" className="h-4 w-20 mb-1" />
            <Skeleton variant="text" className="h-3 w-12" />
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

      {/* Stats section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="p-3 flex items-center justify-between">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="rounded" className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for folder main content.
 */
function FolderContentSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-12 pt-8 sm:pt-6 lg:pt-8 pb-6 lg:pb-8 animate-pulse">
      {/* Back button */}
      <Skeleton variant="text" className="h-4 w-32 mb-4 lg:mb-6" />

      {/* Folder header */}
      <div className="mb-6 sm:mb-8 lg:mb-12">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3">
          <Skeleton variant="rounded" className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex-shrink-0" />
          <div className="flex-1">
            <Skeleton variant="text" className="h-8 sm:h-10 w-48" />
          </div>
          <Skeleton variant="rounded" className="hidden sm:block h-10 w-24" />
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Skeleton variant="text" className="h-4 w-28" />
        <Skeleton variant="text" className="h-3 w-16" />
      </div>

      {/* Conversation list */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} iconSize={40} lines={3} />
        ))}
      </div>
    </div>
  );
}

/**
 * Export for reuse.
 */
export { FolderAssetsSkeleton, FolderContentSkeleton };
