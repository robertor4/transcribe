import type { ReactNode } from 'react';

interface EditorialArticleProps {
  children: ReactNode;
  /** Optional sidebar content rendered to the right on desktop (hidden on mobile). */
  sidebar?: ReactNode;
  /** Optional header rendered above the sidebar layout (e.g. EditorialTitle). When sidebar is present, a full-width rule is rendered between header and content. */
  header?: ReactNode;
  className?: string;
}

/** Constrained-width article wrapper for editorial output templates. */
export function EditorialArticle({ children, sidebar, header, className = '' }: EditorialArticleProps) {
  if (!sidebar) {
    return (
      <article className={`max-w-[680px] overflow-x-hidden ${className}`}>
        {header}
        {children}
      </article>
    );
  }

  return (
    <div>
      {header && (
        <div className={`max-w-[680px] overflow-x-hidden ${className}`}>
          {header}
        </div>
      )}
      <hr className="border-t-2 border-gray-300 dark:border-gray-600" />
      <div className="lg:flex pt-8 lg:pt-10">
        <article className={`flex-1 min-w-0 lg:pr-10 max-w-[680px] overflow-x-hidden ${className}`}>
          {children}
        </article>
        <aside className="hidden lg:block w-60 flex-shrink-0 ml-auto bg-gray-100 dark:bg-gray-800/50 -mt-10">
          <div className="sticky top-8 px-6 pt-10 pb-6">
            {sidebar}
          </div>
        </aside>
      </div>
    </div>
  );
}
