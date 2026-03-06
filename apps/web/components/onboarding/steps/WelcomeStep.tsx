'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';

interface WelcomeStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onContinue, onSkip }: WelcomeStepProps) {
  const t = useTranslations('onboarding.welcome');

  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
        <Sparkles className="h-6 w-6 text-purple-600" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {t('title')}
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mb-8">
        {t('subtitle')}
      </p>

      <Button variant="brand" size="md" onClick={onContinue}>
        {t('getStarted')}
      </Button>

      <button
        onClick={onSkip}
        className="mt-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
      >
        {t('skip')}
      </button>
    </div>
  );
}
