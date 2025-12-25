'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Share2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Zap,
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
import { DeleteConversationButton } from '@/components/DeleteConversationButton';
import { ShareModal } from '@/components/ShareModal';
import { TranslationDropdown } from '@/components/TranslationDropdown';
import { useConversation } from '@/hooks/useConversation';
import { useSlidePanel } from '@/hooks/useSlidePanel';
import { useConversationTranslations } from '@/hooks/useConversationTranslations';
import { updateConversationTitle } from '@/lib/services/conversationService';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDuration } from '@/lib/formatters';
import { useTranslations } from 'next-intl';

interface ConversationClientProps {
  conversationId: string;
}

type ContentTab = 'summary' | 'transcript';

export function ConversationClient({ conversationId }: ConversationClientProps) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [transcriptionForShare, setTranscriptionForShare] = useState<Transcription | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>('summary');
  const [mobileAssetSheetOpen, setMobileAssetSheetOpen] = useState(false);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { conversation, isLoading, error, updateConversationLocally, refresh } = useConversation(conversationId);
  const { folders } = useFoldersContext();
  const { refreshRecentlyOpened } = useConversationsContext();
  const tConversation = useTranslations('conversation');

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
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#8D6AFA] mx-auto mb-4" />
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

  // Metadata for the asset sidebar
  const sidebarMetadata = {
    duration: conversation.source.audioDuration,
    createdAt: conversation.createdAt,
    status: conversation.status,
    speakers: conversation.source.transcript.speakers,
    context: conversation.context,
  };

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        rightPanel={
          <div className="hidden lg:block h-full">
            <AssetSidebar
              assets={outputs}
              isLoading={isLoadingOutputs}
              conversationId={conversationId}
              locale={locale}
              onGenerateNew={handleGenerateOutput}
              onAssetClick={openAssetPanel}
              selectedAssetId={selectedAsset?.id}
              metadata={sidebarMetadata}
            />
          </div>
        }
        mainContent={
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href={folder ? `/${locale}/folder/${folder.id}` : `/${locale}/dashboard`}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors mb-6"
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
                  className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-[#8D6AFA] outline-none w-full mb-3 font-[Montserrat]"
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
                <div className="flex items-center gap-2">
                  <TranslationDropdown
                    status={translationStatus}
                    currentLocale={currentLocale}
                    isTranslating={isTranslating}
                    onSelectLocale={setLocale}
                    onTranslate={translate}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                    onClick={handleCopy}
                  >
                    {copiedSummary ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Share2 className="w-4 h-4" />}
                    onClick={handleOpenShareModal}
                  >
                    Share
                  </Button>
                  <DeleteConversationButton
                    conversationId={conversationId}
                    onDeleted={() => router.push(`/${locale}/dashboard`)}
                  />
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-8 -mx-6 px-6">
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

            {/* Tab Content */}
            {activeTab === 'summary' && (
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
                        />
                      );
                    } else if (summaryTranslation && summaryTranslation.content.type === 'summaryV1') {
                      // Display translated markdown summary
                      return (
                        <SummaryRenderer
                          content={summaryTranslation.content.text}
                        />
                      );
                    }

                    // Display original summary
                    return (
                      <SummaryRenderer
                        content={conversation.source.summary.text}
                        summaryV2={conversation.source.summary.summaryV2}
                      />
                    );
                  })()
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Summary is being generated...</p>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'transcript' && (
              <InlineTranscript
                conversation={conversation}
                onRefresh={refresh}
              />
            )}
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
        onAssetClick={openAssetPanel}
      />

      {/* Output Generator Modal */}
      <OutputGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        conversationTitle={conversation.title}
        conversationId={conversationId}
        onOutputGenerated={fetchOutputs}
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
    </div>
  );
}
