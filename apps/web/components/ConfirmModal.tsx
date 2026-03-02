'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmModalVariant;
  isLoading?: boolean;
}

/**
 * Reusable confirmation modal for destructive or important actions.
 * Uses standard shadcn AlertDialog components for a clean, compact look.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const actionVariant = variant === 'info' ? 'default' : 'destructive';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent className="bg-white dark:bg-gray-800 gap-0 p-0 sm:max-w-md rounded-2xl">
        <AlertDialogHeader className="p-6 pb-4">
          <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-3 rounded-b-lg">
          <AlertDialogCancel
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onClose}
            className="text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className={variant !== 'info' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700' : undefined}
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
