import React from 'react';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { CTAButton } from '@/components/landing/CTAButton';
import { SecondaryLink } from '@/components/landing/hero/SecondaryLink';

// Dynamic imports for heavy client components (framer-motion)
// This significantly reduces the initial bundle size for the landing page
const ScrollAnimation = dynamic(() => import('@/components/ScrollAnimation'), {
  ssr: true,
});

const TransformationSection = dynamic(
  () => import('@/components/landing/TransformationSection').then(mod => ({ default: mod.TransformationSection })),
  { ssr: true }
);

const DottedBackgroundDrift = dynamic(
  () => import('@/components/landing/hero/DottedBackgroundDrift').then(mod => ({ default: mod.DottedBackgroundDrift })),
  { ssr: true }
);

const HeroHeadline = dynamic(
  () => import('@/components/landing/hero/HeroHeadline').then(mod => ({ default: mod.HeroHeadline })),
  { ssr: true }
);

const HeroCTAs = dynamic(
  () => import('@/components/landing/hero/HeroCTAs').then(mod => ({ default: mod.HeroCTAs })),
  { ssr: true }
);

const DocumentStack = dynamic(
  () => import('@/components/landing/hero/DocumentStack').then(mod => ({ default: mod.DocumentStack })),
  { ssr: true }
);

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
              <DocumentStack translations={{
                backTitle: t('hero.document.backTitle'),
                backGreeting: t('hero.document.backGreeting'),
                backIntro: t('hero.document.backIntro'),
                backPointsIntro: t('hero.document.backPointsIntro'),
                backPoint1: t('hero.document.backPoint1'),
                backPoint2: t('hero.document.backPoint2'),
                backPoint3: t('hero.document.backPoint3'),
                frontTitle: t('hero.document.frontTitle'),
                frontBullet1: t('hero.document.frontBullet1'),
                frontBullet2: t('hero.document.frontBullet2'),
                frontBullet3: t('hero.document.frontBullet3'),
                frontBullet4: t('hero.document.frontBullet4'),
                decisionsTitle: t('hero.document.decisionsTitle'),
                decision1: t('hero.document.decision1'),
                decision2: t('hero.document.decision2'),
              }} />
            </div>
          </div>
        </section>

        {/* 2. Proof by Transformation — animated recording → document */}
        <TransformationSection translations={{
          recording: t('transformation.recording'),
          quote1: t('transformation.quote1'),
          quote2: t('transformation.quote2'),
          quote3: t('transformation.quote3'),
          quote4: t('transformation.quote4'),
          quote5: t('transformation.quote5'),
          quote6: t('transformation.quote6'),
          documentTitle: t('transformation.documentTitle'),
          greeting: t('transformation.greeting'),
          intro: t('transformation.intro'),
          point1: t('transformation.point1'),
          point2: t('transformation.point2'),
          point3: t('transformation.point3'),
          nextStepLabel: t('transformation.nextStepLabel'),
          nextStepText: t('transformation.nextStepText'),
        }} />

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
                <CTAButton href={`/${locale}/signup`} variant="light">
                  {t('closingCta.ctaPrimary')}
                </CTAButton>
                <SecondaryLink href={`/${locale}/examples`}>
                  {t('closingCta.ctaSecondary')}
                </SecondaryLink>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* 6. Footer — dark brand footer */}
        <PublicFooter locale={locale} />

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
