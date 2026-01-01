'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { CTAButton } from '@/components/landing/CTAButton';
import { Globe, Clock, FileText, Share2, Headphones, Zap, Package } from 'lucide-react';
import { getPricingForLocale, getCurrencyForLocale, formatPriceLocale } from '@transcribe/shared';
import { formatPricingTierItem } from '@/utils/analytics-helpers';

export default function PricingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const t = useTranslations('pricing');

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [hasTrackedComparison, setHasTrackedComparison] = useState(false);
  const [hasTrackedFAQ, setHasTrackedFAQ] = useState(false);

  // Get pricing and currency info from centralized utility
  const pricing = getPricingForLocale(locale);
  const { code: currency, symbol: currencySymbol } = getCurrencyForLocale(locale);

  // Track page view with all pricing tiers on mount
  useEffect(() => {
    // Track view_item_list event with all pricing tiers
    const items = [
      formatPricingTierItem('free', 0, currency, 'monthly'),
      formatPricingTierItem('professional', billingCycle === 'monthly' ? pricing.professional.monthly : pricing.professional.annualMonthly, currency, billingCycle),
      formatPricingTierItem('payg', pricing.payg.hourly, currency, 'one-time')
    ];

    trackEvent('view_item_list', {
      item_list_name: 'Pricing Page',
      items: items,
      currency: currency,
      locale: locale,
      user_authenticated: !!user
    });
  }, [trackEvent, locale, currency, billingCycle, pricing, user]);

  // Track when user scrolls to comparison table or FAQ
  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;

          if (target.id === 'comparison' && !hasTrackedComparison) {
            trackEvent('pricing_comparison_viewed', {
              locale: locale,
              currency: currency
            });
            setHasTrackedComparison(true);
          }

          if (target.id === 'faq' && !hasTrackedFAQ) {
            trackEvent('pricing_faq_viewed', {
              locale: locale,
              currency: currency
            });
            setHasTrackedFAQ(true);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.3 // Trigger when 30% of element is visible
    });

    // Observe comparison and FAQ sections
    const comparisonSection = document.getElementById('comparison');
    const faqSection = document.getElementById('faq');

    if (comparisonSection) observer.observe(comparisonSection);
    if (faqSection) observer.observe(faqSection);

    return () => {
      observer.disconnect();
    };
  }, [trackEvent, locale, currency, hasTrackedComparison, hasTrackedFAQ]);

  // Handle billing cycle toggle with analytics
  const handleBillingToggle = (newCycle: 'monthly' | 'annual') => {
    setBillingCycle(newCycle);

    // Track billing cycle change
    trackEvent('billing_cycle_toggled', {
      previous_cycle: billingCycle,
      new_cycle: newCycle,
      currency: currency,
      locale: locale
    });
  };

  // Helper function to get the appropriate CTA link based on authentication
  const getCtaLink = (tier: string) => {
    if (tier === 'free') {
      // Free tier always goes to signup
      return `/${locale}/signup`;
    }

    if (!user) {
      // Not authenticated: go to signup with redirect back to pricing
      return `/${locale}/signup?redirect=/${locale}/pricing`;
    }

    // Authenticated: go directly to checkout
    if (tier === 'professional') {
      return `/${locale}/checkout/professional?cycle=${billingCycle}`;
    }
    return `/${locale}/checkout/${tier}`;
  };

  // Standardized feature lists for each tier with icons and categories
  const freeFeatures = [
    { text: t('tiers.free.features.transcriptions'), included: true, icon: FileText, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.duration'), included: true, icon: Clock, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.fileSize'), included: true, icon: Package, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.coreAnalyses'), included: true, icon: Zap, category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.onDemand'), included: true, note: '2/month', category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.translation'), included: false, icon: Globe, category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.sharing'), included: true, note: t('comparison.values.basic'), icon: Share2, category: t('featureCategories.collaboration') },
    { text: t('tiers.free.features.batch'), included: false, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.priority'), included: false, icon: Zap, category: t('featureCategories.collaboration') },
    { text: t('tiers.free.features.support'), included: true, icon: Headphones, category: t('featureCategories.support') },
  ];

  const professionalFeatures = [
    { text: t('tiers.professional.features.unlimited'), included: true, icon: FileText, category: t('featureCategories.transcription') },
    { text: t('tiers.professional.features.hours'), included: true, icon: Clock, category: t('featureCategories.transcription') },
    { text: t('tiers.professional.features.fileSize'), included: true, icon: Package, category: t('featureCategories.transcription') },
    { text: t('tiers.professional.features.allAnalyses'), included: true, icon: Zap, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.onDemandAnalyses'), included: true, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.translation'), included: true, icon: Globe, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.advancedSharing'), included: true, icon: Share2, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.batch'), included: true, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.priority'), included: true, icon: Zap, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.support'), included: true, icon: Headphones, category: t('featureCategories.support') },
  ];

  const paygFeatures = [
    { text: t('tiers.payg.features.transcriptions'), included: true, icon: FileText, category: t('featureCategories.transcription') },
    { text: t('tiers.payg.features.noExpiry'), included: true, icon: Clock, category: t('featureCategories.transcription') },
    { text: t('tiers.payg.features.fileSize'), included: true, icon: Package, category: t('featureCategories.transcription') },
    { text: t('tiers.professional.features.allAnalyses'), included: true, icon: Zap, category: t('featureCategories.analysis') },
    { text: t('tiers.payg.features.allFeatures'), included: true, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.translation'), included: true, icon: Globe, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.advancedSharing'), included: true, icon: Share2, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.batch'), included: true, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.priority'), included: true, icon: Zap, category: t('featureCategories.collaboration') },
    { text: t('tiers.payg.features.support'), included: true, icon: Headphones, category: t('featureCategories.support') },
  ];

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>

            {/* Billing Toggle */}
            <BillingToggle billingCycle={billingCycle} onToggle={handleBillingToggle} />
          </div>
        </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Free Tier */}
            <PricingCard
              tier="free"
              price={0}
              priceUnit={t('tiers.free.period')}
              title={t('tiers.free.title')}
              description={t('tiers.free.description')}
              features={freeFeatures}
              ctaText={t('tiers.free.cta')}
              ctaLink={getCtaLink('free')}
              locale={locale}
            />

            {/* Professional Tier */}
            <PricingCard
              tier="professional"
              price={billingCycle === 'monthly' ? pricing.professional.monthly : pricing.professional.annualMonthly}
              priceUnit={t('tiers.professional.period')}
              billingNote={billingCycle === 'annual' ? t('hero.billedAnnually', { amount: formatPriceLocale(pricing.professional.annual, locale) }) : undefined}
              title={t('tiers.professional.title')}
              description={t('tiers.professional.description')}
              featured={true}
              features={professionalFeatures}
              ctaText={t('tiers.professional.cta')}
              ctaLink={getCtaLink('professional')}
              showGuarantee={true}
              guaranteeText={t('tiers.professional.guarantee')}
              locale={locale}
              currencySymbol={currencySymbol}
              currency={currency}
              billingCycle={billingCycle}
            />

            {/* Pay-As-You-Go */}
            <PricingCard
              tier="payg"
              price={pricing.payg.hourly}
              priceUnit={t('tiers.payg.priceUnit')}
              title={t('tiers.payg.title')}
              description={t('tiers.payg.description')}
              features={paygFeatures}
              ctaText={t('tiers.payg.cta')}
              ctaLink={getCtaLink('payg')}
              locale={locale}
              currencySymbol={currencySymbol}
              currency={currency}
            />
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="comparison" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center tracking-tight">
            {t('comparison.title')}
          </h2>
          <FeatureComparisonTable />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center tracking-tight">
            {t('faq.title')}
          </h2>
          <PricingFAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#23194B]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl text-white/90">
            {t('finalCta.subtitle')}
          </p>
          <CTAButton href="/signup" locale={locale} variant="primary">
            {t('finalCta.button')}
          </CTAButton>
        </div>
      </section>
      </div>

      <PublicFooter locale={locale} />
    </>
  );
}
