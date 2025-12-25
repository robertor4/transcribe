'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, GripVertical, Trash2, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';
import { AssetsCountBadge } from './AssetsCountBadge';
import type { Conversation } from '@/lib/types/conversation';

interface DraggableConversationCardProps {
  conversation: Conversation;
  locale: string;
  onDelete?: (conversationId: string) => Promise<void>;
}

export const DraggableConversationCard = memo(function DraggableConversationCard({
  conversation,
  locale,
  onDelete,
}: DraggableConversationCardProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conversation.id,
    data: {
      type: 'conversation',
      conversation,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(conversation.id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if dragging or clicking on interactive elements
    if (isDragging) return;
    if ((e.target as HTMLElement).closest('[data-no-navigate]')) return;

    router.push(`/${locale}/conversation/${conversation.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between py-3 px-4 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer touch-none ${
        isDragging ? 'opacity-50 scale-[0.98] shadow-xl z-50 cursor-grabbing' : ''
      }`}
    >
      {/* Drag Handle - visual indicator */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 opacity-30 group-hover:opacity-60 transition-opacity duration-200"
        aria-hidden="true"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0 ml-6">
        <div className="flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-[#8D6AFA] group-hover:scale-110 transition-all duration-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] transition-colors duration-200 truncate">
              {conversation.title}
            </span>
            <AssetsCountBadge count={conversation.assetsCount} />
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            <span>{formatRelativeTime(conversation.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Delete Button - appears on hover */}
      {onDelete && (
        <div
          className="flex-shrink-0 mr-2"
          data-no-navigate
          onClick={(e) => e.stopPropagation()}
        >
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <span className="text-xs text-red-700 dark:text-red-300">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-0.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#8D6AFA] group-hover:translate-x-1 transition-all duration-200">
        →
      </div>

      {/* Status Badges */}
      {conversation.status === 'processing' && (
        <div className="ml-4 flex-shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            Processing
          </span>
        </div>
      )}
      {conversation.status === 'failed' && (
        <div className="ml-4 flex-shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            Failed
          </span>
        </div>
      )}
    </div>
  );
});
