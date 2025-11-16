'use client';

import { useTranslations } from 'next-intl';

interface BillingToggleProps {
  billingCycle: 'monthly' | 'annual';
  onToggle: (cycle: 'monthly' | 'annual') => void;
}

export function BillingToggle({ billingCycle, onToggle }: BillingToggleProps) {
  const t = useTranslations('pricing.hero');

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Monthly Label */}
      <span className={`text-sm font-light transition-colors ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
        {t('monthly')}
      </span>

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
        className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2"
        role="switch"
        aria-checked={billingCycle === 'annual'}
        aria-label="Toggle between monthly and annual billing"
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-[#cc3399] shadow-md transition-transform ${
            billingCycle === 'annual' ? 'translate-x-9' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Annual Label with Save Badge */}
      <div className="flex items-center gap-2">
        <span className={`text-sm font-light transition-colors ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
          {t('annual')}
        </span>
        <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
          {t('save25')}
        </span>
      </div>
    </div>
  );
}
