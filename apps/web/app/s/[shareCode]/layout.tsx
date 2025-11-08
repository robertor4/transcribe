import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import { Inter } from "next/font/google";
import { Metadata } from 'next';
import { getShareMetadata } from '@/utils/metadata';
import "../../globals.css";

const inter = Inter({ subsets: ["latin"] });

type Props = {
  params: Promise<{ shareCode: string }>;
  children: React.ReactNode;
};

/**
 * Generate dynamic metadata for legacy share links
 * Even though this redirects, we provide metadata for crawlers
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { shareCode } = resolvedParams;

  try {
    // Fetch the shared transcription data using the share code
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/transcriptions/shared/${shareCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      // If transcription not found, use generic metadata
      return getShareMetadata(
        {
          title: 'Shared Transcript',
          summary: 'View this transcript shared via Neural Summary',
          shareToken: shareCode,
        },
        'en', // Default to English for legacy links
      );
    }

    const data = await response.json();

    if (data.success && data.data) {
      const transcription = data.data;

      // Try to get summary from various analysis types
      let summary = '';
      if (transcription.analyses) {
        summary = transcription.analyses.summary?.content ||
                  transcription.analyses.actionItems?.content ||
                  transcription.analyses.communicationStyles?.content ||
                  '';
      }

      // If no summary, use first 200 chars of transcript
      if (!summary && transcription.transcriptText) {
        summary = transcription.transcriptText.substring(0, 200);
      }

      return getShareMetadata(
        {
          title: transcription.title || transcription.fileName || 'Shared Transcript',
          summary,
          shareToken: shareCode,
        },
        'en', // Default to English for legacy links
      );
    }
  } catch (error) {
    console.error('Error generating metadata for legacy share link:', error);
  }

  // Fallback metadata if fetch fails
  return getShareMetadata(
    {
      title: 'Shared Transcript',
      summary: 'View this transcript shared via Neural Summary',
      shareToken: shareCode,
    },
    'en',
  );
}

export default async function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the user's preferred language from Accept-Language header
  // or default to 'en'
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Simple language detection - just check for common language codes
  let locale = 'en'; // default
  if (acceptLanguage.includes('nl')) locale = 'nl';
  else if (acceptLanguage.includes('de')) locale = 'de';
  else if (acceptLanguage.includes('fr')) locale = 'fr';
  else if (acceptLanguage.includes('es')) locale = 'es';
  
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}