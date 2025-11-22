'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Folder, Clock, Briefcase, Target, Heart, PanelLeft, Home, MessageSquarePlus } from 'lucide-react';
import { mockFolders, mockConversations, getRecentConversations } from '@/lib/mockData';
import { Button } from '@/components/Button';

interface LeftNavigationProps {
  onToggleSidebar?: () => void;
}

/**
 * Left navigation sidebar for three-pane layout
 * Shows: Logo, Folders, Recent Conversations, User Profile
 * Follows ChatGPT/Claude/Linear navigation patterns
 */
export function LeftNavigation({ onToggleSidebar }: LeftNavigationProps) {
  const recentConversations = getRecentConversations(5);

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Logo Section - Top */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <Link href="/prototype-dashboard-v2" className="hover:opacity-80 transition-opacity">
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
              href="/prototype-dashboard-v2"
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#cc3399] transition-colors" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dashboard
              </span>
            </Link>
            <button
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
            <button className="text-gray-400 hover:text-[#cc3399] transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {mockFolders.map((folder) => {
              const FolderIcon = folder.color === 'purple' ? Briefcase : folder.color === 'blue' ? Target : Heart;
              return (
                <Link
                  key={folder.id}
                  href={`/prototype-folder-v2/${folder.id}`}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FolderIcon className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-[#cc3399] transition-colors" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {folder.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {folder.conversationCount}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Conversations Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent
            </h3>
          </div>

          <div className="space-y-1">
            {recentConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/prototype-conversation-v2/${conversation.id}`}
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
        </div>
      </div>

      {/* Bottom Section - User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#cc3399] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            R
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              roberto@dreamone.nl
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
