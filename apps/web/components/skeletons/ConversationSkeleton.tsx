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

/** Nav skeleton uses white/opacity blocks to blend with the purple sidebar background */
function NavigationSkeleton() {
  const bar = (cls: string) => <div className={`rounded-lg bg-white/10 animate-pulse ${cls}`} />;
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-6">{bar('h-8 w-32')}</div>
      {bar('h-10 w-full mb-6')}
      <div className="mb-6">
        {bar('h-3 w-16 mb-3')}
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i}>{bar('h-9 w-full')}</div>)}</div>
      </div>
      <div className="flex-1">
        {bar('h-3 w-20 mb-3')}
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i}>{bar('h-9 w-full')}</div>)}</div>
      </div>
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {bar('w-9 h-9 rounded-full')}
          <div className="flex-1">
            {bar('h-4 w-24 mb-1')}
            {bar('h-3 w-16')}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetSidebarSkeleton() {
  return (
    <div className="h-full flex flex-col border-l border-gray-200 dark:border-gray-800">
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
            className="p-3 border border-gray-200 dark:border-gray-700/50 rounded-lg"
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      {/* Header */}
      <div className="max-w-[680px] mb-6 lg:mb-8">
        {/* Back link */}
        <Skeleton className="h-4 w-24 mb-4 lg:mb-6" />

        {/* Title */}
        <Skeleton className="h-8 lg:h-10 w-3/4 mb-3" />

        {/* Metadata row */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>

      {/* Thick editorial rule */}
      <Skeleton className="h-0.5 w-full mb-8 lg:mb-10" />

      {/* Two-column: main content + key points sidebar */}
      <div className="lg:flex">
        <div className="flex-1 min-w-0 lg:pr-10">
          {/* Intro paragraph */}
          <div className="space-y-2 mb-10">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>

          {/* Deep Dives header */}
          <Skeleton className="h-3 w-20 mb-5" />

          {/* Deep dive items */}
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800 border-y border-gray-100 dark:border-gray-800">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-4">
                <Skeleton className="h-3 w-5" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-3" />
              </div>
            ))}
          </div>
        </div>

        {/* Key points sidebar skeleton */}
        <div className="hidden lg:block w-60 flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/30 rounded-sm">
          <div className="px-6 py-6">
            <Skeleton className="h-3 w-20 mb-5" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="pb-4 border-b border-gray-200/60 dark:border-gray-700/40 last:border-0 last:pb-0">
                  <Skeleton className="h-3.5 w-28 mb-1.5" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AssetSidebarSkeleton };
