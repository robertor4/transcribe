import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'brand' | 'ghost' | 'danger';
  actionIcon?: React.ReactNode;
}

/**
 * Reusable empty state component
 * Used across dashboard, folders, and search results
 * Following 2025 design patterns for friendly, helpful empty states
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'brand',
  actionIcon,
}: EmptyStateProps) {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          size="lg"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
