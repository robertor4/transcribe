'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  X,
  Home,
  MessageSquarePlus,
  Folder,
  Clock,
  Search,
  Loader2,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useImportedConversations } from '@/contexts/ImportedConversationsContext';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { useSearch } from '@/hooks/useSearch';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

interface MobileAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewConversation?: () => void;
}

/**
 * Mobile navigation drawer for authenticated app pages
 * Slides in from the left on mobile viewports (< 1024px)
 * Contains: Logo, Search, Navigation, Folders, Recent conversations, User profile
 */
export function MobileAppDrawer({ isOpen, onClose, onNewConversation }: MobileAppDrawerProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { folders, isLoading: foldersLoading } = useFoldersContext();
  const { count: importedCount } = useImportedConversations();
  const { conversations, recentlyOpened, recentlyOpenedCleared, isLoading: conversationsLoading } = useConversationsContext();

  // Search state
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    clearSearch,
    isActive: isSearchActive,
  } = useSearch({ debounceMs: 300, minChars: 2 });

  // Get recent conversations (same logic as LeftNavigation)
  const recentConversations = (() => {
    if (recentlyOpened.length > 0) {
      return recentlyOpened.slice(0, 5);
    }
    if (recentlyOpenedCleared) {
      return [];
    }
    return conversations.slice(0, 5);
  })();

  const handleNewConversation = () => {
    if (onNewConversation) {
      onNewConversation();
    } else {
      router.push(`/${locale}/dashboard?newConversation=true`);
    }
    onClose();
  };

  const handleSearchResultClick = (conversationId: string) => {
    clearSearch();
    onClose();
    router.push(`/${locale}/conversation/${conversationId}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[280px] max-w-[85vw] bg-[#3F38A0] dark:bg-[#1a1540] shadow-2xl p-0 gap-0 border-none flex flex-col"
      >
        {/* Accessible title (visually hidden) */}
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        {/* Header with logo and close button */}
        <div
          className="flex items-center justify-between px-4 pb-4"
          style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))' }}
        >
          <Link href={`/${locale}/dashboard`} onClick={onClose} className="hover:opacity-80 transition-opacity">
            <Image
              src="/assets/logos/neural-summary-logo-altBlue.svg"
              alt="Neural Summary"
              width={130}
              height={40}
              priority
            />
          </Link>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') clearSearch();
              }}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-8 py-2.5 text-base border border-white/20 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40
                       bg-white/10 text-white
                       placeholder:text-white/50
                       transition-all duration-200"
            />
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

          {/* Search Results */}
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
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {searchResults.results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchResultClick(result.id)}
                      className="w-full text-left group block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <span className="text-sm font-medium text-white truncate block">
                        {result.title}
                      </span>
                      <span className="text-xs text-white/50">
                        {result.createdAt.toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50 py-2">
                  No conversations found
                </p>
              )}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Navigation Links */}
          <div className="px-4 py-3">
            <div className="space-y-1">
              <Link
                href={`/${locale}/dashboard`}
                onClick={onClose}
                className="group flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Home className="w-5 h-5 text-white/60 flex-shrink-0 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/80">
                  Dashboard
                </span>
              </Link>
              <button
                onClick={handleNewConversation}
                className="group flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-colors w-full text-left"
              >
                <MessageSquarePlus className="w-5 h-5 text-white/60 flex-shrink-0 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/80">
                  New Conversation
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-white/10" />

          {/* Folders Section - Always expanded on mobile */}
          <div className="px-4 py-4">
            <h3 className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-3 px-3">
              Folders ({folders.length + (importedCount > 0 ? 1 : 0)})
            </h3>

            {foldersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-white/50" />
              </div>
            ) : folders.length === 0 && importedCount === 0 ? (
              <p className="text-xs text-white/50 px-3 py-2">No folders yet</p>
            ) : (
              <div className="space-y-1">
                {folders.map((folder) => (
                  <Link
                    key={folder.id}
                    href={`/${locale}/folder/${folder.id}`}
                    onClick={onClose}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
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
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/50">
                        {folder.conversationCount ?? 0}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                    </div>
                  </Link>
                ))}
                {/* Shared with you folder */}
                {importedCount > 0 && (
                  <Link
                    href={`/${locale}/shared-with-me`}
                    onClick={onClose}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Users className="w-4 h-4 text-white/50 flex-shrink-0 group-hover:text-white/70 transition-colors" />
                      <span className="text-sm font-normal text-white/70 group-hover:text-white/90 truncate">
                        Shared with you
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/50">
                        {importedCount}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-white/10" />

          {/* Recent Conversations */}
          <div className="px-4 py-4">
            <h3 className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-3 px-3">
              Recently opened
            </h3>

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
                    onClick={onClose}
                    className="group block px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                      <span className="text-sm font-normal text-white/80 truncate">
                        {conversation.title}
                      </span>
                      {conversation.status === 'processing' && (
                        <span className="flex-shrink-0 text-xs text-yellow-400">&#x23F3;</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - User Profile Menu */}
        <div className="p-4 border-t border-white/10 mt-auto safe-area-bottom">
          <UserProfileMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
