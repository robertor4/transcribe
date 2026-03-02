'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { SectionTag } from '@/components/landing/shared/SectionTag';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';
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
  const [isTrialEligible, setIsTrialEligible] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);

  // Check trial eligibility for authenticated users
  useEffect(() => {
    async function checkTrialEligibility() {
      if (!user) {
        setIsTrialEligible(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/stripe/trial-eligibility`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setIsTrialEligible(data.eligible);
        }
      } catch (error) {
        console.error('Failed to check trial eligibility:', error);
        setIsTrialEligible(false);
      }
    }

    checkTrialEligibility();
  }, [user]);

  // Handle trial start
  const handleStartTrial = useCallback(async () => {
    if (!user || startingTrial) return;

    setStartingTrial(true);
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/stripe/create-trial-session`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.url) {
        trackEvent('trial_started', {
          tier: 'professional',
          locale: locale,
        });
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        setStartingTrial(false);
      }
    } catch (error) {
      console.error('Failed to start trial:', error);
      setStartingTrial(false);
    }
  }, [user, startingTrial, locale, trackEvent]);

  // Get pricing and currency info from centralized utility
  const pricing = getPricingForLocale(locale);
  const { code: currency } = getCurrencyForLocale(locale);

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
    { text: t('tiers.free.features.transcriptions'), included: true },
    { text: t('tiers.free.features.duration'), included: true },
    { text: t('tiers.free.features.fileSize'), included: true },
    { text: t('tiers.free.features.coreAnalyses'), included: true },
    { text: t('tiers.free.features.onDemand'), included: true, note: '2/month' },
    { text: t('tiers.free.features.translation'), included: false },
    { text: t('tiers.free.features.askQuestions'), included: false },
    { text: t('tiers.free.features.sharing'), included: true, note: t('comparison.values.basic') },
    { text: t('tiers.free.features.support'), included: true },
  ];

  // Pro tier features
  const professionalFeatures = [
    { text: t('tiers.professional.features.unlimited'), included: true },
    { text: t('tiers.professional.features.hours'), included: true },
    { text: t('tiers.professional.features.fileSize'), included: true },
    { text: t('tiers.professional.features.allAnalyses'), included: true },
    { text: t('tiers.professional.features.onDemandAnalyses'), included: true },
    { text: t('tiers.professional.features.translation'), included: true },
    { text: t('tiers.professional.features.askQuestions'), included: true },
    { text: t('tiers.professional.features.advancedSharing'), included: true },
    { text: t('tiers.professional.features.priority'), included: true },
    { text: t('tiers.professional.features.support'), included: true },
  ];

  // Enterprise tier features
  const enterpriseFeatures = [
    { text: t('tiers.enterprise.features.unlimited'), included: true },
    { text: t('tiers.enterprise.features.unlimitedHours'), included: true },
    { text: t('tiers.enterprise.features.largeFiles'), included: true },
    { text: t('tiers.enterprise.features.allAnalyses'), included: true },
    { text: t('tiers.enterprise.features.customIntegrations'), included: true },
    { text: t('tiers.enterprise.features.sso'), included: true },
    { text: t('tiers.enterprise.features.teamManagement'), included: true },
    { text: t('tiers.enterprise.features.dedicatedSupport'), included: true },
  ];

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-[#22184C] text-white overflow-x-hidden landing-page relative">
        <AmbientGradient />

        {/* Hero Section */}
        <section
          className="landing-section min-h-[60vh] !pt-[140px] flex items-center relative overflow-hidden"
          aria-label="Pricing hero"
        >

          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 text-center relative z-10">
            <SectionTag>{t('hero.tag')}</SectionTag>

            <h1 className="text-[clamp(36px,5vw,60px)] font-bold leading-[1.1] tracking-tight mb-6">
              {t('hero.headline1')}<br />{t('hero.headline2')}<em>{t('hero.headlineEm')}</em>
            </h1>
            <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-10">
              {t('hero.subtitle')}
            </p>

            <BillingToggle billingCycle={billingCycle} onToggle={handleBillingToggle} />
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="landing-section !pt-0">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid md:grid-cols-3 gap-4 items-start">
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
                ctaText={isTrialEligible ? t('tiers.professional.trialCta') : t('tiers.professional.cta')}
                ctaLink={getCtaLink('professional')}
                showGuarantee={true}
                guaranteeText={t('tiers.professional.guarantee')}
                trialBadge={t('tiers.professional.trialBadge')}
                locale={locale}
                currency={currency}
                billingCycle={billingCycle}
                onCtaClick={isTrialEligible ? handleStartTrial : undefined}
                ctaLoading={startingTrial}
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
        <section id="comparison" className="landing-section border-t border-white/[0.08]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <SectionTag>{t('sections.comparisonTag')}</SectionTag>

            <h2 className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-14">
              {t('comparison.headline1')}<em>{t('comparison.headlineEm')}</em>
            </h2>
            <FeatureComparisonTable />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="landing-section border-t border-white/[0.08]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <SectionTag>{t('sections.faqTag')}</SectionTag>

            <h2 className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-14">
              {t('faq.headline1')}<em>{t('faq.headlineEm')}</em>
            </h2>
            <div className="max-w-[800px] mx-auto">
              <PricingFAQ />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-section !py-[120px] text-center border-t border-white/[0.08]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
            <SectionTag>{t('sections.ctaTag')}</SectionTag>

            <h2 className="text-[clamp(36px,5vw,64px)] font-bold leading-[1.15] tracking-tight mb-4">
              {t('finalCta.headline1')}<br />{t('finalCta.headline2')}<em>{t('finalCta.headlineEm')}</em>
            </h2>

            <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-10">
              {t('finalCta.subtitle')}
            </p>

            <div className="flex gap-3 justify-center items-center mb-8 flex-wrap">
              <Link
                href={`/${locale}/signup`}
                className="inline-flex items-center bg-[#8D6AFA] text-white border-none px-9 py-4 rounded-[10px] text-base font-semibold transition-all hover:bg-[#7A5AE0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(141,106,250,0.35)]"
              >
                {t('finalCta.button')}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center bg-transparent text-white/60 border border-white/20 px-6 py-4 rounded-[10px] text-[15px] transition-all hover:border-white/40 hover:text-white"
              >
                {t('finalCta.contactSales')}
              </Link>
            </div>

            <div className="flex gap-6 justify-center text-[13px] text-white/30 flex-wrap">
              <span className="before:content-['✓_'] before:text-[#14D0DC]">{t('finalCta.noCreditCard')}</span>
              <span className="before:content-['✓_'] before:text-[#14D0DC]">{t('hero.freeTrial')}</span>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter locale={locale} />
    </>
  );
}
