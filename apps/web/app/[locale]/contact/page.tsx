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
    <div className="min-h-screen flex flex-col">
      <PublicHeader locale={locale} />

      <main className="flex-grow bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#23194B]/10 mb-6">
              <MessageSquare className="w-8 h-8 text-[#23194B]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="pb-24 px-6 sm:px-8 lg:px-12">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <ContactForm locale={locale} />
            </div>

            {/* Alternative contact method */}
            <div className="mt-8 text-center">
              <a
                href="mailto:hello@neuralsummary.com"
                className="text-sm text-gray-500 hover:text-[#23194B] inline-flex items-center gap-1 transition-colors"
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
