'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getMinimumPaygPackage, getPricingForLocale, getCurrencyForLocale } from '@transcribe/shared';
import { formatBeginCheckoutParams, parsePricingTier, parseBillingCycle } from '@/utils/analytics-helpers';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const t = useTranslations('checkout');
  const [error, setError] = useState<string | null>(null);

  const tier = params.tier as string;
  const locale = params.locale as string;

  useEffect(() => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/checkout/${tier}`);
      return;
    }

    createCheckoutSession();
  }, [user, tier]);

  async function createCheckoutSession() {
    try {
      setError(null);

      // Get user's Firebase ID token
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Get billing cycle from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const cycle = urlParams.get('cycle') || 'monthly';

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const successUrl = `${window.location.origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/${locale}/pricing`;

      // Get pricing info for analytics
      const pricing = getPricingForLocale(locale);
      const { code: currency } = getCurrencyForLocale(locale);
      const parsedTier = parsePricingTier(tier);
      const billingCycle = parseBillingCycle(cycle);

      // Calculate price for analytics
      let price = 0;
      if (tier === 'professional') {
        price = cycle === 'annual' ? pricing.professional.annualMonthly : pricing.professional.monthly;
      } else if (tier === 'payg') {
        price = getMinimumPaygPackage(currency).price;
      }

      // Track begin_checkout event
      const checkoutParams = formatBeginCheckoutParams(parsedTier, price, currency, billingCycle);
      trackEvent('begin_checkout', {
        ...checkoutParams,
        locale: locale,
        user_id: user?.uid
      });

      // Determine endpoint and payload based on tier
      let endpoint = '/stripe/create-checkout-session';
      let payload: Record<string, string | number> = {
        tier,
        billing: cycle, // Use cycle from URL param
        successUrl,
        cancelUrl,
      };

      if (tier === 'payg') {
        endpoint = '/stripe/create-payg-session';
        const minimumPackage = getMinimumPaygPackage('USD'); // Backend always uses USD for Stripe
        payload = {
          amount: minimumPackage.price,
          hours: minimumPackage.hours,
          successUrl,
          cancelUrl,
        };
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();

      // Track add_payment_info event (checkout session created successfully)
      trackEvent('add_payment_info', {
        ...checkoutParams,
        locale: locale,
        session_id: data.sessionId,
        user_id: user?.uid
      });

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);

      // Track checkout error
      trackEvent('checkout_error', {
        error_message: err instanceof Error ? err.message : 'Unknown error',
        tier: tier,
        locale: locale,
        user_id: user?.uid
      });

      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('error.title')}
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <a
              href={`/${params.locale}/pricing`}
              className="px-6 py-3 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors"
            >
              {t('error.backToPricing')}
            </a>
            <button
              onClick={createCheckoutSession}
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t('error.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#cc3399] mx-auto mb-4" />
        <p className="text-gray-700 dark:text-gray-300 text-lg">{t('processing')}</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
          {t('redirecting')}
        </p>
      </div>
    </div>
  );
}
