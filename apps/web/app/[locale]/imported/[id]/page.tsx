'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Lock,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { importedConversationApi } from '@/lib/api';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { SummaryRenderer } from '@/components/SummaryRenderer';
import TranscriptTimeline from '@/components/TranscriptTimeline';
import { Button } from '@/components/Button';
import { ExpirationBadge } from '@/components/ExpirationBadge';
import type {
  ImportedConversation,
  ImportedConversationStatus,
  SharedTranscriptionView,
} from '@transcribe/shared';

/**
 * Imported Conversation Detail Page
 * Read-only view of an imported shared conversation.
 */
export default function ImportedConversationPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('sharedWithMe');
  const tShared = useTranslations('shared');

  const importId = params.id as string;

  const [importData, setImportData] = useState<ImportedConversation | null>(null);
  const [content, setContent] = useState<SharedTranscriptionView | null>(null);
  const [status, setStatus] = useState<ImportedConversationStatus>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fetchImportedConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await importedConversationApi.get(importId);

      if (response.success && response.data) {
        setImportData(response.data.importedConversation);
        setContent(response.data.sharedContent);
        setStatus(response.data.status);
      } else {
        setError('Failed to load conversation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [importId]);

  useEffect(() => {
    fetchImportedConversation();
  }, [fetchImportedConversation]);

  const handleCopySummary = async () => {
    if (!content?.summaryV2 && !content?.analyses?.summary) return;

    const textToCopy = content.summaryV2
      ? JSON.stringify(content.summaryV2, null, 2)
      : content.analyses?.summary || '';

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        mainContent={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        }
      />
    );
  }

  // Error state
  if (error || !importData) {
    return (
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        mainContent={
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {error || 'Conversation not found'}
            </h2>
            <Button variant="secondary" onClick={() => router.push(`/${locale}/shared-with-me`)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('backToList')}
            </Button>
          </div>
        }
      />
    );
  }

  // Unavailable state (revoked, expired, etc.)
  if (status !== 'active' || !content) {
    return (
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        mainContent={
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
              <Lock className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {status === 'expired' ? t('expiredTitle') : t('unavailableTitle')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
              {status === 'expired' ? t('expiredDescription') : t('unavailableDescription')}
            </p>
            <Button variant="secondary" onClick={() => router.push(`/${locale}/shared-with-me`)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('backToList')}
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <ThreePaneLayout
      leftSidebar={<LeftNavigation />}
      mainContent={
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href={`/${locale}/shared-with-me`}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('title')}
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {importData.title}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sharedBy', { name: importData.sharedByName || 'Someone' })}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {importData.expiresAt && (
                  <ExpirationBadge expiresAt={importData.expiresAt} />
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-400">
                  <Lock className="w-3 h-3" />
                  {tShared('readOnly')}
                </span>
              </div>
            </div>
          </div>

          {/* Expiration warning banner */}
          {importData.expiresAt && (() => {
            const daysLeft = Math.ceil(
              (new Date(importData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            if (daysLeft <= 7 && daysLeft > 0) {
              return (
                <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {t('expirationWarning', { days: daysLeft })}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'summary'
                  ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tShared('summary')}
            </button>
            {content.transcriptText && (
              <button
                onClick={() => setActiveTab('transcript')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transcript'
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tShared('transcript')}
              </button>
            )}

            {/* Copy button */}
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySummary}
                disabled={!content.summaryV2 && !content.analyses?.summary}
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-green-500" />
                    {tShared('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    {tShared('copy')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {activeTab === 'summary' ? (
              content.summaryV2 ? (
                <SummaryRenderer content="" summaryV2={content.summaryV2} />
              ) : content.analyses?.summary ? (
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: content.analyses.summary }}
                />
              ) : (
                <p className="text-gray-500">{tShared('noSummary')}</p>
              )
            ) : (
              content.speakerSegments && content.speakerSegments.length > 0 ? (
                <TranscriptTimeline
                  segments={content.speakerSegments}
                />
              ) : content.transcriptText ? (
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {content.transcriptText}
                </div>
              ) : (
                <p className="text-gray-500">{tShared('noTranscript')}</p>
              )
            )}
          </div>
        </div>
      </div>
      }
    />
  );
}
