'use client';

import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';

/**
 * Full-page skeleton for dashboard loading state.
 * Mirrors the actual dashboard layout: greeting, quick create buttons, content sections.
 */
export function DashboardSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<NavigationSkeleton />}
        showRightPanel={false}
        mainContent={<DashboardContentSkeleton />}
      />
    </div>
  );
}

/**
 * Skeleton for left navigation sidebar.
 * Shows folder and conversation list placeholders.
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
 * Skeleton for dashboard main content area.
 * Includes greeting, quick create buttons, and content grid.
 */
export function DashboardContentSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-12 pt-8 sm:pt-4 lg:pt-[38px] pb-12 animate-pulse">
      {/* Greeting skeleton */}
      <div className="mb-4">
        <Skeleton variant="text" className="h-8 w-64" />
      </div>

      {/* Quick Create Buttons skeleton - Desktop */}
      <section className="mb-8 sm:mb-10">
        {/* Mobile skeleton */}
        <div className="sm:hidden space-y-2">
          <div className="p-4 bg-white dark:bg-gray-800/40 border-2 border-gray-200 dark:border-gray-700/50 rounded-2xl">
            <div className="flex items-center gap-4">
              <Skeleton variant="rounded" className="w-14 h-14 rounded-2xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton variant="text" className="h-5 w-28 mb-1" />
                <Skeleton variant="text" className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Skeleton variant="text" className="h-4 w-20" />
            <Skeleton variant="text" className="h-4 w-20" />
          </div>
        </div>

        {/* Desktop skeleton */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 max-w-4xl">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 min-h-[88px] bg-white dark:bg-gray-800/40 border-2 border-gray-200 dark:border-gray-700/50 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <Skeleton variant="rounded" className="w-14 h-14 rounded-2xl flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton variant="text" className="h-5 w-24 mb-2" />
                  <Skeleton variant="text" className="h-4 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two Column Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left column - Folders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="text" className="h-4 w-20" />
            <Skeleton variant="text" className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} iconSize={36} lines={2} />
            ))}
          </div>
        </div>

        {/* Right column - Conversations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="text" className="h-4 w-28" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} iconSize={36} lines={2} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent AI Assets Section Skeleton */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Skeleton variant="rounded" className="w-7 h-7 rounded-lg" />
                <Skeleton variant="text" className="h-4 w-24" />
              </div>
              <Skeleton variant="text" className="h-3 w-32 mb-1.5" />
              <Skeleton variant="text" className="h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Inline skeleton for dashboard content only (folders, conversations, assets).
 * Used when the page shell is already rendered but data is still loading.
 */
export function DashboardInlineSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Two Column Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left column - Folders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="text" className="h-4 w-20" />
            <Skeleton variant="text" className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} iconSize={36} lines={2} />
            ))}
          </div>
        </div>

        {/* Right column - Conversations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="text" className="h-4 w-28" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} iconSize={36} lines={2} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent AI Assets Section Skeleton */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Skeleton variant="rounded" className="w-7 h-7 rounded-lg" />
                <Skeleton variant="text" className="h-4 w-24" />
              </div>
              <Skeleton variant="text" className="h-3 w-32 mb-1.5" />
              <Skeleton variant="text" className="h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
