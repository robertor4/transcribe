import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';
import { WaveDivider } from '@/components/landing/shared/WaveDivider';
import { PersonaHeroSection } from '@/components/landing/sections/persona/PersonaHeroSection';
import { OutputPreviewSection } from '@/components/landing/sections/persona/OutputPreviewSection';
import { PainGapSection } from '@/components/landing/sections/persona/PainGapSection';
import { DeliverableShowcaseSection } from '@/components/landing/sections/persona/DeliverableShowcaseSection';
import { HowItWorksSection } from '@/components/landing/sections/persona/HowItWorksSection';
import { PersonaTestimonialSection } from '@/components/landing/sections/persona/PersonaTestimonialSection';
import { PersonaCtaSection } from '@/components/landing/sections/persona/PersonaCtaSection';
import { CookieConsent } from '@/components/CookieConsent';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'forProductLeaders' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
      url: `https://neuralsummary.com/${locale}/for-product-leaders`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
    },
    alternates: {
      canonical: `https://neuralsummary.com/${locale}/for-product-leaders`,
    },
  };
}

export default async function ForProductLeadersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'forProductLeaders' });

  return (
    <>
      <PublicHeader locale={locale} />

      <main className="min-h-screen bg-[#22184C] text-white overflow-x-hidden relative landing-page">
        <AmbientGradient />

        {/* 1. Hero */}
        <PersonaHeroSection
          locale={locale}
          translations={{
            eyebrow: t('hero.eyebrow'),
            headline1: t('hero.headline1'),
            headlineEm: t('hero.headlineEm'),
            body: t('hero.body'),
            bodyStrong: t('hero.bodyStrong'),
            cta: t('hero.cta'),
            ctaSecondary: t('hero.ctaSecondary'),
            socialProof: t('hero.socialProof'),
          }}
        />

        <WaveDivider />

        {/* 2. Output Preview — Spec */}
        <OutputPreviewSection
          variant="spec"
          translations={{
            tag: t('outputPreview.tag'),
            badge: t('outputPreview.badge'),
            label: t('outputPreview.label'),
            feature: t('outputPreview.feature'),
            featureValue: t('outputPreview.featureValue'),
            owner: t('outputPreview.owner'),
            ownerValue: t('outputPreview.ownerValue'),
            status: t('outputPreview.status'),
            statusValue: t('outputPreview.statusValue'),
            goalsTitle: t('outputPreview.goalsTitle'),
            goals: [
              t('outputPreview.goals.0'),
              t('outputPreview.goals.1'),
              t('outputPreview.goals.2'),
            ],
            reqTitle: t('outputPreview.reqTitle'),
            reqPriority: t('outputPreview.reqPriority'),
            requirements: [
              { name: t('outputPreview.requirements.0.name'), priority: t('outputPreview.requirements.0.priority') },
              { name: t('outputPreview.requirements.1.name'), priority: t('outputPreview.requirements.1.priority') },
              { name: t('outputPreview.requirements.2.name'), priority: t('outputPreview.requirements.2.priority') },
              { name: t('outputPreview.requirements.3.name'), priority: t('outputPreview.requirements.3.priority') },
            ],
          }}
        />

        <WaveDivider />

        {/* 3. Pain Gap — Grid variant */}
        <PainGapSection
          variant="grid"
          translations={{
            tag: t('painGap.tag'),
            headline1: t('painGap.headline1'),
            headline2: t('painGap.headline2'),
            headlineEm: t('painGap.headlineEm'),
            body: t('painGap.body'),
            decisions: {
              title: t('painGap.decisions.title'),
              desc: t('painGap.decisions.desc'),
            },
            feedback: {
              title: t('painGap.feedback.title'),
              desc: t('painGap.feedback.desc'),
            },
            requirements: {
              title: t('painGap.requirements.title'),
              desc: t('painGap.requirements.desc'),
            },
            actions: {
              title: t('painGap.actions.title'),
              desc: t('painGap.actions.desc'),
            },
          }}
        />

        <WaveDivider />

        {/* 3. Deliverable Showcase */}
        <DeliverableShowcaseSection
          variant="product"
          translations={{
            tag: t('deliverables.tag'),
            headline1: t('deliverables.headline1'),
            headline2: t('deliverables.headline2'),
            headlineEm: t('deliverables.headlineEm'),
            headline3: t('deliverables.headline3'),
            body: t('deliverables.body'),
            items: [
              { title: t('deliverables.spec.title'), desc: t('deliverables.spec.desc') },
              { title: t('deliverables.brief.title'), desc: t('deliverables.brief.desc') },
              { title: t('deliverables.insights.title'), desc: t('deliverables.insights.desc') },
              { title: t('deliverables.sprint.title'), desc: t('deliverables.sprint.desc') },
            ],
          }}
        />

        <WaveDivider />

        {/* 4. How It Works */}
        <HowItWorksSection
          translations={{
            tag: t('howItWorks.tag'),
            headline1: t('howItWorks.headline1'),
            headline2: t('howItWorks.headline2'),
            headlineEm: t('howItWorks.headlineEm'),
            steps: [
              { number: t('howItWorks.record.number'), title: t('howItWorks.record.title'), desc: t('howItWorks.record.desc') },
              { number: t('howItWorks.process.number'), title: t('howItWorks.process.title'), desc: t('howItWorks.process.desc') },
              { number: t('howItWorks.deliver.number'), title: t('howItWorks.deliver.title'), desc: t('howItWorks.deliver.desc') },
            ],
          }}
        />

        <WaveDivider />

        {/* 5. Testimonial */}
        <PersonaTestimonialSection
          avatar="/assets/images/avatars/sofiya-hodovanska.jpeg"
          translations={{
            stars: t('testimonial.stars'),
            quote1: t('testimonial.quote1'),
            quoteStrong: t('testimonial.quoteStrong'),
            quote2: t('testimonial.quote2'),
            name: t('testimonial.name'),
            role: t('testimonial.role'),
          }}
        />

        <WaveDivider />

        {/* 6. Final CTA */}
        <PersonaCtaSection
          locale={locale}
          translations={{
            tag: t('cta.tag'),
            headline1: t('cta.headline1'),
            headline2: t('cta.headline2'),
            headlineEm: t('cta.headlineEm'),
            ctaPrimary: t('cta.ctaPrimary'),
            meta: {
              trial: t('cta.meta.trial'),
              noCard: t('cta.meta.noCard'),
              cancel: t('cta.meta.cancel'),
            },
          }}
        />

        {/* Footer */}
        <PublicFooter locale={locale} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': `https://neuralsummary.com/${locale}/for-product-leaders`,
              name: t('meta.title'),
              description: t('meta.description'),
              url: `https://neuralsummary.com/${locale}/for-product-leaders`,
              isPartOf: { '@id': 'https://neuralsummary.com/#website' },
              about: {
                '@type': 'SoftwareApplication',
                '@id': 'https://neuralsummary.com/#software',
              },
            }),
          }}
        />
      </main>
      <CookieConsent />
    </>
  );
}
