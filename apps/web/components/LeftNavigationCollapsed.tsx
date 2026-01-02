'use client';

import { useRouter, useParams } from 'next/navigation';
import { Search, MessageSquarePlus, PanelLeft } from 'lucide-react';
import { UserProfileMenu } from '@/components/UserProfileMenu';

interface LeftNavigationCollapsedProps {
  onToggle: () => void;
  onSearch?: () => void;
}

/**
 * Collapsed left navigation showing only icon buttons
 * Displays: Open sidebar button, Search, New Conversation, User Avatar
 */
export function LeftNavigationCollapsed({ onToggle, onSearch }: LeftNavigationCollapsedProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const handleSearch = () => {
    // Use onSearch if provided (expands sidebar and focuses search input)
    // Otherwise just expand the sidebar
    if (onSearch) {
      onSearch();
    } else {
      onToggle();
    }
  };

  const handleNewConversation = () => {
    // Navigate to dashboard with query param to open new conversation modal
    router.push(`/${locale}/dashboard?newConversation=true`);
  };

  return (
    <div className="h-full flex flex-col items-center py-4 gap-2">
      {/* Open Sidebar Button */}
      <button
        onClick={onToggle}
        className="group relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Open sidebar"
      >
        <PanelLeft className="w-5 h-5 text-white/70" />

        {/* Tooltip on hover */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Open sidebar
        </div>
      </button>

      {/* Separator */}
      <div className="w-6 h-px bg-white/20 my-2" />

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="group relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Search"
      >
        <Search className="w-5 h-5 text-white/70" />

        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Search
        </div>
      </button>

      {/* New Conversation Button */}
      <button
        onClick={handleNewConversation}
        className="group relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="New Conversation"
      >
        <MessageSquarePlus className="w-5 h-5 text-white/70" />

        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          New conversation
        </div>
      </button>

      {/* Spacer to push user profile to bottom */}
      <div className="flex-1" />

      {/* User Profile Menu */}
      <div className="px-1 pb-2">
        <UserProfileMenu collapsed />
      </div>
    </div>
  );
}
