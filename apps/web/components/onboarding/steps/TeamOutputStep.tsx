'use client';

import { useTranslations } from 'next-intl';
import {
  CheckSquare,
  FileText,
  Mail,
  PenTool,
  ClipboardList,
  BarChart3,
  Linkedin,
  Wrench,
} from 'lucide-react';
import type { OnboardingResponses } from '@transcribe/shared';

const TEAM_SIZE_KEYS = ['solo', 'small', 'medium', 'large'] as const;

const OUTPUT_TYPES = [
  { key: 'actionItems', icon: <CheckSquare className="h-4 w-4" /> },
  { key: 'meetingMinutes', icon: <ClipboardList className="h-4 w-4" /> },
  { key: 'followUpEmail', icon: <Mail className="h-4 w-4" /> },
  { key: 'blogPost', icon: <PenTool className="h-4 w-4" /> },
  { key: 'prd', icon: <FileText className="h-4 w-4" /> },
  { key: 'executiveSummary', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'linkedIn', icon: <Linkedin className="h-4 w-4" /> },
  { key: 'custom', icon: <Wrench className="h-4 w-4" /> },
] as const;

interface TeamOutputStepProps {
  values: Pick<OnboardingResponses, 'teamSize' | 'topOutputTypes'>;
  onChange: (
    values: Pick<OnboardingResponses, 'teamSize' | 'topOutputTypes'>,
  ) => void;
}

export function TeamOutputStep({ values, onChange }: TeamOutputStepProps) {
  const t = useTranslations('onboarding.teamOutput');

  const selectTeamSize = (size: OnboardingResponses['teamSize']) => {
    onChange({ ...values, teamSize: size });
  };

  const toggleOutputType = (key: string) => {
    const current = values.topOutputTypes || [];
    const updated = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    onChange({ ...values, topOutputTypes: updated });
  };

  return (
    <div className="px-6 py-6 space-y-8">
      {/* Team size */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('teamTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {TEAM_SIZE_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => selectTeamSize(key)}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                values.teamSize === key
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t(`teamSizes.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Output types (multi-select) */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('outputTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {OUTPUT_TYPES.map(({ key, icon }) => {
            const selected = (values.topOutputTypes || []).includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleOutputType(key)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                  selected
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={selected ? 'text-purple-500' : 'text-gray-400'}>
                  {icon}
                </span>
                {t(`outputTypes.${key}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
