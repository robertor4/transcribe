'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Share2,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  MoreVertical,
  Trash2,
  Replace,
  RefreshCw,
  Loader2,
  Globe,
  ScrollText,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { transcriptionApi, contactApi } from '@/lib/api';
import type { GeneratedAnalysis, Transcription } from '@transcribe/shared';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { AssetSidebar } from '@/components/AssetSidebar';
import { AssetMobileSheet } from '@/components/AssetMobileSheet';
import { Button } from '@/components/Button';
import { OutputGeneratorModal } from '@/components/OutputGeneratorModal';
import { TranslatedSummaryRenderer } from '@/components/TranslatedSummaryRenderer';
import { InlineTranscript } from '@/components/InlineTranscript';
import { KeyPointsSidebar } from '@/components/KeyPointsSidebar';
import { useCopySummaryToClipboard } from '@/hooks/useCopySummaryToClipboard';
import { computeSpeakerStats } from '@/components/TranscriptTimeline';
import { formatDuration } from '@/lib/formatters';
import { ShareModal } from '@/components/ShareModal';
import { FindReplaceSlidePanel } from '@/components/FindReplaceSlidePanel';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DropdownMenu } from '@/components/DropdownMenu';
import { TranslationDialog } from '@/components/TranslationDialog';
import { ExportPDFMenuItem } from '@/components/ExportPDFMenuItem';
import { useConversation } from '@/hooks/useConversation';
import { useConversationTranslations } from '@/hooks/useConversationTranslations';
import { updateConversationTitle, deleteConversation } from '@/lib/services/conversationService';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';

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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RegenerateSummaryDialog } from './RegenerateSummaryDialog';

type ErrorCategory = 'fileCorrupt' | 'timeout' | 'quota' | 'generic';

/**
 * Map raw backend error messages to user-friendly categories.
 * Avoids exposing internal details (file paths, ffmpeg codes) to users.
 */
