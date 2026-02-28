'use client';

import { Skeleton } from '@/components/ui/skeleton';

const TITLE_WIDTHS = ['w-3/4', 'w-2/3', 'w-4/5', 'w-1/2', 'w-3/5'] as const;

function TableSkeletonRow({ index }: { index: number }) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Checkbox */}
      <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0" />
      {/* Title */}
      <Skeleton className={`h-4 flex-1 ${titleWidth}`} />
      {/* Status — hidden below lg */}
      <Skeleton className="hidden lg:block h-5 w-16 rounded-full" />
      {/* AI Assets — hidden below lg */}
      <Skeleton className="hidden lg:block h-5 w-12 rounded-full" />
      {/* Duration — hidden below lg */}
      <Skeleton className="hidden lg:block h-4 w-14" />
      {/* Shared — hidden below lg */}
      <Skeleton className="hidden lg:block h-5 w-14 rounded-full" />
      {/* Date */}
      <Skeleton className="h-4 w-16 flex-shrink-0" />
      {/* Actions */}
      <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
          <Skeleton className="h-9 w-[140px] rounded-lg flex-shrink-0" />
        </div>
        <Skeleton className="h-9 w-20 rounded-full flex-shrink-0" />
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/50">
          <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0" />
          <Skeleton className="h-3 w-10 flex-1" />
          <Skeleton className="hidden lg:block h-3 w-12" />
          <Skeleton className="hidden lg:block h-3 w-14" />
          <Skeleton className="hidden lg:block h-3 w-14" />
          <Skeleton className="hidden lg:block h-3 w-12" />
          <Skeleton className="h-3 w-10 flex-shrink-0" />
          <div className="w-4 flex-shrink-0" />
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <TableSkeletonRow key={i} index={i} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 px-1">
        <Skeleton className="hidden sm:block h-4 w-32" />
        <div className="flex items-center gap-2 ml-auto">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
