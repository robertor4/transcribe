import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

/**
 * Standardized action button for right panel actions
 * Full-width with icon + label, hover states
 */
export function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
    >
      <Icon className="w-4 h-4 text-gray-500" />
      <span>{label}</span>
    </button>
  );
}
