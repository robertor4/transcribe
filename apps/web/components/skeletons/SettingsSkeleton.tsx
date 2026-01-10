'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Skeleton for settings pages (profile, subscription, preferences).
 * Shows form-like structure with labels and inputs.
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Settings card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          {/* Profile photo row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Skeleton variant="text" className="h-5 w-24" />
            </div>
            <div className="sm:w-2/3 flex items-center gap-4">
              <Skeleton variant="circular" width={80} height={80} />
              <div className="space-y-2">
                <Skeleton variant="rounded" className="h-8 w-24" />
                <Skeleton variant="text" className="h-3 w-32" />
              </div>
            </div>
          </div>

          {/* Form field rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="sm:w-1/3">
                <Skeleton variant="text" className="h-5 w-20" />
              </div>
              <div className="sm:w-2/3">
                <Skeleton variant="rounded" className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Save button area */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end">
            <Skeleton variant="rounded" className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>

      {/* Secondary card (e.g., password change) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          <Skeleton variant="text" className="h-6 w-36" />
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="sm:w-1/3">
                <Skeleton variant="text" className="h-5 w-28" />
              </div>
              <div className="sm:w-2/3">
                <Skeleton variant="rounded" className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end">
            <Skeleton variant="rounded" className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for subscription page.
 * Shows plan cards and usage stats.
 */
export function SubscriptionSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Current plan card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton variant="text" className="h-6 w-32 mb-2" />
            <Skeleton variant="text" className="h-4 w-48" />
          </div>
          <Skeleton variant="rounded" className="h-8 w-20 rounded-full" />
        </div>

        {/* Usage stats */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <Skeleton variant="text" className="h-4 w-24 mb-2" />
              <Skeleton variant="text" className="h-6 w-16" />
              <Skeleton variant="rounded" className="h-2 w-full mt-2 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Plan options */}
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton variant="text" className="h-5 w-20 mb-2" />
            <Skeleton variant="text" className="h-8 w-24 mb-4" />
            <div className="space-y-2 mb-6">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton variant="circular" width={16} height={16} />
                  <Skeleton variant="text" className="h-4 w-full" />
                </div>
              ))}
            </div>
            <Skeleton variant="rounded" className="h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
