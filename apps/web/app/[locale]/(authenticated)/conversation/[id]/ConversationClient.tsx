'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Share2,
  ArrowLeft,
  AlertCircle,
  Copy,
  Zap,
  MoreVertical,
  Trash2,
  Replace,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import type { GeneratedAnalysis, Transcription } from '@transcribe/shared';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { AssetSidebar } from '@/components/AssetSidebar';
import { AssetMobileSheet } from '@/components/AssetMobileSheet';
import { AIAssetSlidePanel } from '@/components/AIAssetSlidePanel';
import { Button } from '@/components/Button';
import { OutputGeneratorModal } from '@/components/OutputGeneratorModal';
import { SummaryRenderer } from '@/components/SummaryRenderer';
import { InlineTranscript } from '@/components/InlineTranscript';
import { ShareModal } from '@/components/ShareModal';
import { FindReplaceSlidePanel } from '@/components/FindReplaceSlidePanel';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DropdownMenu } from '@/components/DropdownMenu';
import { TranslationMenuItems } from '@/components/TranslationMenuItems';
import { ExportPDFMenuItem } from '@/components/ExportPDFMenuItem';
import { useConversation } from '@/hooks/useConversation';
import { useSlidePanel } from '@/hooks/useSlidePanel';
import { useConversationTranslations } from '@/hooks/useConversationTranslations';
import { updateConversationTitle, deleteConversation } from '@/lib/services/conversationService';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
import { formatDuration } from '@/lib/formatters';
import { useTranslations } from 'next-intl';
import { QASlidePanel } from '@/components/QASlidePanel';
import { AnimatedAiIcon } from '@/components/icons/AnimatedAiIcon';
import { TextHighlighter, useHighlightOptions } from '@/components/TextHighlighter';
import { ConversationSkeleton } from '@/components/skeletons/ConversationSkeleton';
import { ReadingTimeIndicator, countWords } from '@/components/ReadingTimeIndicator';
import { ConversationCategoryBadge } from '@/components/ConversationCategoryBadge';
import { AssetRecommendations } from '@/components/AssetRecommendations';
import { getAssetRecommendations } from '@/lib/assetRecommendations';
import type { ConversationCategory } from '@transcribe/shared';

interface ConversationClientProps {
  conversationId: string;
}

type ContentTab = 'summary' | 'transcript';

