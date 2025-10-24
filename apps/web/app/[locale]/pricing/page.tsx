'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MobileNav } from '@/components/MobileNav';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { user } = useAuth();
  const t = useTranslations('pricing');
  const tCommon = useTranslations('common');
  const tLanding = useTranslations('landing');

  // Feature lists for each tier
  const freeFeatures = [
    { text: t('tiers.free.features.transcriptions'), included: true },
    { text: t('tiers.free.features.duration'), included: true },
    { text: t('tiers.free.features.fileSize'), included: true },
    { text: t('tiers.free.features.coreAnalyses'), included: true },
    { text: t('tiers.free.features.onDemand'), included: true, note: '2/month' },
    { text: t('tiers.free.features.translation'), included: false },
    { text: t('tiers.free.features.sharing'), included: true, note: 'Basic' },
    { text: t('tiers.free.features.batch'), included: false },
  ];

  const professionalFeatures = [
    { text: t('tiers.professional.features.hours'), included: true },
    { text: t('tiers.professional.features.unlimited'), included: true },
    { text: t('tiers.professional.features.allAnalyses'), included: true },
    { text: t('tiers.professional.features.translation'), included: true },
    { text: t('tiers.professional.features.advancedSharing'), included: true },
    { text: t('tiers.professional.features.batch'), included: true },
    { text: t('tiers.professional.features.priority'), included: true },
    { text: t('tiers.professional.features.overage'), included: true, note: '$0.50/hour' },
  ];

  const paygFeatures = [
    { text: t('tiers.payg.features.noSubscription'), included: true },
    { text: t('tiers.payg.features.allFeatures'), included: true },
    { text: t('tiers.payg.features.noExpiry'), included: true },
    { text: t('tiers.payg.features.minimum'), included: true, note: '$15 min' },
    { text: t('tiers.payg.features.rate'), included: true, note: '$1.50/hour' },
  ];

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${locale}/landing`} className="flex items-center">
              <img
                src="/assets/NS-symbol.webp"
                alt="Neural Summary"
                className="h-8 w-auto mr-2 sm:mr-3"
                width={32}
                height={32}
              />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {tCommon('appName')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{tLanding('hero.byline')}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href={`/${locale}/pricing`}
                className="text-[#cc3399] hover:text-[#b82d89] font-medium transition-colors"
                aria-label="View pricing plans"
              >
                {tLanding('nav.pricing')}
              </Link>
              <LanguageSwitcher />
              {user ? (
                <Link
                  href={`/${locale}/dashboard`}
                  className="px-4 py-2 bg-[#cc3399] text-white font-medium rounded-lg hover:bg-[#b82d89] transition-colors"
                  aria-label="Go to Dashboard"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                    aria-label="Log in to Neural Summary"
                  >
                    {tLanding('nav.login')}
                  </Link>
                  <Link
                    href={`/${locale}/login`}
                    className="px-4 py-2 bg-[#cc3399] text-white font-medium rounded-lg hover:bg-[#b82d89] transition-colors"
                    aria-label="Get started with Neural Summary"
                  >
                    {tLanding('nav.getStarted')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav locale={locale} />
          </div>
        </nav>
      </header>

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <PricingCard
              tier="free"
              price={0}
              title={t('tiers.free.title')}
              description={t('tiers.free.description')}
              features={freeFeatures}
              ctaText={t('tiers.free.cta')}
              ctaLink="/login"
            />

            {/* Professional Tier */}
            <PricingCard
              tier="professional"
              price={29}
              title={t('tiers.professional.title')}
              description={t('tiers.professional.description')}
              featured={true}
              features={professionalFeatures}
              ctaText={t('tiers.professional.cta')}
              ctaLink="/checkout/professional"
            />

            {/* Pay-As-You-Go */}
            <PricingCard
              tier="payg"
              price={1.50}
              priceUnit={t('tiers.payg.priceUnit')}
              title={t('tiers.payg.title')}
              description={t('tiers.payg.description')}
              features={paygFeatures}
              ctaText={t('tiers.payg.cta')}
              ctaLink="/checkout/payg"
            />
          </div>

          {/* Multi-currency notice */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('hero.currencyNotice')}
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t('comparison.title')}
          </h2>
          <FeatureComparisonTable />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t('faq.title')}
          </h2>
          <PricingFAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#cc3399] to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {t('finalCta.subtitle')}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-4 bg-white text-[#cc3399] font-semibold text-lg rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            {t('finalCta.button')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}
