import type { ReactNode } from 'react';

interface EditorialPullQuoteProps {
  children: ReactNode;
  /** Attribution or source for the quote */
  cite?: string;
  /** Left border color. Default brand purple. */
  color?: string;
  className?: string;
}

/** Border-left pull quote block with serif italic styling. */
export function EditorialPullQuote({
  children,
  cite,
  color = '#8D6AFA',
  className = '',
}: EditorialPullQuoteProps) {
  return (
    <div
      className={`border-l-4 pl-5 py-2 mb-10 ${className}`}
      style={{ borderColor: color }}
    >
      <div
        className="space-y-3 text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed italic"
        style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
      >
        {children}
      </div>
      {cite && (
        <cite className="block mt-3 text-sm not-italic font-medium text-gray-500 dark:text-gray-400">
          — {cite}
        </cite>
      )}
    </div>
  );
}
