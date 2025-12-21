'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '@/lib/types/conversation';

interface DashboardDndProviderProps {
  children: React.ReactNode;
  onMoveToFolder: (conversationId: string, folderId: string) => Promise<void>;
}

export function DashboardDndProvider({
  children,
  onMoveToFolder,
}: DashboardDndProviderProps) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Configure sensors with activation constraints to prevent accidental drags
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // 10px movement before drag starts
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // 250ms delay before drag starts on touch
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

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
          await onMoveToFolder(conversationId, folderId);
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
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 opacity-90 max-w-xs">
            <MessageSquare className="w-5 h-5 text-[#8D6AFA] flex-shrink-0" />
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {activeConversation.title}
            </span>
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
