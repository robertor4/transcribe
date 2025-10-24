import { Check, X } from 'lucide-react';
import Link from 'next/link';

interface Feature {
  text: string;
  included: boolean;
  note?: string;
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
  currency?: string;
  currencySymbol?: string;
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
  currency = 'USD',
  currencySymbol = '$',
}: PricingCardProps) {
  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8
        border-2 transition-all duration-200
        ${
          featured
            ? 'border-[#cc3399] scale-105 shadow-2xl'
            : 'border-gray-200 dark:border-gray-700 hover:border-[#cc3399]/50'
        }
      `}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#cc3399] text-white px-4 py-1 rounded-full text-sm font-semibold">
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
            {currencySymbol}{price}
          </span>
          <span className="text-gray-700 dark:text-gray-300 ml-2">
            {priceUnit}
          </span>
        </div>
        {currency !== 'USD' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Prices automatically converted to {currency}
          </p>
        )}
      </div>

      <Link
        href={ctaLink}
        className={`
          block w-full py-3 px-6 rounded-lg text-center font-semibold transition-all mb-8
          ${
            featured
              ? 'bg-[#cc3399] text-white hover:bg-[#b82d89]'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
          }
        `}
      >
        {ctaText}
      </Link>

      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="h-5 w-5 text-gray-400 dark:text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
            )}
            <span className="text-gray-700 dark:text-gray-300">
              {feature.text}
              {feature.note && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  ({feature.note})
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
