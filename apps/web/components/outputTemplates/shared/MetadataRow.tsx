'use client';

import type { LucideIcon } from 'lucide-react';

interface MetadataItem {
  label: string;
  value: string | number | null | undefined;
  icon?: LucideIcon;
}

interface MetadataRowProps {
  items: MetadataItem[];
  className?: string;
}

/**
 * Shared metadata row component for displaying key-value pairs.
 * Filters out null/undefined values automatically.
 */
export function MetadataRow({ items, className = '' }: MetadataRowProps) {
  const validItems = items.filter((item) => item.value != null && item.value !== '');

  if (validItems.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-4 text-sm ${className}`}>
      {validItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          {item.icon && (
            <item.icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
          <span className="text-gray-500 dark:text-gray-400">{item.label}:</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

interface MetadataGridProps {
  items: MetadataItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Grid layout for metadata items.
 */
export function MetadataGrid({ items, columns = 2, className = '' }: MetadataGridProps) {
  const validItems = items.filter((item) => item.value != null && item.value !== '');

  if (validItems.length === 0) return null;

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3 ${className}`}>
      {validItems.map((item, idx) => (
        <div key={idx} className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {item.label}
          </span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
