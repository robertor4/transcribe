import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import ScrollAnimation from '@/components/ScrollAnimation';
import { CTAButton } from '@/components/landing/CTAButton';
import { TransformationSection } from '@/components/landing/TransformationSection';
import { DottedBackgroundDrift } from '@/components/landing/hero/DottedBackgroundDrift';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { HeroCTAs } from '@/components/landing/hero/HeroCTAs';
import { SecondaryLink } from '@/components/landing/hero/SecondaryLink';
import { DocumentStack } from '@/components/landing/hero/DocumentStack';

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-white overflow-x-hidden">

        {/* 1. Hero Section — deep purple background with animated dot pattern */}
        <section
          className="min-h-screen flex items-center pt-24 pb-16 px-6 sm:px-8 lg:px-12 bg-[#23194B] relative overflow-hidden"
          aria-label="Hero section"
        >
          {/* Animated dot pattern with ultra-slow drift */}
          <DottedBackgroundDrift />

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left column — headline, subtitle, CTAs with entrance animations */}
              <div className="text-center lg:text-left">
                <HeroHeadline>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-none tracking-tight mb-8">
                    {t('hero.headline')}
                  </h1>
                </HeroHeadline>

                <HeroHeadline delay={120}>
                  <p className="text-xl sm:text-2xl text-gray-300 font-normal max-w-xl mx-auto lg:mx-0 mb-10">
                    {t('hero.subtitlePart1')}<span className="text-[#14D0DC]">{t('hero.subtitlePart2')}</span>
                  </p>
                </HeroHeadline>

                <HeroCTAs delay={240}>
                  <CTAButton href={`/${locale}/examples`} variant="light">
                    {t('hero.ctaPrimary')}
                  </CTAButton>
                  <SecondaryLink href="#how-it-works">
                    {t('hero.ctaSecondary')}
                  </SecondaryLink>
                </HeroCTAs>
              </div>

              {/* Right column — document stack with breathing motion + progressive reveal */}
              <DocumentStack />
            </div>
          </div>
        </section>

        {/* 2. Proof by Transformation — animated recording → document */}
        <TransformationSection />

        {/* 3. How It Works — with brand-colored icons */}
        <section id="how-it-works" className="py-32 px-6 sm:px-8 lg:px-12 bg-white" aria-labelledby="how-heading">
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation>
              <h2 id="how-heading" className="text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-16">
                {t('how.headline')}
              </h2>
            </ScrollAnimation>

            <div className="grid md:grid-cols-3 gap-12 items-center">
              {/* Step 1 — cyan accent */}
              <ScrollAnimation delay={200}>
                <div className="text-center">
                  {/* Waveform icon — cyan */}
                  <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center gap-1 bg-[#14D0DC]/10 rounded-2xl p-3">
                    <div className="w-1 h-3 bg-[#14D0DC] rounded-full"></div>
                    <div className="w-1 h-6 bg-[#14D0DC]/70 rounded-full"></div>
                    <div className="w-1 h-4 bg-[#14D0DC] rounded-full"></div>
                    <div className="w-1 h-7 bg-[#14D0DC]/70 rounded-full"></div>
                    <div className="w-1 h-4 bg-[#14D0DC] rounded-full"></div>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">{t('how.step1.title')}</h3>
                  <p className="text-sm text-gray-600">{t('how.step1.description')}</p>
                </div>
              </ScrollAnimation>

              {/* Step 2 — emphasized as the hero */}
              <ScrollAnimation delay={400}>
                <div className="text-center relative">
                  {/* Subtle background highlight */}
                  <div className="absolute inset-0 -mx-6 -my-6 bg-[#8D6AFA]/5 rounded-2xl" aria-hidden="true"></div>
                  <div className="relative">
                    {/* Grid icon — brand purple, larger */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-[#8D6AFA]/15 rounded-2xl p-4 flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="w-4 h-4 bg-[#8D6AFA] rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA]/50 rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA] rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA]/50 rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA] rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA]/50 rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA] rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA]/50 rounded-sm"></div>
                        <div className="w-4 h-4 bg-[#8D6AFA] rounded-sm"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('how.step2.title')}</h3>
                    <p className="text-gray-600">{t('how.step2.description')}</p>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Step 3 — deep purple accent */}
              <ScrollAnimation delay={600}>
                <div className="text-center">
                  {/* Document icon — deep purple */}
                  <div className="w-14 h-14 mx-auto mb-6 bg-[#3F38A0]/10 rounded-2xl p-3 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#3F38A0] rounded p-1.5 flex flex-col justify-center gap-0.5">
                      <div className="w-full h-0.5 bg-[#3F38A0]"></div>
                      <div className="w-3/4 h-0.5 bg-[#3F38A0]/50"></div>
                      <div className="w-full h-0.5 bg-[#3F38A0]"></div>
                      <div className="w-1/2 h-0.5 bg-[#3F38A0]/50"></div>
                    </div>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">{t('how.step3.title')}</h3>
                  <p className="text-sm text-gray-600">{t('how.step3.description')}</p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 4. FAQ Section */}
        <section id="faq" className="py-32 px-6 sm:px-8 lg:px-12 bg-white" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <ScrollAnimation>
              <h2 id="faq-heading" className="text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-16">
                {t('faq.title')}
              </h2>
            </ScrollAnimation>

            <div className="space-y-8">
              <ScrollAnimation delay={200}>
                <div className="border-b border-gray-200 pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('faq.q1.question')}
                  </h3>
                  <p className="text-gray-600">
                    {t('faq.q1.answer')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation delay={300}>
                <div className="border-b border-gray-200 pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('faq.q2.question')}
                  </h3>
                  <p className="text-gray-600">
                    {t('faq.q2.answer')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation delay={400}>
                <div className="border-b border-gray-200 pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('faq.q3.question')}
                  </h3>
                  <p className="text-gray-600">
                    {t('faq.q3.answer')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation delay={500}>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('faq.q4.question')}
                  </h3>
                  <p className="text-gray-600">
                    {t('faq.q4.answer')}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 5. Closing CTA — bold brand section */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-[#3F38A0]" aria-label="Get started">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollAnimation>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12">
                {t('closingCta.headline')}
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={200}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  href={`/${locale}/signup`}
                  className="inline-flex items-center justify-center px-8 py-3.5 font-semibold text-base rounded-full bg-white text-[#3F38A0] hover:bg-gray-100 transition-all shadow-lg"
                >
                  {t('closingCta.ctaPrimary')}
                </Link>
                <Link
                  href={`/${locale}/examples`}
                  className="text-white/80 hover:text-white font-medium transition-colors underline underline-offset-4"
                >
                  {t('closingCta.ctaSecondary')}
                </Link>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* 6. Footer — dark brand footer */}
        <footer className="py-16 px-6 sm:px-8 lg:px-12 bg-[#23194B]" aria-label="Footer">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-12">
              {/* White logo for dark background */}
              <Link href={`/${locale}/landing`} className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logos/neural-summary-logo-white.svg"
                  alt="Neural Summary"
                  className="h-10 w-auto"
                  width={200}
                  height={40}
                />
              </Link>

              {/* Navigation */}
              <nav className="flex flex-wrap gap-8 text-sm text-gray-400">
                <Link href={`/${locale}/features`} className="hover:text-white transition-colors">
                  {t('footer.product')}
                </Link>
                <Link href={`/${locale}/examples`} className="hover:text-white transition-colors">
                  {t('footer.examples')}
                </Link>
                <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
                  {t('footer.security')}
                </Link>
                <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">
                  {t('footer.contact')}
                </Link>
              </nav>
            </div>

            <div className="text-sm text-gray-500">
              {t('footer.copyright')}
            </div>
          </div>
        </footer>

        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://neuralsummary.com/#organization',
                  name: 'Neural Summary',
                  url: 'https://neuralsummary.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://neuralsummary.com/assets/logos/neural-summary-logo.svg',
                  },
                  description: 'AI workspace that turns spoken thinking into structured, professional output.',
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://neuralsummary.com/#software',
                  name: 'Neural Summary',
                  applicationCategory: 'BusinessApplication',
                  applicationSubCategory: 'Speech-to-Structure Workspace',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free tier available',
                  },
                  featureList: [
                    'Speech-to-structure transformation',
                    'Decision summaries',
                    'Feature specifications',
                    'Structured notes',
                    'Client-ready reports',
                    'Speaker identification',
                    '50+ languages supported',
                  ],
                  description: 'Neural Summary turns spoken thinking into structured, professional output. Speak once. Get something you can use.',
                },
              ],
            }),
          }}
        />
      </div>
    </>
  );
}
