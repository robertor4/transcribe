import type { ReactNode } from 'react';

interface BulletListProps {
  items: ReactNode[];
  bulletColor?: string;
  className?: string;
}

/**
 * Safely converts any value to a displayable string.
 * Handles objects that AI might return instead of strings.
 */
function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Handle common object patterns from AI
    if (obj.name && obj.reason) return `${obj.name}: ${obj.reason}`;
    if (obj.name && obj.role) return `${obj.name} (${obj.role})`;
    if (obj.name && obj.description) return `${obj.name}: ${obj.description}`;
    if (obj.title && obj.description) return `${obj.title}: ${obj.description}`;
    if (obj.item && obj.detail) return `${obj.item}: ${obj.detail}`;
    if (obj.text) return String(obj.text);
    if (obj.content) return String(obj.content);
    if (obj.value) return String(obj.value);
    if (obj.name) return String(obj.name);
    if (obj.title) return String(obj.title);
    if (obj.label) return String(obj.label);
    // Fallback: stringify the object
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Shared bullet list component for output templates.
 * Renders items with colored dot bullets in a consistent style.
 * Automatically handles objects that AI might return instead of strings.
 */
export function BulletList({
  items,
  bulletColor = 'bg-gray-500',
  className = '',
}: BulletListProps) {
  if (!items || items.length === 0) return null;

  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, idx) => {
        // If it's already a valid ReactNode (string, number, or React element), use it
        // Otherwise, convert to display string
        const displayContent =
          typeof item === 'string' || typeof item === 'number' ||
          (typeof item === 'object' && item !== null && '$$typeof' in item)
            ? item
            : toDisplayString(item);

        return (
          <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 min-w-0">
            <span className={`mt-2 w-1.5 h-1.5 ${bulletColor} rounded-full flex-shrink-0`} />
            <span className="break-words min-w-0">{displayContent}</span>
          </li>
        );
      })}
    </ul>
  );
}
