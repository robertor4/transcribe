import type { ReactNode } from 'react';
import { serifFont } from './editorial';

interface EditorialTitleProps {
  /** The main title text */
  title: string;
  /** Optional metadata row rendered below the title (e.g., date, author, icons) */
  metadata?: ReactNode;
  /** Whether to show the editorial rule (horizontal line) after title/metadata. Default true. */
  rule?: boolean;
}

/** Serif h1 title with optional metadata row and editorial rule divider. */
export function EditorialTitle({ title, metadata, rule = true }: EditorialTitleProps) {
  return (
    <>
      <h1
        className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug mb-3"
        style={serifFont}
      >
        {title}
      </h1>
      {metadata && <div className="mb-6">{metadata}</div>}
      {rule && <hr className="border-t-2 border-gray-300 dark:border-gray-600 mb-8" />}
    </>
  );
}
