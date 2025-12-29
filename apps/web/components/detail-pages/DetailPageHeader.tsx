'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface DetailPageHeaderProps {
  conversationId: string;
  conversationTitle: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions: ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-6xl';
}

/**
 * Standardized page header for detail pages
 * Includes breadcrumb navigation, icon, title, subtitle, and action buttons
 */
export function DetailPageHeader({
  conversationId,
  conversationTitle,
  icon: Icon,
  title,
  subtitle,
  actions,
  maxWidth = 'max-w-4xl'
}: DetailPageHeaderProps) {
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-hidden`}>
      {/* Breadcrumb Navigation */}
      <Link
        href={`/${locale}/conversation/${conversationId}`}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors mb-6 max-w-full"
      >
        <ArrowLeft className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">Back to {conversationTitle}</span>
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
          {/* Title Section */}
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide break-words">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Right Aligned */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
