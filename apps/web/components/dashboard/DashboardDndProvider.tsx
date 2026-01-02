'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { MessageSquare, GripVertical } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';
import { AssetsCountBadge } from './AssetsCountBadge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Conversation } from '@/lib/types/conversation';

interface DashboardDndProviderProps {
  children: React.ReactNode;
  onMoveToFolder: (conversationId: string, folderId: string, previousFolderId?: string | null) => Promise<void>;
}

export function DashboardDndProvider({
  children,
  onMoveToFolder,
}: DashboardDndProviderProps) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const isMobile = useIsMobile(1024); // lg breakpoint

  // Configure mouse sensor with activation constraint
  // On mobile, we disable drag-and-drop entirely (users use "Move to folder" menu instead)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: isMobile ? 99999 : 10, // Effectively disable on mobile
    },
  });

  // Only use mouse sensor - touch interactions on mobile use the action menu instead
  const sensors = useSensors(mouseSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'conversation') {
      setActiveConversation(active.data.current.conversation);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveConversation(null);

      if (!over) return;

      // Check if dropped on a folder
      if (over.data.current?.type === 'folder') {
        const conversationId = active.id as string;
        const folderId = over.id as string;

        // Don't move if already in this folder
        const conversation = active.data.current?.conversation as Conversation;
        if (conversation?.folderId === folderId) return;

        setIsMoving(true);
        try {
          await onMoveToFolder(conversationId, folderId, conversation?.folderId || null);
        } catch (error) {
          console.error('Failed to move conversation to folder:', error);
        } finally {
          setIsMoving(false);
        }
      }
    },
    [onMoveToFolder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveConversation(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      {/* Drag Overlay - follows cursor during drag */}
      <DragOverlay dropAnimation={null}>
        {activeConversation && (
          <div className="relative flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-[#8D6AFA] w-[650px] cursor-grabbing">
            {/* Drag Handle - visual indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 p-2 opacity-60">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-0 ml-6">
              <div className="flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-[#8D6AFA]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {activeConversation.title}
                  </span>
                  <AssetsCountBadge count={activeConversation.assetsCount} />
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  <span>{formatRelativeTime(activeConversation.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 text-sm font-medium text-gray-400">
              →
            </div>
          </div>
        )}
      </DragOverlay>

      {/* Loading overlay during move operation */}
      {isMoving && (
        <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-xl">
            <span className="text-sm text-gray-600 dark:text-gray-400">Moving...</span>
          </div>
        </div>
      )}
    </DndContext>
  );
}
