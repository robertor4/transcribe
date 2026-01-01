'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Copy,
  Trash2,
  StickyNote,
  ImagePlus,
  Replace,
  MoreVertical,
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import type { GeneratedAnalysis, BlogPostOutput, LinkedInOutput } from '@transcribe/shared';
import { OutputRenderer } from '@/components/outputTemplates';
import { DetailPageLayout } from '@/components/detail-pages/DetailPageLayout';
import { DetailPageHeader } from '@/components/detail-pages/DetailPageHeader';
import { DetailMetadataPanel } from '@/components/detail-pages/DetailMetadataPanel';
import { RightPanelSection } from '@/components/detail-pages/RightPanelSection';
import { Button } from '@/components/Button';
import { DropdownMenu } from '@/components/DropdownMenu';
import { ConfirmModal } from '@/components/ConfirmModal';
import { FindReplaceSlidePanel } from '@/components/FindReplaceSlidePanel';
import { useConversation } from '@/hooks/useConversation';
import { formatRelativeTime } from '@/lib/formatters';
import { structuredOutputToMarkdown, structuredOutputToHtml } from '@/lib/outputToMarkdown';
import type { StructuredOutput } from '@transcribe/shared';
import { useTranslations } from 'next-intl';
import { useUsage } from '@/contexts/UsageContext';

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
  const { usageStats, isAdmin } = useUsage();
  const [output, setOutput] = useState<GeneratedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
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
    try {
      await transcriptionApi.deleteAnalysis(conversationId, outputId);
      router.push(`/${locale}/conversation/${conversationId}`);
    } catch (err) {
      console.error('Failed to delete output:', err);
    }
  };

  // Generate hero image for blog post (Premium only)
  const handleGenerateImage = async () => {
    if (!output) return;

    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const response = await transcriptionApi.generateBlogImage(conversationId, outputId);
      if (response.success && response.data?.heroImage) {
        // Update the output with the new hero image
        const updatedContent = {
          ...(output.content as BlogPostOutput),
          heroImage: response.data.heroImage,
        };
        setOutput({
          ...output,
          content: updatedContent,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to generate image:', err);
      const errorMessage = err instanceof Error ? err.message :
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to generate image';
      setImageError(errorMessage);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Check if this is a blog post
  const isBlogPost = output?.templateId === 'blogPost' && typeof output?.content === 'object';
  const hasHeroImage = isBlogPost && !!(output.content as BlogPostOutput)?.heroImage;

  // Check if user has premium access (not free tier, or is admin)
  const isPremiumUser = isAdmin || (usageStats?.tier && usageStats.tier !== 'free');

  // Refresh output after Find & Replace
  const handleReplaceComplete = useCallback(async () => {
    try {
      const response = await transcriptionApi.getAnalysis(conversationId, outputId);
      if (response.success && response.data) {
        setOutput(response.data);
      }
    } catch (err) {
      console.error('Failed to refresh output:', err);
    }
    setShowFindReplace(false);
  }, [conversationId, outputId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      rightPanel={
        <DetailMetadataPanel
          conversation={{
            id: conversationId,
            title: conversationTitle,
            audioDuration: conversation?.source.audioDuration || 0
          }}
          details={detailsData}
          sectionTitle="Conversation"
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
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy className="w-4 h-4" />}
              onClick={handleCopy}
            >
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>

            <DropdownMenu
              trigger={
                <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              }
              items={[
                // Generate Image - for blog posts with premium
                ...(isBlogPost && isPremiumUser
                  ? [
                      {
                        icon: isGeneratingImage ? Loader2 : ImagePlus,
                        label: isGeneratingImage
                          ? 'Generating...'
                          : hasHeroImage
                            ? 'Regenerate Image'
                            : 'Generate Image',
                        onClick: handleGenerateImage,
                        disabled: isGeneratingImage,
                      },
                    ]
                  : []),
                // Generate Image upgrade hint - for blog posts without premium
                ...(isBlogPost && !hasHeroImage && !isPremiumUser
                  ? [
                      {
                        icon: ImagePlus,
                        label: 'Generate Image (Pro)',
                        onClick: () => router.push(`/${locale}/pricing`),
                      },
                    ]
                  : []),
                {
                  icon: Replace,
                  label: t('findReplace'),
                  onClick: () => setShowFindReplace(true),
                },
                { type: 'divider' as const },
                {
                  icon: Trash2,
                  label: t('delete'),
                  onClick: () => setShowDeleteConfirm(true),
                  variant: 'danger' as const,
                },
              ]}
            />
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        {/* Image generation error */}
        {imageError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to generate image
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {imageError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Output Content */}
        {/* Email and LinkedIn templates get a framed container since they simulate another UI */}
        <div
          className={
            output.templateId === 'email' || output.templateId === 'linkedin'
              ? 'bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 md:p-8'
              : output.templateId === 'actionItems'
                ? 'bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 md:p-8'
                : ''
          }
        >
          <OutputRenderer
            content={output.content}
            contentType={output.contentType}
            templateId={output.templateId}
            analysisId={output.id}
          />
        </div>
      </div>

      {/* Find & Replace Panel - scoped to this AI Asset */}
      <FindReplaceSlidePanel
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        conversationId={conversationId}
        conversationTitle={output.templateName}
        onReplaceComplete={handleReplaceComplete}
        filterContext={{ type: 'aiAsset', analysisId: outputId, templateName: output.templateName }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('deleteConfirmTitle')}
        message={t('deleteConfirmMessage')}
        confirmLabel={t('deleteConfirmYes')}
        cancelLabel={t('deleteConfirmNo')}
        variant="danger"
      />
    </DetailPageLayout>
  );
}
