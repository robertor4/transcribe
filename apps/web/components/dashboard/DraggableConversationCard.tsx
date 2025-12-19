'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { MessageSquare, GripVertical } from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/formatters';
import type { Conversation } from '@/lib/types/conversation';

interface DraggableConversationCardProps {
  conversation: Conversation;
  locale: string;
}

export function DraggableConversationCard({
  conversation,
  locale,
}: DraggableConversationCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-[0.98] shadow-xl z-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200 touch-none"
        aria-label="Drag to move to folder"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <Link
        href={`/${locale}/conversation/${conversation.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 ml-6"
        onClick={(e) => {
          // Prevent navigation while dragging
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-[#cc3399] group-hover:scale-110 transition-all duration-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399] transition-colors duration-200 truncate">
              {conversation.title}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span>{formatDuration(conversation.source.audioDuration)}</span>
            <span>·</span>
            <span>{formatRelativeTime(conversation.createdAt)}</span>
          </div>
        </div>
      </Link>

      <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
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
}
