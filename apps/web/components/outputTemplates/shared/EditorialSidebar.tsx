import type { ReactNode } from 'react';

interface EditorialSidebarProps {
  title: string;
  children: ReactNode;
}

/** Styled sidebar content block with uppercase title. Stack multiple for sections. */
export function EditorialSidebar({ title, children }: EditorialSidebarProps) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">
        {title}
      </h3>
      {children}
    </div>
  );
}