function categorizeError(error?: string): ErrorCategory {
  if (!error) return 'generic';
  const lower = error.toLowerCase();

  if (
    lower.includes('invalid data') ||
    lower.includes('error opening input') ||
    lower.includes('invalid input') ||
    lower.includes('corrupt') ||
    lower.includes('moov atom') ||
    lower.includes('ebml') ||
    lower.includes('no such file') ||
    lower.includes('not found') ||
    lower.includes('unsupported') ||
    lower.includes('ffmpeg exited') ||
    lower.includes('ffprobe')
  ) {
    return 'fileCorrupt';
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('deadline') ||
    lower.includes('econnreset') ||
    lower.includes('socket hang up')
  ) {
    return 'timeout';
  }

  if (
    lower.includes('quota') ||
    lower.includes('limit') ||
    lower.includes('exceeded') ||
    lower.includes('402')
  ) {
    return 'quota';
  }

  return 'generic';
}

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [transcriptionForShare, setTranscriptionForShare] = useState<Transcription | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>('summary');
  const activeTabRef = useRef<ContentTab>('summary');
  const [mobileAssetSheetOpen, setMobileAssetSheetOpen] = useState(false);
  const [isQAPanelOpen, setIsQAPanelOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [translationDialogOpen, setTranslationDialogOpen] = useState(false);

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
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
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

  // Show toast when translation completes
  const wasTranslating = useRef(false);
  useEffect(() => {
    if (wasTranslating.current && !isTranslating) {
      toast.success(tConversation('translation.translationComplete'));
    }
    wasTranslating.current = isTranslating;
  }, [isTranslating, tConversation]);

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
  const handleRegenerateSummary = async (options?: { context?: string; instructions?: string }) => {
    if (isRegeneratingSummary) return;

    setIsRegenerateDialogOpen(false);
    setIsRegeneratingSummary(true);
    toast.info(tConversation('summary.regeneratingToast'));
    try {
      await transcriptionApi.regenerateSummary(conversationId, options);
      await refresh();
      toast.success(tConversation('summary.regenerateSuccess'));
    } catch (error) {
      console.error('Failed to regenerate summary:', error);
      toast.error(tConversation('summary.regenerateError'));
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

  // Copy summary to clipboard (hook handles translation detection + rich text)
  const { copied: copiedSummary, setCopied: setCopiedSummary, handleCopy: handleCopySummary } = useCopySummaryToClipboard({
    summaryV2: conversation?.source.summary.summaryV2,
    summaryText: conversation?.source.summary.text || '',
    sourceId: conversationId,
    currentLocale,
    getTranslatedContent,
  });

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

  // Failed transcription state
  if (conversation.status === 'failed') {
    const errorCategory = categorizeError(conversation.error);
    const friendlyMessage = tConversation(`failed.reasons.${errorCategory}`);
    const handleReportError = () => {
      toast.promise(
        contactApi.reportError({
          conversationId: conversation.id,
          conversationTitle: conversation.title || 'Untitled',
          error: conversation.error || 'Unknown',
          createdAt: conversation.createdAt.toISOString(),
        }),
        {
          loading: tConversation('failed.reportSending'),
          success: tConversation('failed.reportSent'),
          error: tConversation('failed.reportFailed'),
        },
      );
    };

    return (
      <div className="h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4 border-gray-200 dark:border-gray-700 pb-0 overflow-hidden">
          <CardHeader className="justify-items-center text-center pb-0">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-1">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              {tConversation('failed.title')}
            </CardTitle>
            {conversation.title && (
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {conversation.title}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-gray-700 dark:text-gray-300">
                {friendlyMessage}
              </AlertDescription>
            </Alert>
            <Separator />
            <div className="flex flex-col gap-2 [&_a]:block [&_button]:w-full">
              <Link href={`/${locale}/dashboard`}>
                <Button variant="primary">{tConversation('failed.tryAgain')}</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                {tConversation('failed.deleteConversation')}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 py-5">
            <button
              onClick={handleReportError}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {tConversation('failed.reportIssue')}
            </button>
          </CardFooter>
        </Card>

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
        initialLeftCollapsed={true}
        initialRightCollapsed={true}
        leftSidebar={<LeftNavigation />}
        rightPanel={
          <AssetSidebar
            assets={outputs}
            isLoading={isLoadingOutputs}
            onGenerateNew={handleGenerateOutput}
            onAssetClick={(asset) => {
              router.push(`/${locale}/conversation/${conversationId}/outputs/${asset.id}`);
            }}
            metadata={sidebarMetadata}
            recommendations={recommendations}
            onRecommendationSelect={handleRecommendationSelect}
          />
        }
        mainContent={
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
            {/* Header */}
            <div className="max-w-[680px] mb-6 lg:mb-8">
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
                  className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-[#8D6AFA] outline-none w-full mb-4"
                  style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
                />
              ) : (
                <h1
                  onClick={handleStartEditTitle}
                  className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 cursor-text hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600 transition-all leading-snug"
                  style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
                  title="Click to rename"
                  id="conversation-title"
                >
                  <TextHighlighter text={conversation.title} highlight={highlightOptions} />
                </h1>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                {activeWordCount > 0 && (
                  <>
                    <ReadingTimeIndicator wordCount={activeWordCount} />
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                  </>
                )}
                {conversation.conversationCategory && (
                  <>
                    <ConversationCategoryBadge category={conversation.conversationCategory} />
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                  </>
                )}
                <span>
                  {conversation.createdAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>

                {/* Action icons */}
                <TooltipProvider>
                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setIsQAPanelOpen(true)}
                          className="hidden sm:block p-1.5 rounded-lg text-gray-400 hover:text-[#8D6AFA] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          <AnimatedAiIcon size={16} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>
                        {tConversation('actions.askQuestions')}
                      </TooltipContent>
                    </Tooltip>
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
                    <Tooltip open={copiedSummary || undefined}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleCopy}
                          className={`p-1.5 rounded-lg transition-colors ${
                            copiedSummary
                              ? 'text-green-500'
                              : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>
                        {copiedSummary ? tConversation('actions.copied') : tConversation('actions.copy')}
                      </TooltipContent>
                    </Tooltip>
                    <span className="hidden lg:inline text-gray-300 dark:text-gray-600">|</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTab(activeTab === 'summary' ? 'transcript' : 'summary')}
                          className={`hidden lg:block p-1.5 rounded-lg transition-colors ${
                            activeTab === 'transcript'
                              ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800'
                              : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <ScrollText className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>
                        {activeTab === 'summary'
                          ? tConversation('tabs.transcript')
                          : tConversation('tabs.summary')}
                      </TooltipContent>
                    </Tooltip>
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setTranslationDialogOpen(true)}
                          className="hidden sm:block p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>
                        {tConversation('translation.dialogTitle')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                <span className="hidden lg:inline text-gray-300 dark:text-gray-600">|</span>
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
                      {
                        icon: Globe,
                        label: tConversation('translation.dialogTitle'),
                        onClick: () => setTranslationDialogOpen(true),
                      },
                      // Regenerate summary - only for V2 conversations and Pro+ users
                      ...(!isLegacyConversation && (isAdmin || userTier !== 'free')
                        ? [
                            {
                              icon: RefreshCw,
                              label: isRegeneratingSummary ? tConversation('summary.regenerating') : tConversation('summary.regenerate'),
                              onClick: () => setIsRegenerateDialogOpen(true),
                              disabled: isRegeneratingSummary,
                            },
                          ]
                        : []),
                      { type: 'divider' },
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

            {/* Editorial rule — desktop only */}
            <hr className="hidden lg:block border-t-2 border-gray-300 dark:border-gray-400 mt-6 lg:mt-8" />

            {/* Mobile transcript toggle */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentTab)} className="lg:hidden mt-4">
              <TabsList className="bg-gray-100 dark:bg-gray-800 h-7 p-0.5 rounded-full">
                <TabsTrigger
                  value="summary"
                  className="text-[11px] font-medium h-6 px-3 rounded-full data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-gray-100 dark:data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className="text-[11px] font-medium h-6 px-3 rounded-full data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-gray-100 dark:data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
                >
                  Transcript
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Content area — two-column: main + key points sidebar */}
            <div className="lg:flex pt-6 lg:pt-10">
              <div className="flex-1 min-w-0 lg:pr-10">
              {/* Tab Content - Both tabs are always rendered for Find & Replace scroll navigation */}
              <div className={activeTab === 'summary' ? '' : 'hidden'}>
              <section id="summary" className="scroll-mt-16">
                {isRegeneratingSummary && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">{tConversation('summary.regenerating')}</span>
                  </div>
                )}
                {conversation.source.summary.summaryV2 || conversation.source.summary.text ? (
                  <TranslatedSummaryRenderer
                    summaryV2={conversation.source.summary.summaryV2}
                    summaryText={conversation.source.summary.text}
                    sourceId={conversationId}
                    currentLocale={currentLocale}
                    getTranslatedContent={getTranslatedContent}
                    highlightOptions={highlightOptions}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">{tConversation('summary.notAvailable')}</p>
                    {/* Regenerate button only for Pro+ users or admins */}
                    {(isAdmin || userTier !== 'free') && (
                      <Button
                        variant="primary"
                        onClick={() => setIsRegenerateDialogOpen(true)}
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
              <div className="max-w-[680px]">
                <InlineTranscript
                  conversation={conversation}
                  highlightOptions={highlightOptions}
                />
              </div>
            </div>
              </div>{/* end flex-1 main content */}

              {/* Contextual sidebar — desktop only */}
              {(() => {
                if (activeTab === 'summary') {
                  const summaryTranslation = currentLocale !== 'original'
                    ? getTranslatedContent('summary', conversationId)
                    : null;
                  const kp = summaryTranslation?.content.type === 'summaryV2'
                    ? summaryTranslation.content.keyPoints
                    : conversation.source.summary.summaryV2?.keyPoints;
                  if (!kp || kp.length === 0) return null;
                  return <KeyPointsSidebar keyPoints={kp} />;
                }

                if (activeTab === 'transcript') {
                  // Transcript stats + speaker breakdown sidebar
                  const segs = conversation.source.transcript.speakerSegments;
                  if (!segs || segs.length === 0) return null;
                  const speakerStats = computeSpeakerStats(segs);
                  const totalDur = segs[segs.length - 1].endTime;
                  const uniqueSpeakers = new Set(segs.map(s => s.speakerTag)).size;
                  const totalWords = segs.reduce((sum, s) => sum + s.text.split(' ').length, 0);

                  return (
                    <aside className="hidden lg:block w-60 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 -mt-10">
                      <div className="sticky top-8 px-6 pt-10 pb-6">
                        {/* Overview stats */}
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">
                          Overview
                        </h3>
                        <dl className="space-y-3 mb-8">
                          <div>
                            <dt className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Duration</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDuration(totalDur)}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Segments</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{segs.length}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Speakers</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{uniqueSpeakers}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total words</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{totalWords.toLocaleString()}</dd>
                          </div>
                        </dl>

                        {/* Speaker breakdown */}
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">
                          Speakers
                        </h3>
                        <ol className="space-y-3">
                          {speakerStats.map((speaker, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: speaker.color }}
                              >
                                {speaker.initial}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block leading-snug">
                                  {speaker.speakerTag}
                                </span>
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 block mt-0.5">
                                  {formatDuration(speaker.totalDuration)} · {speaker.percentage}%
                                </span>
                                {/* Mini bar */}
                                <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${speaker.percentage}%`, backgroundColor: speaker.color }}
                                  />
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </aside>
                  );
                }

                return null;
              })()}
            </div>{/* end lg:flex */}
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
          // Navigate to the full page view
          router.push(`/${locale}/conversation/${conversationId}/outputs/${asset.id}`);
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

      {/* Translation Dialog */}
      <TranslationDialog
        open={translationDialogOpen}
        onOpenChange={setTranslationDialogOpen}
        status={translationStatus}
        currentLocale={currentLocale}
        isTranslating={isTranslating}
        userTier={userTier}
        isAdmin={isAdmin}
        onSelectLocale={setLocale}
        onTranslate={translate}
      />

      {/* Regenerate Summary Dialog */}
      <RegenerateSummaryDialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
        initialContext={conversation.context || ''}
        onSubmit={handleRegenerateSummary}
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
