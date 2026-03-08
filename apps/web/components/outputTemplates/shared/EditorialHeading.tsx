import type { ReactNode } from 'react';
import { serifFont } from './editorial';

interface EditorialHeadingProps {
  children: ReactNode;
  className?: string;
}

/** Serif h2 heading with bottom border, used for major named sections. */
export function EditorialHeading({ children, className = '' }: EditorialHeadingProps) {
  return (
    <h2
      className={`text-xl font-bold text-gray-800 dark:text-gray-200 mb-1 pb-3 border-b border-gray-200 dark:border-gray-700 ${className}`}
      style={serifFont}
    >
      {children}
    </h2>
  );
}
