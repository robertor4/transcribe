import React from 'react';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import ScrollAnimation from '@/components/ScrollAnimation';
import { CTAButton } from '@/components/landing/CTAButton';
import { DottedBackgroundDrift } from '@/components/landing/hero/DottedBackgroundDrift';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { HeroCTAs } from '@/components/landing/hero/HeroCTAs';
import { SecondaryLink } from '@/components/landing/hero/SecondaryLink';

export default async function ProductOwnerLandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'productOwnerLanding' });

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-white overflow-x-hidden">

        {/* 1. Hero Section — Product Owner focused */}
        <section
          className="min-h-screen flex items-center pt-24 pb-16 px-6 sm:px-8 lg:px-12 bg-[#23194B] relative overflow-hidden"
          aria-label="Hero section"
        >
          <DottedBackgroundDrift />

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left column — headline and CTAs */}
              <div className="text-center lg:text-left">
                <HeroHeadline>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8D6AFA]/20 border border-[#8D6AFA]/30 mb-6">
                    <span className="text-[#8D6AFA] text-sm font-medium">{t('hero.badge')}</span>
                  </div>
                </HeroHeadline>

                <HeroHeadline delay={80}>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
                    {t('hero.headline')}
                  </h1>
                </HeroHeadline>

                <HeroHeadline delay={160}>
                  <p className="text-xl sm:text-2xl text-gray-300 font-normal max-w-xl mx-auto lg:mx-0 mb-10">
                    {t('hero.subtitle')}
                  </p>
                </HeroHeadline>

                <HeroCTAs delay={240}>
                  <CTAButton href={`/${locale}/signup`} variant="brand">
                    {t('hero.ctaPrimary')}
                  </CTAButton>
                  <SecondaryLink href="#use-cases">
                    {t('hero.ctaSecondary')}
                  </SecondaryLink>
                </HeroCTAs>
              </div>

              {/* Right column — Pain points visualization */}
              <div className="hidden lg:block">
                <HeroHeadline delay={300}>
                  <div className="relative">
                    {/* Before state - scattered notes */}
                    <div className="absolute -top-4 -left-4 w-48 h-32 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 transform -rotate-6 opacity-60">
                      <div className="text-xs text-gray-400 mb-2">{t('hero.visual.before.title')}</div>
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-gray-600/50 rounded"></div>
                        <div className="h-2 w-3/4 bg-gray-600/50 rounded"></div>
                        <div className="h-2 w-1/2 bg-gray-600/50 rounded"></div>
                      </div>
                    </div>

                    {/* After state - structured output */}
                    <div className="bg-white rounded-xl shadow-2xl p-6 ml-12 mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-[#8D6AFA]"></div>
                        <span className="text-sm font-semibold text-gray-900">{t('hero.visual.after.title')}</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded bg-[#14D0DC]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[#14D0DC] text-xs">1</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{t('hero.visual.after.item1.title')}</div>
                            <div className="text-xs text-gray-500">{t('hero.visual.after.item1.desc')}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[#8D6AFA] text-xs">2</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{t('hero.visual.after.item2.title')}</div>
                            <div className="text-xs text-gray-500">{t('hero.visual.after.item2.desc')}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded bg-[#3F38A0]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[#3F38A0] text-xs">3</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{t('hero.visual.after.item3.title')}</div>
                            <div className="text-xs text-gray-500">{t('hero.visual.after.item3.desc')}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400">{t('hero.visual.after.footer')}</div>
                      </div>
                    </div>
                  </div>
                </HeroHeadline>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Pain Points Section */}
        <section className="py-24 px-6 sm:px-8 lg:px-12 bg-gray-50" aria-labelledby="pain-heading">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation>
              <h2 id="pain-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
                {t('painPoints.headline')}
              </h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-16">
                {t('painPoints.subheadline')}
              </p>
            </ScrollAnimation>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Pain Point 1 */}
              <ScrollAnimation delay={100}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#8D6AFA]/30 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('painPoints.pain1.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('painPoints.pain1.description')}</p>
                </div>
              </ScrollAnimation>

              {/* Pain Point 2 */}
              <ScrollAnimation delay={200}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#8D6AFA]/30 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('painPoints.pain2.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('painPoints.pain2.description')}</p>
                </div>
              </ScrollAnimation>

              {/* Pain Point 3 */}
              <ScrollAnimation delay={300}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#8D6AFA]/30 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('painPoints.pain3.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('painPoints.pain3.description')}</p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 3. Use Cases Section */}
        <section id="use-cases" className="py-24 px-6 sm:px-8 lg:px-12 bg-white" aria-labelledby="usecases-heading">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation>
              <h2 id="usecases-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
                {t('useCases.headline')}
              </h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-16">
                {t('useCases.subheadline')}
              </p>
            </ScrollAnimation>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Use Case 1 - Sprint Planning */}
              <ScrollAnimation delay={100}>
                <div className="group relative bg-gradient-to-br from-[#8D6AFA]/5 to-transparent rounded-2xl p-8 border border-[#8D6AFA]/10 hover:border-[#8D6AFA]/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#8D6AFA]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-[#8D6AFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('useCases.case1.title')}</h3>
                      <p className="text-gray-600 mb-4">{t('useCases.case1.description')}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-[#8D6AFA]/10 text-[#8D6AFA] text-xs font-medium rounded-full">{t('useCases.case1.tag1')}</span>
                        <span className="px-3 py-1 bg-[#14D0DC]/10 text-[#14D0DC] text-xs font-medium rounded-full">{t('useCases.case1.tag2')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Use Case 2 - Stakeholder Interviews */}
              <ScrollAnimation delay={200}>
                <div className="group relative bg-gradient-to-br from-[#14D0DC]/5 to-transparent rounded-2xl p-8 border border-[#14D0DC]/10 hover:border-[#14D0DC]/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#14D0DC]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-[#14D0DC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('useCases.case2.title')}</h3>
                      <p className="text-gray-600 mb-4">{t('useCases.case2.description')}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-[#14D0DC]/10 text-[#14D0DC] text-xs font-medium rounded-full">{t('useCases.case2.tag1')}</span>
                        <span className="px-3 py-1 bg-[#8D6AFA]/10 text-[#8D6AFA] text-xs font-medium rounded-full">{t('useCases.case2.tag2')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Use Case 3 - User Research */}
              <ScrollAnimation delay={300}>
                <div className="group relative bg-gradient-to-br from-[#3F38A0]/5 to-transparent rounded-2xl p-8 border border-[#3F38A0]/10 hover:border-[#3F38A0]/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#3F38A0]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-[#3F38A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('useCases.case3.title')}</h3>
                      <p className="text-gray-600 mb-4">{t('useCases.case3.description')}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-[#3F38A0]/10 text-[#3F38A0] text-xs font-medium rounded-full">{t('useCases.case3.tag1')}</span>
                        <span className="px-3 py-1 bg-[#14D0DC]/10 text-[#14D0DC] text-xs font-medium rounded-full">{t('useCases.case3.tag2')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Use Case 4 - Customer Calls */}
              <ScrollAnimation delay={400}>
                <div className="group relative bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl p-8 border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('useCases.case4.title')}</h3>
                      <p className="text-gray-600 mb-4">{t('useCases.case4.description')}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-medium rounded-full">{t('useCases.case4.tag1')}</span>
                        <span className="px-3 py-1 bg-[#8D6AFA]/10 text-[#8D6AFA] text-xs font-medium rounded-full">{t('useCases.case4.tag2')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 4. Templates Section */}
        <section className="py-24 px-6 sm:px-8 lg:px-12 bg-[#23194B]" aria-labelledby="templates-heading">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation>
              <h2 id="templates-heading" className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
                {t('templates.headline')}
              </h2>
              <p className="text-lg text-gray-300 text-center max-w-2xl mx-auto mb-16">
                {t('templates.subheadline')}
              </p>
            </ScrollAnimation>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Template cards */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <ScrollAnimation key={num} delay={num * 50}>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-[#8D6AFA]/50 hover:bg-white/10 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-[#8D6AFA]/20 flex items-center justify-center mb-4 group-hover:bg-[#8D6AFA]/30 transition-colors">
                      <svg className="w-5 h-5 text-[#8D6AFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">{t(`templates.template${num}.title`)}</h3>
                    <p className="text-sm text-gray-400">{t(`templates.template${num}.description`)}</p>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Transformation Example */}
        <section className="py-24 px-6 sm:px-8 lg:px-12 bg-white" aria-labelledby="transform-heading">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation>
              <h2 id="transform-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
                {t('transformation.headline')}
              </h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-16">
                {t('transformation.subheadline')}
              </p>
            </ScrollAnimation>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Before - Meeting Recording */}
              <ScrollAnimation delay={100}>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">{t('transformation.before.label')}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 italic">&quot;{t('transformation.before.quote1')}&quot;</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 italic">&quot;{t('transformation.before.quote2')}&quot;</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 italic">&quot;{t('transformation.before.quote3')}&quot;</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('transformation.before.duration')}
                  </div>
                </div>
              </ScrollAnimation>

              {/* After - Structured Output */}
              <ScrollAnimation delay={200}>
                <div className="bg-gradient-to-br from-[#8D6AFA]/5 to-[#14D0DC]/5 rounded-2xl p-6 border border-[#8D6AFA]/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#8D6AFA]"></div>
                    <span className="text-sm font-medium text-gray-700">{t('transformation.after.label')}</span>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4">{t('transformation.after.title')}</h4>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-medium text-[#8D6AFA] uppercase tracking-wide mb-2">{t('transformation.after.section1.title')}</div>
                        <ul className="space-y-1">
                          <li className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-[#14D0DC]">•</span>
                            {t('transformation.after.section1.item1')}
                          </li>
                          <li className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-[#14D0DC]">•</span>
                            {t('transformation.after.section1.item2')}
                          </li>
                        </ul>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-[#8D6AFA] uppercase tracking-wide mb-2">{t('transformation.after.section2.title')}</div>
                        <ul className="space-y-1">
                          <li className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-[#14D0DC]">•</span>
                            {t('transformation.after.section2.item1')}
                          </li>
                          <li className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-[#14D0DC]">•</span>
                            {t('transformation.after.section2.item2')}
                          </li>
                        </ul>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-[#8D6AFA] uppercase tracking-wide mb-2">{t('transformation.after.section3.title')}</div>
                        <ul className="space-y-1">
                          <li className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-emerald-500">✓</span>
                            {t('transformation.after.section3.item1')}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-[#8D6AFA]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t('transformation.after.generated')}
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 6. Coming Soon Features */}
        <section className="py-24 px-6 sm:px-8 lg:px-12 bg-gray-50" aria-labelledby="roadmap-heading">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8D6AFA]/10 border border-[#8D6AFA]/20 mb-6 mx-auto block w-fit">
                <span className="text-[#8D6AFA] text-sm font-medium">{t('roadmap.badge')}</span>
              </div>
              <h2 id="roadmap-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
                {t('roadmap.headline')}
              </h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-16">
                {t('roadmap.subheadline')}
              </p>
            </ScrollAnimation>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 - JIRA Integration */}
              <ScrollAnimation delay={100}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('roadmap.feature1.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('roadmap.feature1.description')}</p>
                </div>
              </ScrollAnimation>

              {/* Feature 2 - AI Interview */}
              <ScrollAnimation delay={200}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('roadmap.feature2.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('roadmap.feature2.description')}</p>
                </div>
              </ScrollAnimation>

              {/* Feature 3 - Team Workspace */}
              <ScrollAnimation delay={300}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('roadmap.feature3.title')}</h3>
                  <p className="text-gray-600 text-sm">{t('roadmap.feature3.description')}</p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* 7. Closing CTA */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-[#3F38A0]" aria-label="Get started">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollAnimation>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                {t('closingCta.headline')}
              </h2>
              <p className="text-xl text-gray-300 mb-12">
                {t('closingCta.subheadline')}
              </p>
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

        {/* 8. Footer */}
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
                  name: 'Neural Summary for Product Owners',
                  applicationCategory: 'BusinessApplication',
                  applicationSubCategory: 'Product Management Tools',
                  operatingSystem: 'Web',
                  audience: {
                    '@type': 'Audience',
                    audienceType: 'Product Owners, Product Managers, Scrum Masters',
                  },
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free tier available',
                  },
                  featureList: [
                    'Sprint planning notes generation',
                    'PRD creation from stakeholder interviews',
                    'User research insights extraction',
                    'Customer call summaries',
                    'Release notes automation',
                    'Action items tracking',
                    'User story generation',
                    'Technical decision records',
                  ],
                  description: 'Transform product meetings into PRDs, user stories, and structured documentation. Built for Product Owners who want to spend less time writing and more time shipping.',
                },
              ],
            }),
          }}
        />
      </div>
    </>
  );
}
