import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface TemplateHeaderProps {
  icon: LucideIcon;
  label: string;
  iconColor?: string;
  metadata?: ReactNode;
}

/**
 * Shared header component for output templates.
 * Provides consistent styling for icon + label + optional metadata.
 */
export function TemplateHeader({
  icon: Icon,
  label,
  iconColor = 'text-[#8D6AFA]',
  metadata,
}: TemplateHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      {metadata && (
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          {metadata}
        </div>
      )}
    </div>
  );
}
