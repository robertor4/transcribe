'use client';

import { useTranslations } from 'next-intl';

interface BillingToggleProps {
  billingCycle: 'monthly' | 'annual';
  onToggle: (cycle: 'monthly' | 'annual') => void;
}

export function BillingToggle({ billingCycle, onToggle }: BillingToggleProps) {
  const t = useTranslations('pricing.hero');

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <button
        onClick={() => onToggle('monthly')}
        className={`
          px-6 py-2 rounded-lg font-medium transition-all duration-200
          ${
            billingCycle === 'monthly'
              ? 'bg-[#cc3399] text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
        `}
        aria-label="Select monthly billing"
      >
        {t('monthly')}
      </button>

      <button
        onClick={() => onToggle('annual')}
        className={`
          relative px-6 py-2 rounded-lg font-medium transition-all duration-200
          ${
            billingCycle === 'annual'
              ? 'bg-[#cc3399] text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
        `}
        aria-label="Select annual billing and save 25%"
      >
        {t('annual')}
        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
          {t('save25')}
        </span>
      </button>
    </div>
  );
}
