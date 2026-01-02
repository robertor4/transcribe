'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { deleteConversation } from '@/lib/services/conversationService';

interface DeleteConversationButtonProps {
  conversationId: string;
  onDeleted?: () => void;
  /** 'icon' for compact display in lists, 'button' for full button with text */
  variant?: 'icon' | 'button';
  /** Additional class names */
  className?: string;
}

export function DeleteConversationButton({
  conversationId,
  onDeleted,
  variant = 'button',
  className = '',
}: DeleteConversationButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConversation(conversationId);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 ${className}`}
      >
        <span className="text-sm text-red-700 dark:text-red-300">Delete?</span>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          No
        </Button>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className={`p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${className}`}
        title="Delete conversation"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="md"
        icon={<Trash2 className="w-4 h-4" />}
        onClick={() => setShowConfirm(true)}
      >
        Delete
      </Button>
    </div>
  );
}
