'use client';

import TranscriptTimeline from '@/components/TranscriptTimeline';
import type { Conversation } from '@/lib/types/conversation';
import { formatDuration } from '@/lib/formatters';

interface InlineTranscriptProps {
  conversation: Conversation;
  onRefresh?: () => void;
}

/**
 * Inline transcript component for the tabbed conversation view.
 * Renders the transcript with speaker timeline directly in the tab.
 */
export function InlineTranscript({ conversation, onRefresh }: InlineTranscriptProps) {
  const transcript = conversation.source.transcript;

  return (
    <section className="scroll-mt-16">
      {/* Metadata */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {transcript.speakers} speaker{transcript.speakers !== 1 ? 's' : ''} · {Math.floor(transcript.confidence * 100)}% confidence · {formatDuration(conversation.source.audioDuration)}
        </p>
      </div>

      {/* Transcript Content */}
      {transcript.speakerSegments && transcript.speakerSegments.length > 0 ? (
        <div>
          <TranscriptTimeline
            transcriptionId={conversation.id}
            segments={transcript.speakerSegments}
            readOnlyMode={false}
            onRefresh={onRefresh}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Speaker Timeline Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-6">
            This conversation does not have speaker diarization data.
          </p>
          {transcript.text && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg text-left">
              <p className="font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {transcript.text}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
