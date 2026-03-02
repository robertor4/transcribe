'use client';

import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';

interface BillingToggleProps {
  billingCycle: 'monthly' | 'annual';
  onToggle: (cycle: 'monthly' | 'annual') => void;
}

export function BillingToggle({ billingCycle, onToggle }: BillingToggleProps) {
  const t = useTranslations('pricing.hero');

  return (
    <div className="flex items-center justify-center gap-3">
      <span className={`text-[11px] font-[family-name:var(--font-dm-mono)] tracking-[1px] uppercase transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-white/30'}`}>
        {t('monthly')}
      </span>

      <Switch
        checked={billingCycle === 'annual'}
        onCheckedChange={(checked) => onToggle(checked ? 'annual' : 'monthly')}
        size="lg"
        aria-label="Toggle between monthly and annual billing"
        className="data-[state=checked]:bg-[#8D6AFA] data-[state=unchecked]:bg-white/[0.12]"
      />

      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] font-[family-name:var(--font-dm-mono)] tracking-[1px] uppercase transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-white/30'}`}>
          {t('annual')}
        </span>
        <span className="bg-[#14D0DC] text-[#23194B] text-[10px] font-[family-name:var(--font-dm-mono)] tracking-wider uppercase px-2 py-0.5 rounded-full">
          {t('save25')}
        </span>
      </div>
    </div>
  );
}
