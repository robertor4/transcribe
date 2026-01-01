import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import ScrollAnimation from '@/components/ScrollAnimation';
import { CTAButton } from '@/components/landing/CTAButton';
import { TransformationSection } from '@/components/landing/TransformationSection';

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <>
      <PublicHeader locale={locale} showFeaturesLink={false} />

      <div className="min-h-screen bg-white">

        {/* 1. Hero Section — deep purple background with white dot pattern */}
        <section
          className="min-h-screen flex items-center pt-24 pb-16 px-6 sm:px-8 lg:px-12 bg-[#23194B] relative"
          aria-label="Hero section"
        >
          {/* Dot pattern with gradient fade: 0% opacity left → 50% opacity right */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/assets/images/dotted-background-inverted.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage: 'linear-gradient(to right, transparent 0%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 100%)',
              opacity: 0.15,
            }}
            aria-hidden="true"
          />
          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left column — headline, subtitle, CTAs */}
              <div className="text-center lg:text-left">
                <ScrollAnimation delay={100}>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-none tracking-tight mb-8">
                    {t('hero.headline')}
                  </h1>
                </ScrollAnimation>

                <ScrollAnimation delay={200}>
                  <p className="text-xl sm:text-2xl text-gray-300 font-normal max-w-xl mx-auto lg:mx-0 mb-10">
                    {t('hero.subtitlePart1')}<span className="text-[#14D0DC]">{t('hero.subtitlePart2')}</span>
                  </p>
                </ScrollAnimation>

                <ScrollAnimation delay={300}>
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                    <CTAButton href={`/${locale}/examples`} variant="light">
                      {t('hero.ctaPrimary')}
                    </CTAButton>
                    <Link
                      href="#how-it-works"
                      className="text-gray-300/80 hover:text-white font-normal transition-colors hover:underline decoration-white/50 underline-offset-4 py-4"
                    >
                      {t('hero.ctaSecondary')}
                    </Link>
                  </div>
                </ScrollAnimation>
              </div>

              {/* Right column — overlapping document stack */}
              <ScrollAnimation delay={400}>
                <div className="flex justify-center lg:justify-end">
                  <div className="relative w-full max-w-md">
                    {/* Secondary document — partially visible behind primary, slightly shorter */}
                    <div
                      className="absolute -top-3 -left-4 w-full bg-white/80 rounded-lg shadow-md border border-gray-200/60 p-8 text-left transform -rotate-2"
                      aria-hidden="true"
                    >
                      {/* Document header with title and logotype */}
                      <div className="flex items-start justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-400">Client Follow-up Email</h3>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/logos/neural-summary-logotype.svg"
                          alt=""
                          className="h-5 w-auto opacity-20"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="space-y-3 text-gray-300 text-sm mb-6">
                        <p>Hi Sarah,</p>
                        <p>Following up on our call regarding the Q4 timeline...</p>
                        <p>Key points we discussed:</p>
                        <ul className="space-y-2 ml-4 opacity-80">
                          <li>• Enterprise onboarding priority confirmed</li>
                          <li>• Mobile app postponed to Q1</li>
                          <li>• API v2 on track for November</li>
                        </ul>
                      </div>
                    </div>

                    {/* Primary document — fully readable, dominant */}
                    <div className="relative w-full bg-white rounded-lg shadow-xl border border-gray-200 p-8 text-left transform lg:rotate-1 hover:rotate-0 transition-transform duration-300">
                      {/* Document header with title */}
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Q4 Product Strategy</h3>
                      </div>
                      <ul className="space-y-3 text-gray-700 text-sm mb-8">
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8D6AFA] text-white text-xs font-semibold flex items-center justify-center mr-3">A</span>
                          <span>Focus on enterprise onboarding flow redesign</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8D6AFA]/80 text-white text-xs font-semibold flex items-center justify-center mr-3">B</span>
                          <span>Defer mobile app to Q1 based on resource constraints</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8D6AFA]/60 text-white text-xs font-semibold flex items-center justify-center mr-3">C</span>
                          <span>API v2 launch targeting November release</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8D6AFA]/40 text-white text-xs font-semibold flex items-center justify-center mr-3">D</span>
                          <span>Hire two senior engineers for platform team</span>
                        </li>
                      </ul>
                      <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Decisions</h4>
                        <ul className="space-y-3 text-gray-600 text-sm">
                          <li className="flex items-center">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[#14D0DC] bg-[#14D0DC]/10 flex items-center justify-center mr-3">
                              <svg className="w-3 h-3 text-[#14D0DC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span>Proceed with Stripe integration over PayPal</span>
                          </li>
                          <li className="flex items-center">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[#14D0DC] bg-[#14D0DC]/10 flex items-center justify-center mr-3">
                              <svg className="w-3 h-3 text-[#14D0DC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span>Delay internationalization until Q2</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 2. Proof by Transformation — animated recording → document */}
        <TransformationSection />

        {/* 2.5. Recognition Moment — typography and whitespace only */}
        <section className="py-24 sm:py-32 px-6 sm:px-8 lg:px-12 bg-white relative overflow-hidden" aria-labelledby="recognition-heading">
          {/* Subtle dot pattern clipped to corner */}
          <div
            className="absolute -bottom-16 -right-16 w-[300px] h-[200px] pointer-events-none"
            style={{
              backgroundImage: 'url(/assets/images/dotted-background-inverted.webp)',
              backgroundSize: 'cover',
              opacity: 0.08,
              transform: 'rotate(-8deg)',
            }}
            aria-hidden="true"
          />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 id="recognition-heading" className="sr-only">The problem we solve</h2>
            <ScrollAnimation>
              <div className="space-y-3 text-xl sm:text-2xl text-gray-500 leading-relaxed mb-12">
                <p>{t('recognition.line1')}</p>
                <p>{t('recognition.line2')}</p>
                <p>{t('recognition.line3')}</p>
                <p>{t('recognition.line4')}</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation delay={400}>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {t('recognition.conclusion')}
              </p>
            </ScrollAnimation>
          </div>
        </section>

        {/* 3. Category Clarification — dark accent background */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-[#23194B] relative overflow-hidden" aria-labelledby="category-heading">
          {/* Dot pattern — bottom right, rotated */}
          <div
            className="absolute -bottom-32 -right-32 w-[600px] h-[400px] pointer-events-none"
            style={{
              backgroundImage: 'url(/assets/images/dotted-background-inverted.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'top left',
              opacity: 0.15,
              transform: 'rotate(-12deg) scale(2)',
            }}
            aria-hidden="true"
          />
          {/* Dot pattern — top left, rotated opposite direction, gradient fade */}
          <div
            className="absolute -top-24 -left-32 w-[500px] h-[350px] pointer-events-none"
            style={{
              backgroundImage: 'url(/assets/images/dotted-background-inverted.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'bottom right',
              maskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
              opacity: 0.15,
              transform: 'rotate(15deg) scale(2)',
            }}
            aria-hidden="true"
          />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <ScrollAnimation>
              <h2 id="category-heading" className="text-4xl sm:text-5xl font-bold text-white mb-8">
                {t('category.headline')}
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={200}>
              <p className="text-xl text-gray-300 mb-4">
                {t('category.line1')}
              </p>
              <p className="text-xl text-white font-medium mb-12">
                {t('category.line2')}
              </p>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <p className="text-2xl font-semibold text-[#14D0DC]">
                {t('category.tagline')}
              </p>
            </ScrollAnimation>
          </div>
        </section>

        {/* 4. Who It's For */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-gray-50" aria-labelledby="audience-heading">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollAnimation>
              <h2 id="audience-heading" className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
                {t('audience.headline')}
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={200}>
              <p className="text-xl text-gray-700 mb-12">
                {t('audience.description')}
              </p>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-lg text-gray-700">
                <li>{t('audience.role1')}</li>
                <li className="text-gray-300">•</li>
                <li>{t('audience.role2')}</li>
                <li className="text-gray-300">•</li>
                <li>{t('audience.role3')}</li>
                <li className="text-gray-300">•</li>
                <li>{t('audience.role4')}</li>
              </ul>
            </ScrollAnimation>
          </div>
        </section>

        {/* 5. How It Works — with brand-colored icons */}
        <section id="how-it-works" className="py-32 px-6 sm:px-8 lg:px-12 bg-white" aria-labelledby="how-heading">
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation>
              <h2 id="how-heading" className="text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-16">
                {t('how.headline')}
              </h2>
            </ScrollAnimation>

            <div className="grid md:grid-cols-3 gap-12">
              {/* Step 1 — reduced visual weight */}
              <ScrollAnimation delay={200}>
                <div className="text-center opacity-80">
                  {/* Waveform icon — muted */}
                  <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center gap-1 bg-gray-100 rounded-2xl p-3">
                    <div className="w-1 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-7 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                  </div>
                  <h3 className="text-base font-medium text-gray-700 mb-2">{t('how.step1.title')}</h3>
                  <p className="text-sm text-gray-500">{t('how.step1.description')}</p>
                </div>
              </ScrollAnimation>

              {/* Step 2 — emphasized as the hero */}
              <ScrollAnimation delay={400}>
                <div className="text-center relative">
                  {/* Subtle background highlight */}
                  <div className="absolute inset-0 -mx-4 -my-2 bg-[#8D6AFA]/5 rounded-2xl" aria-hidden="true"></div>
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

              {/* Step 3 — reduced visual weight */}
              <ScrollAnimation delay={600}>
                <div className="text-center opacity-80">
                  {/* Document icon — muted */}
                  <div className="w-14 h-14 mx-auto mb-6 bg-gray-100 rounded-2xl p-3 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-400 rounded p-1.5 flex flex-col justify-center gap-0.5">
                      <div className="w-full h-0.5 bg-gray-400"></div>
                      <div className="w-3/4 h-0.5 bg-gray-300"></div>
                      <div className="w-full h-0.5 bg-gray-400"></div>
                      <div className="w-1/2 h-0.5 bg-gray-300"></div>
                    </div>
                  </div>
                  <h3 className="text-base font-medium text-gray-700 mb-2">{t('how.step3.title')}</h3>
                  <p className="text-sm text-gray-500">{t('how.step3.description')}</p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 6. Professional Standards — conviction section */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden" aria-labelledby="trust-heading">
          {/* Subtle dot pattern clipped to left side */}
          <div
            className="absolute -top-8 -left-16 w-[250px] h-[180px] pointer-events-none"
            style={{
              backgroundImage: 'url(/assets/images/dotted-background-inverted.webp)',
              backgroundSize: 'cover',
              opacity: 0.06,
              transform: 'rotate(12deg)',
            }}
            aria-hidden="true"
          />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <ScrollAnimation>
              <h2 id="trust-heading" className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
                {t('trust.headline')}
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={200}>
              <p className="text-xl text-gray-700 mb-4">
                {t('trust.description')}
              </p>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <p className="text-xl text-gray-900 font-medium mb-12">
                {t('trust.reinforcement')}
              </p>
            </ScrollAnimation>

            <ScrollAnimation delay={600}>
              <p className="text-sm text-gray-500">
                {t('trust.proof')}
              </p>
            </ScrollAnimation>
          </div>
        </section>

        {/* 7. Closing CTA — bold brand section */}
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
                  href={`/${locale}/examples`}
                  className="inline-flex items-center justify-center px-8 py-3.5 font-semibold text-base rounded-full bg-white text-[#3F38A0] hover:bg-gray-100 transition-all shadow-lg"
                >
                  {t('closingCta.ctaPrimary')}
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="text-white/80 hover:text-white font-medium transition-colors underline underline-offset-4"
                >
                  {t('closingCta.ctaSecondary')}
                </Link>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* 8. Footer — dark brand footer */}
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
