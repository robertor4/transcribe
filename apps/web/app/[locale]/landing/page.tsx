import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import ScrollAnimation from '@/components/ScrollAnimation';
import { MeetingPlatforms } from '@/components/landing/MeetingPlatforms';
import { MeetingUseCases } from '@/components/landing/MeetingUseCases';
import { MeetingFAQ } from '@/components/landing/MeetingFAQ';
import { CTAButton } from '@/components/landing/CTAButton';
import { ThreeStepsAnimation } from '@/components/landing/ThreeStepsAnimation';
import WorkflowCarousel from '@/components/landing/WorkflowCarousel';
import { getPricingForLocale, formatPriceLocale } from '@transcribe/shared';
import type { Metadata } from 'next';
import {
  Shield,
  Brain,
  Lock,
  Award,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Mic,
  Sparkles
} from 'lucide-react';

// SEO Metadata for meeting-focused landing page
export const metadata: Metadata = {
  title: 'AI Meeting Summarizer & Notes App | Neural Summary',
  description: 'Best AI meeting notes app for automatic meeting transcription and summary. Turn Zoom, Teams, and Google Meet recordings into actionable notes instantly. 99.5% accuracy, 50+ languages supported.',
  keywords: [
    'AI meeting summarizer',
    'AI meeting notes app',
    'automatic meeting summary',
    'meeting transcription software',
    'meeting notes automation',
    'AI transcription and summary',
    'summarize meeting recordings',
    'audio to meeting summary',
    'best AI meeting notes app',
    'AI meeting assistant',
    'Zoom transcription',
    'Teams meeting notes',
    'Google Meet transcription',
    'meeting minutes automation',
    'AI note taker for meetings'
  ],
  openGraph: {
    title: 'AI Meeting Summarizer & Notes App | Neural Summary',
    description: 'Turn every meeting into actionable notes and summaries automatically. Works with Zoom, Teams, and Google Meet. Try free today.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Meeting Summarizer & Notes App | Neural Summary',
    description: 'Automatic meeting transcription and AI-powered summaries. Never miss action items again.',
  },
};

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  // Calculate locale-specific prices for pricing teaser
  const pricing = getPricingForLocale(locale);
  const freePrice = formatPriceLocale(0, locale, { decimals: 0 });
  const professionalPrice = formatPriceLocale(pricing.professional.monthly, locale, { decimals: 0 });
  const paygPrice = formatPriceLocale(pricing.payg.hourly, locale, { decimals: 2 });

  // Pre-translate strings for meeting components
  const meetingPlatformsStrings = {
    title: t('landing.meetingPlatforms.title'),
    subtitle: t('landing.meetingPlatforms.subtitle'),
    platforms: {
      zoom: {
        name: t('landing.meetingPlatforms.zoom.name'),
        description: t('landing.meetingPlatforms.zoom.description'),
      },
      teams: {
        name: t('landing.meetingPlatforms.teams.name'),
        description: t('landing.meetingPlatforms.teams.description'),
      },
      meet: {
        name: t('landing.meetingPlatforms.meet.name'),
        description: t('landing.meetingPlatforms.meet.description'),
      },
      webex: {
        name: t('landing.meetingPlatforms.webex.name'),
        description: t('landing.meetingPlatforms.webex.description'),
      },
      anyPlatform: {
        name: t('landing.meetingPlatforms.anyPlatform.name'),
        description: t('landing.meetingPlatforms.anyPlatform.description'),
      },
    },
  };

  const meetingUseCasesStrings = {
    title: t('landing.meetingUseCases.title'),
    subtitle: t('landing.meetingUseCases.subtitle'),
    useCases: {
      oneOnOnes: {
        title: t('landing.meetingUseCases.oneOnOnes.title'),
        description: t('landing.meetingUseCases.oneOnOnes.description'),
      },
      teamStandups: {
        title: t('landing.meetingUseCases.teamStandups.title'),
        description: t('landing.meetingUseCases.teamStandups.description'),
      },
      clientCalls: {
        title: t('landing.meetingUseCases.clientCalls.title'),
        description: t('landing.meetingUseCases.clientCalls.description'),
      },
      allHands: {
        title: t('landing.meetingUseCases.allHands.title'),
        description: t('landing.meetingUseCases.allHands.description'),
      },
    },
  };

  const meetingFaqStrings = {
    title: t('landing.meetingFaq.title'),
    subtitle: t('landing.meetingFaq.subtitle'),
    questions: [
      {
        question: t('landing.meetingFaq.question1.question'),
        answer: t('landing.meetingFaq.question1.answer'),
      },
      {
        question: t('landing.meetingFaq.question2.question'),
        answer: t('landing.meetingFaq.question2.answer'),
      },
      {
        question: t('landing.meetingFaq.question3.question'),
        answer: t('landing.meetingFaq.question3.answer'),
      },
      {
        question: t('landing.meetingFaq.question4.question'),
        answer: t('landing.meetingFaq.question4.answer'),
      },
      {
        question: t('landing.meetingFaq.question5.question'),
        answer: t('landing.meetingFaq.question5.answer'),
      },
      {
        question: t('landing.meetingFaq.question6.question'),
        answer: t('landing.meetingFaq.question6.answer'),
      },
      {
        question: t('landing.meetingFaq.question7.question'),
        answer: t('landing.meetingFaq.question7.answer'),
      },
      {
        question: t('landing.meetingFaq.question8.question'),
        answer: t('landing.meetingFaq.question8.answer'),
      },
    ],
  };

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">

        {/* Hero Section - Minimal Apple-like Design */}
        <section className="relative min-h-screen flex items-start justify-center overflow-hidden bg-gradient-to-br from-gray-100/40 via-stone-50/30 to-gray-50/50" aria-label="Hero section">
          {/* Background Image - Clean, full opacity, positioned at bottom */}
          <div className="absolute inset-0 flex items-end justify-center" aria-hidden="true">
            <img
              src="/assets/images/hero-bg-01 transparant.webp"
              alt=""
              className="w-full h-auto object-cover object-bottom"
              style={{ minWidth: '100%', maxHeight: '70vh' }}
            />
          </div>

          {/* Content - Positioned at top, clean spacing */}
          <div className="relative z-10 px-6 sm:px-8 lg:px-12 w-full pt-32 sm:pt-40">
            <div className="max-w-6xl mx-auto text-center">
              <div className="space-y-8">

                {/* Main Headline - Large and Bold, single line */}
                <ScrollAnimation delay={200}>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 leading-tight tracking-tight whitespace-nowrap">
                    Speak. We'll remember.
                  </h1>
                </ScrollAnimation>

                {/* Subtitle - Compact and Clean */}
                <ScrollAnimation delay={400}>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-normal max-w-3xl mx-auto leading-relaxed">
                    Turn conversations into work-ready documents—effortlessly.
                  </p>
                </ScrollAnimation>

                {/* Dual CTAs */}
                <ScrollAnimation delay={600}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                    {/* Primary CTA */}
                    <CTAButton href="/signup" locale={locale} variant="primary">
                      Get started free
                    </CTAButton>

                    {/* Secondary CTA - Watch Demo */}
                    <CTAButton href="#video-demo" variant="secondary">
                      Watch demo
                    </CTAButton>
                  </div>
                </ScrollAnimation>

              </div>
            </div>
          </div>
        </section>

        {/* The Cost of Translation - Dark Section (WHY) */}
        <section className="relative py-32 px-6 sm:px-8 lg:px-12 overflow-hidden" style={{ backgroundColor: '#2c2c2c' }} aria-labelledby="cost-heading">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="cost-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-12">
                Your best ideas get lost in translation.
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <div className="space-y-8 text-lg sm:text-xl text-gray-300">
                <p>
                  You think in conversations. You work in documents.
                </p>
                <p>
                  Between the two: hours typing, formatting, restructuring.
                </p>
                <p className="text-2xl sm:text-3xl text-white font-semibold mt-12">
                  What if your voice became the document?
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* How It Works - Light Section */}
        <section className="relative py-32 px-6 sm:px-8 lg:px-12 overflow-hidden bg-gradient-to-b from-white to-gray-50" aria-label="How it works">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8">
                Three steps to creation.
              </h2>
            </ScrollAnimation>

            <div className="mt-20">
              <ThreeStepsAnimation />
            </div>
          </div>
        </section>

        {/* From Thinking to Done - Light Section (WOW) */}
        <section id="video-demo" className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white" aria-labelledby="video-demo-heading">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="video-demo-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8">
                Speaking becomes creating.
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
                Have a product idea? Talk to Neural Summary. Answer questions.
              </p>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-100 mb-12">
                {/* YouTube embed - Replace VIDEO_ID with actual YouTube video ID */}
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/VIDEO_ID"
                  title="Neural Summary Demo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <p className="text-lg text-gray-700">
                No writing. No formatting. Just think out loud.
              </p>
            </ScrollAnimation>
          </div>
        </section>

        {/* Built for Creators - Full viewport section (WHO) */}
        <section className="relative overflow-hidden" aria-labelledby="creators-heading">
          <ScrollAnimation delay={300}>
            <div className="relative">
              {/* Title positioned absolutely on top of carousel */}
              <div className="absolute top-8 md:top-12 left-0 right-0 z-20 px-6 sm:px-8 lg:px-12">
                <h2 id="creators-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center drop-shadow-lg">
                  Built for your workflow.
                </h2>
              </div>

              {/* Carousel fills viewport */}
              <WorkflowCarousel />
            </div>
          </ScrollAnimation>
        </section>

        {/* Features - Light Section */}
        <section id="features" className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-white to-gray-50" aria-labelledby="features-heading">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="features-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-16">
                Built for focus.
              </h2>
            </ScrollAnimation>

            <div className="space-y-32">
              {/* Feature 1 - Image placeholder left */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <ScrollAnimation animation="slideLeft">
                  <div className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Feature Image</span>
                  </div>
                </ScrollAnimation>
                <ScrollAnimation animation="slideRight" delay={200}>
                  <div className="text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">99.5% accuracy</h3>
                    <p className="text-lg text-gray-700">Every word captured. Speaker labels included.</p>
                  </div>
                </ScrollAnimation>
              </div>

              {/* Feature 2 - Image placeholder right */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <ScrollAnimation animation="slideLeft" className="md:order-2">
                  <div className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Feature Image</span>
                  </div>
                </ScrollAnimation>
                <ScrollAnimation animation="slideRight" delay={200} className="md:order-1">
                  <div className="text-left md:text-right">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Files up to 5GB</h3>
                    <p className="text-lg text-gray-700">Handle hours of audio. No limits.</p>
                  </div>
                </ScrollAnimation>
              </div>

              {/* Feature 3 - Image placeholder left */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <ScrollAnimation animation="slideLeft">
                  <div className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Feature Image</span>
                  </div>
                </ScrollAnimation>
                <ScrollAnimation animation="slideRight" delay={200}>
                  <div className="text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">99 languages</h3>
                    <p className="text-lg text-gray-700">Automatic detection. Translate instantly.</p>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </section>

        {/* Security - Dark Section */}
        <section className="py-32 px-6 sm:px-8 lg:px-12" style={{ backgroundColor: '#2c2c2c' }} aria-labelledby="security-heading">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="security-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-8">
                Your privacy matters.
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Audio deleted within seconds. Only text remains. Enterprise-grade encryption.
              </p>
            </ScrollAnimation>
          </div>
        </section>

        {/* The Future of Work - Dark Section (WARP) */}
        <section className="relative py-32 px-6 sm:px-8 lg:px-12 overflow-hidden" style={{ backgroundColor: '#2c2c2c' }} aria-labelledby="future-heading">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="future-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-12">
                The future of work isn't typing.
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <div className="space-y-8 text-xl sm:text-2xl text-gray-300">
                <p>
                  It's thinking out loud.
                </p>
                <div className="space-y-4 mt-12">
                  <p className="text-white">Your ideas become requirements.</p>
                  <p className="text-white">Your vision becomes strategy.</p>
                  <p className="text-white">Your voice becomes output.</p>
                </div>
                <p className="text-2xl sm:text-3xl text-white font-semibold mt-16">
                  This is how creative work should feel.
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* CTA Section - Light */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white" aria-label="Get started">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8">
                Ready to remember?
              </h2>
              <CTAButton href="/signup" locale={locale}>
                Get started
              </CTAButton>
            </ScrollAnimation>
          </div>
        </section>

        {/* Why Teams Choose Section */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-white" aria-labelledby="why-teams-heading">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation className="text-center mb-12">
              <h2 id="why-teams-heading" className="text-4xl font-bold text-gray-900 mb-8">
                {t('landing.whyTeams.title')}
              </h2>
            </ScrollAnimation>

            <div className="space-y-4 mb-12">
              <ScrollAnimation animation="slideLeft">
                <div className="flex items-start bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit1')}</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="slideRight" delay={100}>
                <div className="flex items-start bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit2')}</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="slideLeft" delay={200}>
                <div className="flex items-start bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit3')}</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="slideRight" delay={300}>
                <div className="flex items-start bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit4')}</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="slideLeft" delay={400}>
                <div className="flex items-start bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit5')}</p>
                </div>
              </ScrollAnimation>
            </div>

            <ScrollAnimation className="text-center" delay={400}>
              <p className="text-xl font-semibold text-gray-900 mb-6">
                {t('landing.whyTeams.tagline')}
              </p>
              <div className="inline-flex items-center gap-2">
                <CTAButton href="/login" locale={locale} variant="primary">
                  {t('landing.hero.cta.primary')}
                </CTAButton>
                <ArrowRight className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Pricing Teaser Section */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-white" aria-labelledby="pricing-teaser-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <ScrollAnimation>
                <h2 id="pricing-teaser-heading" className="text-4xl font-bold text-gray-900 mb-4">
                  {t('landing.pricingTeaser.title')}
                </h2>
                <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                  {t('landing.pricingTeaser.subtitle')}
                </p>
              </ScrollAnimation>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Tier */}
              <ScrollAnimation animation="slideLeft">
                <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-[#cc3399] transition-all hover-lift">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('landing.pricingTeaser.free.name')}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{freePrice}</div>
                    <p className="text-gray-700">{t('landing.pricingTeaser.free.description')}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-[#cc3399] mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.free.features.transcriptions')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-[#cc3399] mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.free.features.duration')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-[#cc3399] mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.free.features.summary')}</span>
                    </li>
                  </ul>
                  <Link
                    href={`/${locale}/login`}
                    className="block w-full py-3 px-4 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
                    aria-label="Get started with free plan"
                  >
                    {t('landing.pricingTeaser.free.cta')}
                  </Link>
                </div>
              </ScrollAnimation>

              {/* Professional Tier - Featured */}
              <ScrollAnimation delay={200}>
                <div className="bg-gradient-to-br from-[#cc3399] to-purple-600 rounded-2xl p-8 border-2 border-[#cc3399] shadow-2xl transform scale-100 md:scale-105 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                      {t('landing.pricingTeaser.professional.badge')}
                    </span>
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{t('landing.pricingTeaser.professional.name')}</h3>
                    <div className="text-4xl font-bold text-white mb-2">{professionalPrice}</div>
                    <p className="text-white/90">{t('landing.pricingTeaser.professional.description')}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start text-white">
                      <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.professional.features.transcriptions')}</span>
                    </li>
                    <li className="flex items-start text-white">
                      <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.professional.features.hours')}</span>
                    </li>
                    <li className="flex items-start text-white">
                      <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.professional.features.analyses')}</span>
                    </li>
                    <li className="flex items-start text-white">
                      <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.professional.features.fileSize')}</span>
                    </li>
                    <li className="flex items-start text-white">
                      <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.professional.features.priority')}</span>
                    </li>
                  </ul>
                  <Link
                    href={`/${locale}/pricing`}
                    className="block w-full py-3 px-4 bg-white text-[#cc3399] font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center"
                    aria-label="Start professional plan free trial"
                  >
                    {t('landing.pricingTeaser.professional.cta')}
                  </Link>
                </div>
              </ScrollAnimation>

              {/* Pay-As-You-Go Tier */}
              <ScrollAnimation animation="slideRight" delay={400}>
                <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-600 transition-all hover-lift">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('landing.pricingTeaser.payg.name')}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{paygPrice}</div>
                    <p className="text-gray-700">{t('landing.pricingTeaser.payg.description')}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-[#cc3399] mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.payg.features.credits')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-[#cc3399] mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.payg.features.analyses')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-[#cc3399] mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.payg.features.occasional')}</span>
                    </li>
                  </ul>
                  <Link
                    href={`/${locale}/pricing`}
                    className="block w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors text-center"
                    aria-label="View pay-as-you-go pricing"
                  >
                    {t('landing.pricingTeaser.payg.cta')}
                  </Link>
                </div>
              </ScrollAnimation>
            </div>

            {/* View Full Pricing CTA */}
            <ScrollAnimation className="text-center mt-12" delay={600}>
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex items-center text-[#cc3399] font-semibold text-lg hover:text-[#b82d89] transition-colors"
                aria-label="View full pricing details and comparison"
              >
                {t('landing.pricingTeaser.viewFullPricing')}
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </ScrollAnimation>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="testimonials-heading" className="text-3xl font-bold text-gray-900 mb-4">
                {t('landing.testimonials.title')}
              </h2>
              <div className="flex justify-center items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                ))}
              </div>
              <p className="text-gray-700">{t('landing.testimonials.rating')}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <ScrollAnimation animation="slideLeft">
                <blockquote className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover-lift">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  &ldquo;{t('landing.testimonials.testimonial1.quote')}&rdquo;
                </p>
                <footer className="flex items-center">
                  <img 
                    src="/assets/images/avatars/avatar-sarah-martinez.webp"
                    alt="Sarah Martinez"
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    width={40}
                    height={40}
                  />
                  <div>
                    <cite className="font-semibold text-gray-900 text-sm not-italic">{t('landing.testimonials.testimonial1.author')}</cite>
                    <p className="text-xs text-gray-500">{t('landing.testimonials.testimonial1.role')}</p>
                  </div>
                </footer>
                </blockquote>
              </ScrollAnimation>

              <ScrollAnimation delay={200}>
                <blockquote className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover-lift">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  &ldquo;{t('landing.testimonials.testimonial2.quote')}&rdquo;
                </p>
                <footer className="flex items-center">
                  <img 
                    src="/assets/images/avatars/avatar-james-liu.webp"
                    alt="Dr. James Liu"
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    width={40}
                    height={40}
                  />
                  <div>
                    <cite className="font-semibold text-gray-900 text-sm not-italic">{t('landing.testimonials.testimonial2.author')}</cite>
                    <p className="text-xs text-gray-500">{t('landing.testimonials.testimonial2.role')}</p>
                  </div>
                </footer>
                </blockquote>
              </ScrollAnimation>

              <ScrollAnimation animation="slideRight" delay={400}>
                <blockquote className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover-lift">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  &ldquo;{t('landing.testimonials.testimonial3.quote')}&rdquo;
                </p>
                <footer className="flex items-center">
                  <img 
                    src="/assets/images/avatars/avatar-emily-chen.webp"
                    alt="Emily Chen"
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    width={40}
                    height={40}
                  />
                  <div>
                    <cite className="font-semibold text-gray-900 text-sm not-italic">{t('landing.testimonials.testimonial3.author')}</cite>
                    <p className="text-xs text-gray-500">{t('landing.testimonials.testimonial3.role')}</p>
                  </div>
                </footer>
                </blockquote>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Meeting FAQ Section */}
        <MeetingFAQ {...meetingFaqStrings} />

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#cc3399] to-purple-600" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation>
              <h2 id="cta-heading" className="text-4xl font-bold text-white mb-6">
                {t('landing.cta.title')}
              </h2>
            </ScrollAnimation>
            <ScrollAnimation delay={200}>
              <p className="text-xl text-white/90 mb-8">
                {t('landing.cta.subtitle')}
              </p>
            </ScrollAnimation>
            <ScrollAnimation className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8" delay={400}>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center px-8 py-4 bg-white text-[#cc3399] font-semibold text-lg rounded-full shadow-lg hover:bg-gray-100 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#cc3399] hover-glow"
                aria-label="Start your free trial now"
              >
                <Sparkles className="h-5 w-5 mr-2" aria-hidden="true" />
                {t('landing.cta.button')}
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </ScrollAnimation>
            <ScrollAnimation className="flex justify-center items-center space-x-4 text-sm text-white/80" delay={600}>
              <span>✓ {t('landing.cta.benefits.free')}</span>
              <span>✓ {t('landing.cta.benefits.noCard')}</span>
              <span>✓ {t('landing.cta.benefits.cancel')}</span>
            </ScrollAnimation>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8" aria-label="Footer">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-semibold mb-4">{t('landing.footer.product.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/features`} className="hover:text-white transition-colors">{t('landing.footer.product.features')}</Link></li>
                  <li><Link href={`/${locale}/pricing`} className="hover:text-white transition-colors">{t('landing.footer.product.pricing')}</Link></li>
                  <li><Link href={`/${locale}/api`} className="hover:text-white transition-colors">{t('landing.footer.product.api')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('landing.footer.company.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/about`} className="hover:text-white transition-colors">{t('landing.footer.company.about')}</Link></li>
                  <li><Link href={`/${locale}/blog`} className="hover:text-white transition-colors">{t('landing.footer.company.blog')}</Link></li>
                  <li><Link href={`/${locale}/careers`} className="hover:text-white transition-colors">{t('landing.footer.company.careers')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('landing.footer.support.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/help`} className="hover:text-white transition-colors">{t('landing.footer.support.help')}</Link></li>
                  <li><Link href={`/${locale}/contact`} className="hover:text-white transition-colors">{t('landing.footer.support.contact')}</Link></li>
                  <li><Link href={`/${locale}/status`} className="hover:text-white transition-colors">{t('landing.footer.support.status')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('landing.footer.legal.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('landing.footer.legal.privacy')}</Link></li>
                  <li><Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('landing.footer.legal.terms')}</Link></li>
                  <li><Link href={`/${locale}/security`} className="hover:text-white transition-colors">{t('landing.footer.legal.security')}</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 italic max-w-2xl mx-auto">
                  {t('landing.footer.tagline')}
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <img
                    src="/assets/NS-symbol.webp"
                    alt="Neural Summary"
                    className="h-6 w-auto mr-2"
                    width={24}
                    height={24}
                  />
                  <span className="text-sm text-gray-400">{t('landing.footer.copyright')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  <span>{t('landing.security.badges.soc2')}</span>
                  <span>•</span>
                  <span>{t('landing.security.badges.gdpr')}</span>
                  <span>•</span>
                  <span>{t('landing.security.badges.hipaa')}</span>
                  <span>•</span>
                  <span>{t('landing.security.badges.iso')}</span>
                </div>
              </div>
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
                    url: 'https://neuralsummary.com/assets/NS-symbol.webp',
                  },
                  description: 'AI-powered meeting transcription and summarization platform',
                  sameAs: [
                    'https://twitter.com/neuralsummary',
                    'https://linkedin.com/company/neuralsummary',
                  ],
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://neuralsummary.com/#software',
                  name: 'Neural Summary - AI Meeting Notes & Transcription',
                  applicationCategory: 'BusinessApplication',
                  applicationSubCategory: 'Meeting Notes & Transcription Software',
                  operatingSystem: 'Web, iOS, Android, Windows, macOS',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free plan available',
                  },
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.8',
                    ratingCount: '1250',
                    bestRating: '5',
                    worstRating: '1',
                  },
                  featureList: [
                    'AI meeting summarizer',
                    'Automatic meeting transcription',
                    'Works with Zoom, Microsoft Teams, Google Meet',
                    'Speaker identification',
                    'Action items extraction',
                    '50+ languages supported',
                    '99.5% transcription accuracy',
                    'GDPR compliant',
                  ],
                  keywords: 'AI meeting summarizer, meeting notes app, automatic meeting transcription, meeting assistant, Zoom transcription, Teams notes, Google Meet transcription',
                  description: 'Transform your meetings into actionable notes and summaries automatically. Neural Summary uses AI to transcribe and summarize Zoom, Teams, and Google Meet recordings with 99.5% accuracy.',
                },
                {
                  '@type': 'FAQPage',
                  '@id': 'https://neuralsummary.com/#faq',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'How do I automatically transcribe Zoom meetings?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Simply record your Zoom meeting (either locally or to the cloud), download the audio or video file, and upload it to Neural Summary. Our AI will automatically transcribe the meeting with speaker labels and generate a summary with action items.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Does Neural Summary work with Microsoft Teams and Google Meet?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes! Neural Summary works with any meeting platform. Simply record your Microsoft Teams or Google Meet meeting, download the recording, and upload it to our platform for automatic transcription and AI-powered summaries.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What is an AI meeting summarizer?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'An AI meeting summarizer is a tool that uses artificial intelligence to automatically transcribe meeting recordings and generate concise summaries with key points, decisions, and action items. Neural Summary goes beyond basic transcription to provide intelligent analysis of your meetings.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How accurate is the meeting transcription?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Neural Summary achieves 99.5% transcription accuracy using state-of-the-art AI models. The system can identify multiple speakers, handle 50+ languages, and accurately transcribe technical terminology when provided with context.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Can I share meeting transcripts and summaries with my team?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes! Neural Summary includes advanced sharing features. You can share transcripts and summaries via secure links, email, or export to PDF and other formats. Professional plans include collaboration features for teams.',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </div>
    </>
  );
}