import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales } from '@/i18n.config';
import "../globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { PageTracker } from "@/components/PageTracker";
import { CookieConsent } from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://neuralsummary.com'),
  title: {
    default: 'Neural Summary - AI-Powered Audio Transcription & Smart Summaries',
    template: '%s | Neural Summary'
  },
  description: 'Transform audio recordings into accurate transcripts and intelligent summaries with Neural Summary. 99.5% accuracy, 50+ languages, enterprise security. Start free today.',
  keywords: ['audio transcription', 'AI transcription', 'speech to text', 'meeting notes', 'interview transcription', 'voice notes', 'OpenAI Whisper', 'automatic transcription', 'audio to text converter'],
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
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://neuralsummary.com',
    siteName: 'Neural Summary',
    title: 'Neural Summary - AI-Powered Audio Transcription & Smart Summaries',
    description: 'Transform audio recordings into accurate transcripts and intelligent summaries. 99.5% accuracy, 50+ languages, enterprise security.',
    images: [
      {
        url: '/assets/NS-symbol.webp',
        width: 1200,
        height: 630,
        alt: 'Neural Summary - AI Transcription Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neural Summary - AI-Powered Audio Transcription',
    description: 'Transform audio into accurate transcripts & summaries. 99.5% accuracy, 50+ languages. Start free.',
    site: '@neuralsummary',
    creator: '@neuralsummary',
    images: ['/assets/NS-symbol.webp'],
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
      'ja-JP': 'https://neuralsummary.com/ja',
      'zh-CN': 'https://neuralsummary.com/zh',
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
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <AnalyticsProvider>
              <PageTracker />
              {children}
              <CookieConsent />
            </AnalyticsProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
