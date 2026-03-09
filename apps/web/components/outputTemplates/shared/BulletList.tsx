import type { ReactNode } from 'react';

interface BulletListProps {
  items: ReactNode[];
  bulletColor?: string;
  className?: string;
  /** Bold the text before the first colon in each item */
  boldBeforeColon?: boolean;
  /** "dot" = small colored dot (default), "chevron" = editorial blog-post style circle with > */
  variant?: 'dot' | 'chevron';
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
  boldBeforeColon = false,
  variant = 'dot',
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

        // Apply bold-before-colon formatting if enabled and content is a string
        let rendered: ReactNode = displayContent;
        if (boldBeforeColon && typeof displayContent === 'string') {
          const colonIdx = displayContent.indexOf(':');
          if (colonIdx > 0 && colonIdx < 60) {
            rendered = (
              <>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">{displayContent.slice(0, colonIdx)}</strong>
                {displayContent.slice(colonIdx)}
              </>
            );
          }
        }

        return (
          <li key={idx} className={`flex items-start ${variant === 'chevron' ? 'gap-3' : 'gap-2'} text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7] min-w-0`}>
            {variant === 'chevron' ? (
              <span className={`flex-shrink-0 w-5 h-5 rounded-full ${bulletColor || 'bg-gray-800 dark:bg-gray-200'} text-white dark:text-gray-800 text-[10px] font-bold flex items-center justify-center mt-[3px]`}>&gt;</span>
            ) : (
              <span className={`mt-2 w-1.5 h-1.5 ${bulletColor} rounded-full flex-shrink-0`} />
            )}
            <span className="break-words min-w-0">{rendered}</span>
          </li>
        );
      })}
    </ul>
  );
}
