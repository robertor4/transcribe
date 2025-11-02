'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PublicHeader } from '@/components/PublicHeader';
import ScrollAnimation from '@/components/ScrollAnimation';
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

export default function LandingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">

        {/* Hero Section with Video Background */}
        <section className="relative min-h-screen flex items-center overflow-hidden" aria-label="Hero section">
          {/* Video Background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover"
            aria-hidden="true"
          >
            <source src="/assets/videos/neuralnotes-videobg.webm" type="video/webm" />
          </video>
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/70" aria-hidden="true"></div>
          
          {/* Content */}
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-10">
                {/* Trust Indicators */}
                <ScrollAnimation className="flex flex-wrap justify-center items-center gap-3 sm:gap-4" delay={200}>
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                    <Users className="h-5 w-5 mr-1.5 text-[#ff66cc]" aria-hidden="true" />
                    <span className="text-sm font-medium text-white">{t('landing.hero.trustIndicators.users')}</span>
                  </div>
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                    <Star className="h-5 w-5 mr-1.5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-white">{t('landing.hero.trustIndicators.rating')}</span>
                  </div>
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                    <Shield className="h-5 w-5 mr-1.5 text-green-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-white">{t('landing.hero.trustIndicators.certified')}</span>
                  </div>
                </ScrollAnimation>

                {/* Main Headline */}
                <ScrollAnimation delay={300}>
                  <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                    {t('landing.hero.title')}{' '}
                    <span className="text-[#ff66cc]">{t('landing.hero.titleHighlight')}</span>
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto mt-8 drop-shadow-md">
                    {t('landing.hero.subtitle')}
                  </p>
                </ScrollAnimation>

                {/* CTA Buttons */}
                <ScrollAnimation className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0" delay={400}>
                  <Link
                    href={`/${locale}/signup`}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-[#cc3399] text-white font-semibold text-lg rounded-xl shadow-lg hover:bg-[#ff66cc] transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#ff66cc] focus:ring-offset-2 focus:ring-offset-black/50 hover-glow"
                    aria-label="Start using Neural Summary free forever"
                  >
                    {t('landing.hero.cta.primary')}
                    <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-xl shadow-md border border-white/30 hover:bg-white/20 transition-all"
                    aria-label="Learn how Neural Summary works"
                  >
                    {t('landing.hero.cta.secondary')}
                    <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                  </a>
                </ScrollAnimation>

                <p className="text-sm md:text-base text-gray-200">
                  {t('landing.hero.guarantee')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900" aria-labelledby="value-prop-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <ScrollAnimation>
                <h2 id="value-prop-heading" className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed max-w-4xl mx-auto">
                  {t('landing.valueProposition.title')}
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                  {t('landing.valueProposition.subtitle')}
                </p>
              </ScrollAnimation>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <ScrollAnimation className="text-center" animation="slideLeft">
                <div className="bg-gradient-to-br from-[#cc3399]/10 to-purple-50 dark:from-[#cc3399]/20 dark:to-purple-900/20 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-[#cc3399] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('landing.valueProposition.efficiency.title')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t('landing.valueProposition.efficiency.description')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation className="text-center" delay={200}>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('landing.valueProposition.clarity.title')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t('landing.valueProposition.clarity.description')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation className="text-center" animation="slideRight" delay={400}>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 h-full">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('landing.valueProposition.impact.title')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t('landing.valueProposition.impact.description')}
                  </p>
                </div>
              </ScrollAnimation>
            </div>

            <ScrollAnimation className="text-center" delay={600}>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('landing.valueProposition.tagline')}
              </p>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center mt-6 px-8 py-4 bg-[#cc3399] text-white font-semibold text-lg rounded-xl shadow-lg hover:bg-[#b82d89] transform transition-all hover:scale-105"
                aria-label="Start your free trial"
              >
                {t('landing.hero.cta.primary')}
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </ScrollAnimation>
          </div>
        </section>

        {/* Benefits Section - What's in it for me? */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800" aria-labelledby="benefits-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <ScrollAnimation>
                <h2 id="benefits-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('landing.benefits.title')}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  {t('landing.benefits.subtitle')}
                </p>
              </ScrollAnimation>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <ScrollAnimation className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden hover-lift" animation="slideLeft">
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[#cc3399]/10 dark:bg-[#cc3399]/20 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-[#cc3399]" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                      {t('landing.benefits.shareCollaborate.title')}
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('landing.benefits.shareCollaborate.description')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden hover-lift" animation="slideRight" delay={100}>
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                      {t('landing.benefits.improveCommunication.title')}
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('landing.benefits.improveCommunication.description')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden hover-lift" animation="slideLeft" delay={200}>
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                      {t('landing.benefits.saveTime.title')}
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('landing.benefits.saveTime.description')}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden hover-lift" animation="slideRight" delay={300}>
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                      {t('landing.benefits.neverMiss.title')}
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('landing.benefits.neverMiss.description')}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 dark:bg-gray-900" aria-labelledby="how-it-works-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="how-it-works-heading" className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('landing.howItWorks.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t('landing.howItWorks.subtitle')}
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <ScrollAnimation className="relative" animation="slideLeft">
                <article className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden h-full border-2 border-transparent hover:border-[#cc3399] transition-colors hover-lift">
                  <div className="absolute top-4 right-4 z-10 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg" aria-hidden="true">
                    1
                  </div>
                  <div className="h-48 overflow-hidden">
                    <img
                      src="/assets/images/how-it-works-step1-recording.webp"
                      alt="Recording audio easily"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                      <Mic className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {t('landing.howItWorks.step1.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('landing.howItWorks.step1.description')}
                    </p>
                  </div>
                </article>
              </ScrollAnimation>

              <ScrollAnimation className="relative" delay={200}>
                <article className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden h-full border-2 border-transparent hover:border-[#cc3399] transition-colors hover-lift">
                  <div className="absolute top-4 right-4 z-10 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg" aria-hidden="true">
                    2
                  </div>
                  <div className="h-48 overflow-hidden">
                    <img
                      src="/assets/images/how-it-works-step2-ai-processing.webp"
                      alt="AI processing audio"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8">
                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                      <Brain className="h-7 w-7 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {t('landing.howItWorks.step2.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('landing.howItWorks.step2.description')}
                    </p>
                  </div>
                </article>
              </ScrollAnimation>

              <ScrollAnimation className="relative" animation="slideRight" delay={400}>
                <article className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden h-full border-2 border-transparent hover:border-[#cc3399] transition-colors hover-lift">
                  <div className="absolute top-4 right-4 z-10 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg" aria-hidden="true">
                    3
                  </div>
                  <div className="h-48 overflow-hidden">
                    <img
                      src="/assets/images/how-it-works-step3-insights.webp"
                      alt="Reviewing insights and summaries"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8">
                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                      <Award className="h-7 w-7 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {t('landing.howItWorks.step3.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('landing.howItWorks.step3.description')}
                    </p>
                  </div>
                </article>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Credibility & Social Proof Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" aria-labelledby="security-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <ScrollAnimation>
                <h2 id="security-heading" className="text-4xl font-bold text-gray-900 mb-4">
                  {t('landing.security.title')}
                </h2>
                <p className="text-xl text-gray-700 mb-2">
                  {t('landing.security.stats.users')}, {t('landing.security.stats.rating')}
                </p>
              </ScrollAnimation>
            </div>

            <ScrollAnimation className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 md:p-12 mb-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <Shield className="h-8 w-8 text-green-600 mr-3" aria-hidden="true" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        {t('landing.security.compliance.title')}
                      </h3>
                    </div>
                    <p className="text-lg text-gray-700">
                      {t('landing.security.compliance.description')}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('landing.security.encryption.title')}</p>
                        <p className="text-sm text-gray-600">{t('landing.security.encryption.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('landing.security.retention.title')}</p>
                        <p className="text-sm text-gray-600">{t('landing.security.retention.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('landing.security.compliance.title')}</p>
                        <p className="text-sm text-gray-600">{t('landing.security.compliance.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('landing.security.audit.title')}</p>
                        <p className="text-sm text-gray-600">{t('landing.security.audit.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="relative rounded-xl overflow-hidden shadow-xl">
                    <img 
                      src="/assets/images/security-data-protection.webp"
                      alt="Enterprise-grade security and data protection"
                      className="w-full h-auto"
                      width={512}
                      height={384}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm hover-scale transition-all-smooth">
                      <Lock className="h-6 w-6 text-green-600 mx-auto mb-1" aria-hidden="true" />
                      <p className="text-xs text-gray-700 font-medium">{t('landing.security.badges.ssl')}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm hover-scale transition-all-smooth">
                      <Shield className="h-6 w-6 text-green-600 mx-auto mb-1" aria-hidden="true" />
                      <p className="text-xs text-gray-700 font-medium">{t('landing.security.badges.soc2')}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm hover-scale transition-all-smooth">
                      <Award className="h-6 w-6 text-green-600 mx-auto mb-1" aria-hidden="true" />
                      <p className="text-xs text-gray-700 font-medium">{t('landing.security.badges.gdpr')}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm hover-scale transition-all-smooth">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" aria-hidden="true" />
                      <p className="text-xs text-gray-700 font-medium">{t('landing.security.badges.hipaa')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <ScrollAnimation className="bg-white rounded-xl shadow-md p-6 text-center" animation="slideLeft">
                <Brain className="h-12 w-12 text-[#cc3399] mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('landing.security.technology.title')}
                </h3>
                <p className="text-gray-700 text-sm">
                  {t('landing.security.technology.description')}
                </p>
              </ScrollAnimation>

              <ScrollAnimation className="bg-white rounded-xl shadow-md p-6 text-center" delay={200}>
                <Award className="h-12 w-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('landing.security.useCases.title')}
                </h3>
                <p className="text-gray-700 text-sm">
                  {t('landing.security.useCases.description')}
                </p>
              </ScrollAnimation>

              <ScrollAnimation className="bg-white rounded-xl shadow-md p-6 text-center" animation="slideRight" delay={400}>
                <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('landing.security.audit.title')}
                </h3>
                <p className="text-gray-700 text-sm">
                  {t('landing.security.audit.description')}
                </p>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Why Teams Choose Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="why-teams-heading">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation className="text-center mb-12">
              <h2 id="why-teams-heading" className="text-4xl font-bold text-gray-900 mb-8">
                {t('landing.whyTeams.title')}
              </h2>
            </ScrollAnimation>

            <div className="space-y-4 mb-12">
              <ScrollAnimation animation="slideLeft">
                <div className="flex items-start bg-pink-50 rounded-lg p-6">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit1')}</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="slideRight" delay={100}>
                <div className="flex items-start bg-pink-50 rounded-lg p-6">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit2')}</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="slideLeft" delay={200}>
                <div className="flex items-start bg-pink-50 rounded-lg p-6">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit3')}</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="slideRight" delay={300}>
                <div className="flex items-start bg-pink-50 rounded-lg p-6">
                  <CheckCircle className="h-6 w-6 text-[#cc3399] mr-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="text-lg text-gray-800">{t('landing.whyTeams.benefit4')}</p>
                </div>
              </ScrollAnimation>
            </div>

            <ScrollAnimation className="text-center" delay={400}>
              <p className="text-xl font-semibold text-gray-900 mb-6">
                {t('landing.whyTeams.tagline')}
              </p>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center px-8 py-4 bg-[#cc3399] text-white font-semibold text-lg rounded-xl shadow-lg hover:bg-[#b82d89] transform transition-all hover:scale-105"
                aria-label="Start your free trial"
              >
                {t('landing.hero.cta.primary')}
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </ScrollAnimation>
          </div>
        </section>

        {/* Pricing Teaser Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="pricing-teaser-heading">
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
                    <div className="text-4xl font-bold text-gray-900 mb-2">{t('landing.pricingTeaser.free.price')}</div>
                    <p className="text-gray-700">{t('landing.pricingTeaser.free.description')}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.free.features.transcriptions')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.free.features.duration')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
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
                <div className="bg-gradient-to-br from-[#cc3399] to-purple-600 rounded-2xl p-8 border-2 border-[#cc3399] shadow-2xl transform scale-105 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                      {t('landing.pricingTeaser.professional.badge')}
                    </span>
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{t('landing.pricingTeaser.professional.name')}</h3>
                    <div className="text-4xl font-bold text-white mb-2">{t('landing.pricingTeaser.professional.price')}</div>
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
                    <div className="text-4xl font-bold text-gray-900 mb-2">{t('landing.pricingTeaser.payg.price')}</div>
                    <p className="text-gray-700">{t('landing.pricingTeaser.payg.description')}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.payg.features.credits')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{t('landing.pricingTeaser.payg.features.analyses')}</span>
                    </li>
                    <li className="flex items-start text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
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
                className="inline-flex items-center px-8 py-4 bg-white text-[#cc3399] font-semibold text-lg rounded-xl shadow-lg hover:bg-gray-100 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#cc3399] hover-glow"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
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
      </div>
    </>
  );
}