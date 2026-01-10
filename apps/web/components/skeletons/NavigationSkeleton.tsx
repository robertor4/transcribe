'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Skeleton for navigation list items (folders or conversations).
 * Used in LeftNavigation while data is loading.
 */
interface NavigationSkeletonProps {
  /** Type of items - affects icon shape */
  type?: 'folders' | 'conversations';
  /** Number of skeleton items to show */
  count?: number;
}

export function NavigationListSkeleton({
  type = 'folders',
  count = 3,
}: NavigationSkeletonProps) {
  return (
    <div className="space-y-1 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-2 rounded-lg animate-pulse"
        >
          <Skeleton
            variant={type === 'folders' ? 'rounded' : 'circular'}
            className="w-4 h-4 bg-white/20 flex-shrink-0"
          />
          <Skeleton
            variant="text"
            className="h-4 flex-1 bg-white/20"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
          {type === 'folders' && (
            <Skeleton variant="text" className="h-3 w-4 bg-white/15" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Full navigation sidebar skeleton.
 * Used when the entire sidebar needs to show loading state.
 */
export function NavigationSidebarSkeleton() {
  return (
    <div className="h-full flex flex-col bg-[#23194B] p-4 animate-pulse">
      {/* Logo area */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton variant="rounded" className="h-8 w-8 bg-white/20" />
        <Skeleton variant="text" className="h-5 w-28 bg-white/20" />
      </div>

      {/* Search */}
      <Skeleton variant="rounded" className="h-10 w-full bg-white/10 mb-6" />

      {/* New button */}
      <Skeleton variant="rounded" className="h-10 w-full bg-white/15 mb-6" />

      {/* Folders section */}
      <div className="mb-6">
        <Skeleton variant="text" className="h-3 w-16 bg-white/20 mb-3 ml-3" />
        <NavigationListSkeleton type="folders" count={3} />
      </div>

      {/* Recent section */}
      <div className="flex-1">
        <Skeleton variant="text" className="h-3 w-20 bg-white/20 mb-3 ml-3" />
        <NavigationListSkeleton type="conversations" count={5} />
      </div>

      {/* User profile */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <Skeleton variant="circular" width={36} height={36} className="bg-white/20" />
          <div className="flex-1">
            <Skeleton variant="text" className="h-4 w-24 bg-white/20 mb-1" />
            <Skeleton variant="text" className="h-3 w-16 bg-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
}
