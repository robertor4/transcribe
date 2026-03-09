import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import {
  Mic,
  Brain,
  FileText,
  MessageSquare,
  Briefcase,
  Rocket,
  Users,
  Pen,
  Shield,
  Sparkles,
  Minimize2,
} from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: [
      'Neural Summary',
      'about Neural Summary',
      'Neural Summary AI',
      'voice to document platform',
      'meeting intelligence',
      'AI transcription platform',
      'Neural Summary company',
    ],
    alternates: {
      canonical: `https://neuralsummary.com/${locale}/about`,
      languages: {
        en: 'https://neuralsummary.com/en/about',
        nl: 'https://neuralsummary.com/nl/about',
        de: 'https://neuralsummary.com/de/about',
        fr: 'https://neuralsummary.com/fr/about',
        es: 'https://neuralsummary.com/es/about',
      },
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  };
}

const featureIcons = {
  transcription: Mic,
  analysis: Brain,
  templates: FileText,
  chat: MessageSquare,
};

const roleIcons = {
  pm: Briefcase,
  founders: Rocket,
  consultants: Users,
  creators: Pen,
};

const valueIcons = {
  privacy: Shield,
  quality: Sparkles,
  simplicity: Minimize2,
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `https://neuralsummary.com/${locale}/about`,
        name: t('title'),
        description: t('meta.description'),
        url: `https://neuralsummary.com/${locale}/about`,
        mainEntity: { '@id': 'https://neuralsummary.com/#organization' },
      },
      {
        '@type': 'Organization',
        '@id': 'https://neuralsummary.com/#organization',
        name: 'Neural Summary',
        alternateName: 'NeuralSummary',
        url: 'https://neuralsummary.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://neuralsummary.com/assets/logos/neural-summary-logo.svg',
        },
        image: 'https://neuralsummary.com/assets/socials/neural-summary-og.png',
        description: t('meta.description'),
        foundingDate: '2025',
        sameAs: [
          'https://www.youtube.com/@NeuralSummary',
          'https://www.linkedin.com/company/neural-summary/',
          'https://x.com/NeuralSummary',
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#22184C]">
      <PublicHeader locale={locale} />

      <main className="flex-grow">
        {/* Hero */}
        <section className="pt-32 pb-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[2px] uppercase text-[#14D0DC] mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#14D0DC]" />
              {t('mission.tag')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              {t('mission.title')}
            </h2>
            <p className="text-lg text-white/70 leading-relaxed max-w-3xl">
              {t('mission.body')}
            </p>
          </div>
        </section>

        {/* Product */}
        <section className="py-16 px-6 sm:px-8 lg:px-12 bg-white/[0.03]">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[2px] uppercase text-[#14D0DC] mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#14D0DC]" />
              {t('product.tag')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              {t('product.title')}
            </h2>
            <p className="text-lg text-white/70 leading-relaxed max-w-3xl mb-12">
              {t('product.body')}
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {(
                Object.keys(featureIcons) as Array<keyof typeof featureIcons>
              ).map((key) => {
                const Icon = featureIcons[key];
                return (
                  <div
                    key={key}
                    className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-6"
                  >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#8D6AFA]/20 mb-4">
                      <Icon className="w-5 h-5 text-[#8D6AFA]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t(`product.features.${key}.title`)}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {t(`product.features.${key}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Audience */}
        <section className="py-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[2px] uppercase text-[#14D0DC] mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#14D0DC]" />
              {t('audience.tag')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-10">
              {t('audience.title')}
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {(Object.keys(roleIcons) as Array<keyof typeof roleIcons>).map(
                (key) => {
                  const Icon = roleIcons[key];
                  return (
                    <div key={key} className="flex gap-4">
                      <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#14D0DC]/20">
                        <Icon className="w-5 h-5 text-[#14D0DC]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {t(`audience.roles.${key}.title`)}
                        </h3>
                        <p className="text-sm text-white/60">
                          {t(`audience.roles.${key}.desc`)}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-6 sm:px-8 lg:px-12 bg-white/[0.03]">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[2px] uppercase text-[#14D0DC] mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#14D0DC]" />
              {t('values.tag')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-10">
              {t('values.title')}
            </h2>

            <div className="grid sm:grid-cols-3 gap-6">
              {(
                Object.keys(valueIcons) as Array<keyof typeof valueIcons>
              ).map((key) => {
                const Icon = valueIcons[key];
                return (
                  <div
                    key={key}
                    className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-6"
                  >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#8D6AFA]/20 mb-4">
                      <Icon className="w-5 h-5 text-[#8D6AFA]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t(`values.items.${key}.title`)}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {t(`values.items.${key}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-white/60 mb-8">{t('cta.body')}</p>
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center bg-[#8D6AFA] text-white px-7 py-3.5 rounded-full text-[15px] font-semibold transition-all hover:bg-[#7A5AE0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(141,106,250,0.35)]"
            >
              {t('cta.button')}
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter locale={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}
