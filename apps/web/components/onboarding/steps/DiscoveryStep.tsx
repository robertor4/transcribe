'use client';

import { useTranslations } from 'next-intl';
import {
  Search,
  Share2,
  Users,
  Rocket,
  MoreHorizontal,
} from 'lucide-react';
import type { OnboardingResponses } from '@transcribe/shared';

const DISCOVERY_SOURCES = [
  { key: 'search', icon: <Search className="h-5 w-5" /> },
  { key: 'social-media', icon: <Share2 className="h-5 w-5" /> },
  { key: 'friend', icon: <Users className="h-5 w-5" /> },
  { key: 'producthunt', icon: <Rocket className="h-5 w-5" /> },
  { key: 'other', icon: <MoreHorizontal className="h-5 w-5" /> },
] as const;

interface DiscoveryStepProps {
  value: OnboardingResponses['discoverySource'];
  onChange: (value: OnboardingResponses['discoverySource']) => void;
}

export function DiscoveryStep({ value, onChange }: DiscoveryStepProps) {
  const t = useTranslations('onboarding.discovery');

  return (
    <div className="px-6 py-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        {t('title')}
      </h3>

      <div className="space-y-3">
        {DISCOVERY_SOURCES.map(({ key, icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${
              value === key
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className={value === key ? 'text-purple-500' : 'text-gray-400'}>
              {icon}
            </span>
            {t(`sources.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
