'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Skeleton for asset list items in sidebars.
 * Used in AssetSidebar, AssetMobileSheet, and folder views.
 */
export function AssetListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
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
  );
}

/**
 * Compact skeleton for smaller asset cards (e.g., in mobile sheets).
 */
export function AssetListSkeletonCompact({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-2 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-lg animate-pulse"
        >
          <div className="flex gap-2 items-center">
            <Skeleton variant="rounded" className="w-7 h-7 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <Skeleton variant="text" className="h-3 w-16 mb-1" />
              <Skeleton variant="text" className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
