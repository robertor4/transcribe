'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UsageIndicatorProps {
  current: number;
  limit: number | undefined; // undefined = unlimited
  unit: string;
  percentUsed: number;
  label?: string;
  showWarning?: boolean;
}

export function UsageIndicator({
  current,
  limit,
  unit,
  percentUsed,
  label,
  showWarning = true,
}: UsageIndicatorProps) {
  const t = useTranslations('paywall.usageIndicator');

  const isUnlimited = limit === undefined;
  const isWarning = percentUsed >= 80 && percentUsed < 100;
  const isExceeded = percentUsed >= 100;

  return (
    <div className="mb-4">
      {/* Label and Values */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label || unit}
        </span>
        <span className={`text-sm font-medium ${
          isExceeded ? 'text-red-600 dark:text-red-400' :
          isWarning ? 'text-orange-600 dark:text-orange-400' :
          'text-gray-700 dark:text-gray-300'
        }`}>
          {current.toFixed(1)} {!isUnlimited && `/ ${limit}`} {unit}
          {!isUnlimited && ` (${percentUsed.toFixed(0)}%)`}
        </span>
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              isExceeded ? 'bg-red-600' :
              isWarning ? 'bg-orange-500' :
              'bg-[#8D6AFA]'
            }`}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>
      )}

      {/* Warnings */}
      {showWarning && isWarning && !isExceeded && (
        <div className="mt-2 flex items-start text-sm text-orange-600 dark:text-orange-400">
          <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{t('approaching')}</span>
        </div>
      )}

      {showWarning && isExceeded && (
        <div className="mt-2 flex items-start text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{t('exceeded')}</span>
        </div>
      )}

      {/* Unlimited Badge */}
      {isUnlimited && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          ∞ {t('unlimited')}
        </p>
      )}
    </div>
  );
}
