'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface DetailPageHeaderProps {
  conversationId: string;
  conversationTitle: string;
  templateName: string;
  templateIcon: LucideIcon;
  generatedAt: Date;
  actions: ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl';
}

/**
 * Compact page header for AI Asset detail pages.
 * Renders a back link + metadata row (type badge, date, action icons)
 * matching the Conversation page header style.
 */
export function DetailPageHeader({
  conversationId,
  conversationTitle,
  templateIcon: Icon,
  templateName,
  generatedAt,
  actions,
  maxWidth = 'max-w-4xl'
}: DetailPageHeaderProps) {
  const params = useParams();
  const locale = params?.locale || 'en';

  const formattedDate = generatedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-hidden`}>
      {/* Breadcrumb Navigation */}
      <Link
        href={`/${locale}/conversation/${conversationId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">Back to {conversationTitle}</span>
      </Link>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
        {/* Asset Type Badge */}
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-semibold px-3 py-1 rounded-full">
          <Icon className="w-3.5 h-3.5" />
          {templateName}
        </span>

        <span className="text-gray-300 dark:text-gray-600">|</span>

        {/* Date */}
        <span>{formattedDate}</span>

        <span className="text-gray-300 dark:text-gray-600">|</span>

        {/* Action Icons */}
        {actions}
      </div>
    </div>
  );
}
