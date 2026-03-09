'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { CookieConsent } from '@/components/CookieConsent';

/**
 * Providers for the pricing page.
 * Pricing needs AuthProvider (to check user state for CTAs) and
 * AnalyticsProvider (for tracking pricing page events).
 */
export function PricingProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        {children}
        <CookieConsent />
      </AnalyticsProvider>
    </AuthProvider>
  );
}
