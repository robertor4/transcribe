'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, GripVertical, Trash2, MoreVertical, FolderInput, LucideIcon } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';
import { AssetsCountBadge } from './AssetsCountBadge';
import { DropdownMenu } from '@/components/DropdownMenu';
import { FolderPickerModal } from '@/components/FolderPickerModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Conversation } from '@/lib/types/conversation';

export interface ConversationCardMenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'danger';
}

interface DraggableConversationCardProps {
  conversation: Conversation;
  locale: string;
  onDelete?: (conversationId: string) => Promise<void>;
  onMoveToFolder?: (conversationId: string, folderId: string | null) => void;
  /** Custom menu items to replace the default "Move to folder" action */
  customMenuItems?: ConversationCardMenuItem[];
  /** Whether to show the drag handle (default: true on desktop) */
  showDragHandle?: boolean;
}

export const DraggableConversationCard = memo(function DraggableConversationCard({
  conversation,
  locale,
  onDelete,
  onMoveToFolder,
  customMenuItems,
  showDragHandle = true,
}: DraggableConversationCardProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const isMobile = useIsMobile(1024);

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
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if dragging, modal is open, or clicking on interactive elements
    if (isDragging) return;
    if (showDeleteConfirm) return;
    if ((e.target as HTMLElement).closest('[data-no-navigate]')) return;

    router.push(`/${locale}/conversation/${conversation.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isMobile ? listeners : {})}
      {...(!isMobile ? attributes : {})}
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between py-3 px-4 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer ${
        !isMobile ? 'lg:touch-none' : ''
      } ${isDragging ? 'opacity-50 scale-[0.98] shadow-xl z-50 cursor-grabbing' : ''}`}
    >
      {/* Drag Handle - visual indicator (hidden on mobile) */}
      {showDragHandle && (
        <div
          className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 p-2 opacity-30 group-hover:opacity-60 transition-opacity duration-200"
          aria-hidden="true"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}

      <div className={`flex items-center gap-3 flex-1 min-w-0 ${showDragHandle ? 'ml-0 lg:ml-6' : ''}`}>
        <div className="flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-[#8D6AFA] group-hover:scale-110 transition-all duration-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] transition-colors duration-200 line-clamp-2 sm:truncate">
              {conversation.title}
            </span>
            {/* Badge - desktop only */}
            <div className="hidden sm:block">
              <AssetsCountBadge count={conversation.assetsCount} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{formatRelativeTime(conversation.createdAt)}</span>
            {/* Inline count - mobile only */}
            {conversation.assetsCount > 0 && (
              <span className="sm:hidden">· {conversation.assetsCount} AI Asset{conversation.assetsCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Status Badges - before delete and arrow */}
      {conversation.status === 'processing' && (
        <div className="flex-shrink-0 mr-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            Processing
          </span>
        </div>
      )}
      {conversation.status === 'failed' && (
        <div className="flex-shrink-0 mr-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            Failed
          </span>
        </div>
      )}

      {/* Arrow first */}
      <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#8D6AFA] group-hover:translate-x-1 transition-all duration-200 mr-2">
        →
      </div>

      {/* Action Menu - always visible on mobile, appears on hover on desktop */}
      <div
        className="flex-shrink-0 -mr-2"
        data-no-navigate
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu
          trigger={
            <button
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 transition-all"
              aria-label="Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            // Use custom menu items if provided, otherwise show default "Move to folder"
            ...(customMenuItems || [
              {
                icon: FolderInput,
                label: 'Move to folder',
                onClick: () => setShowFolderPicker(true),
              },
            ]),
            ...(onDelete
              ? [
                  { type: 'divider' as const },
                  {
                    icon: Trash2,
                    label: 'Delete',
                    onClick: () => setShowDeleteConfirm(true),
                    variant: 'danger' as const,
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Folder Picker Modal */}
      <FolderPickerModal
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        conversationId={conversation.id}
        conversationTitle={conversation.title}
        currentFolderId={conversation.folderId}
        onMoveComplete={(newFolderId) => {
          onMoveToFolder?.(conversation.id, newFolderId);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete conversation?"
        message="This action cannot be undone. The conversation and all its AI assets will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
});
