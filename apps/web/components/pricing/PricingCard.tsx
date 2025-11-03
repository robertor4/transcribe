import { Check, X, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { formatPriceLocale } from '@transcribe/shared';

interface Feature {
  text: string;
  included: boolean;
  note?: string;
  icon?: LucideIcon;
  category?: string;
}

interface PricingCardProps {
  tier: 'free' | 'professional' | 'payg';
  price: number;
  priceUnit?: string;
  title: string;
  description: string;
  featured?: boolean;
  features: Feature[];
  ctaText: string;
  ctaLink: string;
  locale: string; // Locale code for proper number formatting
  currency?: string; // Kept for backwards compatibility
  currencySymbol?: string; // Kept for backwards compatibility
  showGuarantee?: boolean;
  guaranteeText?: string;
  billingNote?: string;
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
  currencySymbol = '$',
  showGuarantee = false,
  guaranteeText,
  billingNote,
}: PricingCardProps) {
  // Use locale-aware formatting for the price
  // PAYG uses 2 decimals (e.g., €1.40/hour), subscription tiers use 0 decimals (e.g., €27/month)
  const decimals = tier === 'payg' ? 2 : 0;
  const formattedPrice = formatPriceLocale(price, locale, { decimals });

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8
        border-2 transition-all duration-200
        ${
          featured
            ? 'border-[#cc3399] scale-100 md:scale-110 shadow-2xl ring-4 ring-[#cc3399]/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-[#cc3399]/50'
        }
      `}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#cc3399] to-purple-600 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            {formattedPrice}
          </span>
          <span className="text-gray-700 dark:text-gray-300 ml-2">
            {priceUnit}
          </span>
        </div>
        {billingNote && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {billingNote}
          </p>
        )}
      </div>

      <Link
        href={ctaLink}
        className={`
          group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg text-center font-semibold transition-all mb-4
          ${
            featured
              ? 'bg-gradient-to-r from-[#cc3399] to-purple-600 text-white hover:from-[#b82d89] hover:to-purple-700 shadow-lg'
              : tier === 'free'
              ? 'bg-[#cc3399] text-white hover:bg-[#b82d89]'
              : 'border-2 border-[#cc3399] text-[#cc3399] hover:bg-[#cc3399] hover:text-white dark:border-[#cc3399] dark:text-[#cc3399]'
          }
        `}
      >
        {ctaText}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>

      {showGuarantee && guaranteeText && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span>{guaranteeText}</span>
        </div>
      )}

      <ul className="space-y-3">
        {features.map((feature, index) => {
          const isNewCategory = index === 0 || feature.category !== features[index - 1]?.category;
          return (
            <div key={index}>
              {isNewCategory && feature.category && (
                <li className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-4 mb-2">
                  {feature.category}
                </li>
              )}
              <li className="flex items-start gap-3">
                {feature.icon && (
                  <feature.icon className="h-5 w-5 text-[#cc3399] mt-0.5 flex-shrink-0" />
                )}
                {!feature.icon && (
                  feature.included ? (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-gray-400 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                  )
                )}
                <span className={`${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500 line-through'}`}>
                  {feature.text}
                  {feature.note && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
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
