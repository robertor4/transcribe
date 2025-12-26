'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Clock, Folder, PanelLeft, Home, MessageSquarePlus, Loader2, X, ChevronRight, Trash2 } from 'lucide-react';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { useSearch } from '@/hooks/useSearch';

interface LeftNavigationProps {
  onToggleSidebar?: () => void;
  onNewConversation?: () => void;
  focusSearch?: boolean;
  onSearchFocused?: () => void;
}

/**
 * Left navigation sidebar for three-pane layout
 * Shows: Logo, Folders, Recent Conversations, User Profile
 * Follows ChatGPT/Claude/Linear navigation patterns
 */
export function LeftNavigation({ onToggleSidebar, onNewConversation, focusSearch, onSearchFocused }: LeftNavigationProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { folders, isLoading: foldersLoading } = useFoldersContext();
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(false);
  const { conversations, recentlyOpened, recentlyOpenedCleared, isLoading: conversationsLoading, clearRecentlyOpened } = useConversationsContext();
  const [isClearing, setIsClearing] = useState(false);

  // Focus search input when focusSearch prop becomes true
  useEffect(() => {
    if (focusSearch && searchInputRef.current) {
      // Small delay to ensure sidebar animation has started
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        onSearchFocused?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [focusSearch, onSearchFocused]);

  // Search state
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    clearSearch,
    isActive: isSearchActive,
  } = useSearch({ debounceMs: 300, minChars: 2 });

  // Use recently opened from context, fallback to first 5 conversations by createdAt
  // Don't show fallback if user explicitly cleared the list
  const recentConversations = useMemo(() => {
    if (recentlyOpened.length > 0) {
      return recentlyOpened;
    }
    // Don't show fallback if user explicitly cleared the list
    if (recentlyOpenedCleared) {
      return [];
    }
    // Fallback for users who haven't opened any conversations yet
    return conversations.slice(0, 5);
  }, [recentlyOpened, recentlyOpenedCleared, conversations]);

  const handleNewConversation = () => {
    if (onNewConversation) {
      onNewConversation();
    } else {
      // Navigate to dashboard with query param to open modal
      router.push(`/${locale}/dashboard?newConversation=true`);
    }
  };

  const handleClearRecentlyOpened = async () => {
    if (isClearing || recentConversations.length === 0) return;
    setIsClearing(true);
    try {
      await clearRecentlyOpened();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Logo Section - Top */}
      <div className="py-5 px-4 pt-6 pl-7">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/${locale}/dashboard`} className="hover:opacity-80 transition-opacity">
            {/* Alt blue logo (cyan accent) for purple sidebar */}
            <Image
              src="/assets/logos/neural-summary-logo-altBlue.svg"
              alt="Neural Summary"
              width={140}
              height={43}
              priority
            />
          </Link>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Close sidebar"
            >
              <PanelLeft className="w-5 h-5 text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="py-3 px-4">
        {/* Enhanced Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') clearSearch();
            }}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-8 py-2.5 text-sm border border-white/20 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40
                     bg-white/10 text-white
                     placeholder:text-white/50
                     transition-all duration-200
                     hover:border-white/30"
          />
          {/* Clear button or loading spinner */}
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
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
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                Results
              </h3>
              <span className="text-xs text-white/50">
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
                    className="group block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm font-medium text-white truncate block">
                      {result.title}
                    </span>
                    {/* Show matched snippet for semantic search results */}
                    {result.matchedSnippets?.[0] && (
                      <span className="text-xs text-white/60 truncate block mt-0.5 italic">
                        &quot;{result.matchedSnippets[0].text.slice(0, 60)}...&quot;
                      </span>
                    )}
                    <span className="text-xs text-white/50">
                      {result.createdAt.toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50 py-2">
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
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Home className="w-4 h-4 text-white/60 flex-shrink-0 group-hover:text-white transition-colors" />
              <span className="text-sm font-normal text-white/80">
                Dashboard
              </span>
            </Link>
            <button
              onClick={handleNewConversation}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors w-full text-left"
            >
              <MessageSquarePlus className="w-4 h-4 text-white/60 flex-shrink-0 group-hover:text-white transition-colors" />
              <span className="text-sm font-normal text-white/80">
                New Conversation
              </span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-black/20" />

        {/* Folders Section */}
        <div className="py-4 px-4">
          <div className={`flex items-center justify-between ${isFoldersExpanded ? 'mb-3' : ''}`}>
            <button
              onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
              className="flex items-center gap-1.5 text-white/50 hover:text-white/70 transition-colors"
              aria-expanded={isFoldersExpanded}
              aria-label={isFoldersExpanded ? 'Collapse folders' : 'Expand folders'}
            >
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isFoldersExpanded ? 'rotate-90' : ''}`}
              />
              <h3 className="text-[11px] font-medium uppercase tracking-wider">
                Folders
              </h3>
              {!isFoldersExpanded && folders.length > 0 && (
                <span className="text-[10px] text-white/40">({folders.length})</span>
              )}
            </button>
          </div>

          {/* Collapsible folder content */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isFoldersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {foldersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-white/50" />
              </div>
            ) : folders.length === 0 ? (
              <p className="text-xs text-white/50 px-3 py-2">No folders yet</p>
            ) : (
              <div className="space-y-1">
                {folders.map((folder) => (
                  <Link
                    key={folder.id}
                    href={`/${locale}/folder/${folder.id}`}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Folder
                        className="w-4 h-4 text-white/60 flex-shrink-0 group-hover:text-white transition-colors"
                        style={{ color: folder.color || undefined }}
                      />
                      <span className="text-sm font-normal text-white/80 truncate">
                        {folder.name}
                      </span>
                    </div>
                    <span className="text-xs text-white/50 flex-shrink-0">
                      {folder.conversationCount ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-black/20" />

        {/* Recent Conversations Section */}
        <div className="py-4 px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                Recently opened
              </h3>
              {recentConversations.length > 0 && (
                <button
                  onClick={handleClearRecentlyOpened}
                  disabled={isClearing}
                  className="p-1 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
                  aria-label="Clear recently opened"
                  title="Clear recently opened"
                >
                  {isClearing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {conversationsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-white/50" />
              </div>
            ) : recentConversations.length === 0 ? (
              <p className="text-xs text-white/50 px-3 py-2">No conversations yet</p>
            ) : (
              <div className="space-y-1">
                {recentConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/${locale}/conversation/${conversation.id}`}
                    className="group block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-white/50 flex-shrink-0" />
                      <span className="text-sm font-normal text-white/80 truncate">
                        {conversation.title}
                      </span>
                      {conversation.status === 'processing' && (
                        <span className="flex-shrink-0 text-xs text-yellow-400">⏳</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Bottom Section - User Profile Menu */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <UserProfileMenu />
      </div>
    </div>
  );
}
