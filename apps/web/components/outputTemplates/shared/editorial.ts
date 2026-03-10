/** Shared editorial design system constants for output templates. */

export const serifFont = { fontFamily: 'var(--font-merriweather), Georgia, serif' } as const;

/** Reusable Tailwind class strings for the editorial system. */
export const EDITORIAL = {
  /** Body paragraph: 16px, relaxed line height */
  body: 'text-[16px] text-gray-700 dark:text-gray-300 leading-[1.8]',
  /** List items: 15px, slightly tighter */
  listItem: 'text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]',
  /** Uppercase section label */
  sectionLabel: 'text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500',
  /** Monospace zero-padded numbering */
  numbering: 'text-xs font-mono text-gray-400 dark:text-gray-500 w-6 flex-shrink-0 pt-1',
  /** Horizontal rule after metadata */
  rule: 'border-t-2 border-gray-300 dark:border-gray-600',
  /** Light section border */
  sectionBorder: 'border-t border-gray-200 dark:border-gray-700',
} as const;
