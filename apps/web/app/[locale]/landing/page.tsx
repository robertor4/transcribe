import React from 'react';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';
import { WaveDivider } from '@/components/landing/shared/WaveDivider';
import { SocialProofBar } from '@/components/landing/sections/SocialProofBar';
import { CompatibilitySection } from '@/components/landing/sections/CompatibilitySection';
import { OutputsSection } from '@/components/landing/sections/OutputsSection';
import { AskAnythingSection } from '@/components/landing/sections/AskAnythingSection';
import { InfrastructureSection } from '@/components/landing/sections/InfrastructureSection';
import { IntegrationsSection } from '@/components/landing/sections/IntegrationsSection';
import { TestimonialsSection } from '@/components/landing/sections/TestimonialsSection';
import { SecuritySection } from '@/components/landing/sections/SecuritySection';
import { PricingSection } from '@/components/landing/sections/PricingSection';
import { FinalCtaSection } from '@/components/landing/sections/FinalCtaSection';

// Dynamic import for the hero (client component with framer-motion animations)
const HeroSection = dynamic(
  () => import('@/components/landing/sections/HeroSection').then(mod => ({ default: mod.HeroSection })),
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

      <div className="min-h-screen bg-[#22184C] text-white overflow-x-hidden relative landing-page">
        <AmbientGradient />

        {/* 1. Hero */}
        <HeroSection
          locale={locale}
          translations={{
            eyebrow: t('hero.eyebrow'),
            headline1: t('hero.headline1'),
            headline2: t('hero.headline2'),
            headlineEm: t('hero.headlineEm'),
            body: t('hero.body'),
            bodyStrong: t('hero.bodyStrong'),
            bodyEnd: t('hero.bodyEnd'),
            ctaPrimary: t('hero.ctaPrimary'),
            ctaSecondary: t('hero.ctaSecondary'),
            socialProof: t('hero.socialProof'),
            lionPlaceholder: t('hero.lionPlaceholder'),
            card: {
              tabSummary: t('hero.card.tabSummary'),
              tabTranscript: t('hero.card.tabTranscript'),
              duration: t('hero.card.duration'),
              durationValue: t('hero.card.durationValue'),
              segments: t('hero.card.segments'),
              segmentsValue: t('hero.card.segmentsValue'),
              speakers: t('hero.card.speakers'),
              speakersValue: t('hero.card.speakersValue'),
              confidence: t('hero.card.confidence'),
              confidenceValue: t('hero.card.confidenceValue'),
              speakerA: t('hero.card.speakerA'),
              speakerAText: t('hero.card.speakerAText'),
              speakerB: t('hero.card.speakerB'),
              speakerBText: t('hero.card.speakerBText'),
            },
          }}
        />

        <WaveDivider />

        {/* 2. Social Proof Bar */}
        <SocialProofBar
          translations={{
            stars: t('proofBar.stars'),
            quote1: t('proofBar.quote1'),
            quoteStrong: t('proofBar.quoteStrong'),
            quote2: t('proofBar.quote2'),
            name: t('proofBar.name'),
            title: t('proofBar.title'),
          }}
        />

        <WaveDivider />

        {/* 3. Compatibility — platforms */}
        <CompatibilitySection
          translations={{
            tag: t('compatibility.tag'),
            headline1: t('compatibility.headline1'),
            headline2: t('compatibility.headline2'),
            headlineEm: t('compatibility.headlineEm'),
            body: t('compatibility.body'),
            platforms: {
              meet: { name: t('compatibility.platforms.meet.name'), desc: t('compatibility.platforms.meet.desc') },
              teams: { name: t('compatibility.platforms.teams.name'), desc: t('compatibility.platforms.teams.desc') },
              zoom: { name: t('compatibility.platforms.zoom.name'), desc: t('compatibility.platforms.zoom.desc') },
              anyAudio: { name: t('compatibility.platforms.anyAudio.name'), desc: t('compatibility.platforms.anyAudio.desc') },
            },
            noBotCallout: t('compatibility.noBotCallout'),
            noBotCalloutBody: t('compatibility.noBotCalloutBody'),
          }}
        />

        <WaveDivider />

        {/* 4. Output categories */}
        <OutputsSection
          translations={{
            tag: t('outputs.tag'),
            headline1: t('outputs.headline1'),
            headline2: t('outputs.headline2'),
            headlineEm: t('outputs.headlineEm'),
            headline3: t('outputs.headline3'),
            body: t('outputs.body'),
            categories: {
              sales: { title: t('outputs.categories.sales.title'), subtitle: t('outputs.categories.sales.subtitle'), chips: t('outputs.categories.sales.chips') },
              marketing: { title: t('outputs.categories.marketing.title'), subtitle: t('outputs.categories.marketing.subtitle'), chips: t('outputs.categories.marketing.chips') },
              product: { title: t('outputs.categories.product.title'), subtitle: t('outputs.categories.product.subtitle'), chips: t('outputs.categories.product.chips') },
              tech: { title: t('outputs.categories.tech.title'), subtitle: t('outputs.categories.tech.subtitle'), chips: t('outputs.categories.tech.chips') },
            },
          }}
        />

        <WaveDivider />

        {/* 5. Ask Anything — AI chat */}
        <AskAnythingSection
          translations={{
            tag: t('ask.tag'),
            headline1: t('ask.headline1'),
            headline2: t('ask.headline2'),
            headlineEm: t('ask.headlineEm'),
            body: t('ask.body'),
            features: {
              timestamps: { title: t('ask.features.timestamps.title'), desc: t('ask.features.timestamps.desc') },
              search: { title: t('ask.features.search.title'), desc: t('ask.features.search.desc') },
              languages: { title: t('ask.features.languages.title'), desc: t('ask.features.languages.desc') },
            },
            chat: {
              header: t('ask.chat.header'),
              headerSub: t('ask.chat.headerSub'),
              userMsg1: t('ask.chat.userMsg1'),
              aiReply1a: t('ask.chat.aiReply1a'),
              aiReply1chip1: t('ask.chat.aiReply1chip1'),
              aiReply1b: t('ask.chat.aiReply1b'),
              aiReply1chip2: t('ask.chat.aiReply1chip2'),
              aiReply1c: t('ask.chat.aiReply1c'),
              aiReply1chip3: t('ask.chat.aiReply1chip3'),
              userMsg2: t('ask.chat.userMsg2'),
              aiReply2a: t('ask.chat.aiReply2a'),
              aiReply2chip1: t('ask.chat.aiReply2chip1'),
              aiReply2b: t('ask.chat.aiReply2b'),
              aiReply2chip2: t('ask.chat.aiReply2chip2'),
              inputPlaceholder: t('ask.chat.inputPlaceholder'),
            },
          }}
        />

        <WaveDivider />

        {/* 6. Infrastructure — stats */}
        <InfrastructureSection
          translations={{
            tag: t('infrastructure.tag'),
            headline1: t('infrastructure.headline1'),
            headlineEm: t('infrastructure.headlineEm'),
            body: t('infrastructure.body'),
            stats: {
              languages: { number: t('infrastructure.stats.languages.number'), label: t('infrastructure.stats.languages.label'), desc: t('infrastructure.stats.languages.desc') },
              accuracy: { number: t('infrastructure.stats.accuracy.number'), label: t('infrastructure.stats.accuracy.label'), desc: t('infrastructure.stats.accuracy.desc') },
              speed: { number: t('infrastructure.stats.speed.number'), label: t('infrastructure.stats.speed.label'), desc: t('infrastructure.stats.speed.desc') },
            },
          }}
        />

        <WaveDivider />

        {/* 7. Integrations */}
        <IntegrationsSection
          translations={{
            tag: t('integrations.tag'),
            headline1: t('integrations.headline1'),
            headline2: t('integrations.headline2'),
            headlineEm: t('integrations.headlineEm'),
            body: t('integrations.body'),
            logos: t('integrations.logos'),
          }}
        />

        <WaveDivider />

        {/* 8. Testimonials */}
        <TestimonialsSection
          translations={{
            tag: t('testimonials.tag'),
            headline1: t('testimonials.headline1'),
            headline2: t('testimonials.headline2'),
            headlineEm: t('testimonials.headlineEm'),
            cards: {
              t1: {
                quote1: t('testimonials.cards.t1.quote1'),
                quoteStrong: t('testimonials.cards.t1.quoteStrong'),
                quote2: t('testimonials.cards.t1.quote2'),
                name: t('testimonials.cards.t1.name'),
                role: t('testimonials.cards.t1.role'),
                initials: t('testimonials.cards.t1.initials'),
              },
              t2: {
                quote1: t('testimonials.cards.t2.quote1'),
                quoteStrong: t('testimonials.cards.t2.quoteStrong'),
                quote2: t('testimonials.cards.t2.quote2'),
                name: t('testimonials.cards.t2.name'),
                role: t('testimonials.cards.t2.role'),
                initials: t('testimonials.cards.t2.initials'),
              },
              t3: {
                quote1: t('testimonials.cards.t3.quote1'),
                quoteStrong: t('testimonials.cards.t3.quoteStrong'),
                quote2: t('testimonials.cards.t3.quote2'),
                name: t('testimonials.cards.t3.name'),
                role: t('testimonials.cards.t3.role'),
                initials: t('testimonials.cards.t3.initials'),
              },
            },
          }}
        />

        <WaveDivider />

        {/* 9. Security */}
        <SecuritySection
          translations={{
            tag: t('security.tag'),
            headline1: t('security.headline1'),
            headlineEm: t('security.headlineEm'),
            headline2: t('security.headline2'),
            body: t('security.body'),
            badges: {
              gdpr: { title: t('security.badges.gdpr.title'), desc: t('security.badges.gdpr.desc') },
              encrypted: { title: t('security.badges.encrypted.title'), desc: t('security.badges.encrypted.desc') },
              autoDelete: { title: t('security.badges.autoDelete.title'), desc: t('security.badges.autoDelete.desc') },
              ownership: { title: t('security.badges.ownership.title'), desc: t('security.badges.ownership.desc') },
            },
          }}
        />

        <WaveDivider />

        {/* 10. Pricing */}
        <PricingSection
          locale={locale}
          translations={{
            tag: t('pricing.tag'),
            headline1: t('pricing.headline1'),
            headline2: t('pricing.headline2'),
            headlineEm: t('pricing.headlineEm'),
            body: t('pricing.body'),
            starter: {
              tier: t('pricing.starter.tier'),
              price: t('pricing.starter.price'),
              period: t('pricing.starter.period'),
              periodSub: t('pricing.starter.periodSub'),
              features: t('pricing.starter.features'),
              cta: t('pricing.starter.cta'),
            },
            pro: {
              tier: t('pricing.pro.tier'),
              price: t('pricing.pro.price'),
              period: t('pricing.pro.period'),
              periodSub: t('pricing.pro.periodSub'),
              badge: t('pricing.pro.badge'),
              features: t('pricing.pro.features'),
              cta: t('pricing.pro.cta'),
            },
            team: {
              tier: t('pricing.team.tier'),
              price: t('pricing.team.price'),
              period: t('pricing.team.period'),
              periodSub: t('pricing.team.periodSub'),
              features: t('pricing.team.features'),
              cta: t('pricing.team.cta'),
            },
            note: t('pricing.note'),
            noteCta: t('pricing.noteCta'),
          }}
        />

        <WaveDivider />

        {/* 11. Final CTA */}
        <FinalCtaSection
          locale={locale}
          translations={{
            tag: t('finalCta.tag'),
            headline1: t('finalCta.headline1'),
            headline2: t('finalCta.headline2'),
            headlineEm: t('finalCta.headlineEm'),
            body: t('finalCta.body'),
            ctaPrimary: t('finalCta.ctaPrimary'),
            ctaSecondary: t('finalCta.ctaSecondary'),
            meta: {
              trial: t('finalCta.meta.trial'),
              noCard: t('finalCta.meta.noCard'),
              noBot: t('finalCta.meta.noBot'),
              cancel: t('finalCta.meta.cancel'),
            },
          }}
        />

        {/* Footer */}
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
                  description: 'The meeting intelligence platform. Turn every conversation into searchable transcripts, summaries, and ready-to-use documents.',
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://neuralsummary.com/#software',
                  name: 'Neural Summary',
                  applicationCategory: 'BusinessApplication',
                  applicationSubCategory: 'Meeting Intelligence Platform',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'EUR',
                    description: 'Free tier available with 5 recordings per month',
                  },
                  featureList: [
                    'Meeting transcription with speaker identification',
                    'AI-generated summaries and action items',
                    'Template library for professional document outputs',
                    'AI chat to query meeting content',
                    'Multi-language support (99+ languages)',
                    'Platform integrations (Notion, Slack, Google Drive)',
                    'GDPR compliance with EU data residency',
                  ],
                  description: 'Neural Summary turns every meeting into searchable transcripts, summaries, and ready-to-use documents. Nothing gets lost. Nothing needs to be rewritten.',
                },
              ],
            }),
          }}
        />
      </div>
    </>
  );
}
