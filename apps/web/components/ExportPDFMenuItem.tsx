'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { SummaryV2, Translation } from '@transcribe/shared';
import { useTranslations } from 'next-intl';

export interface ExportPDFMenuItemProps {
  summary: SummaryV2;
  metadata: {
    title: string;
    createdAt: Date;
    duration?: number;
    speakerCount?: number;
  };
  currentLocale: string;
  getTranslatedContent: (
    sourceType: 'summary' | 'analysis',
    sourceId: string
  ) => Translation | undefined;
  conversationId: string;
  onClose?: () => void;
}

export function ExportPDFMenuItem({
  summary,
  metadata,
  currentLocale,
  getTranslatedContent,
  conversationId,
  onClose,
}: ExportPDFMenuItemProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const t = useTranslations('conversation');

  const handleExportPDF = async () => {
    setIsGenerating(true);

    try {
      // Lazy load the PDF generator
      const { loadPDFGenerator } = await import('@/lib/pdf');
      const generateSummaryPDF = await loadPDFGenerator();

      // Get translated summary if viewing a translation
      let exportSummary = summary;
      let languageLabel = 'original';

      if (currentLocale !== 'original') {
        const translation = getTranslatedContent('summary', conversationId);
        if (translation?.content.type === 'summaryV2') {
          const translated = translation.content;
          exportSummary = {
            version: 2,
            title: translated.title,
            intro: translated.intro,
            keyPoints: translated.keyPoints,
            detailedSections: translated.detailedSections,
            decisions: translated.decisions,
            nextSteps: translated.nextSteps,
            generatedAt: translation.translatedAt,
          };
          languageLabel = currentLocale;
        }
      }

      await generateSummaryPDF({
        summary: exportSummary,
        metadata: {
          ...metadata,
          language: languageLabel,
        },
      });

      onClose?.();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isGenerating}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 text-gray-500 dark:text-gray-400 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      )}
      <span>
        {isGenerating ? t('actions.generatingPDF') : t('actions.exportPDF')}
      </span>
    </button>
  );
}
