'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search, MessageSquarePlus, PanelLeft } from 'lucide-react';

interface LeftNavigationCollapsedProps {
  onToggle: () => void;
}

/**
 * Collapsed left navigation showing only icon buttons
 * Displays: Open sidebar button, Search, New Conversation, User Avatar
 */
export function LeftNavigationCollapsed({ onToggle }: LeftNavigationCollapsedProps) {
  return (
    <div className="h-full flex flex-col items-center py-4 gap-2">
      {/* Open Sidebar Button */}
      <button
        onClick={onToggle}
        className="group relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Open sidebar"
      >
        <PanelLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />

        {/* Tooltip on hover */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Open sidebar
        </div>
      </button>

      {/* Separator */}
      <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 my-2" />

      {/* Search Button */}
      <button
        className="group relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Search"
      >
        <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />

        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Search
        </div>
      </button>

      {/* New Conversation Button */}
      <button
        className="group relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="New Conversation"
      >
        <MessageSquarePlus className="w-5 h-5 text-gray-600 dark:text-gray-400" />

        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          New conversation
        </div>
      </button>

      {/* Spacer to push user avatar to bottom */}
      <div className="flex-1" />

      {/* User Profile Avatar */}
      <Link
        href="/prototype-dashboard-v2"
        className="group relative p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="User profile"
      >
        <div className="w-8 h-8 rounded-full bg-[#cc3399] flex items-center justify-center text-white text-sm font-medium">
          R
        </div>

        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          roberto@dreamone.nl
        </div>
      </Link>
    </div>
  );
}
