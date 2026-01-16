'use client';

import { XCircle, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function CheckoutCancelPage() {
  const t = useTranslations('checkout.cancel');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <XCircle className="h-16 w-16 text-orange-600 dark:text-orange-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
          {t('title')}
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-8">
          {t('description')}
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
            {t('help.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
            {t('help.description')}
          </p>
          <ul className="text-left space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#8D6AFA] mr-2">•</span>
              <span>{t('help.reason1')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#8D6AFA] mr-2">•</span>
              <span>{t('help.reason2')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#8D6AFA] mr-2">•</span>
              <span>{t('help.reason3')}</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center px-6 py-3 bg-[#8D6AFA] text-white font-semibold rounded-lg hover:bg-[#7A5AE0] transition-colors"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t('backToPricing')}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t('goToDashboard')}
          </Link>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
          {t('contactSupport')}
        </p>
      </div>
    </div>
  );
}
