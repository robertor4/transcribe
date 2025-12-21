'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Mail,
  CheckSquare,
  Edit3,
  Share2,
  FileText,
  MessageSquareQuote,
  Clock,
  Copy,
  Trash2,
  StickyNote,
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import type { GeneratedAnalysis, BlogPostOutput, LinkedInOutput } from '@transcribe/shared';
import { OutputRenderer } from '@/components/outputTemplates';
import { DetailPageLayout } from '@/components/detail-pages/DetailPageLayout';
import { DetailPageHeader } from '@/components/detail-pages/DetailPageHeader';
import { DetailMetadataPanel } from '@/components/detail-pages/DetailMetadataPanel';
import { RightPanelSection } from '@/components/detail-pages/RightPanelSection';
import { Button } from '@/components/Button';
import { useConversation } from '@/hooks/useConversation';
import { formatRelativeTime } from '@/lib/formatters';
import { structuredOutputToMarkdown, structuredOutputToHtml } from '@/lib/outputToMarkdown';
import type { StructuredOutput } from '@transcribe/shared';
import { useTranslations } from 'next-intl';

interface OutputDetailClientProps {
  conversationId: string;
  outputId: string;
}

export function OutputDetailClient({ conversationId, outputId }: OutputDetailClientProps) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('aiAssets');

  const { conversation } = useConversation(conversationId);
  const [output, setOutput] = useState<GeneratedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Icon mapping for output types
  const getOutputIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'actionItems':
        return CheckSquare;
      case 'blogPost':
        return Edit3;
      case 'linkedin':
        return Share2;
      case 'communicationAnalysis':
        return MessageSquareQuote;
      default:
        return FileText;
    }
  };

  // Fetch the output
  useEffect(() => {
    async function fetchOutput() {
      setIsLoading(true);
      try {
        const response = await transcriptionApi.getAnalysis(conversationId, outputId);
        if (response.success && response.data) {
          setOutput(response.data);
        } else {
          setError(new Error('Failed to load output'));
        }
      } catch (err) {
        console.error('Failed to fetch output:', err);
        setError(err instanceof Error ? err : new Error('Failed to load output'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOutput();
  }, [conversationId, outputId]);

  // Copy content to clipboard as rich text (HTML) with plain text fallback
  const handleCopy = async () => {
    if (!output) return;

    try {
      if (typeof output.content === 'string') {
        // Plain markdown content - just copy as text
        await navigator.clipboard.writeText(output.content);
      } else {
        // Structured content - copy as rich text HTML with plain text fallback
        const html = structuredOutputToHtml(output.content as StructuredOutput);
        const plainText = structuredOutputToMarkdown(output.content as StructuredOutput);

        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          }),
        ]);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Delete output
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await transcriptionApi.deleteAnalysis(conversationId, outputId);
      router.push(`/${locale}/conversation/${conversationId}`);
    } catch (err) {
      console.error('Failed to delete output:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#8D6AFA] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !output) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('notFound')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error?.message || t('notFoundDescription')}
          </p>
          <Link href={`/${locale}/conversation/${conversationId}`}>
            <Button variant="primary">Back to Conversation</Button>
          </Link>
        </div>
      </div>
    );
  }

  const OutputIcon = getOutputIcon(output.templateId);
  const conversationTitle = conversation?.title || 'Conversation';

  // Extract metadata from structured content for the right panel
  const getOutputMetadata = (): { label: string; value: string }[] => {
    if (typeof output.content !== 'object' || !output.content) return [];

    const content = output.content as { type?: string };

    if (content.type === 'blogPost') {
      const blogData = output.content as BlogPostOutput;
      const metadata: { label: string; value: string }[] = [];
      if (blogData.metadata?.wordCount) {
        metadata.push({ label: 'Word count', value: `${blogData.metadata.wordCount} words` });
      }
      if (blogData.metadata?.tone) {
        metadata.push({ label: 'Tone', value: blogData.metadata.tone });
      }
      if (blogData.metadata?.targetAudience) {
        metadata.push({ label: 'Audience', value: blogData.metadata.targetAudience });
      }
      return metadata;
    }

    if (content.type === 'linkedin') {
      const linkedinData = output.content as LinkedInOutput;
      if (linkedinData.characterCount) {
        return [{ label: 'Characters', value: `${linkedinData.characterCount}` }];
      }
    }

    return [];
  };

  // Details for right panel
  const detailsData = [
    { label: 'Generated', value: formatRelativeTime(new Date(output.generatedAt)) },
    { label: 'Template', value: output.templateName },
    ...getOutputMetadata(),
  ];

  // Custom sections for the right panel
  const customSections = output.customInstructions ? (
    <RightPanelSection icon={StickyNote} title="Custom Instructions" showBorder>
      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
        {output.customInstructions}
      </p>
    </RightPanelSection>
  ) : null;

  return (
    <DetailPageLayout
      conversationId={conversationId}
      rightPanel={
        <DetailMetadataPanel
          conversation={{
            id: conversationId,
            title: conversationTitle,
            audioDuration: conversation?.source.audioDuration || 0
          }}
          details={detailsData}
          sectionTitle="Conversation"
          detailsIcon={Clock}
          customSections={customSections}
        />
      }
    >
      <DetailPageHeader
        conversationId={conversationId}
        conversationTitle={conversationTitle}
        icon={OutputIcon}
        title={output.templateName}
        subtitle={`Generated ${formatRelativeTime(new Date(output.generatedAt))}`}
        actions={
          <>
            <Button
              variant="ghost"
              size="md"
              icon={<Copy className="w-4 h-4" />}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>

            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                size="md"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <span className="text-sm text-red-700 dark:text-red-300">Delete?</span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? '...' : 'Yes'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  No
                </Button>
              </div>
            )}
          </>
        }
      />

      <div className="max-w-4xl mx-auto px-6 pb-8">
        {/* Output Content */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 md:p-8">
          <OutputRenderer
            content={output.content}
            contentType={output.contentType}
            templateId={output.templateId}
          />
        </div>
      </div>
    </DetailPageLayout>
  );
}
