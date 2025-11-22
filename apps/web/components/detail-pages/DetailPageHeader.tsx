'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
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
  return (
    <div className={`${maxWidth} mx-auto px-6 py-8`}>
      {/* Breadcrumb Navigation */}
      <Link
        href={`/en/prototype-conversation-v2/${conversationId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {conversationTitle}
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
              <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Right Aligned */}
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
