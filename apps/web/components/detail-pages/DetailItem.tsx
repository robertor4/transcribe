import { ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  value: string | ReactNode;
}

/**
 * Standardized key-value pair for detail panels
 * Used in right panel metadata sections
 */
export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}
