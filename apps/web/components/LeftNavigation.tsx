'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Search, Plus, Clock, Folder, PanelLeft, Home, MessageSquarePlus, Loader2, X } from 'lucide-react';
import { useFolders } from '@/hooks/useFolders';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/formatters';

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
  const { user } = useAuth();

  const { folders, isLoading: foldersLoading, createFolder } = useFolders();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { conversations, isLoading: conversationsLoading } = useConversations({ pageSize: 5 });

  // Get recent conversations (first 5)
  const recentConversations = conversations.slice(0, 5);

  // Calculate folder counts from conversations
  const getFolderCount = (folderId: string) => {
    return conversations.filter((c) => c.folderId === folderId).length;
  };

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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/${locale}/dashboard`} className="hover:opacity-80 transition-opacity">
            <Image
              src="/assets/NS-symbol.webp"
              alt="Neural Summary"
              width={32}
              height={32}
              priority
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Enhanced Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-[#cc3399]/30 focus:border-[#cc3399]
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                     placeholder:text-gray-500 dark:placeholder:text-gray-400
                     transition-all duration-200
                     hover:border-gray-300 dark:hover:border-gray-500"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation Links */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            <Link
              href={`/${locale}/dashboard`}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#cc3399] transition-colors" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dashboard
              </span>
            </Link>
            <button
              onClick={handleNewConversation}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
            >
              <MessageSquarePlus className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#cc3399] transition-colors" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Conversation
              </span>
            </button>
          </div>
        </div>
        {/* Folders Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Folders
            </h3>
            {!isCreatingFolder && (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="text-gray-400 hover:text-[#cc3399] transition-colors"
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
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[#cc3399] disabled:opacity-50"
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
                      className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#cc3399] transition-colors"
                      style={{ color: folder.color || undefined }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {folder.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {getFolderCount(folder.id)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                    {conversation.status === 'ready' && (
                      <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">✓</span>
                    )}
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

      {/* Bottom Section - User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#cc3399] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {user?.displayName ? getInitials(user.displayName) : user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.email || 'User'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
