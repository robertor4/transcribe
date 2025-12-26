'use client';

import { MessageSquareText, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QASidebarEntryProps {
  onClick: () => void;
  scope: 'conversation' | 'folder';
  conversationCount?: number;
}

export function QASidebarEntry({
  onClick,
  scope,
  conversationCount,
}: QASidebarEntryProps) {
  const t = useTranslations('qa');

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full text-left p-3 rounded-xl
        bg-gradient-to-br from-[#8D6AFA]/5 to-[#8D6AFA]/10
        dark:from-[#8D6AFA]/10 dark:to-[#8D6AFA]/20
        border border-[#8D6AFA]/20 dark:border-[#8D6AFA]/30
        hover:from-[#8D6AFA]/10 hover:to-[#8D6AFA]/15
        dark:hover:from-[#8D6AFA]/15 dark:hover:to-[#8D6AFA]/25
        hover:border-[#8D6AFA]/30 dark:hover:border-[#8D6AFA]/40
        transition-all duration-200 group
      "
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8D6AFA] to-[#7A5AE0] flex items-center justify-center flex-shrink-0">
          <MessageSquareText className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('title')}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#8D6AFA] transition-colors" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {scope === 'folder' && conversationCount
              ? t('descriptionFolder', { count: conversationCount })
              : t('description')}
          </p>
        </div>
      </div>
    </button>
  );
}
