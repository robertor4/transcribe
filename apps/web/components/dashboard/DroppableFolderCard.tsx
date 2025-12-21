'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import Link from 'next/link';
import { Folder } from 'lucide-react';
import type { Folder as FolderType } from '@/lib/services/folderService';

interface FolderStats {
  count: number;
  duration: number;
}

interface DroppableFolderCardProps {
  folder: FolderType;
  stats: FolderStats;
  locale: string;
}

export const DroppableFolderCard = memo(function DroppableFolderCard({
  folder,
  stats,
  locale,
}: DroppableFolderCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-all duration-200 ${
        isOver
          ? 'ring-2 ring-[#8D6AFA] bg-purple-50/20 dark:bg-purple-900/10 scale-[1.02]'
          : ''
      }`}
    >
      <Link
        href={`/${locale}/folder/${folder.id}`}
        className="group flex items-center justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Folder
              className={`w-5 h-5 transition-all duration-200 ${
                isOver
                  ? 'text-[#8D6AFA] scale-125'
                  : 'text-gray-500 group-hover:text-[#8D6AFA] group-hover:scale-110'
              }`}
              style={{
                color: isOver ? '#8D6AFA' : folder.color || undefined,
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`font-semibold mb-0.5 transition-colors duration-200 ${
                isOver
                  ? 'text-[#8D6AFA]'
                  : 'text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA]'
              }`}
            >
              {folder.name}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              <span>{stats.count} conversations</span>
            </div>
          </div>
        </div>
        <div
          className={`flex-shrink-0 pr-2 text-sm font-medium transition-all duration-200 ${
            isOver
              ? 'text-[#8D6AFA] translate-x-1'
              : 'text-gray-400 group-hover:text-[#8D6AFA] group-hover:translate-x-1'
          }`}
        >
          →
        </div>
      </Link>

      {/* Drop indicator text */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-[#8D6AFA] text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
            Drop to move here
          </span>
        </div>
      )}
    </div>
  );
});
