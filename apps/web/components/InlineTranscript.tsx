'use client';

import TranscriptTimeline from '@/components/TranscriptTimeline';
import type { Conversation } from '@/lib/types/conversation';
import type { SpeakerSegment } from '@transcribe/shared';
import { TextHighlighter, type HighlightOptions } from './TextHighlighter';

export type InlineTranscriptProps = {
  highlightOptions?: HighlightOptions;
} & (
  | { conversation: Conversation; speakerSegments?: never; text?: never }
  | { conversation?: never; speakerSegments?: SpeakerSegment[]; text?: string }
);

/**
 * Inline transcript component for the tabbed conversation view.
 * Renders the transcript with speaker timeline directly in the tab.
 *
 * Accepts either a full Conversation object or direct speakerSegments + text props.
 */
export function InlineTranscript(props: InlineTranscriptProps) {
  const { highlightOptions } = props;

  // Resolve data from either prop shape
  const speakerSegments = props.conversation
    ? props.conversation.source.transcript.speakerSegments
    : props.speakerSegments;
  const text = props.conversation
    ? props.conversation.source.transcript.text
    : props.text;

  return (
    <section className="scroll-mt-16">
      {/* Transcript Content */}
      {speakerSegments && speakerSegments.length > 0 ? (
        <div>
          <TranscriptTimeline
            segments={speakerSegments}
            highlightOptions={highlightOptions}
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
          {text && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg text-left">
              <p className="font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                <TextHighlighter text={text} highlight={highlightOptions} />
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
