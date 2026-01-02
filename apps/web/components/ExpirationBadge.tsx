'use client';

import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';

interface ExpirationBadgeProps {
  expiresAt: Date | string;
  className?: string;
}

/**
 * Displays a countdown badge showing days remaining until expiration.
 * Color-coded by urgency: green (>7 days), yellow (3-7 days), red (<3 days).
 */
export function ExpirationBadge({ expiresAt, className = '' }: ExpirationBadgeProps) {
  const t = useTranslations('sharedWithMe');

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Already expired
  if (diffDays <= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 ${className}`}
      >
        <Clock className="w-3 h-3" />
        {t('expired')}
      </span>
    );
  }

  // Determine color based on days remaining
  let colorClasses: string;
  if (diffDays <= 3) {
    colorClasses = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  } else if (diffDays <= 7) {
    colorClasses = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  } else {
    colorClasses = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  }

  // Format the text
  const text = diffDays === 1
    ? t('expiresToday')
    : t('expiresIn', { days: diffDays });

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${colorClasses} ${className}`}
    >
      <Clock className="w-3 h-3" />
      {text}
    </span>
  );
}
