'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
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
  const { isAdmin } = useUsage();
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

  const loadSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
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
        setSubscription(subData);
      }
      // Still allow page to render with basic tier info from usage stats if subscription fetch fails

      // Handle usage stats
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        // Handle API response wrapper format
        setUsageStats(usageData.data || usageData);
      }

      // Handle billing history (may fail if no Stripe customer exists)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBillingHistory(historyData.invoices || []);
      } else {
        setBillingHistory([]);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user, loadSubscriptionData]);

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
        <Loader2 className="h-8 w-8 animate-spin text-[#8D6AFA]" />
      </div>
    );
  }

  const tier = subscription?.tier || usageStats?.tier || 'free';
  const isFree = tier === 'free';
  const isProfessional = tier === 'professional';
  const isPayg = tier === 'payg';

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <label className="block text-base font-medium text-gray-900 dark:text-gray-100">
                {t('currentPlan.title')}
              </label>
            </div>
            <div className="sm:w-2/3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#8D6AFA]" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isFree ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                  isProfessional ? 'bg-purple-100 dark:bg-purple-900/30 text-pink-700 dark:text-pink-300' :
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                }`}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </span>
              </div>
              {isFree && (
                <Link
                  href="/pricing"
                  className="px-6 py-2 bg-[#8D6AFA] text-white rounded-full hover:bg-[#7A5AE0] transition-colors text-sm font-medium"
                >
                  {t('upgrade')}
                </Link>
              )}
            </div>
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
              className="mt-3 block text-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
            >
              {t('buyMoreCredits')}
            </Link>
          </div>
        )}
        </div>
      </div>

      {/* Usage Stats - Hidden for admins */}
      {usageStats && !isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[#8D6AFA]" />
              <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                {t('usageThisMonth')}
              </label>
            </div>

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
                    'bg-[#8D6AFA]'
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
                    'bg-[#8D6AFA]'
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
                  className="h-2.5 rounded-full transition-all bg-[#8D6AFA]"
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
        </div>
      )}

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-[#8D6AFA]" />
            <label className="text-base font-medium text-gray-900 dark:text-gray-100">
              {t('billingHistory.title')}
            </label>
          </div>
          {billingHistory.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('noBillingHistory')}</p>
          ) : (
            <div className="space-y-3">
              {billingHistory.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
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
                        className="text-[#8D6AFA] hover:underline text-sm"
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
      </div>

      {/* Cancel Subscription */}
      {isProfessional && subscription?.subscription && !subscription.subscription.cancelAtPeriodEnd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
              <div className="sm:w-1/3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('cancelSubscription')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('cancelDescription')}
                </p>
              </div>
              <div className="sm:w-2/3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-medium"
                >
                  {cancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {t('cancelButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
