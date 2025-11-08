import { Metadata } from 'next';
import { getShareMetadata } from '@/utils/metadata';

type Props = {
  params: Promise<{ shareToken: string; locale: string }>;
  children: React.ReactNode;
};

/**
 * Generate dynamic metadata for shared transcripts
 * This allows proper Open Graph tags when sharing links
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { shareToken, locale } = resolvedParams;

  try {
    // Fetch the shared transcription data to get title and summary
    // Use API_URL for server-side (internal), NEXT_PUBLIC_API_URL for client-side
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    console.log('[Metadata] Fetching transcript data for:', shareToken, 'from:', apiUrl);

    const response = await fetch(`${apiUrl}/transcriptions/shared/${shareToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't increment view count for metadata generation
      next: { revalidate: 3600 }, // Cache for 1 hour
      cache: 'force-cache',
    });

    if (!response.ok) {
      console.log('[Metadata] API response not OK:', response.status, response.statusText);
      // If transcription not found or password protected, use generic metadata
      return getShareMetadata(
        {
          title: 'Shared Transcript',
          summary: 'View this transcript shared via Neural Summary',
          shareToken,
        },
        locale,
      );
    }

    const data = await response.json();
    console.log('[Metadata] Received data:', {
      success: data.success,
      hasData: !!data.data,
      title: data.data?.title,
      hasAnalyses: !!data.data?.analyses,
      hasTranscript: !!data.data?.transcriptText,
    });

    if (data.success && data.data) {
      const transcription = data.data;

      // Try to get summary from various analysis types
      let summary = '';
      if (transcription.analyses) {
        // Priority: summary > actionItems > communicationStyles
        summary = transcription.analyses.summary?.content ||
                  transcription.analyses.actionItems?.content ||
                  transcription.analyses.communicationStyles?.content ||
                  '';
      }

      // If no summary, use first 200 chars of transcript
      if (!summary && transcription.transcriptText) {
        summary = transcription.transcriptText.substring(0, 200);
      }

      console.log('[Metadata] Generated metadata:', {
        title: transcription.title || transcription.fileName || 'Shared Transcript',
        summaryLength: summary.length,
      });

      return getShareMetadata(
        {
          title: transcription.title || transcription.fileName || 'Shared Transcript',
          summary,
          shareToken,
        },
        locale,
      );
    }
  } catch (error) {
    console.error('[Metadata] Error generating metadata for shared transcription:', error);
  }

  // Fallback metadata if fetch fails
  return getShareMetadata(
    {
      title: 'Shared Transcript',
      summary: 'View this transcript shared via Neural Summary',
      shareToken,
    },
    locale,
  );
}

export default function SharedLayout({ children }: Props) {
  return <>{children}</>;
}
