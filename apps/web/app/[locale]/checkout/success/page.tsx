'use client';

import { use, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import Link from 'next/link';

export default function CheckoutSuccessPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const t = useTranslations('checkout.success');
  const { trackEvent } = useAnalytics();

  // Note: Subscription sync happens via Stripe webhooks
  // In development, use Stripe CLI: stripe listen --forward-to localhost:3001/stripe/webhook
  // See docs/STRIPE_CLI_SETUP.md for details

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-8">
          {t('description')}
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
            {t('nextSteps.title')}
          </h2>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#cc3399] mr-2">•</span>
              <span>{t('nextSteps.step1')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#cc3399] mr-2">•</span>
              <span>{t('nextSteps.step2')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#cc3399] mr-2">•</span>
              <span>{t('nextSteps.step3')}</span>
            </li>
          </ul>
        </div>

        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center px-8 py-3 bg-[#cc3399] text-white font-semibold rounded-lg hover:bg-[#b82d89] transition-colors"
        >
          {t('cta')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
          {t('receiptNotice')}
        </p>
      </div>
    </div>
  );
}
