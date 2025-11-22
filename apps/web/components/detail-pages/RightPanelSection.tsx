import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface RightPanelSectionProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  showBorder?: boolean;
}

/**
 * Standardized section wrapper for right panel content
 * Includes icon, title, and optional bottom border
 */
export function RightPanelSection({ icon: Icon, title, children, showBorder = false }: RightPanelSectionProps) {
  return (
    <div className={`mb-6 ${showBorder ? 'pb-6 border-b border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
