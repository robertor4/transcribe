'use client';

import { useState } from 'react';
import { FileDown, Loader2, Lock } from 'lucide-react';
import type { SummaryV2, Translation } from '@transcribe/shared';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

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
  /** User's subscription tier - PDF export requires Pro or higher */
  userTier?: string;
  /** Whether the user is an admin (bypasses tier restrictions) */
  isAdmin?: boolean;
}

export function ExportPDFMenuItem({
  summary,
  metadata,
  currentLocale,
  getTranslatedContent,
  conversationId,
  onClose,
  userTier = 'free',
  isAdmin = false,
}: ExportPDFMenuItemProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const t = useTranslations('conversation');

  // PDF export requires Pro or higher (admins bypass tier restrictions)
  const canExportPDF = isAdmin || userTier !== 'free';

  const handleExportPDF = async () => {
    // Show upgrade prompt for free users when they click
    if (!canExportPDF) {
      setShowUpgradePrompt(true);
      return;
    }

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

  // Show upgrade prompt after clicking (for free users)
  if (showUpgradePrompt) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {t('actions.proFeature')}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {t('actions.upgradeToExportPDF')}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white text-sm font-medium rounded-lg transition-colors"
        >
          {t('actions.upgradeToPro')}
        </Link>
      </div>
    );
  }

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
