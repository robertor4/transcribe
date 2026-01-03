'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, Sparkles } from 'lucide-react';

interface TrialCountdownBannerProps {
  trialEndsAt: Date | string;
}

export function TrialCountdownBanner({ trialEndsAt }: TrialCountdownBannerProps) {
  const t = useTranslations('trial');
  const params = useParams();
  const locale = params.locale as string;

  // Calculate days remaining
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Determine urgency level
  const isUrgent = daysRemaining <= 3;
  const isExpired = daysRemaining === 0;

  if (isExpired) {
    return null;
  }

  return (
    <div
      className={`rounded-lg p-4 ${
        isUrgent
          ? 'bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
          : 'bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              isUrgent
                ? 'bg-orange-100 dark:bg-orange-900/40'
                : 'bg-purple-100 dark:bg-purple-900/40'
            }`}
          >
            {isUrgent ? (
              <Clock
                className={`h-5 w-5 ${
                  isUrgent
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-purple-600 dark:text-purple-400'
                }`}
              />
            ) : (
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div>
            <p
              className={`font-semibold ${
                isUrgent
                  ? 'text-orange-800 dark:text-orange-200'
                  : 'text-purple-800 dark:text-purple-200'
              }`}
            >
              {t('active')}
            </p>
            <p
              className={`text-sm ${
                isUrgent
                  ? 'text-orange-600 dark:text-orange-300'
                  : 'text-purple-600 dark:text-purple-300'
              }`}
            >
              {t('daysRemaining', { days: daysRemaining })}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/pricing`}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isUrgent
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {t('upgradeNow')}
        </Link>
      </div>
    </div>
  );
}
