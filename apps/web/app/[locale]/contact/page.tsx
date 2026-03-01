import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { ContactForm } from '@/components/ContactForm';
import { Mail, MessageSquare } from 'lucide-react';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  };
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="min-h-screen flex flex-col bg-[#22184C]">
      <PublicHeader locale={locale} />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.08] mb-6">
              <MessageSquare className="w-8 h-8 text-[#14D0DC]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="pb-24 px-6 sm:px-8 lg:px-12">
          <div className="max-w-xl mx-auto">
            <div className="bg-white/[0.08] rounded-2xl border border-white/[0.08] p-8">
              <ContactForm locale={locale} />
            </div>

            {/* Alternative contact method */}
            <div className="mt-8 text-center">
              <a
                href="mailto:hello@neuralsummary.com"
                className="text-sm text-white/40 hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@neuralsummary.com
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
