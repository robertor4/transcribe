'use client';

import { FileText, Copy } from 'lucide-react';
import { DetailPageLayout } from '@/components/detail-pages/DetailPageLayout';
import { DetailPageHeader } from '@/components/detail-pages/DetailPageHeader';
import { DetailMetadataPanel } from '@/components/detail-pages/DetailMetadataPanel';
import { Button } from '@/components/Button';
import TranscriptTimeline from '@/components/TranscriptTimeline';
import { useConversation } from '@/hooks/useConversation';
import { formatDuration } from '@/lib/formatters';

interface TranscriptPageClientProps {
  conversationId: string;
}

export function TranscriptPageClient({ conversationId }: TranscriptPageClientProps) {
  const { conversation, isLoading, error, refresh } = useConversation(conversationId);

  const handleCopyTranscript = () => {
    if (conversation?.source.transcript.speakerSegments) {
      const formattedTranscript = conversation.source.transcript.speakerSegments
        .map(segment => {
          const minutes = Math.floor(segment.startTime / 60);
          const seconds = Math.floor(segment.startTime % 60);
          const timestamp = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
          return `${timestamp} ${segment.speakerTag}: ${segment.text}`;
        })
        .join('\n\n');

      navigator.clipboard.writeText(formattedTranscript);
      alert('Transcript copied to clipboard!');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading transcript...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Conversation Not Found</h2>
          <p className="text-gray-600">{error?.message || 'Unable to load conversation'}</p>
        </div>
      </div>
    );
  }

  const transcript = conversation.source.transcript;
  const detailsData = [
    { label: 'Speakers', value: transcript.speakers },
    { label: 'Confidence', value: `${Math.floor(transcript.confidence * 100)}%` },
    { label: 'Duration', value: formatDuration(conversation.source.audioDuration) },
    ...(transcript.speakerSegments
      ? [{ label: 'Segments', value: transcript.speakerSegments.length }]
      : []
    )
  ];

  return (
    <DetailPageLayout
      conversationId={conversationId}
      rightPanel={
        <DetailMetadataPanel
          conversation={{
            id: conversation.id,
            title: conversation.title,
            audioDuration: conversation.source.audioDuration
          }}
          details={detailsData}
          sectionTitle="Conversation"
          detailsIcon={FileText}
          actionsIcon={Copy}
        />
      }
    >
      <DetailPageHeader
        conversationId={conversationId}
        conversationTitle={conversation.title}
        icon={FileText}
        title="Transcript"
        subtitle={`${transcript.speakers} speakers · ${Math.floor(transcript.confidence * 100)}% confidence`}
        maxWidth="max-w-6xl"
        actions={
          <Button
            variant="ghost"
            size="md"
            icon={<Copy className="w-4 h-4" />}
            onClick={handleCopyTranscript}
          >
            Copy
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto px-6 pb-8">
        {/* Transcript Timeline Component */}
        {transcript.speakerSegments && transcript.speakerSegments.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8">
            <TranscriptTimeline
              transcriptionId={conversation.id}
              segments={transcript.speakerSegments}
              readOnlyMode={false}
              onRefresh={refresh}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No Speaker Timeline Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">
              This conversation does not have speaker diarization data.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
              <p className="font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {transcript.text}
              </p>
            </div>
          </div>
        )}
      </div>
    </DetailPageLayout>
  );
}
