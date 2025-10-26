'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CreditCard, Calendar, AlertCircle, TrendingUp, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    cancelAt: number | null;
  } | null;
  tier: string;
}

interface UsageStats {
  tier: string;
  usage: {
    hours: number;
    transcriptions: number;
    onDemandAnalyses: number;
  };
  limits: {
    transcriptions?: number;
    hours?: number;
    onDemandAnalyses?: number;
  };
  overage: {
    hours: number;
    amount: number;
  };
  percentUsed: number;
  warnings: string[];
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  invoicePdf: string;
  hostedInvoiceUrl: string;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const t = useTranslations('subscription');
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [billingHistory, setBillingHistory] = useState<Invoice[]>([]);
  const [cancelling, setCancelling] = useState(false);

  // Format date as dd-MMM-yyyy (e.g., 26-Oct-2025)
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  async function loadSubscriptionData() {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      console.log('Current user UID:', user?.uid);
      console.log('Current user email:', user?.email);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const [subResponse, usageResponse, historyResponse] = await Promise.all([
        fetch(`${apiUrl}/stripe/subscription`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/user/usage-stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/stripe/billing-history`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      // Handle subscription data (may fail if Stripe subscription doesn't exist)
      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log('Subscription data:', subData);
        console.log('Subscription object:', subData.subscription);
        console.log('Current period start:', subData.subscription?.currentPeriodStart);
        console.log('Current period end:', subData.subscription?.currentPeriodEnd);
        setSubscription(subData);
      } else {
        console.warn('Failed to load subscription details:', subResponse.status);
        // Still allow page to render with basic tier info from usage stats
      }

      // Handle usage stats
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        console.log('Usage data:', usageData);
        // Handle API response wrapper format
        setUsageStats(usageData.data || usageData);
      }

      // Handle billing history (may fail if no Stripe customer exists)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('Billing history:', historyData);
        setBillingHistory(historyData.invoices || []);
      } else {
        console.warn('Failed to load billing history:', historyResponse.status);
        setBillingHistory([]);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm(t('cancelConfirm'))) {
      return;
    }

    try {
      setCancelling(true);
      const token = await user?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      alert(t('cancelSuccess'));
      await loadSubscriptionData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert(t('cancelError'));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#cc3399]" />
      </div>
    );
  }

  const tier = subscription?.tier || usageStats?.tier || 'free';
  const isFree = tier === 'free';
  const isProfessional = tier === 'professional';
  const isPayg = tier === 'payg';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {t('title')}
      </h1>

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('currentPlan.title')}
            </h2>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#cc3399]" />
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isFree ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                isProfessional ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' :
                'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              }`}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
            </div>
          </div>
          {isFree && (
            <Link
              href="/pricing"
              className="px-6 py-2 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors"
            >
              {t('upgrade')}
            </Link>
          )}
        </div>

        {/* Subscription Details */}
        {(isProfessional || tier === 'business') && subscription?.subscription && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Subscription Status */}
            {subscription.subscription.status && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('status')}:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  subscription.subscription.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : subscription.subscription.status === 'trialing'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {subscription.subscription.status.charAt(0).toUpperCase() + subscription.subscription.status.slice(1)}
                </span>
              </div>
            )}

            {/* Billing Cycle Start */}
            {subscription.subscription.currentPeriodStart && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('billingPeriodStart')}:</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {formatDate(subscription.subscription.currentPeriodStart)}
                </span>
              </div>
            )}

            {/* Next Billing Date */}
            {subscription.subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('nextBilling')}:</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {formatDate(subscription.subscription.currentPeriodEnd)}
                  </span>
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscription.subscription.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{t('cancelAtPeriodEnd')}</span>
              </div>
            )}
          </div>
        )}

        {isPayg && usageStats && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">{t('paygCredits')}:</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageStats.usage.hours.toFixed(1)} {t('hours')}
              </span>
            </div>
            <Link
              href="/checkout/payg"
              className="mt-3 block text-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              {t('buyMoreCredits')}
            </Link>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      {usageStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-[#cc3399]" />
            {t('usageThisMonth')}
          </h2>

          {/* Hours (Professional/Business) */}
          {(isProfessional || tier === 'business') && usageStats?.limits?.hours && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('hoursUsed')}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {usageStats.usage.hours.toFixed(1)} / {usageStats.limits.hours} {t('hours')}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    usageStats.percentUsed >= 100 ? 'bg-red-600' :
                    usageStats.percentUsed >= 80 ? 'bg-orange-500' :
                    'bg-[#cc3399]'
                  }`}
                  style={{ width: `${Math.min(100, usageStats.percentUsed)}%` }}
                />
              </div>
            </div>
          )}

          {/* Transcriptions (Free) */}
          {isFree && usageStats?.limits?.transcriptions && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('transcriptionsUsed')}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {usageStats.usage.transcriptions} / {usageStats.limits.transcriptions}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    usageStats.usage.transcriptions >= usageStats.limits.transcriptions ? 'bg-red-600' :
                    usageStats.usage.transcriptions >= usageStats.limits.transcriptions * 0.8 ? 'bg-orange-500' :
                    'bg-[#cc3399]'
                  }`}
                  style={{ width: `${(usageStats.usage.transcriptions / usageStats.limits.transcriptions) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* On-Demand Analyses (Free) */}
          {isFree && usageStats?.limits?.onDemandAnalyses && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('onDemandAnalyses')}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {usageStats.usage.onDemandAnalyses} / {usageStats.limits.onDemandAnalyses}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all bg-[#cc3399]"
                  style={{ width: `${(usageStats.usage.onDemandAnalyses / usageStats.limits.onDemandAnalyses) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Overage Warning */}
          {usageStats?.overage?.hours > 0 && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center text-orange-700 dark:text-orange-300">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-semibold">
                  {t('overageWarning')}: {usageStats.overage.hours.toFixed(1)} {t('hours')}
                </span>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                {t('overageCharge')}: ${(usageStats.overage.amount / 100).toFixed(2)}
              </p>
            </div>
          )}

          {/* Usage Warnings */}
          {usageStats?.warnings && usageStats.warnings.length > 0 && (
            <div className="mt-4 space-y-2">
              {usageStats.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300"
                >
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-[#cc3399]" />
          {t('billingHistory.title')}
        </h2>
        {billingHistory.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">{t('noBillingHistory')}</p>
        ) : (
          <div className="space-y-3">
            {billingHistory.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(invoice.created)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {invoice.status}
                  </span>
                  {invoice.invoicePdf && (
                    <a
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#cc3399] hover:underline text-sm"
                    >
                      {t('downloadInvoice')}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Subscription */}
      {isProfessional && subscription?.subscription && !subscription.subscription.cancelAtPeriodEnd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('cancelSubscription')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t('cancelDescription')}
          </p>
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {cancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('cancelButton')}
          </button>
        </div>
      )}
    </div>
  );
}
