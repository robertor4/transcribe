'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  Zap,
  FileText,
  Mail,
  CheckSquare,
  Edit3,
  Share2,
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  MessageSquareQuote,
  Copy,
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import type { GeneratedAnalysis, StructuredOutput } from '@transcribe/shared';
import { getStructuredOutputPreview } from '@/components/outputTemplates';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { RightContextPanel } from '@/components/RightContextPanel';
import { Button } from '@/components/Button';
import { OutputGeneratorModal } from '@/components/OutputGeneratorModal';
import { SummaryRenderer } from '@/components/SummaryRenderer';
import { DeleteConversationButton } from '@/components/DeleteConversationButton';
import { useConversation } from '@/hooks/useConversation';
import { updateConversationTitle } from '@/lib/services/conversationService';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { formatRelativeTime, formatDuration } from '@/lib/formatters';
import { useTranslations } from 'next-intl';

interface ConversationClientProps {
  conversationId: string;
}

export function ConversationClient({ conversationId }: ConversationClientProps) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { conversation, isLoading, error, updateConversationLocally } = useConversation(conversationId);
  const { folders } = useFoldersContext();
  const t = useTranslations('aiAssets');
  const [outputs, setOutputs] = useState<GeneratedAnalysis[]>([]);
  const [, setIsLoadingOutputs] = useState(false);

  // Find the folder for this conversation
  const folder = conversation?.folderId
    ? folders.find((f) => f.id === conversation.folderId)
    : null;

  // Title editing handlers
  const handleStartEditTitle = () => {
    if (conversation) {
      setEditedTitle(conversation.title);
      setIsEditingTitle(true);
    }
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = async () => {
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle && trimmedTitle !== conversation?.title) {
      try {
        await updateConversationTitle(conversationId, trimmedTitle);
        updateConversationLocally({ title: trimmedTitle });
      } catch (err) {
        console.error('Failed to rename conversation:', err);
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingTitle(false);
    }
  };

  // Fetch generated outputs for this conversation
  const fetchOutputs = useCallback(async () => {
    if (!conversationId) return;

    setIsLoadingOutputs(true);
    try {
      const response = await transcriptionApi.getUserAnalyses(conversationId);
      if (response.success && response.data) {
        setOutputs(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch outputs:', err);
    } finally {
      setIsLoadingOutputs(false);
    }
  }, [conversationId]);

  // Fetch outputs on mount and when conversation changes
  useEffect(() => {
    fetchOutputs();
  }, [fetchOutputs]);

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

  const handleGenerateOutput = () => {
    setIsGeneratorOpen(true);
  };

  // Copy summary to clipboard as rich text HTML with plain text fallback
  const handleCopySummary = async () => {
    if (!conversation) return;

    const summaryV2 = conversation.source.summary.summaryV2;
    const summaryText = conversation.source.summary.text;

    let html = '';
    let plainText = '';

    if (summaryV2) {
      // Build HTML for rich text copying
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
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } catch {
        // Fallback to plain text if rich text fails
        try {
          await navigator.clipboard.writeText(plainText);
          setCopiedSummary(true);
          setTimeout(() => setCopiedSummary(false), 2000);
        } catch (fallbackErr) {
          console.error('Failed to copy summary:', fallbackErr);
        }
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#cc3399] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Conversation not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error?.message || 'The conversation you are looking for does not exist or you do not have access to it.'}
          </p>
          <Link href={`/${locale}/dashboard`}>
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Conversation details for right panel
  const conversationDetails = {
    duration: conversation.source.audioDuration,
    fileSize: '—', // TODO: Add file size to Conversation type
    createdAt: conversation.createdAt,
    status: conversation.status,
    folder: folder ? { id: folder.id, name: folder.name } : undefined,
    tags: conversation.tags,
    speakers: conversation.source.transcript.speakers,
    summaryFormat: conversation.source.summary.summaryV2 ? 'v2' as const : 'v1' as const,
  };


  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        rightPanel={
          <RightContextPanel
            conversation={conversationDetails}
            onGenerateOutput={handleGenerateOutput}
          />
        }
        mainContent={
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href={folder ? `/${locale}/folder/${folder.id}` : `/${locale}/dashboard`}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                {folder ? folder.name : 'Dashboard'}
              </Link>
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleTitleKeyDown}
                  className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-[#cc3399] outline-none w-full mb-3"
                />
              ) : (
                <h1
                  onClick={handleStartEditTitle}
                  className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 cursor-text hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                  title="Click to rename"
                >
                  {conversation.title}
                </h1>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <span>{formatDuration(conversation.source.audioDuration)}</span>
                  <span>·</span>
                  <span>
                    Created{' '}
                    {conversation.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <DeleteConversationButton
                  conversationId={conversationId}
                  onDeleted={() => router.push(`/${locale}/dashboard`)}
                />
              </div>
            </div>

            {/* Sticky Section Navigation */}
            <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-8 -mx-6 px-6">
              <div className="flex items-center gap-6 py-3">
                <button
                  onClick={() => document.getElementById('summary')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors duration-200"
                >
                  Summary
                </button>
                <Link
                  href={`/${locale}/conversation/${conversationId}/transcript`}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors duration-200"
                >
                  Transcript
                </Link>
                <button
                  onClick={() => document.getElementById('outputs')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors duration-200"
                >
                  AI Assets
                </button>
              </div>
            </nav>

            {/* Section: Summary */}
            <section id="summary" className="mb-12 scroll-mt-16">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Summary</h2>
                </div>
                {(conversation.source.summary.summaryV2 || conversation.source.summary.text) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                    onClick={handleCopySummary}
                  >
                    {copiedSummary ? 'Copied!' : 'Copy'}
                  </Button>
                )}
              </div>

              {conversation.source.summary.summaryV2 || conversation.source.summary.text ? (
                <SummaryRenderer
                  content={conversation.source.summary.text}
                  summaryV2={conversation.source.summary.summaryV2}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Summary is being generated...</p>
                </div>
              )}
            </section>

            {/* Section: AI Assets */}
            <section
              id="outputs"
              className="mb-12 scroll-mt-8 pt-8 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="mb-6 relative">
                {/* Accent bar on left */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#cc3399] to-[#cc3399]/50 rounded-full" />

                <div className="pl-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon with brand gradient background */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#cc3399] to-[#b82d89] flex items-center justify-center shadow-lg shadow-[#cc3399]/20">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {t('title')}
                      </h2>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('description')}
                      </p>
                    </div>
                  </div>
                  {outputs.length > 0 && (
                    <Button
                      variant="brand"
                      size="md"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setIsGeneratorOpen(true)}
                    >
                      {t('newAsset')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Outputs Gallery */}
              {outputs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outputs.map((output) => {
                    const OutputIcon = getOutputIcon(output.templateId);
                    // Create a preview from the content - handle both markdown and structured
                    let preview: string;
                    if (output.contentType === 'structured' && typeof output.content === 'object') {
                      preview = getStructuredOutputPreview(output.content as StructuredOutput);
                    } else {
                      const contentStr = typeof output.content === 'string' ? output.content : JSON.stringify(output.content);
                      preview = contentStr
                        .replace(/^#+ /gm, '') // Remove markdown headers
                        .replace(/\*\*/g, '') // Remove bold markers
                        .slice(0, 150)
                        .trim() + (contentStr.length > 150 ? '...' : '');
                    }

                    return (
                      <Link
                        key={output.id}
                        href={`/${locale}/conversation/${conversation.id}/outputs/${output.id}`}
                        className="group relative p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#cc3399] dark:hover:border-[#cc3399] hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0">
                            <OutputIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#cc3399] transition-colors">
                              {output.templateName}
                            </h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {preview}
                            </p>
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Generated {formatRelativeTime(new Date(output.generatedAt))}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                            →
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {t('emptyTitle')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">
                    {t('emptyDescription')}
                  </p>
                  <Button variant="brand" size="md" onClick={() => setIsGeneratorOpen(true)}>
                    {t('emptyButton')}
                  </Button>
                </div>
              )}
            </section>

            {/* Section: Transcript */}
            <section
              id="transcript"
              className="mb-12 scroll-mt-8 pt-8 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Transcript
                  </h2>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  View the full conversation with speaker diarization and timeline
                </p>
              </div>

              {/* Transcript Card - Links to dedicated page */}
              <Link
                href={`/${locale}/conversation/${conversation.id}/transcript`}
                className="group block p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#cc3399] dark:hover:border-[#cc3399] hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#cc3399] transition-colors">
                      Full Transcript with Timeline
                    </h3>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Interactive speaker timeline with {conversation.source.transcript.speakers}{' '}
                      speakers and{' '}
                      {Math.floor(conversation.source.transcript.confidence * 100)}% confidence
                    </p>
                    {conversation.source.transcript.speakerSegments && (
                      <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        <span>
                          {conversation.source.transcript.speakerSegments.length} segments
                        </span>
                        <span>·</span>
                        <span>{formatDuration(conversation.source.audioDuration)} duration</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                    →
                  </div>
                </div>
              </Link>
            </section>
          </div>
        }
      />

      {/* Output Generator Modal */}
      <OutputGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        conversationTitle={conversation.title}
        conversationId={conversationId}
        onOutputGenerated={fetchOutputs}
      />
    </div>
  );
}
