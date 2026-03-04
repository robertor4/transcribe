import { SummaryRenderer } from '@/components/SummaryRenderer';
import type { SummaryV2, Translation } from '@transcribe/shared';
import type { HighlightOptions } from '@/components/TextHighlighter';

interface TranslatedSummaryRendererProps {
  /** Original V2 structured summary */
  summaryV2?: SummaryV2;
  /** Original V1 markdown summary text */
  summaryText: string;
  /** Source ID for translation lookup */
  sourceId: string;
  /** Current translation locale ('original' or locale code) */
  currentLocale: string;
  /** Function to get translated content */
  getTranslatedContent: (sourceType: 'summary' | 'analysis', sourceId: string) => Translation | undefined;
  /** Highlight options for Find & Replace (conversation page only) */
  highlightOptions?: HighlightOptions;
}

/**
 * Renders a summary with automatic translation detection.
 * Checks if a translation exists for the current locale and renders the
 * appropriate version (translated V2, translated V1, or original).
 */
export function TranslatedSummaryRenderer({
  summaryV2,
  summaryText,
  sourceId,
  currentLocale,
  getTranslatedContent,
  highlightOptions,
}: TranslatedSummaryRendererProps) {
  const summaryTranslation = currentLocale !== 'original'
    ? getTranslatedContent('summary', sourceId)
    : null;

  if (summaryTranslation && summaryTranslation.content.type === 'summaryV2') {
    const translated = summaryTranslation.content;
    return (
      <SummaryRenderer
        content=""
        summaryV2={{
          version: 2,
          title: translated.title,
          intro: translated.intro,
          keyPoints: translated.keyPoints,
          detailedSections: translated.detailedSections,
          decisions: translated.decisions,
          nextSteps: translated.nextSteps,
          generatedAt: summaryTranslation.translatedAt,
        }}
        highlightOptions={highlightOptions}
      />
    );
  }

  if (summaryTranslation && summaryTranslation.content.type === 'summaryV1') {
    return (
      <SummaryRenderer
        content={summaryTranslation.content.text}
        highlightOptions={highlightOptions}
      />
    );
  }

  return (
    <SummaryRenderer
      content={summaryText}
      summaryV2={summaryV2}
      highlightOptions={highlightOptions}
    />
  );
}