export function ConversationClient({ conversationId }: ConversationClientProps) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [preselectedTemplate, setPreselectedTemplate] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [transcriptionForShare, setTranscriptionForShare] = useState<Transcription | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>('summary');
  const activeTabRef = useRef<ContentTab>('summary');
  const [mobileAssetSheetOpen, setMobileAssetSheetOpen] = useState(false);
  const [isQAPanelOpen, setIsQAPanelOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find & Replace highlight state
  const [searchText, setSearchText] = useState('');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  const [searchWholeWord, setSearchWholeWord] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number | undefined>(undefined);
  const highlightOptions = useHighlightOptions(searchText, searchCaseSensitive, searchWholeWord, currentMatchIndex);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { usageStats, isAdmin } = useUsage();
  const { conversation, isLoading, error, updateConversationLocally, refresh } = useConversation(conversationId);
  const { folders } = useFoldersContext();
  const { refreshRecentlyOpened } = useConversationsContext();
  const tConversation = useTranslations('conversation');
  const userTier = usageStats?.tier || 'free';

  // Translation state
  const {
    status: translationStatus,
    isTranslating,
    currentLocale,
    translate,
    setLocale,
    getTranslatedContent,
  } = useConversationTranslations(conversationId);

  // Slide panel for AI Assets
  const {
    selectedItem: selectedAsset,
    isOpen: isPanelOpen,
    isClosing: isPanelClosing,
    open: openAssetPanel,
    close: closeAssetPanel,
  } = useSlidePanel<GeneratedAnalysis>();

  const [outputs, setOutputs] = useState<GeneratedAnalysis[]>([]);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(false);

  // Find the folder for this conversation
  const folder = conversation?.folderId
    ? folders.find((f) => f.id === conversation.folderId)
    : null;

  // Keep activeTab ref in sync with state for use in callbacks
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

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
    if (!conversationId || !user) return;

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
  }, [conversationId, user]);

  // Fetch outputs on mount and when conversation changes
  useEffect(() => {
    fetchOutputs();
  }, [fetchOutputs]);

  // Record access for "Recently Opened" tracking
  useEffect(() => {
    if (conversation && user) {
      // Fire-and-forget - don't await, don't block rendering
      transcriptionApi.recordAccess(conversationId)
        .then(() => {
          // Refresh the recently opened list in the sidebar
          refreshRecentlyOpened();
        })
        .catch(() => {
          // Silently ignore errors - this is non-critical
        });
    }
  }, [conversation, user, conversationId, refreshRecentlyOpened]);

  const handleGenerateOutput = () => {
    setPreselectedTemplate(null);
    setIsGeneratorOpen(true);
  };

  const handleRecommendationSelect = (templateId: string) => {
    setPreselectedTemplate(templateId);
    setIsGeneratorOpen(true);
  };

  // Delete asset handler for slide panel
  const handleDeleteAsset = async (assetId: string) => {
    await transcriptionApi.deleteAnalysis(conversationId, assetId);
    fetchOutputs();
  };

  // Share modal handlers
  const handleOpenShareModal = async () => {
    const response = await transcriptionApi.get(conversationId);
    if (response.success && response.data) {
      setTranscriptionForShare(response.data as Transcription);
      setIsShareModalOpen(true);
    }
  };

  // Delete conversation handler
  const handleDeleteConversation = async () => {
    try {
      await deleteConversation(conversationId);
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Regenerate summary handler
  const handleRegenerateSummary = async () => {
    if (isRegeneratingSummary) return;

    setIsRegeneratingSummary(true);
    try {
      await transcriptionApi.regenerateSummary(conversationId);
      // Refresh the conversation to get the new summary
      await refresh();
    } catch (error) {
      console.error('Failed to regenerate summary:', error);
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const handleShareUpdate = (updated: Transcription) => {
    // Update local conversation sharing state
    updateConversationLocally({
      sharing: {
        isPublic: !!updated.shareToken,
        publicLinkId: updated.shareToken,
        viewCount: updated.shareSettings?.viewCount || 0,
        sharedWith: updated.sharedWith?.map((s) => s.email) || [],
      },
    });
    setTranscriptionForShare(updated);
  };

  // Copy summary to clipboard as rich text HTML with plain text fallback
  const handleCopySummary = async () => {
    if (!conversation) return;

    // Check if viewing a translation
    const summaryTranslation = currentLocale !== 'original'
      ? getTranslatedContent('summary', conversationId)
      : null;

    // Use translated content if available, otherwise use original
    let summaryV2 = conversation.source.summary.summaryV2;
    let summaryText = conversation.source.summary.text;

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

  // Copy transcript to clipboard
  const handleCopyTranscript = async () => {
    if (!conversation) return;

    const transcript = conversation.source.transcript;
    if (transcript.speakerSegments && transcript.speakerSegments.length > 0) {
      const formattedTranscript = transcript.speakerSegments
        .map((segment) => {
          const minutes = Math.floor(segment.startTime / 60);
          const seconds = Math.floor(segment.startTime % 60);
          const timestamp = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
          return `${timestamp} ${segment.speakerTag}: ${segment.text}`;
        })
        .join('\n\n');

      try {
        await navigator.clipboard.writeText(formattedTranscript);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } catch (err) {
        console.error('Failed to copy transcript:', err);
      }
    } else if (transcript.text) {
      try {
        await navigator.clipboard.writeText(transcript.text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } catch (err) {
        console.error('Failed to copy transcript:', err);
      }
    }
  };

  // Context-aware copy handler
  const handleCopy = () => {
    if (activeTab === 'summary') {
      handleCopySummary();
    } else {
      handleCopyTranscript();
    }
  };

  // Loading state
  if (isLoading) {
    return <ConversationSkeleton />;
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
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

  // V1 legacy conversation detection (no structured summaryV2)
  const isLegacyConversation = !conversation.source.summary.summaryV2;

  // Calculate word count for reading time indicator
  const summaryWordCount = (() => {
    const v2 = conversation.source.summary.summaryV2;
    if (v2) {
      const parts = [
        v2.intro || '',
        ...v2.keyPoints.map(kp => `${kp.topic} ${kp.description}`),
        ...v2.detailedSections.map(s => `${s.topic} ${s.content}`),
        ...(v2.decisions || []),
        ...(v2.nextSteps || []),
      ];
      return countWords(parts.join(' '));
    }
    return countWords(conversation.source.summary.text);
  })();

  const transcriptWordCount = (() => {
    const segments = conversation.source.transcript.speakerSegments;
    if (segments && segments.length > 0) {
      return countWords(segments.map(s => s.text).join(' '));
    }
    return countWords(conversation.source.transcript.text);
  })();

  const activeWordCount = activeTab === 'summary' ? summaryWordCount : transcriptWordCount;

  // Compute asset recommendations based on conversation category
  const recommendations = getAssetRecommendations(
    conversation.conversationCategory as ConversationCategory | undefined,
    outputs,
  );

  // Metadata for the asset sidebar
  const sidebarMetadata = {
    duration: conversation.source.audioDuration,
    createdAt: conversation.createdAt,
    status: conversation.status,
    speakers: conversation.source.transcript.speakers,
    context: conversation.context,
    isLegacy: isLegacyConversation,
  };

  return (
    <div className="h-screen flex flex-col h-full">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        rightPanel={
          <div className="hidden lg:block h-full">
            <AssetSidebar
              assets={outputs}
              isLoading={isLoadingOutputs}
              onGenerateNew={handleGenerateOutput}
              onAssetClick={openAssetPanel}
              selectedAssetId={selectedAsset?.id}
              metadata={sidebarMetadata}
              recommendations={recommendations}
              onRecommendationSelect={handleRecommendationSelect}
            />
          </div>
        }
        mainContent={
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
              <Link
                href={folder ? `/${locale}/folder/${folder.id}` : `/${locale}/dashboard`}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors mb-4 lg:mb-6"
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
                  className="text-2xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-[#8D6AFA] outline-none w-full mb-3 font-[Montserrat]"
                />
              ) : (
                <h1
                  onClick={handleStartEditTitle}
                  className="text-2xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 cursor-text hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                  title="Click to rename"
                  id="conversation-title"
                >
                  <TextHighlighter text={conversation.title} highlight={highlightOptions} />
                </h1>
              )}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
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
                  {activeWordCount > 0 && (
                    <>
                      <span>·</span>
                      <ReadingTimeIndicator wordCount={activeWordCount} />
                    </>
                  )}
                  {conversation.conversationCategory && (
                    <>
                      <span>·</span>
                      <ConversationCategoryBadge category={conversation.conversationCategory} />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Desktop: Show Ask Questions and Copy buttons */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<AnimatedAiIcon size={14} />}
                      onClick={() => setIsQAPanelOpen(true)}
                    >
                      {tConversation('actions.askQuestions')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Copy className="w-4 h-4" />}
                      onClick={handleCopy}
                    >
                      {copiedSummary ? tConversation('actions.copied') : tConversation('actions.copy')}
                    </Button>
                  </div>
                  <DropdownMenu
                    trigger={
                      <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    }
                    items={[
                      // Ask Questions and Copy available in menu for all devices
                      {
                        icon: Zap,
                        label: tConversation('actions.askQuestions'),
                        onClick: () => setIsQAPanelOpen(true),
                      },
                      {
                        icon: Copy,
                        label: copiedSummary ? tConversation('actions.copied') : tConversation('actions.copy'),
                        onClick: handleCopy,
                      },
                      // Regenerate summary - only for V2 conversations and Pro+ users
                      ...(!isLegacyConversation && (isAdmin || userTier !== 'free')
                        ? [
                            {
                              icon: RefreshCw,
                              label: isRegeneratingSummary ? tConversation('summary.regenerating') : tConversation('summary.regenerate'),
                              onClick: handleRegenerateSummary,
                              disabled: isRegeneratingSummary,
                            },
                          ]
                        : []),
                      { type: 'divider' },
                      {
                        type: 'custom',
                        content: (
                          <TranslationMenuItems
                            status={translationStatus}
                            currentLocale={currentLocale}
                            isTranslating={isTranslating}
                            userTier={userTier}
                            isAdmin={isAdmin}
                            onSelectLocale={setLocale}
                            onTranslate={translate}
                          />
                        ),
                      },
                      ...(conversation.source.summary.summaryV2
                        ? [
                            {
                              type: 'custom' as const,
                              content: (
                                <ExportPDFMenuItem
                                  summary={conversation.source.summary.summaryV2}
                                  metadata={{
                                    title: conversation.title,
                                    createdAt: conversation.createdAt,
                                    duration: conversation.source.audioDuration,
                                    speakerCount: conversation.source.transcript.speakers,
                                  }}
                                  currentLocale={currentLocale}
                                  getTranslatedContent={getTranslatedContent}
                                  conversationId={conversationId}
                                  userTier={userTier}
                                  isAdmin={isAdmin}
                                />
                              ),
                            },
                          ]
                        : []),
                      {
                        icon: Replace,
                        label: tConversation('actions.findReplace'),
                        onClick: () => setIsFindReplaceOpen(true),
                        disabled: isLegacyConversation,
                        disabledReason: isLegacyConversation ? tConversation('actions.findReplaceDisabledLegacy') : undefined,
                      },
                      { type: 'divider' },
                      {
                        icon: Share2,
                        label: tConversation('actions.share'),
                        onClick: handleOpenShareModal,
                      },
                      {
                        icon: Trash2,
                        label: tConversation('actions.delete'),
                        onClick: () => setShowDeleteConfirm(true),
                        variant: 'danger' as const,
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="lg:sticky lg:top-0 lg:z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <div className="flex items-center gap-1 py-1">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                    activeTab === 'summary'
                      ? 'text-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {tConversation('tabs.summary')}
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                    activeTab === 'transcript'
                      ? 'text-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {tConversation('tabs.transcript')}
                </button>
              </div>
            </nav>

            {/* Tab Content - Both tabs are always rendered for Find & Replace scroll navigation */}
            <div className={activeTab === 'summary' ? '' : 'hidden'}>
              <section id="summary" className="scroll-mt-16">
                {conversation.source.summary.summaryV2 || conversation.source.summary.text ? (
                  (() => {
                    // Check if viewing a translation
                    const summaryTranslation = currentLocale !== 'original'
                      ? getTranslatedContent('summary', conversationId)
                      : null;

                    if (summaryTranslation && summaryTranslation.content.type === 'summaryV2') {
                      // Display translated structured summary
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
                    } else if (summaryTranslation && summaryTranslation.content.type === 'summaryV1') {
                      // Display translated markdown summary
                      return (
                        <SummaryRenderer
                          content={summaryTranslation.content.text}
                          highlightOptions={highlightOptions}
                        />
                      );
                    }

                    // Display original summary
                    return (
                      <SummaryRenderer
                        content={conversation.source.summary.text}
                        summaryV2={conversation.source.summary.summaryV2}
                        highlightOptions={highlightOptions}
                      />
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">{tConversation('summary.notAvailable')}</p>
                    {/* Regenerate button only for Pro+ users or admins */}
                    {(isAdmin || userTier !== 'free') && (
                      <Button
                        variant="primary"
                        onClick={handleRegenerateSummary}
                        disabled={isRegeneratingSummary}
                        icon={isRegeneratingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      >
                        {isRegeneratingSummary ? tConversation('summary.regenerating') : tConversation('summary.regenerate')}
                      </Button>
                    )}
                  </div>
                )}
              </section>

              {/* Asset Recommendations - shown below summary */}
              {recommendations.length > 0 && (
                <AssetRecommendations
                  recommendations={recommendations}
                  onSelectTemplate={handleRecommendationSelect}
                  variant="inline"
                />
              )}
            </div>

            <div className={activeTab === 'transcript' ? '' : 'hidden'}>
              <InlineTranscript
                conversation={conversation}
                highlightOptions={highlightOptions}
              />
            </div>
          </div>
        }
      />

      {/* Mobile FAB for AI Assets */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setMobileAssetSheetOpen(true)}
          className="relative w-14 h-14 rounded-full bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white shadow-lg flex items-center justify-center transition-colors"
          aria-label="Open AI Assets"
        >
          <Zap className="w-6 h-6" />
          {outputs.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-[#8D6AFA] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
              {outputs.length}
            </span>
          )}
        </button>
      </div>

      {/* AI Asset Slide Panel */}
      <AIAssetSlidePanel
        asset={selectedAsset}
        isOpen={isPanelOpen}
        isClosing={isPanelClosing}
        onClose={closeAssetPanel}
        onDelete={handleDeleteAsset}
        conversationId={conversationId}
        locale={locale}
        currentTranslationLocale={currentLocale}
        getTranslatedContent={getTranslatedContent}
      />

      {/* Mobile Asset Sheet */}
      <AssetMobileSheet
        assets={outputs}
        isLoading={isLoadingOutputs}
        isOpen={mobileAssetSheetOpen}
        onClose={() => setMobileAssetSheetOpen(false)}
        onGenerateNew={() => setIsGeneratorOpen(true)}
        conversationId={conversationId}
        conversationTitle={conversation.title}
        userTier={userTier}
        isAdmin={isAdmin}
      />

      {/* Output Generator Modal */}
      <OutputGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => {
          setIsGeneratorOpen(false);
          setPreselectedTemplate(null);
        }}
        conversationTitle={conversation.title}
        conversationId={conversationId}
        preselectedTemplate={preselectedTemplate}
        onOutputGenerated={(asset) => {
          // Add the new asset to the list
          setOutputs((prev) => [asset, ...prev]);
          // Open the slide panel with the new asset
          openAssetPanel(asset);
        }}
      />

      {/* Share Modal */}
      {transcriptionForShare && (
        <ShareModal
          transcription={transcriptionForShare}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShareUpdate={handleShareUpdate}
        />
      )}

      {/* Q&A Slide Panel */}
      <QASlidePanel
        isOpen={isQAPanelOpen}
        onClose={() => setIsQAPanelOpen(false)}
        scope="conversation"
        transcriptionId={conversationId}
        title={conversation.title}
        userTier={userTier}
        isAdmin={isAdmin}
      />

      {/* Find & Replace Panel - scoped to active tab */}
      <FindReplaceSlidePanel
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        conversationId={conversationId}
        conversationTitle={conversation.title}
        onReplaceComplete={() => {
          refresh();
          fetchOutputs();
        }}
        filterContext={activeTab === 'summary' ? 'summary' : 'transcript'}
        onSearchTextChange={(text, caseSensitive, wholeWord, matchIndex) => {
          setSearchText(text);
          setSearchCaseSensitive(caseSensitive);
          setSearchWholeWord(wholeWord);
          setCurrentMatchIndex(matchIndex);

          // Scroll to the current match after a brief delay for DOM update
          // If matchIndex is provided, scroll to that specific match
          // Otherwise, scroll to the first match (index 0) when search text changes
          const targetIndex = matchIndex ?? 0;
          setTimeout(() => {
            // Query within the scoped section based on active tab
            // This ensures navigation respects the filterContext scope
            const currentTab = activeTabRef.current;
            const summarySection = document.getElementById('summary');

            let matchElement: Element | null = null;

            if (currentTab === 'summary') {
              // Find the nth match within the summary section AND title
              const titleElement = document.getElementById('conversation-title');
              const titleMatches = titleElement?.querySelectorAll('[data-match-index]') || [];
              const summaryMatches = summarySection?.querySelectorAll('[data-match-index]') || [];
              // Combine title matches (first) + summary matches
              const allSummaryMatches = [...Array.from(titleMatches), ...Array.from(summaryMatches)];
              matchElement = allSummaryMatches[targetIndex] || null;
            } else {
              // Find the nth match within the transcript section (outside summary and title)
              const allMatches = document.querySelectorAll('[data-match-index]');
              const titleElement = document.getElementById('conversation-title');
              const transcriptMatches = Array.from(allMatches).filter(
                match => !summarySection?.contains(match) && !titleElement?.contains(match)
              );
              matchElement = transcriptMatches[targetIndex] || null;
            }

            if (matchElement) {
              // Small additional delay for any pending renders
              setTimeout(() => {
                matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 50);
            }
          }, 100);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConversation}
        title={tConversation('actions.deleteConfirmTitle')}
        message={tConversation('actions.deleteConfirmMessage')}
        confirmLabel={tConversation('actions.deleteConfirmYes')}
        cancelLabel={tConversation('actions.deleteConfirmNo')}
        variant="danger"
      />
    </div>
  );
}
