'use client';

import { X, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaType: 'transcriptions' | 'duration' | 'filesize' | 'payg_credits' | 'on_demand_analyses';
  currentTier: 'free' | 'professional' | 'payg';
  details?: {
    current?: number;
    limit?: number;
    required?: number;
  };
}

export function QuotaExceededModal({
  isOpen,
  onClose,
  quotaType,
  currentTier: _currentTier,
  details,
}: QuotaExceededModalProps) {
  const t = useTranslations('paywall.quotaExceeded');

  if (!isOpen) return null;

  const messages = {
    transcriptions: {
      title: t('transcriptions.title'),
      description: t('transcriptions.description'),
      upgradeLink: '/pricing',
      upgradeText: t('upgradeButton'),
    },
    duration: {
      title: t('duration.title'),
      description: t('duration.description'),
      upgradeLink: '/pricing',
      upgradeText: t('upgradeButton'),
    },
    filesize: {
      title: t('filesize.title'),
      description: t('filesize.description'),
      upgradeLink: '/pricing',
      upgradeText: t('upgradeButton'),
    },
    payg_credits: {
      title: t('paygCredits.title'),
      description: t('paygCredits.description'),
      upgradeLink: '/checkout/payg',
      upgradeText: t('buyCreditsButton'),
    },
    on_demand_analyses: {
      title: t('onDemandAnalyses.title'),
      description: t('onDemandAnalyses.description'),
      upgradeLink: '/pricing',
      upgradeText: t('upgradeButton'),
    },
  };

  const message = messages[quotaType];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {message.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {message.description}
        </p>

        {/* Details */}
        {details && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              {details.current !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('current')}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {details.current}
                  </span>
                </div>
              )}
              {details.limit !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('limit')}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {details.limit}
                  </span>
                </div>
              )}
              {details.required !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('required')}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {details.required}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('cancelButton')}
          </button>
          <Link
            href={message.upgradeLink}
            className="flex-1 px-4 py-2 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors text-center"
          >
            {message.upgradeText}
          </Link>
        </div>
      </div>
    </div>
  );
}
