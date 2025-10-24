'use client';

import { CheckCircle, Shield, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function TrustBadges() {
  const tPricing = useTranslations('pricing.hero');
  const tLanding = useTranslations('landing.hero.trustIndicators');

  const badges = [
    {
      icon: CheckCircle,
      text: tPricing('noCreditCard'),
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: Shield,
      text: tPricing('freeTrial'),
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Users,
      text: tLanding('users'),
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-6 mb-8">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <badge.icon className={`h-5 w-5 ${badge.color}`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
}
