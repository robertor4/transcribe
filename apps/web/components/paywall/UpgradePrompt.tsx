'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface UpgradePromptProps {
  variant?: 'banner' | 'card' | 'inline';
  message?: string;
  showIcon?: boolean;
}

export function UpgradePrompt({
  variant = 'card',
  message,
  showIcon = true,
}: UpgradePromptProps) {
  const t = useTranslations('paywall.upgradePrompt');

  const defaultMessage = message || t('defaultMessage');

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-[#cc3399] to-purple-600 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {showIcon && <Sparkles className="h-5 w-5 text-white mr-3" />}
            <div>
              <p className="text-white font-semibold">{t('title')}</p>
              <p className="text-white/90 text-sm">{defaultMessage}</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-white text-[#cc3399] rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center whitespace-nowrap"
          >
            {t('cta')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {defaultMessage}
        </span>
        <Link
          href="/pricing"
          className="text-sm text-[#cc3399] hover:underline font-semibold flex items-center"
        >
          {t('cta')}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-dashed border-[#cc3399]/30 mb-6">
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <Sparkles className="h-8 w-8 text-[#cc3399]" />
          </div>
        )}
        <div className={showIcon ? 'ml-4' : ''}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {defaultMessage}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-4 py-2 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors font-semibold"
          >
            {t('cta')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
