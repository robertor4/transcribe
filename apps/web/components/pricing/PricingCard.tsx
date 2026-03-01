'use client';

import { Check, X, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { AiIcon } from '@/components/icons/AiIcon';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { formatPriceLocale } from '@transcribe/shared';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useEffect } from 'react';
import { formatViewItemParams, formatSelectItemParams, type PricingTier, type BillingCycle } from '@/utils/analytics-helpers';

interface Feature {
  text: string;
  included: boolean;
  note?: string;
  icon?: LucideIcon;
  category?: string;
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
  currencySymbol?: string;
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
        relative rounded-2xl p-8 transition-all duration-300
        ${
          featured
            ? 'border-2 border-[rgba(141,106,250,0.5)] bg-white/[0.12] shadow-[0_8px_32px_rgba(141,106,250,0.15)] md:scale-105'
            : 'border border-white/[0.08] bg-white/[0.08] hover:bg-white/[0.12]'
        }
      `}
    >
      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8D6AFA] text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
          Most Popular
        </div>
      )}

      {/* Trial badge for Pro tier */}
      {trialBadge && (
        <div className="flex items-center gap-1.5 text-[#14D0DC] text-sm font-medium mb-4">
          <AiIcon size={16} />
          <span>{trialBadge}</span>
        </div>
      )}

      <div className="mb-8 space-y-3">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-white/60 leading-relaxed">{description}</p>
      </div>

      <div className="mb-8">
        {customPriceLabel ? (
          // Custom price label for enterprise
          <div className="flex items-baseline">
            <span className="text-3xl font-semibold text-white tracking-tight">
              {customPriceLabel}
            </span>
          </div>
        ) : (
          // Regular price display
          <div className="flex items-baseline">
            <span className="text-5xl font-light text-white tracking-tight">
              {formattedPrice}
            </span>
            {priceUnit && (
              <span className="text-white/40 ml-2 font-light">
                {priceUnit}
              </span>
            )}
          </div>
        )}
        {billingNote && (
          <p className="text-sm text-white/40 mt-2 font-light">
            {billingNote}
          </p>
        )}
      </div>

      {onCtaClick ? (
        <button
          onClick={() => {
            handleCtaClick();
            onCtaClick();
          }}
          disabled={ctaLoading}
          className={`
            group flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full text-center font-medium transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              featured
                ? 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] shadow-lg'
                : tier === 'free'
                ? 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0]'
                : 'border border-white/20 text-white hover:bg-white/10 hover:border-white/40'
            }
          `}
        >
          {ctaLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {ctaText}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      ) : (
        <Link
          href={ctaLink}
          onClick={handleCtaClick}
          className={`
            group flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full text-center font-medium transition-all mb-6
            ${
              featured
                ? 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] shadow-lg'
                : tier === 'free'
                ? 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0]'
                : 'border border-white/20 text-white hover:bg-white/10 hover:border-white/40'
            }
          `}
        >
          {ctaText}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {showGuarantee && guaranteeText && (
        <div className="flex items-center justify-center gap-2 text-sm text-white/50 mb-8 pb-8 border-b border-white/10 font-light">
          <Shield className="h-4 w-4 text-green-400" />
          <span>{guaranteeText}</span>
        </div>
      )}

      <ul className="space-y-4">
        {features.map((feature, index) => {
          const isNewCategory = index === 0 || feature.category !== features[index - 1]?.category;
          return (
            <div key={index}>
              {isNewCategory && feature.category && (
                <li className="text-xs font-medium text-white/30 uppercase tracking-wider mt-6 mb-3">
                  {feature.category}
                </li>
              )}
              <li className="flex items-start gap-3">
                {feature.icon && (
                  <feature.icon className="h-5 w-5 text-[#8D6AFA] mt-0.5 flex-shrink-0" />
                )}
                {!feature.icon && (
                  feature.included ? (
                    <Check className="h-5 w-5 text-[#14D0DC] mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-white/20 mt-0.5 flex-shrink-0" />
                  )
                )}
                <span className={`font-light ${feature.included ? 'text-white/70' : 'text-white/30 line-through'}`}>
                  {feature.text}
                  {feature.note && (
                    <span className="text-sm text-white/40 ml-2">
                      ({feature.note})
                    </span>
                  )}
                </span>
              </li>
            </div>
          );
        })}
      </ul>
    </div>
  );
}
