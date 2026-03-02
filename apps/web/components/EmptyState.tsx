import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'brand' | 'ghost' | 'danger';
  actionIcon?: React.ReactNode;
  /** Wrap in a dashed border container */
  bordered?: boolean;
}

/**
 * Reusable empty state component (convenience wrapper around shadcn Empty)
 * Used across dashboard, folders, and search results
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'brand',
  actionIcon,
  bordered = false,
}: EmptyStateProps) {
  const content = (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle className="text-2xl font-bold uppercase tracking-wide">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && onAction && (
        <EmptyContent>
          <Button
            variant={actionVariant}
            size="lg"
            onClick={onAction}
            icon={actionIcon}
          >
            {actionLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );

  if (bordered) {
    return (
      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
        {content}
      </div>
    );
  }

  return content;
}
