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
  const t = await getTranslations({ locale, namespace: 'forConsultants' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
      url: `https://neuralsummary.com/${locale}/for-consultants`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
    },
    alternates: {
      canonical: `https://neuralsummary.com/${locale}/for-consultants`,
    },
  };
}

export default async function ForConsultantsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'forConsultants' });

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
          }}
        />

        <WaveDivider />

        {/* 2. Output Preview — Email */}
        <OutputPreviewSection
          variant="email"
          translations={{
            tag: t('outputPreview.tag'),
            badge: t('outputPreview.badge'),
            label: t('outputPreview.label'),
            to: t('outputPreview.to'),
            toValue: t('outputPreview.toValue'),
            subject: t('outputPreview.subject'),
            subjectValue: t('outputPreview.subjectValue'),
            greeting: t('outputPreview.greeting'),
            body: t('outputPreview.body'),
            bullets: [
              t('outputPreview.bullets.0'),
              t('outputPreview.bullets.1'),
              t('outputPreview.bullets.2'),
            ],
            closing: t('outputPreview.closing'),
          }}
        />

        <WaveDivider />

        {/* 3. Pain Gap — Timeline variant */}
        <PainGapSection
          variant="timeline"
          translations={{
            tag: t('painGap.tag'),
            headline1: t('painGap.headline1'),
            headline2: t('painGap.headline2'),
            headlineEm: t('painGap.headlineEm'),
            body: t('painGap.body'),
            them: {
              label: t('painGap.them.label'),
              step1: t('painGap.them.step1'),
              step2: t('painGap.them.step2'),
              step3: t('painGap.them.step3'),
            },
            you: {
              label: t('painGap.you.label'),
              step1: t('painGap.you.step1'),
              step2: t('painGap.you.step2'),
              step3: t('painGap.you.step3'),
            },
          }}
        />

        <WaveDivider />

        {/* 3. Deliverable Showcase */}
        <DeliverableShowcaseSection
          variant="consultant"
          translations={{
            tag: t('deliverables.tag'),
            headline1: t('deliverables.headline1'),
            headline2: t('deliverables.headline2'),
            headlineEm: t('deliverables.headlineEm'),
            headline3: t('deliverables.headline3'),
            body: t('deliverables.body'),
            items: [
              { title: t('deliverables.followUp.title'), desc: t('deliverables.followUp.desc') },
              { title: t('deliverables.proposal.title'), desc: t('deliverables.proposal.desc') },
              { title: t('deliverables.engagement.title'), desc: t('deliverables.engagement.desc') },
              { title: t('deliverables.notes.title'), desc: t('deliverables.notes.desc') },
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
          avatar="/assets/images/avatars/wouter-chompff.webp"
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
              '@id': `https://neuralsummary.com/${locale}/for-consultants`,
              name: t('meta.title'),
              description: t('meta.description'),
              url: `https://neuralsummary.com/${locale}/for-consultants`,
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
