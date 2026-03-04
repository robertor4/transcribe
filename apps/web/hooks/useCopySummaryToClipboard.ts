'use client';

import { useState, useCallback } from 'react';
import type { SummaryV2, Translation } from '@transcribe/shared';

interface UseCopySummaryToClipboardOptions {
  /** Original V2 structured summary */
  summaryV2?: SummaryV2;
  /** Original V1 markdown summary text */
  summaryText: string;
  /** Source ID for translation lookup (transcriptionId or conversationId) */
  sourceId: string;
  /** Current translation locale ('original' or locale code) */
  currentLocale: string;
  /** Function to get translated content */
  getTranslatedContent: (sourceType: 'summary' | 'analysis', sourceId: string) => Translation | undefined;
}

/**
 * Hook for copying summary content to clipboard as rich text (HTML) with plain text fallback.
 * Handles translation detection and summaryV2/V1 formatting.
 */
export function useCopySummaryToClipboard({
  summaryV2: originalSummaryV2,
  summaryText: originalSummaryText,
  sourceId,
  currentLocale,
  getTranslatedContent,
}: UseCopySummaryToClipboardOptions) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const summaryTranslation = currentLocale !== 'original'
      ? getTranslatedContent('summary', sourceId)
      : null;

    let summaryV2 = originalSummaryV2;
    let summaryText = originalSummaryText;

    if (summaryTranslation) {
      if (summaryTranslation.content.type === 'summaryV2') {
        const translated = summaryTranslation.content;
        summaryV2 = {
          version: 2,
          title: translated.title,
          intro: translated.intro,
          keyPoints: translated.keyPoints,
          detailedSections: translated.detailedSections,
          decisions: translated.decisions,
          nextSteps: translated.nextSteps,
          generatedAt: summaryTranslation.translatedAt,
        };
        summaryText = '';
      } else if (summaryTranslation.content.type === 'summaryV1') {
        summaryV2 = undefined;
        summaryText = summaryTranslation.content.text;
      }
    }

    let html = '';
    let plainText = '';

    if (summaryV2) {
      const htmlParts: string[] = [];
      const textParts: string[] = [];

      if (summaryV2.intro) {
        htmlParts.push(`<p>${summaryV2.intro}</p>`);
        textParts.push(summaryV2.intro);
      }

      if (summaryV2.keyPoints && summaryV2.keyPoints.length > 0) {
        htmlParts.push('<h2>Key Points</h2><ul>');
        textParts.push('\nKey Points\n');
        summaryV2.keyPoints.forEach((point) => {
          htmlParts.push(`<li><strong>${point.topic}:</strong> ${point.description}</li>`);
          textParts.push(`• ${point.topic}: ${point.description}`);
        });
        htmlParts.push('</ul>');
      }

      if (summaryV2.detailedSections && summaryV2.detailedSections.length > 0) {
        summaryV2.detailedSections.forEach((section) => {
          htmlParts.push(`<h3>${section.topic}</h3><p>${section.content}</p>`);
          textParts.push(`\n${section.topic}\n${section.content}`);
        });
      }

      if (summaryV2.decisions && summaryV2.decisions.length > 0) {
        htmlParts.push('<h2>Decisions Made</h2><ul>');
        textParts.push('\nDecisions Made\n');
        summaryV2.decisions.forEach((decision) => {
          htmlParts.push(`<li>${decision}</li>`);
          textParts.push(`• ${decision}`);
        });
        htmlParts.push('</ul>');
      }

      if (summaryV2.nextSteps && summaryV2.nextSteps.length > 0) {
        htmlParts.push('<h2>Next Steps</h2><ul>');
        textParts.push('\nNext Steps\n');
        summaryV2.nextSteps.forEach((step) => {
          htmlParts.push(`<li>${step}</li>`);
          textParts.push(`• ${step}`);
        });
        htmlParts.push('</ul>');
      }

      html = htmlParts.join('');
      plainText = textParts.join('\n');
    } else if (summaryText) {
      html = `<p>${summaryText.replace(/\n/g, '</p><p>')}</p>`;
      plainText = summaryText;
    }

    if (html && plainText) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        try {
          await navigator.clipboard.writeText(plainText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Failed to copy summary:', fallbackErr);
        }
      }
    }
  }, [currentLocale, getTranslatedContent, sourceId, originalSummaryV2, originalSummaryText]);

  return { copied, setCopied, handleCopy };
}
