'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { NavigationSidebarSkeleton } from './NavigationSkeleton';
import { TableSkeleton } from './TableSkeleton';

/**
 * Full-page skeleton for dashboard loading state.
 * Mirrors the actual dashboard layout: greeting, quick create buttons, conversations table.
 */
export function DashboardSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<NavigationSidebarSkeleton />}
        showRightPanel={false}
        mainContent={<DashboardContentSkeleton />}
      />
    </div>
  );
}

/**
 * Skeleton for dashboard main content area.
 * Greeting → quick create buttons → conversations data table.
 */
export function DashboardContentSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-12 pt-8 sm:pt-4 lg:pt-[38px] pb-12">
      {/* Greeting */}
      <div className="mb-4">
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Quick Create Buttons — Mobile */}
      <section className="mb-8 sm:mb-10">
        <div className="sm:hidden space-y-2">
          <div className="p-4 bg-white dark:bg-gray-800/40 border-2 border-gray-200 dark:border-gray-700/50 rounded-2xl">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-28 mb-1.5" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Quick Create Buttons — Desktop */}
        <div className="hidden sm:flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-36 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Conversations header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Conversations data table */}
      <TableSkeleton rows={7} />
    </div>
  );
}

/**
 * Inline skeleton for dashboard content only (conversations table).
 * Used when the page shell is already rendered but data is still loading.
 */
export function DashboardInlineSkeleton() {
  return (
    <div>
      {/* Conversations header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Conversations data table */}
      <TableSkeleton rows={5} />
    </div>
  );
}
