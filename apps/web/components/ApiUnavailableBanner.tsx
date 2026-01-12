'use client';

import { useState } from 'react';
import { useApiHealth } from '@/contexts/ApiHealthContext';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AlertTriangle, X, RefreshCw, Mail } from 'lucide-react';
import Link from 'next/link';

export function ApiUnavailableBanner() {
  const { isApiHealthy, isChecking, retryHealthCheck } = useApiHealth();
  const [dismissed, setDismissed] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('apiHealth');

  // Don't show if healthy or dismissed
  if (isApiHealthy || dismissed) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('title')}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {t('message')}{' '}
                <Link
                  href={`/${locale}/contact`}
                  className="underline hover:text-amber-700 dark:hover:text-amber-300 inline-flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  {t('contactSupport')}
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={retryHealthCheck}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`}
              />
              {isChecking ? t('checking') : t('retry')}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800 transition-colors"
              aria-label={t('dismiss')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
