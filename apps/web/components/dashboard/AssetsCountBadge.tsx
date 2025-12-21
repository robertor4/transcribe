'use client';

import { Sparkles } from 'lucide-react';

interface AssetsCountBadgeProps {
  count: number;
}

export function AssetsCountBadge({ count }: AssetsCountBadgeProps) {
  // Only show badge if count is a positive number
  if (!count || count <= 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium">
      <Sparkles className="w-3 h-3" />
      <span>{count}</span>
    </div>
  );
}
