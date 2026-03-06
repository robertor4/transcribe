'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Briefcase,
  Mic,
  PenTool,
  StickyNote,
  Phone,
  Lightbulb,
} from 'lucide-react';
import type { OnboardingResponses } from '@transcribe/shared';

const USE_CASE_ICONS: Record<string, React.ReactNode> = {
  'work-meetings': <Briefcase className="h-5 w-5" />,
  interviews: <Mic className="h-5 w-5" />,
  'content-creation': <PenTool className="h-5 w-5" />,
  'personal-notes': <StickyNote className="h-5 w-5" />,
  'client-calls': <Phone className="h-5 w-5" />,
  brainstorming: <Lightbulb className="h-5 w-5" />,
};

const USE_CASE_KEYS = [
  'work-meetings',
  'interviews',
  'content-creation',
  'personal-notes',
  'client-calls',
  'brainstorming',
] as const;

const ROLE_KEYS = [
  'product-manager',
  'founder',
  'consultant',
  'engineer',
  'sales',
  'content-creator',
  'other',
] as const;

interface UseCaseRoleStepProps {
  values: Pick<OnboardingResponses, 'primaryUseCase' | 'role' | 'roleOther'>;
  onChange: (
    values: Pick<OnboardingResponses, 'primaryUseCase' | 'role' | 'roleOther'>,
  ) => void;
}

export function UseCaseRoleStep({ values, onChange }: UseCaseRoleStepProps) {
  const t = useTranslations('onboarding.useCaseRole');
  const [roleOther, setRoleOther] = useState(values.roleOther || '');

  const selectUseCase = (uc: OnboardingResponses['primaryUseCase']) => {
    onChange({ ...values, primaryUseCase: uc });
  };

  const selectRole = (role: OnboardingResponses['role']) => {
    onChange({ ...values, role, roleOther: role === 'other' ? roleOther : undefined });
  };

  return (
    <div className="px-6 py-6 space-y-8">
      {/* Use case selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('useCaseTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {USE_CASE_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => selectUseCase(key)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                values.primaryUseCase === key
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className={
                  values.primaryUseCase === key
                    ? 'text-purple-500'
                    : 'text-gray-400'
                }
              >
                {USE_CASE_ICONS[key]}
              </span>
              {t(`useCases.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Role selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('roleTitle')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {ROLE_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => selectRole(key)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                values.role === key
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {t(`roles.${key}`)}
            </button>
          ))}
        </div>

        {values.role === 'other' && (
          <input
            type="text"
            value={roleOther}
            onChange={(e) => {
              setRoleOther(e.target.value);
              onChange({ ...values, roleOther: e.target.value });
            }}
            placeholder={t('roleOtherPlaceholder')}
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        )}
      </div>
    </div>
  );
}
