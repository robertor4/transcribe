import type { ReactNode } from 'react';

interface BulletListProps {
  items: ReactNode[];
  bulletColor?: string;
  className?: string;
}

/**
 * Shared bullet list component for output templates.
 * Renders items with colored dot bullets in a consistent style.
 */
export function BulletList({
  items,
  bulletColor = 'bg-gray-500',
  className = '',
}: BulletListProps) {
  if (items.length === 0) return null;

  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
          <span className={`mt-1.5 w-1.5 h-1.5 ${bulletColor} rounded-full flex-shrink-0`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
