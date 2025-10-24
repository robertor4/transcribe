import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pricing.metadata');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  };
}

export default function PricingPage() {
  const t = useTranslations('pricing');

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
  );
}
