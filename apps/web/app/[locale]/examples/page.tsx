import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { ExamplesPageClient } from '@/components/examples/ExamplesPageClient';
import { CTAButton } from '@/components/landing/CTAButton';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'examples' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  };
}

export default async function ExamplesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'examples' });

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-white overflow-x-hidden">

        {/* Hero Section */}
        <section
          className="pt-32 pb-16 px-6 sm:px-8 lg:px-12 bg-[#23194B] relative"
          aria-label="Examples hero"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
              {t('hero.headline')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 font-normal max-w-2xl mx-auto mb-8">
              {t('hero.subtitle')}
            </p>
            {/* Scenario badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <span className="relative flex items-center justify-center w-4 h-4">
                <span className="absolute w-4 h-4 rounded-full border border-white/40" />
                <span className="w-2 h-2 rounded-full bg-[#14D0DC] animate-pulse" />
              </span>
              <span className="text-sm text-gray-200 font-medium">{t('hero.scenarioLabel')}</span>
            </div>
          </div>
        </section>

        {/* Examples Grid */}
        <section
          className="py-16 sm:py-24 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white"
          aria-labelledby="examples-heading"
        >
          <h2 id="examples-heading" className="sr-only">Example outputs</h2>
          <ExamplesPageClient
            translations={{
              actionItems: t('cards.actionItems.title'),
              email: t('cards.email.title'),
              blogPost: t('cards.blogPost.title'),
              linkedin: t('cards.linkedin.title'),
              communicationAnalysis: t('cards.communicationAnalysis.title'),
            }}
            scenarioLabels={{
              productLaunch: t('scenarios.productLaunch'),
              clientDiscovery: t('scenarios.clientDiscovery'),
            }}
            content={t.raw('content')}
          />
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32 px-6 sm:px-8 lg:px-12 bg-[#3F38A0]" aria-label="Get started">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12">
              {t('cta.headline')}
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <CTAButton href={`/${locale}/signup`} variant="light">
                {t('cta.primaryButton')}
              </CTAButton>
              <Link
                href={`/${locale}/pricing`}
                className="text-white/80 hover:text-white font-medium transition-colors underline underline-offset-4"
              >
                {t('cta.secondaryLink')}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <PublicFooter locale={locale} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Examples | Neural Summary',
              description: 'One conversation becomes four work-ready outputs. See the transformation.',
              mainEntity: {
                '@type': 'SoftwareApplication',
                name: 'Neural Summary',
                applicationCategory: 'BusinessApplication',
                description: 'AI workspace that turns spoken thinking into structured, professional output.',
              },
            }),
          }}
        />
      </div>
    </>
  );
}
