'use client';

import { useState, useMemo } from 'react';
import { Folder as FolderIcon, MessageSquare, Mic, Plus, X, FolderPlus, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { DashboardDndProvider } from './DashboardDndProvider';
import { DraggableConversationCard } from './DraggableConversationCard';
import { DroppableFolderCard } from './DroppableFolderCard';
import type { Conversation } from '@/lib/types/conversation';
import type { Folder } from '@/lib/services/folderService';

interface FolderStats {
  count: number;
  duration: number;
}

interface TwoColumnDashboardLayoutProps {
  folders: Folder[];
  conversations: Conversation[];
  ungroupedConversations: Conversation[];
  locale: string;
  getFolderStats: (folderId: string) => FolderStats;
  onMoveToFolder: (conversationId: string, folderId: string) => Promise<void>;
  onCreateFolder: (name: string) => Promise<void>;
  onNewConversation: () => void;
}

// Sort modes cycle: A-Z → Z-A → Newest → Oldest → A-Z...
type FolderSortMode = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

const SORT_MODE_CONFIG: Record<FolderSortMode, { icon: typeof ArrowDownAZ; label: string; next: FolderSortMode }> = {
  'name-asc': { icon: ArrowDownAZ, label: 'A-Z', next: 'name-desc' },
  'name-desc': { icon: ArrowUpAZ, label: 'Z-A', next: 'date-desc' },
  'date-desc': { icon: ArrowDown01, label: 'Newest', next: 'date-asc' },
  'date-asc': { icon: ArrowUp01, label: 'Oldest', next: 'name-asc' },
};

const ITEMS_PER_PAGE = 10;

export function TwoColumnDashboardLayout({
  folders,
  conversations,
  ungroupedConversations,
  locale,
  getFolderStats,
  onMoveToFolder,
  onCreateFolder,
  onNewConversation,
}: TwoColumnDashboardLayoutProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [sortMode, setSortMode] = useState<FolderSortMode>('name-asc');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Pagination for ungrouped conversations
  const visibleConversations = ungroupedConversations.slice(0, displayCount);
  const remainingCount = ungroupedConversations.length - displayCount;
  const hasMore = remainingCount > 0;

  // Sort folders based on current mode
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      switch (sortMode) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        default:
          return 0;
      }
    });
  }, [folders, sortMode]);

  const currentSortConfig = SORT_MODE_CONFIG[sortMode];
  const SortIcon = currentSortConfig.icon;

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleCancelFolderCreation = () => {
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // If no conversations at all, show welcome empty state
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<Mic className="w-10 h-10 text-gray-400" />}
        title="Welcome to Neural Summary"
        description="Start by recording or uploading your first conversation. We'll transcribe and summarize it for you."
        actionLabel="Create Conversation"
        onAction={onNewConversation}
        actionIcon={<Mic className="w-5 h-5" />}
      />
    );
  }

  return (
    <DashboardDndProvider onMoveToFolder={onMoveToFolder}>
      <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-8">
        {/* Left Column: Folders */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Folders
            </h2>
            <div className="flex items-center gap-1">
              {folders.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortMode(currentSortConfig.next)}
                  icon={<SortIcon className="h-4 w-4" />}
                >
                  {currentSortConfig.label}
                </Button>
              )}
              {!isCreatingFolder && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingFolder(true)}
                  icon={<FolderPlus className="h-4 w-4" />}
                >
                  Add
                </Button>
              )}
            </div>
          </div>

          {folders.length === 0 && !isCreatingFolder ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <FolderIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create folders to organize your conversations
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCreatingFolder(true)}
              >
                Create First Folder
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Add New Folder - appears at top when creating */}
              {isCreatingFolder && (
                <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                  <FolderIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') handleCancelFolderCreation();
                    }}
                    placeholder="Folder name..."
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Create folder"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelFolderCreation}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {sortedFolders.length > 0 && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                  {sortedFolders.map((folder) => (
                    <DroppableFolderCard
                      key={folder.id}
                      folder={folder}
                      stats={getFolderStats(folder.id)}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Drag hint */}
          {folders.length > 0 && ungroupedConversations.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              Drag conversations here to organize them
            </p>
          )}
        </section>

        {/* Right Column: Ungrouped Conversations */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {folders.length > 0 ? 'Ungrouped' : 'Conversations'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {hasMore
                ? `${displayCount} of ${ungroupedConversations.length}`
                : `${ungroupedConversations.length} items`}
            </span>
          </div>

          {ungroupedConversations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All conversations are organized in folders
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              {visibleConversations.map((conversation) => (
                <DraggableConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  locale={locale}
                />
              ))}
              {hasMore && (
                <button
                  onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                  className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#cc3399] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  Show More ({remainingCount} remaining)
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardDndProvider>
  );
}
