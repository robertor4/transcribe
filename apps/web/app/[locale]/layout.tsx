import type { Metadata, Viewport } from "next";
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales } from '@/i18n.config';
import "../globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://neuralsummary.com'),
  title: 'Neural Summary – You Speak. It Creates.',
  description: 'Turn spoken thinking into structured, professional documents. Upload conversations or let AI interview you to generate product specs, articles, strategies, and emails. No writing. No formatting. Just think out loud.',
  keywords: [
    'voice to document',
    'speech to structure',
    'AI document creation',
    'voice-to-output platform',
    'AI interview assistant',
    'speaking to writing',
    'audio to document',
    'voice-powered creation',
    'AI document generator',
    'conversation to spec',
    'transcription to deliverables',
    'AI transcription and analysis',
    'audio to article',
    'speech to document creation',
    'AI content generation from voice'
  ],
  authors: [{ name: 'Neural Summary' }],
  creator: 'Neural Summary',
  publisher: 'Neural Summary',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/assets/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/assets/favicons/favicon.ico',
    apple: '/assets/favicons/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/assets/favicons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/assets/favicons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  manifest: '/assets/favicons/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://neuralsummary.com',
    siteName: 'Neural Summary',
    title: 'Neural Summary – You Speak. It Creates.',
    description: 'Turn spoken thinking into structured, professional documents with AI that interviews you and generates work-ready deliverables.',
    images: [
      {
        url: 'https://neuralsummary.com/assets/socials/neural-summary-og.png',
        width: 1200,
        height: 630,
        alt: 'Neural Summary - You speak. It creates.',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neural Summary – You Speak. It Creates.',
    description: 'Turn spoken thinking into structured documents. Upload conversations or let AI interview you. No writing. No formatting. Just think out loud.',
    site: '@neuralsummary',
    creator: '@neuralsummary',
    images: ['https://neuralsummary.com/assets/socials/neural-summary-og.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://neuralsummary.com',
    languages: {
      'en-US': 'https://neuralsummary.com/en',
      'es-ES': 'https://neuralsummary.com/es',
      'fr-FR': 'https://neuralsummary.com/fr',
      'de-DE': 'https://neuralsummary.com/de',
      'nl-NL': 'https://neuralsummary.com/nl',
    },
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
  },
  category: 'technology',
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as typeof locales[number])) {
    notFound();
  }

  // Get messages for the specific locale
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
