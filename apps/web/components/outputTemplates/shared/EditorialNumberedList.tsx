import type { ReactNode } from 'react';
import { EDITORIAL } from './editorial';

interface EditorialNumberedListItem {
  /** Primary content (bold title + body text) */
  primary: ReactNode;
  /** Optional secondary line (e.g., impact, description) */
  secondary?: ReactNode;
  /** Optional inline badge (e.g., StatusBadge for priority) */
  badge?: ReactNode;
}

interface EditorialNumberedListProps {
  items: EditorialNumberedListItem[];
  className?: string;
}

/** Zero-padded monospace numbered list in editorial style. */
export function EditorialNumberedList({ items, className = '' }: EditorialNumberedListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`divide-y divide-gray-100 dark:divide-gray-800 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-3 py-4">
          <span className={EDITORIAL.numbering}>
            {String(idx + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <p className={EDITORIAL.listItem}>
              {item.primary}
              {item.badge && <span className="ml-2 align-middle">{item.badge}</span>}
            </p>
            {item.secondary && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                {item.secondary}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
