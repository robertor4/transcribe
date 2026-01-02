'use client';

import { Clock } from 'lucide-react';
import type { Citation } from '@transcribe/shared';

interface CitationCardProps {
  citation: Citation;
  showConversationTitle?: boolean;
}

export function CitationCard({
  citation,
  showConversationTitle = false,
}: CitationCardProps) {
  return (
    <div
      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
    >
      {/* Header: Timestamp and Speaker */}
      <div className="flex items-center gap-2 text-sm mb-1.5">
        <Clock className="w-3.5 h-3.5 text-[#8D6AFA]" />
        <span className="font-medium text-[#8D6AFA]">{citation.timestamp}</span>
        <span className="text-gray-400 dark:text-gray-500">•</span>
        <span className="text-gray-700 dark:text-gray-300">{citation.speaker}</span>
      </div>

      {/* Quote */}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        &ldquo;{citation.text}&rdquo;
      </p>

      {/* Conversation title (for folder/global scope) */}
      {showConversationTitle && citation.conversationTitle && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          In: {citation.conversationTitle}
        </div>
      )}
    </div>
  );
}
