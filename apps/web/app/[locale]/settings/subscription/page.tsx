'use client';

import { useTranslations } from 'next-intl';
import { CreditCard, Rocket, Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      '5 transcriptions per month',
      'Up to 1GB per file',
      'Basic summary',
      'Email notifications',
    ],
    current: true,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: [
      'Unlimited transcriptions',
      'Up to 3GB per file',
      'All analysis types',
      'Priority processing',
      'API access',
    ],
    current: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Everything in Pro',
      'Up to 5GB per file',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
    ],
    current: false,
  },
];

export default function SubscriptionSettingsPage() {
  const t = useTranslations('settings.subscriptionPage');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('description')}
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-6">
        <div className="flex items-center">
          <Rocket className="h-8 w-8 text-[#cc3399] mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('comingSoon')}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('comingSoonDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Plans Preview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('availablePlans')}</h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border-2 p-6 ${
                plan.current
                  ? 'border-[#cc3399] bg-pink-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.current && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#cc3399] text-white mb-3">
                  {t('currentPlan')}
                </span>
              )}
              
              <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {!plan.current && (
                <button
                  disabled
                  className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('upgrade')}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact for Enterprise */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('needMore')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('enterpriseDescription')}
        </p>
        <a
          href="mailto:support@neuralsummary.com"
          className="inline-flex items-center text-[#cc3399] hover:text-[#b82d89] text-sm font-medium"
        >
          {t('contactSales')} →
        </a>
      </div>
    </div>
  );
}