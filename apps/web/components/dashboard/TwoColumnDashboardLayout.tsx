'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, MessageSquare, Plus, X, FolderPlus, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01, Mic, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { DraggableConversationCard } from './DraggableConversationCard';
import { DroppableFolderCard } from './DroppableFolderCard';
import { useImportedConversations } from '@/contexts/ImportedConversationsContext';
import type { Conversation } from '@/lib/types/conversation';
import type { Folder } from '@/lib/services/folderService';

interface TwoColumnDashboardLayoutProps {
  folders: Folder[];
  ungroupedConversations: Conversation[];
  locale: string;
  onCreateFolder: (name: string) => Promise<void>;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
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
const FOLDER_SORT_STORAGE_KEY = 'neural-summary-folder-sort-mode';

export function TwoColumnDashboardLayout({
  folders,
  ungroupedConversations,
  locale,
  onCreateFolder,
  onNewConversation,
  onDeleteConversation,
}: TwoColumnDashboardLayoutProps) {
  const { count: importedCount } = useImportedConversations();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [sortMode, setSortMode] = useState<FolderSortMode>('name-asc');
  const [isHydrated, setIsHydrated] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Load sort mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FOLDER_SORT_STORAGE_KEY);
    if (stored && stored in SORT_MODE_CONFIG) {
      setSortMode(stored as FolderSortMode);
    }
    setIsHydrated(true);
  }, []);

  // Save sort mode to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(FOLDER_SORT_STORAGE_KEY, sortMode);
    }
  }, [sortMode, isHydrated]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column: Conversations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#8D6AFA] uppercase tracking-wider">
              Conversations
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {hasMore
                  ? `${displayCount} of ${ungroupedConversations.length}`
                  : `${ungroupedConversations.length} items`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewConversation}
                icon={<Mic className="h-4 w-4" />}
              >
                New
              </Button>
            </div>
          </div>

          {ungroupedConversations.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Start by recording or uploading your first conversation
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={onNewConversation}
              >
                Start First Conversation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700/50 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40">
              {visibleConversations.map((conversation) => (
                <DraggableConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  locale={locale}
                  onDelete={onDeleteConversation}
                />
              ))}
              {hasMore && (
                <button
                  onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                  className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#8D6AFA] hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  Show More ({remainingCount} remaining)
                </button>
              )}
            </div>
          )}
        </section>

        {/* Right Column: Folders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#8D6AFA] uppercase tracking-wider">
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

          {folders.length === 0 && importedCount === 0 && !isCreatingFolder ? (
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
                <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800/40">
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
                    className="flex-1 px-2 py-1 text-base sm:text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-[#8D6AFA] disabled:opacity-50 disabled:cursor-not-allowed"
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

              {(sortedFolders.length > 0 || importedCount > 0) && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700/50 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40">
                  {sortedFolders.map((folder) => (
                    <DroppableFolderCard
                      key={folder.id}
                      folder={folder}
                      locale={locale}
                    />
                  ))}
                  {/* Shared with you - System folder, rendered like a regular folder */}
                  {importedCount > 0 && (
                    <Link
                      href={`/${locale}/shared-with-me`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Shared with you
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {importedCount}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Drag hint - hidden on mobile since we use action menu instead */}
          {folders.length > 0 && ungroupedConversations.length > 0 && (
            <p className="hidden lg:block text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              Drag conversations here to organize them
            </p>
          )}
        </section>
    </div>
  );
}
