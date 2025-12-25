import { ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  value: string | ReactNode;
}

/**
 * Standardized key-value pair for detail panels
 * Used in right panel metadata sections
 * Short values display inline, long values stack vertically
 */
export function DetailItem({ label, value }: DetailItemProps) {
  // Check if value is a long string (more than 30 chars)
  const isLongValue = typeof value === 'string' && value.length > 30;

  if (isLongValue) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
        {value}
      </span>
    </div>
  );
}
