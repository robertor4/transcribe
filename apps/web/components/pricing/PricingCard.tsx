'use client';

import { Check, X, Shield, Loader2 } from 'lucide-react';
import { AiIcon } from '@/components/icons/AiIcon';
import Link from 'next/link';
import { formatPriceLocale } from '@transcribe/shared';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useEffect } from 'react';
import { formatViewItemParams, formatSelectItemParams, type PricingTier, type BillingCycle } from '@/utils/analytics-helpers';

interface Feature {
  text: string;
  included: boolean;
  note?: string;
}

interface PricingCardProps {
  tier: 'free' | 'professional' | 'enterprise';
  price: number;
  priceUnit?: string;
  title: string;
  description: string;
  featured?: boolean;
  features: Feature[];
  ctaText: string;
  ctaLink: string;
  locale: string;
  currency?: string;
  showGuarantee?: boolean;
  guaranteeText?: string;
  billingNote?: string;
  billingCycle?: 'monthly' | 'annual';
  trialBadge?: string; // e.g., "14-day free trial"
  customPriceLabel?: string; // e.g., "Contact sales" for enterprise
  onCtaClick?: () => void; // Custom click handler (e.g., for trial)
  ctaLoading?: boolean; // Show loading state on CTA
}

export function PricingCard({
  tier,
  price,
  priceUnit = 'per month',
  title,
  description,
  featured = false,
  features,
  ctaText,
  ctaLink,
  locale,
  currency = 'USD',
  showGuarantee = false,
  guaranteeText,
  billingNote,
  billingCycle = 'monthly',
  trialBadge,
  customPriceLabel,
  onCtaClick,
  ctaLoading = false,
}: PricingCardProps) {
  const { trackEvent } = useAnalytics();

  // Use locale-aware formatting for the price
  const decimals = tier === 'professional' && billingCycle === 'annual' ? 2 : 0;
  const formattedPrice = customPriceLabel ? null : formatPriceLocale(price, locale, { decimals });

  // Determine billing cycle type for analytics (enterprise uses monthly as default for tracking)
  const cycle: BillingCycle = billingCycle;

  // Track view_item when card becomes visible
  useEffect(() => {
    const params = formatViewItemParams(tier as PricingTier, price, currency, cycle);

    trackEvent('view_item', {
      ...params,
      locale: locale,
      tier_name: title,
      is_featured: featured
    });
  }, [tier, price, currency, cycle, locale, title, featured, trackEvent]);

  // Handle CTA click
  const handleCtaClick = () => {
    const params = formatSelectItemParams(tier as PricingTier, price, currency, cycle, 'Pricing Page');

    trackEvent('select_item', {
      ...params,
      locale: locale,
      tier_name: title,
      is_featured: featured,
      cta_text: ctaText
    });
  };

  return (
    <div
      className={`
        relative border rounded-2xl p-7 text-left transition-all duration-300
        ${
          featured
            ? 'landing-pricing-featured border-[rgba(141,106,250,0.5)]'
            : 'bg-white/[0.08] border-white/[0.08] hover:bg-white/[0.12]'
        }
      `}
    >
      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 bg-[#8D6AFA] text-white text-[10px] font-[family-name:var(--font-dm-mono)] tracking-wider uppercase px-3 py-0.5 rounded-full whitespace-nowrap">
          Most Popular
        </div>
      )}

      {/* Tier name (monospace label) */}
      <div className="text-xs font-[family-name:var(--font-dm-mono)] text-white/30 tracking-[2px] uppercase mb-2">
        {title}
      </div>

      {/* Price */}
      <div className="mb-1">
        {customPriceLabel ? (
          <div className="font-[family-name:var(--font-merriweather)] text-[38px] font-black leading-none">
            {customPriceLabel}
          </div>
        ) : (
          <div className="font-[family-name:var(--font-merriweather)] text-[38px] font-black leading-none">
            {formattedPrice}<span className="text-base font-normal text-white/30">{priceUnit}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-white/30 mb-1">
        {billingNote || description}
      </div>

      {/* Trial badge for Pro tier */}
      {trialBadge && (
        <div className="flex items-center gap-1.5 text-[#14D0DC] text-xs font-medium mb-1">
          <AiIcon size={14} />
          <span>{trialBadge}</span>
        </div>
      )}

      <div className="h-4" />

      {onCtaClick ? (
        <button
          onClick={() => {
            handleCtaClick();
            onCtaClick();
          }}
          disabled={ctaLoading}
          className={`
            block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              featured
                ? 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0]'
                : 'bg-transparent text-white border border-white/20 hover:border-white/40'
            }
          `}
        >
          {ctaLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            ctaText
          )}
        </button>
      ) : (
        <Link
          href={ctaLink}
          onClick={handleCtaClick}
          className={`
            block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all mb-6
            ${
              featured
                ? 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0]'
                : 'bg-transparent text-white border border-white/20 hover:border-white/40'
            }
          `}
        >
          {ctaText}
        </Link>
      )}

      {showGuarantee && guaranteeText && (
        <div className="flex items-center justify-center gap-2 text-[11px] text-white/30 mb-5">
          <Shield className="h-3.5 w-3.5 text-green-400" />
          <span>{guaranteeText}</span>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-2 text-[13px] text-white/60 items-start">
            {feature.included ? (
              <Check className="w-3.5 h-3.5 text-[#14D0DC] shrink-0 mt-0.5" strokeWidth={2.5} />
            ) : (
              <X className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" strokeWidth={2.5} />
            )}
            <span className={feature.included ? '' : 'text-white/30 line-through'}>
              {feature.text}
              {feature.note && (
                <span className="text-white/30 ml-1">({feature.note})</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
