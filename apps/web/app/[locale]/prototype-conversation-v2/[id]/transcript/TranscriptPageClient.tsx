'use client';

import { FileText, Copy } from 'lucide-react';
import { DetailPageLayout } from '@/components/detail-pages/DetailPageLayout';
import { DetailPageHeader } from '@/components/detail-pages/DetailPageHeader';
import { DetailMetadataPanel } from '@/components/detail-pages/DetailMetadataPanel';
import { PrototypeNotice } from '@/components/detail-pages/PrototypeNotice';
import { Button } from '@/components/Button';
import TranscriptTimeline from '@/components/TranscriptTimeline';
import { mockConversations, mockFolders } from '@/lib/mockData';

interface TranscriptPageClientProps {
  conversationId: string;
}

export function TranscriptPageClient({ conversationId }: TranscriptPageClientProps) {
  const conversation = mockConversations.find(c => c.id === conversationId) || mockConversations[0];
  const folder = conversation.folderId ? mockFolders.find(f => f.id === conversation.folderId) : null;

  const handleCopyTranscript = () => {
    if (conversation.source.transcript.speakerSegments) {
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

  const detailsData = [
    { label: 'Speakers', value: conversation.source.transcript.speakers },
    { label: 'Confidence', value: `${Math.floor(conversation.source.transcript.confidence * 100)}%` },
    { label: 'Duration', value: `${Math.floor(conversation.source.audioDuration / 60)} min` },
    ...(conversation.source.transcript.speakerSegments
      ? [{ label: 'Segments', value: conversation.source.transcript.speakerSegments.length }]
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
        subtitle={`${conversation.source.transcript.speakers} speakers · ${Math.floor(conversation.source.transcript.confidence * 100)}% confidence`}
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
        {conversation.source.transcript.speakerSegments && conversation.source.transcript.speakerSegments.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8">
            <TranscriptTimeline
              transcriptionId={conversation.id}
              segments={conversation.source.transcript.speakerSegments}
              readOnlyMode={false}
              onRefresh={() => {
                console.log('Transcript refreshed');
              }}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No Speaker Timeline Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">
              This conversation doesn't have speaker diarization data.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
              <p className="font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {conversation.source.transcript.text}
              </p>
            </div>
          </div>
        )}

        <PrototypeNotice
          title="Transcript Timeline Page (V2)"
          description="Dedicated page for speaker diarization timeline with interactive visualization, search, and copy functionality."
        />
      </div>
    </DetailPageLayout>
  );
}
