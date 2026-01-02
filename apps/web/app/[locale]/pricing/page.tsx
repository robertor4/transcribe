'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { DottedBackgroundDrift } from '@/components/landing/hero/DottedBackgroundDrift';
import { Globe, Clock, FileText, Share2, Headphones, Zap, Package, Building2, Users, Shield, MessageSquareText } from 'lucide-react';
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
    const items = [
      formatPricingTierItem('free', 0, currency, 'monthly'),
      formatPricingTierItem('professional', billingCycle === 'monthly' ? pricing.professional.monthly : pricing.professional.annualMonthly, currency, billingCycle),
      formatPricingTierItem('enterprise', 0, currency, 'monthly') // Contact sales
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
      threshold: 0.3
    });

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
      return `/${locale}/signup`;
    }

    if (tier === 'enterprise') {
      return `/${locale}/contact`;
    }

    if (!user) {
      return `/${locale}/signup?redirect=/${locale}/pricing`;
    }

    return `/${locale}/checkout/professional?cycle=${billingCycle}`;
  };

  // Free tier features
  const freeFeatures = [
    { text: t('tiers.free.features.transcriptions'), included: true, icon: FileText, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.duration'), included: true, icon: Clock, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.fileSize'), included: true, icon: Package, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.coreAnalyses'), included: true, icon: Zap, category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.onDemand'), included: true, note: '2/month', category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.translation'), included: false, icon: Globe, category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.askQuestions'), included: false, icon: MessageSquareText, category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.sharing'), included: true, note: t('comparison.values.basic'), icon: Share2, category: t('featureCategories.collaboration') },
    { text: t('tiers.free.features.support'), included: true, icon: Headphones, category: t('featureCategories.support') },
  ];

  // Pro tier features
  const professionalFeatures = [
    { text: t('tiers.professional.features.unlimited'), included: true, icon: FileText, category: t('featureCategories.transcription') },
    { text: t('tiers.professional.features.hours'), included: true, icon: Clock, category: t('featureCategories.transcription') },
    { text: t('tiers.professional.features.fileSize'), included: true, icon: Package, category: t('featureCategories.transcription') },
    { text: t('tiers.professional.features.allAnalyses'), included: true, icon: Zap, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.onDemandAnalyses'), included: true, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.translation'), included: true, icon: Globe, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.askQuestions'), included: true, icon: MessageSquareText, category: t('featureCategories.analysis') },
    { text: t('tiers.professional.features.advancedSharing'), included: true, icon: Share2, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.priority'), included: true, icon: Zap, category: t('featureCategories.collaboration') },
    { text: t('tiers.professional.features.support'), included: true, icon: Headphones, category: t('featureCategories.support') },
  ];

  // Enterprise tier features
  const enterpriseFeatures = [
    { text: t('tiers.enterprise.features.unlimited'), included: true, icon: FileText, category: t('featureCategories.transcription') },
    { text: t('tiers.enterprise.features.unlimitedHours'), included: true, icon: Clock, category: t('featureCategories.transcription') },
    { text: t('tiers.enterprise.features.largeFiles'), included: true, icon: Package, category: t('featureCategories.transcription') },
    { text: t('tiers.enterprise.features.allAnalyses'), included: true, icon: Zap, category: t('featureCategories.analysis') },
    { text: t('tiers.enterprise.features.customIntegrations'), included: true, icon: Building2, category: t('featureCategories.analysis') },
    { text: t('tiers.enterprise.features.sso'), included: true, icon: Shield, category: t('featureCategories.collaboration') },
    { text: t('tiers.enterprise.features.teamManagement'), included: true, icon: Users, category: t('featureCategories.collaboration') },
    { text: t('tiers.enterprise.features.dedicatedSupport'), included: true, icon: Headphones, category: t('featureCategories.support') },
  ];

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* Hero Section — deep purple background with animated dot pattern */}
        <section
          className="pt-32 pb-20 px-6 sm:px-8 lg:px-12 bg-[#23194B] relative overflow-hidden"
          aria-label="Pricing hero"
        >
          {/* Animated dot pattern */}
          <DottedBackgroundDrift />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
              {t('hero.subtitle')}
            </p>
            <p className="text-lg text-[#14D0DC] font-medium mb-10">
              {t('hero.trialMessage')}
            </p>

            {/* Billing Toggle */}
            <BillingToggle billingCycle={billingCycle} onToggle={handleBillingToggle} />
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-gray-50">
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

              {/* Pro Tier — Featured */}
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
                trialBadge={t('tiers.professional.trialBadge')}
                locale={locale}
                currencySymbol={currencySymbol}
                currency={currency}
                billingCycle={billingCycle}
              />

              {/* Enterprise Tier */}
              <PricingCard
                tier="enterprise"
                price={0}
                priceUnit=""
                customPriceLabel={t('tiers.enterprise.customPrice')}
                title={t('tiers.enterprise.title')}
                description={t('tiers.enterprise.description')}
                features={enterpriseFeatures}
                ctaText={t('tiers.enterprise.cta')}
                ctaLink={getCtaLink('enterprise')}
                locale={locale}
              />
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section id="comparison" className="py-20 px-6 sm:px-8 lg:px-12 bg-white">
          <div className="max-w-7xl mx-auto space-y-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center tracking-tight">
              {t('comparison.title')}
            </h2>
            <FeatureComparisonTable />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-6 sm:px-8 lg:px-12 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center tracking-tight">
              {t('faq.title')}
            </h2>
            <PricingFAQ />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 sm:px-8 lg:px-12 bg-[#3F38A0]">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-white/90">
              {t('finalCta.subtitle')}
            </p>
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center justify-center px-8 py-4 font-semibold text-lg rounded-full bg-white text-[#3F38A0] hover:bg-gray-100 transition-all shadow-lg hover:scale-105"
            >
              {t('finalCta.button')}
            </Link>
            <p className="text-sm text-white/70">
              {t('finalCta.noCreditCard')}
            </p>
          </div>
        </section>
      </div>

      <PublicFooter locale={locale} />
    </>
  );
}
