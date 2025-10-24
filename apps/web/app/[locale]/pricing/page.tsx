'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { ArrowRight, Globe, Clock, FileText, Share2, Headphones, Zap, Package } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('pricing');

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Currency and pricing based on locale
  const isEuro = locale !== 'en';
  const currencySymbol = isEuro ? '€' : '$';
  const currency = isEuro ? 'EUR' : 'USD';

  // Pricing (approximate EUR conversion: 1 USD ≈ 0.92 EUR)
  const pricing = {
    professional: {
      monthly: isEuro ? 27 : 29,
      annual: isEuro ? 20 : 21.75,
      annualTotal: isEuro ? 240 : 261,
    },
    payg: isEuro ? 1.40 : 1.50,
  };

  // Standardized feature lists for each tier with icons and categories
  const freeFeatures = [
    { text: t('tiers.free.features.transcriptions'), included: true, icon: FileText, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.duration'), included: true, icon: Clock, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.fileSize'), included: true, icon: Package, category: t('featureCategories.transcription') },
    { text: t('tiers.free.features.coreAnalyses'), included: true, icon: Zap, category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.onDemand'), included: true, note: '2/month', category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.translation'), included: false, icon: Globe, category: t('featureCategories.analysis') },
    { text: t('tiers.free.features.sharing'), included: true, note: 'Basic', icon: Share2, category: t('featureCategories.collaboration') },
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
      <PublicHeader locale={locale} showFeaturesLink={true} />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              {t('hero.subtitle')}
            </p>

            {/* Billing Toggle */}
            <BillingToggle billingCycle={billingCycle} onToggle={setBillingCycle} />
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
              price={billingCycle === 'monthly' ? pricing.professional.monthly : pricing.professional.annual}
              priceUnit="/month"
              billingNote={billingCycle === 'annual' ? `Billed annually (${currencySymbol}${pricing.professional.annualTotal}/year)` : undefined}
              title={t('tiers.professional.title')}
              description={t('tiers.professional.description')}
              featured={true}
              features={professionalFeatures}
              ctaText={t('tiers.professional.cta')}
              ctaLink={`/checkout/professional?cycle=${billingCycle}`}
              showGuarantee={true}
              guaranteeText={t('tiers.professional.guarantee')}
              currencySymbol={currencySymbol}
              currency={currency}
            />

            {/* Pay-As-You-Go */}
            <PricingCard
              tier="payg"
              price={pricing.payg}
              priceUnit={t('tiers.payg.priceUnit')}
              title={t('tiers.payg.title')}
              description={t('tiers.payg.description')}
              features={paygFeatures}
              ctaText={t('tiers.payg.cta')}
              ctaLink="/checkout/payg"
              currencySymbol={currencySymbol}
              currency={currency}
            />
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="comparison" className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t('comparison.title')}
          </h2>
          <FeatureComparisonTable />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 px-4 sm:px-6 lg:px-8">
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
            href={`/${locale}/signup`}
            className="inline-flex items-center px-8 py-4 bg-white text-[#cc3399] font-semibold text-lg rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            {t('finalCta.button')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
      </div>

      <PublicFooter locale={locale} />
    </>
  );
}
