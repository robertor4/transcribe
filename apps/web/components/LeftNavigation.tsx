'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Search, Plus, Clock, Folder, PanelLeft, Home, MessageSquarePlus, Loader2, X } from 'lucide-react';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { useSearch } from '@/hooks/useSearch';

interface LeftNavigationProps {
  onToggleSidebar?: () => void;
  onNewConversation?: () => void;
}

/**
 * Left navigation sidebar for three-pane layout
 * Shows: Logo, Folders, Recent Conversations, User Profile
 * Follows ChatGPT/Claude/Linear navigation patterns
 */
export function LeftNavigation({ onToggleSidebar, onNewConversation }: LeftNavigationProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { folders, isLoading: foldersLoading, createFolder } = useFoldersContext();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { conversations, isLoading: conversationsLoading } = useConversationsContext();

  // Search state
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    clearSearch,
    isActive: isSearchActive,
  } = useSearch({ debounceMs: 300, minChars: 2 });

  // Memoize recent conversations to prevent recalculation on every render
  const recentConversations = useMemo(() => conversations.slice(0, 5), [conversations]);

  const handleNewConversation = () => {
    if (onNewConversation) {
      onNewConversation();
    } else {
      // Navigate to dashboard with query param to open modal
      router.push(`/${locale}/dashboard?newConversation=true`);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName.trim());
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
    <div className="h-full flex flex-col bg-transparent">
      {/* Logo Section - Top */}
      <div className="py-5 px-4 pt-6 pl-7">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/${locale}/dashboard`} className="hover:opacity-80 transition-opacity">
            {/* Light mode logo */}
            <Image
              src="/assets/logos/neural-summary-logo.svg"
              alt="Neural Summary"
              width={140}
              height={43}
              priority
              className="dark:hidden"
            />
            {/* Dark mode logo */}
            <Image
              src="/assets/logos/neural-summary-logo-white.svg"
              alt="Neural Summary"
              width={140}
              height={43}
              priority
              className="hidden dark:block"
            />
          </Link>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="Close sidebar"
            >
              <PanelLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="py-3 px-4">
        {/* Enhanced Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') clearSearch();
            }}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-8 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-500 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/30 focus:border-[#8D6AFA]
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     placeholder:text-gray-500 dark:placeholder:text-gray-400
                     transition-all duration-200
                     hover:border-gray-300 dark:hover:border-gray-400
                     dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          />
          {/* Clear button or loading spinner */}
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Search Results - shown directly under search box */}
        {isSearchActive && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Results
              </h3>
              <span className="text-xs text-gray-400">
                {searchResults?.total ?? 0} found
              </span>
            </div>

            {searchResults && searchResults.results.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/${locale}/conversation/${result.id}`}
                    onClick={clearSearch}
                    className="group block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate block">
                      {result.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {result.createdAt.toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                No conversations found for &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation Links */}
        <div className="py-4 px-4">
          <div className="space-y-1">
            <Link
              href={`/${locale}/dashboard`}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#8D6AFA] transition-colors" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dashboard
              </span>
            </Link>
            <button
              onClick={handleNewConversation}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
            >
              <MessageSquarePlus className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#8D6AFA] transition-colors" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Conversation
              </span>
            </button>
          </div>
        </div>
        {/* Folders Section */}
        <div className="py-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Folders
            </h3>
            {!isCreatingFolder && (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="text-gray-400 hover:text-[#8D6AFA] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Folder Creation Input */}
          {isCreatingFolder && (
            <div className="flex items-center gap-1 mb-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                className="flex-1 min-w-0 px-1 py-0.5 text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[#8D6AFA] disabled:opacity-50"
                aria-label="Create"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelFolderCreation}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {foldersLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : folders.length === 0 && !isCreatingFolder ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">No folders yet</p>
          ) : (
            <div className="space-y-1">
              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/${locale}/folder/${folder.id}`}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Folder
                      className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#8D6AFA] transition-colors"
                      style={{ color: folder.color || undefined }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {folder.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {folder.conversationCount ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations Section */}
        <div className="py-4 px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Recent
              </h3>
            </div>

            {conversationsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : recentConversations.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">No conversations yet</p>
            ) : (
              <div className="space-y-1">
                {recentConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/${locale}/conversation/${conversation.id}`}
                    className="group block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {conversation.title}
                      </span>
                      {conversation.status === 'processing' && (
                        <span className="flex-shrink-0 text-xs text-yellow-600 dark:text-yellow-400">⏳</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Bottom Section - User Profile Menu */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <UserProfileMenu />
      </div>
    </div>
  );
}
