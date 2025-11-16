import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import ScrollAnimation from '@/components/ScrollAnimation';
import { MeetingPlatforms } from '@/components/landing/MeetingPlatforms';
import { MeetingUseCases } from '@/components/landing/MeetingUseCases';
import { MeetingFAQ } from '@/components/landing/MeetingFAQ';
import { CTAButton } from '@/components/landing/CTAButton';
import WorkflowCarousel from '@/components/landing/WorkflowCarousel';
import type { Metadata } from 'next';
import {
  Shield,
  Brain,
  Lock,
  Award,
  TrendingUp,
  Clock,
  Users,
  Star,
  Mic
} from 'lucide-react';

// SEO Metadata for voice-to-output creation platform
export const metadata: Metadata = {
  title: 'Neural Summary | Turn Conversations into Work-Ready Documents',
  description: 'Voice-to-output creation platform. Turn conversations into product specs, articles, strategies, and emails instantly. AI interviews you, extracts ideas, generates deliverables. Speaking becomes creating.',
  keywords: [
    'voice to document',
    'conversation to document',
    'AI document creation',
    'voice-to-output platform',
    'AI interview assistant',
    'speaking to writing',
    'audio to document',
    'voice-powered creation',
    'AI document generator',
    'conversation to spec',
    'voice-activated writing',
    'AI transcription and analysis',
    'audio to article',
    'speech to document creation',
    'AI content generation from voice'
  ],
  openGraph: {
    title: 'Neural Summary | Turn Conversations into Work-Ready Documents',
    description: 'Speaking becomes creating. Transform conversations into product specs, articles, and strategies with AI that interviews you and generates deliverables.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neural Summary | Voice-to-Output Creation Platform',
    description: 'Turn 3-minute conversations into complete product specs, articles, and strategies. AI interviews you, generates deliverables.',
  },
};

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  // Debug: Log locale and test translation
  console.log('[Landing Page] Locale:', locale);
  console.log('[Landing Page] Hero headline:', t('hero.headline'));

  // Pre-translate strings for meeting components
  const meetingPlatformsStrings = {
    title: t('meetingPlatforms.title'),
    subtitle: t('meetingPlatforms.subtitle'),
    platforms: {
      zoom: {
        name: t('meetingPlatforms.zoom.name'),
        description: t('meetingPlatforms.zoom.description'),
      },
      teams: {
        name: t('meetingPlatforms.teams.name'),
        description: t('meetingPlatforms.teams.description'),
      },
      meet: {
        name: t('meetingPlatforms.meet.name'),
        description: t('meetingPlatforms.meet.description'),
      },
      webex: {
        name: t('meetingPlatforms.webex.name'),
        description: t('meetingPlatforms.webex.description'),
      },
      anyPlatform: {
        name: t('meetingPlatforms.anyPlatform.name'),
        description: t('meetingPlatforms.anyPlatform.description'),
      },
    },
  };

  const meetingUseCasesStrings = {
    title: t('meetingUseCases.title'),
    subtitle: t('meetingUseCases.subtitle'),
    useCases: {
      oneOnOnes: {
        title: t('meetingUseCases.oneOnOnes.title'),
        description: t('meetingUseCases.oneOnOnes.description'),
      },
      teamStandups: {
        title: t('meetingUseCases.teamStandups.title'),
        description: t('meetingUseCases.teamStandups.description'),
      },
      clientCalls: {
        title: t('meetingUseCases.clientCalls.title'),
        description: t('meetingUseCases.clientCalls.description'),
      },
      allHands: {
        title: t('meetingUseCases.allHands.title'),
        description: t('meetingUseCases.allHands.description'),
      },
    },
  };

  const meetingFaqStrings = {
    title: t('meetingFaq.title'),
    subtitle: t('meetingFaq.subtitle'),
    questions: [
      {
        question: t('meetingFaq.question1.question'),
        answer: t('meetingFaq.question1.answer'),
      },
      {
        question: t('meetingFaq.question2.question'),
        answer: t('meetingFaq.question2.answer'),
      },
      {
        question: t('meetingFaq.question3.question'),
        answer: t('meetingFaq.question3.answer'),
      },
      {
        question: t('meetingFaq.question4.question'),
        answer: t('meetingFaq.question4.answer'),
      },
      {
        question: t('meetingFaq.question5.question'),
        answer: t('meetingFaq.question5.answer'),
      },
      {
        question: t('meetingFaq.question6.question'),
        answer: t('meetingFaq.question6.answer'),
      },
      {
        question: t('meetingFaq.question7.question'),
        answer: t('meetingFaq.question7.answer'),
      },
    ],
  };

  return (
    <>
      <PublicHeader locale={locale} showFeaturesLink={true} />

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
                    {t('hero.headline')}
                  </h1>
                </ScrollAnimation>

                {/* Subtitle - Compact and Clean */}
                <ScrollAnimation delay={400}>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-normal max-w-3xl mx-auto leading-relaxed">
                    {t('hero.subtitle')}
                  </p>
                </ScrollAnimation>

                {/* Dual CTAs */}
                <ScrollAnimation delay={600}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                    {/* Primary CTA */}
                    <CTAButton href="/signup" locale={locale} variant="primary">
                      {t('hero.ctaPrimary')}
                    </CTAButton>

                    {/* Secondary CTA - Watch Demo */}
                    <CTAButton href="#video-demo" variant="secondary">
                      {t('hero.ctaSecondary')}
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
                {t('why.headline')}
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <div className="space-y-8 text-lg sm:text-xl text-gray-300">
                <p>
                  {t('why.paragraph1')}
                </p>
                <p>
                  {t('why.paragraph2')}
                </p>
                <p className="text-2xl sm:text-3xl text-white font-semibold mt-12">
                  {t('why.paragraph3')}
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* From Thinking to Done - Light Section (WOW) */}
        <section id="video-demo" className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white" aria-labelledby="video-demo-heading">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="video-demo-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8">
                {t('wow.headline')}
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
                {t('wow.subtitle')}
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
                {t('wow.tagline')}
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
                  {t('who.headline')}
                </h2>
              </div>

              {/* Carousel fills viewport */}
              <WorkflowCarousel />
            </div>
          </ScrollAnimation>
        </section>

        {/* The Future of Work - Dark Section (WARP) */}
        <section className="relative py-32 px-6 sm:px-8 lg:px-12 overflow-hidden" style={{ backgroundColor: '#2c2c2c' }} aria-labelledby="future-heading">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="future-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-12">
                {t('warp.headline')}
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <div className="space-y-8 text-xl sm:text-2xl text-gray-300">
                <p>
                  {t('warp.subtitle')}
                </p>
                <div className="space-y-4 mt-12">
                  <p className="text-white">{t('warp.line1')}</p>
                  <p className="text-white">{t('warp.line2')}</p>
                  <p className="text-white">{t('warp.line3')}</p>
                </div>
                <p className="text-2xl sm:text-3xl text-white font-semibold mt-16">
                  {t('warp.tagline')}
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Features - Light Section */}
        <section id="features" className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-white to-gray-50" aria-labelledby="features-heading">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 id="features-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-16">
                {t('featuresSection.headline')}
              </h2>
            </ScrollAnimation>

            <div className="space-y-32">
              {/* Feature 1 - 99.5% accuracy */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <ScrollAnimation animation="slideLeft">
                  <div className="rounded-2xl aspect-[4/3] overflow-hidden">
                    <img
                      src="/assets/images/features/feature-accuracy.webp"
                      alt="99.5% transcription accuracy with speaker labels"
                      className="w-full h-full object-cover"
                      width={1200}
                      height={900}
                      loading="lazy"
                    />
                  </div>
                </ScrollAnimation>
                <ScrollAnimation animation="slideRight" delay={200}>
                  <div className="text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('featuresSection.accuracy.title')}</h3>
                    <p className="text-lg text-gray-700">{t('featuresSection.accuracy.description')}</p>
                  </div>
                </ScrollAnimation>
              </div>

              {/* Feature 2 - Files up to 5GB */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <ScrollAnimation animation="slideLeft" className="md:order-2">
                  <div className="rounded-2xl aspect-[4/3] overflow-hidden">
                    <img
                      src="/assets/images/features/feature-large-files.webp"
                      alt="Handle large audio files up to 5GB"
                      className="w-full h-full object-cover"
                      width={1200}
                      height={900}
                      loading="lazy"
                    />
                  </div>
                </ScrollAnimation>
                <ScrollAnimation animation="slideRight" delay={200} className="md:order-1">
                  <div className="text-left md:text-right">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('featuresSection.largeFiles.title')}</h3>
                    <p className="text-lg text-gray-700">{t('featuresSection.largeFiles.description')}</p>
                  </div>
                </ScrollAnimation>
              </div>

              {/* Feature 3 - 99 languages */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <ScrollAnimation animation="slideLeft">
                  <div className="rounded-2xl aspect-[4/3] overflow-hidden">
                    <img
                      src="/assets/images/features/feature-languages.webp"
                      alt="Support for 99 languages with automatic detection"
                      className="w-full h-full object-cover"
                      width={1200}
                      height={900}
                      loading="lazy"
                    />
                  </div>
                </ScrollAnimation>
                <ScrollAnimation animation="slideRight" delay={200}>
                  <div className="text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('featuresSection.languages.title')}</h3>
                    <p className="text-lg text-gray-700">{t('featuresSection.languages.description')}</p>
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
              <div className="flex justify-center mb-6">
                <Lock className="h-12 w-12 text-white" aria-hidden="true" />
              </div>
              <h2 id="security-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-8">
                {t('securitySection.headline')}
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                {t('securitySection.description')}
              </p>
            </ScrollAnimation>
          </div>
        </section>

        {/* CTA Section - Light */}
        <section className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white" aria-label="Get started">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation delay={200}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8">
                {t('finalCta.headline')}
              </h2>
              <CTAButton href="/signup" locale={locale}>
                {t('hero.ctaPrimary')}
              </CTAButton>
            </ScrollAnimation>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="testimonials-heading" className="text-3xl font-bold text-gray-900 mb-4">
                {t('testimonials.title')}
              </h2>
              <div className="flex justify-center items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                ))}
              </div>
              <p className="text-gray-700">{t('testimonials.rating')}</p>
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
                  &ldquo;{t('testimonials.testimonial1.quote')}&rdquo;
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
                    <cite className="font-semibold text-gray-900 text-sm not-italic">{t('testimonials.testimonial1.author')}</cite>
                    <p className="text-xs text-gray-500">{t('testimonials.testimonial1.role')}</p>
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
                  &ldquo;{t('testimonials.testimonial2.quote')}&rdquo;
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
                    <cite className="font-semibold text-gray-900 text-sm not-italic">{t('testimonials.testimonial2.author')}</cite>
                    <p className="text-xs text-gray-500">{t('testimonials.testimonial2.role')}</p>
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
                  &ldquo;{t('testimonials.testimonial3.quote')}&rdquo;
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
                    <cite className="font-semibold text-gray-900 text-sm not-italic">{t('testimonials.testimonial3.author')}</cite>
                    <p className="text-xs text-gray-500">{t('testimonials.testimonial3.role')}</p>
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
        <section
          className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="cta-heading"
          style={{
            backgroundImage: 'url(/images/cta-hero.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay for text contrast */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(44, 44, 44, 0.6), rgba(44, 44, 44, 0.7), rgba(44, 44, 44, 0.8))'
            }}
          />

          <div className="relative max-w-4xl mx-auto text-center">
            <ScrollAnimation>
              <h2 id="cta-heading" className="text-5xl md:text-6xl font-bold text-white mb-4">
                {t('finalCta.headline')}
              </h2>
            </ScrollAnimation>
            <ScrollAnimation delay={200}>
              <p className="text-lg text-white/80 mb-10">
                {t('finalCta.subtext')}
              </p>
            </ScrollAnimation>
            <ScrollAnimation className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8" delay={400}>
              <CTAButton
                href="/login"
                locale={locale}
                variant="brand"
                aria-label={t('finalCta.button')}
              >
                {t('finalCta.button')}
              </CTAButton>
            </ScrollAnimation>
            <ScrollAnimation className="flex justify-center items-center space-x-6 text-sm text-white/70" delay={600}>
              <span>✓ {t('finalCta.benefits.free')}</span>
              <span>✓ {t('finalCta.benefits.noCard')}</span>
            </ScrollAnimation>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-gray-400 py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#1a1a1a' }} aria-label="Footer">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-semibold mb-4">{t('footer.product.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/features`} className="hover:text-white transition-colors">{t('footer.product.features')}</Link></li>
                  <li><Link href={`/${locale}/pricing`} className="hover:text-white transition-colors">{t('footer.product.pricing')}</Link></li>
                  <li><Link href={`/${locale}/api`} className="hover:text-white transition-colors">{t('footer.product.api')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('footer.company.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/about`} className="hover:text-white transition-colors">{t('footer.company.about')}</Link></li>
                  <li><Link href={`/${locale}/blog`} className="hover:text-white transition-colors">{t('footer.company.blog')}</Link></li>
                  <li><Link href={`/${locale}/careers`} className="hover:text-white transition-colors">{t('footer.company.careers')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('footer.support.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/help`} className="hover:text-white transition-colors">{t('footer.support.help')}</Link></li>
                  <li><Link href={`/${locale}/contact`} className="hover:text-white transition-colors">{t('footer.support.contact')}</Link></li>
                  <li><Link href={`/${locale}/status`} className="hover:text-white transition-colors">{t('footer.support.status')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('footer.legal.title')}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('footer.legal.privacy')}</Link></li>
                  <li><Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('footer.legal.terms')}</Link></li>
                  <li><Link href={`/${locale}/security`} className="hover:text-white transition-colors">{t('footer.legal.security')}</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 italic max-w-2xl mx-auto">
                  {t('footer.tagline')}
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
                  <span className="text-sm text-gray-400">{t('footer.copyright')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  <span>{t('security.badges.compliance')}</span>
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
                  description: 'Voice-to-output creation platform that transforms conversations into work-ready documents',
                  sameAs: [
                    'https://twitter.com/neuralsummary',
                    'https://linkedin.com/company/neuralsummary',
                  ],
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://neuralsummary.com/#software',
                  name: 'Neural Summary - Voice-to-Output Creation Platform',
                  applicationCategory: 'BusinessApplication',
                  applicationSubCategory: 'AI Document Creation & Transcription Software',
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
                    'Voice-to-document creation',
                    'AI interview assistant',
                    'Conversation to product specs',
                    'Audio to articles and strategies',
                    'Speaker identification',
                    'Action items extraction',
                    '50+ languages supported',
                    '99.5% transcription accuracy',
                    'GDPR compliant',
                  ],
                  keywords: 'voice to document, AI document creation, conversation to spec, voice-to-output platform, AI interview assistant, audio to article, speech to document, voice-powered creation',
                  description: 'Turn conversations into work-ready documents. Neural Summary interviews you with AI, extracts ideas, and generates product specs, articles, emails, and strategies from your voice.',
                },
                {
                  '@type': 'FAQPage',
                  '@id': 'https://neuralsummary.com/#faq',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'How does Neural Summary work?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Upload any audio or video recording, or speak directly into the platform. Our AI processes your conversation, identifies key insights, and generates structured documents—summaries, action items, and detailed analysis. It works with meetings, brainstorms, interviews, or voice memos. From upload to finished document takes just 3-5 minutes.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What types of documents can I create?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'From a single recording, create meeting summaries with action items and decisions, content analysis, strategic insights, and communication breakdowns. Each document type is optimized for different needs—whether you need executive summaries, detailed transcripts, or team action plans.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Does it work with Zoom, Teams, and Google Meet?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes! Record your meeting on any platform, download the file, and upload it to Neural Summary. We support all major video and audio formats including MP3, M4A, WAV, MP4, MOV, and more. No bots, no plugins—just upload and create.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Can Neural Summary identify different speakers?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes! Our speaker diarization technology automatically detects and labels multiple speakers throughout your conversation. Each speaker\'s contributions are clearly attributed, maintaining the natural flow of dialogue. You can rename speakers after processing for even greater clarity in your documents.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How accurate are the results?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'We deliver 99.5% transcription accuracy with speaker identification in over 50 languages. But Neural Summary goes beyond transcription—our AI extracts decisions, action items, themes, and insights that manual note-taking often misses. You get both precise word-for-word capture and intelligent analysis.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Is my data private and secure?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Your audio is NEVER stored on our servers. When you upload a recording, it\'s processed immediately and deleted within seconds. We only retain the text and analysis results. This zero-knowledge architecture ensures your sensitive conversations remain completely private—ideal for confidential business, legal, or medical discussions.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Can I share and export documents?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes! Share your documents via secure password-protected links, send via email, or export to PDF and Word formats. Professional plans include unlimited sharing and collaboration features for teams.',
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