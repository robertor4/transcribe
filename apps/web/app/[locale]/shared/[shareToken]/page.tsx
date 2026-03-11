'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import type { SharedTranscriptionView, GeneratedAnalysis } from '@transcribe/shared';
import { TranslatedSummaryRenderer } from '@/components/TranslatedSummaryRenderer';
import { InlineTranscript } from '@/components/InlineTranscript';
import { KeyPointsSidebar } from '@/components/KeyPointsSidebar';
import { AIAssetSlidePanel } from '@/components/AIAssetSlidePanel';
import { ReadingTimeIndicator, countWords } from '@/components/ReadingTimeIndicator';
import { ConversationCategoryBadge } from '@/components/ConversationCategoryBadge';
import { AiIcon } from '@/components/icons/AiIcon';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { transcriptionApi } from '@/lib/api';
import { setPendingImport } from '@/lib/pendingImport';
import { useSlidePanel } from '@/hooks/useSlidePanel';
import { useCopySummaryToClipboard } from '@/hooks/useCopySummaryToClipboard';
import { formatRelativeTime } from '@/lib/formatters';
import { getOutputIcon } from '@/lib/outputIcons';
import {
  Lock,
  Loader2,
  BarChart3,
  FileText,
  Link2Off,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronUp,
  Download,
  UserPlus,
  Globe,
  MoreVertical,
  Info,
  Tag,
  User,
} from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useConversationTranslations } from '@/hooks/useConversationTranslations';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu } from '@/components/DropdownMenu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SharedTab = 'summary' | 'transcript' | 'ai-assets';

export default function SharedTranscriptionPage() {
  return (
    <AuthProvider>
      <SharedTranscriptionContent />
    </AuthProvider>
  );
}

function SharedTranscriptionContent() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('shared');
  const { user } = useAuth();
  const shareToken = params.shareToken as string;

  // Force light mode on shared pages (they don't have theme controls)
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    html.classList.remove('dark');

    // Restore dark mode if it was active when leaving the page
    return () => {
      if (wasDark) {
        html.classList.add('dark');
      }
    };
  }, []);

  const [transcription, setTranscription] = useState<SharedTranscriptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<SharedTab>('summary');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Slide panel for AI Assets
  const {
    selectedItem: selectedAsset,
    isOpen: isPanelOpen,
    isClosing: isPanelClosing,
    open: openAssetPanel,
    close: closeAssetPanel,
  } = useSlidePanel<GeneratedAnalysis>();

  // Scroll-to-top visibility tracking
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-to-top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [isImported, setIsImported] = useState(false);

  // Check import status when user is authenticated
  useEffect(() => {
    if (user && shareToken) {
      transcriptionApi.checkCopy(shareToken).then((response) => {
        if (response.success && response.data?.copied) {
          setIsImported(true);
        }
      }).catch(() => {
        // Ignore errors - user just hasn't copied yet
      });
    }
  }, [user, shareToken]);

  // Handle import for authenticated users
  const handleImport = async () => {
    if (!user) {
      setPendingImport(shareToken);
      router.push(`/${locale}/signup?redirect=/shared/${shareToken}`);
      return;
    }

    setIsImporting(true);
    try {
      const response = await transcriptionApi.copyFromShare(shareToken, password || undefined);
      if (response.success && response.data) {
        setIsImported(true);
        const newId = response.data.transcriptionId;
        toast.success(t('importCta.importSuccess'), {
          action: {
            label: t('importCta.viewImports'),
            onClick: () => router.push(`/${locale}/conversation/${newId}`),
          },
        });
      }
    } catch (err) {
      console.error('Failed to import:', err);
      toast.error(t('importCta.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  // Handle sign up redirect for unauthenticated users
  const handleSignUpToImport = () => {
    setPendingImport(shareToken);
    router.push(`/${locale}/signup?redirect=/shared/${shareToken}`);
  };

  // Translation state for shared view (read-only)
  const {
    status: translationStatus,
    currentLocale,
    setLocale,
    getTranslatedContent,
  } = useConversationTranslations(transcription?.id, {
    isShared: true,
    shareToken,
  });

  // Copy summary to clipboard
  const { copied: copiedSummary, handleCopy: handleCopySummary } = useCopySummaryToClipboard({
    summaryV2: transcription?.summaryV2,
    summaryText: transcription?.analyses?.summary || '',
    sourceId: transcription?.id || '',
    currentLocale,
    getTranslatedContent,
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const fetchSharedTranscription = useCallback(async (withPassword?: string, incrementView: boolean = false) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (withPassword) {
        queryParams.append('password', withPassword);
      }
      if (incrementView) {
        queryParams.append('incrementView', 'true');
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/api/transcriptions/shared/${shareToken}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.message?.includes('password')) {
          setPasswordRequired(true);
          setPasswordSubmitted(false);
        } else {
          setError(data.message || t('error.invalidLink'));
        }
        return;
      }

      if (data.success && data.data) {
        setTranscription(data.data);
        setPasswordRequired(false);
      } else {
        setError(t('error.notFound'));
      }
    } catch (error) {
      console.error('Error fetching shared transcription:', error);
      setError(t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [shareToken, t]);

  useEffect(() => {
    if (shareToken) {
      const sessionKey = `share_view_${shareToken}`;
      const hasViewed = sessionStorage.getItem(sessionKey);

      if (!hasViewed) {
        fetchSharedTranscription(undefined, true);
        sessionStorage.setItem(sessionKey, 'true');
      } else {
        fetchSharedTranscription(undefined, false);
      }
    }
  }, [shareToken, fetchSharedTranscription]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitted(true);
    fetchSharedTranscription(password, false);
  };

  // Check which sections are available
  const hasSummary = !!(transcription?.summaryV2 || transcription?.analyses?.summary);
  const hasTranscript = !!transcription?.transcriptText;
  const hasAIAssets = !!(transcription?.generatedAnalyses && transcription.generatedAnalyses.length > 0);

  // Set initial active tab based on available content
  useEffect(() => {
    if (transcription) {
      if (hasSummary) {
        setActiveTab('summary');
      } else if (hasTranscript) {
        setActiveTab('transcript');
      } else if (hasAIAssets) {
        setActiveTab('ai-assets');
      }
    }
  }, [transcription, hasSummary, hasTranscript, hasAIAssets]);

  // Word count for reading time
  const summaryWordCount = transcription ? (() => {
    if (transcription.summaryV2) {
      const v2 = transcription.summaryV2;
      const parts = [
        v2.intro || '',
        ...(v2.keyPoints || []).map(kp => `${kp.topic} ${kp.description}`),
        ...(v2.detailedSections || []).map(s => `${s.topic} ${s.content}`),
        ...(v2.decisions || []),
        ...(v2.nextSteps || []),
      ];
      return countWords(parts.join(' '));
    }
    return countWords(transcription.analyses?.summary || '');
  })() : 0;

  const transcriptWordCount = transcription ? (() => {
    if (transcription.speakerSegments && transcription.speakerSegments.length > 0) {
      return countWords(transcription.speakerSegments.map(s => s.text).join(' '));
    }
    return countWords(transcription.transcriptText || '');
  })() : 0;

  const activeWordCount = activeTab === 'summary' ? summaryWordCount : transcriptWordCount;

  // --- Early returns for loading/password/error ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#8D6AFA]" />
          <p className="text-gray-700">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (passwordRequired && !passwordSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-[#8D6AFA] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 uppercase tracking-wide">{t('passwordRequired')}</h2>
            <p className="text-gray-600 mt-2">{t('passwordDescription')}</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                data-1p-ignore
                data-bwignore
                data-lpignore="true"
                autoComplete="off"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:border-[#8D6AFA] hover:border-gray-400 transition-colors text-gray-800 placeholder:text-gray-500"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-[#8D6AFA] text-white py-3 rounded-full hover:bg-[#7A5AE0] transition-colors"
            >
              {t('submit')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <a href="https://neuralsummary.com" className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/neural-summary-logo.svg"
            alt="Neural Summary"
            className="h-8 w-auto"
          />
        </a>

        <Card className="max-w-md w-full text-center border-gray-200/60 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-3 pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50">
              <Link2Off className="h-7 w-7 text-[#8D6AFA]" />
            </div>
            <CardTitle className="text-xl text-gray-900">{t('error.title')}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {t('error.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">{t('error.contactOwner')}</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <a href="https://neuralsummary.com">{t('error.goHome')}</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!transcription) {
    return null;
  }

  // Count available tabs for conditional rendering
  const availableTabs = [hasSummary, hasTranscript, hasAIAssets].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3 sm:py-6">
          {/* Logo/Branding */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <a href="https://neuralsummary.com" target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logos/neural-summary-logo.svg"
                alt="Neural Summary"
                className="h-8 w-auto"
              />
            </a>
            {user && <UserAvatarDropdown compact />}
          </div>

          {/* Title — Merriweather serif, matching conversation page */}
          <h1
            className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2 leading-snug break-words max-w-[680px]"
            style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
          >
            {transcription.title || transcription.fileName}
          </h1>

          {/* Metadata row */}
          <div className="flex items-center gap-x-2 sm:gap-x-3 text-xs text-gray-500 whitespace-nowrap">
            {activeWordCount > 0 && (
              <>
                <ReadingTimeIndicator wordCount={activeWordCount} />
                <span className="text-gray-300">|</span>
              </>
            )}
            {transcription.conversationCategory && (
              <span className="hidden sm:inline-flex items-center gap-x-2 sm:gap-x-3">
                <ConversationCategoryBadge category={transcription.conversationCategory} />
                <span className="text-gray-300">|</span>
              </span>
            )}
            <span>{formatDate(transcription.createdAt)}</span>

            {/* Mobile info popover — shows category, shared by, views */}
            {(transcription.conversationCategory || transcription.sharedBy || transcription.viewCount !== undefined) && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="sm:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={6} className="w-auto p-3 space-y-1.5 bg-white border-gray-200 shadow-lg">
                  {transcription.conversationCategory && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      <ConversationCategoryBadge category={transcription.conversationCategory} />
                    </div>
                  )}
                  {transcription.sharedBy && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span>{transcription.sharedBy}</span>
                    </div>
                  )}
                  {transcription.viewCount !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      <span>{transcription.viewCount} {transcription.viewCount === 1 ? 'view' : 'views'}</span>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Mobile action dropdown */}
            <div className="sm:hidden ml-auto">
              <DropdownMenu
                trigger={
                  <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                }
                items={[
                  {
                    icon: copiedSummary ? Check : Copy,
                    label: copiedSummary ? t('copied') : t('copy'),
                    onClick: handleCopySummary,
                  },
                  ...(translationStatus && translationStatus.availableLocales.length > 0
                    ? [
                        { type: 'divider' as const },
                        {
                          icon: Globe,
                          label: `${
                            translationStatus.originalLocale
                              ? translationStatus.availableLocales.find(l => l.code.toLowerCase() === translationStatus.originalLocale?.toLowerCase())?.nativeName || 'Original'
                              : 'Original'
                          }${currentLocale === 'original' ? ' \u2713' : ''}`,
                          onClick: () => setLocale('original'),
                        },
                        ...translationStatus.availableLocales
                          .filter(l => l.code.toLowerCase() !== translationStatus.originalLocale?.toLowerCase())
                          .map(loc => ({
                            icon: Globe,
                            label: `${loc.nativeName}${currentLocale === loc.code ? ' \u2713' : ''}`,
                            onClick: () => setLocale(loc.code),
                          })),
                      ]
                    : []),
                  { type: 'divider' as const },
                  ...(user
                    ? isImported
                      ? [{ icon: Check, label: t('importCta.imported'), onClick: () => {}, disabled: true }]
                      : [{ icon: Download, label: isImporting ? t('importCta.importing') : t('importCta.importButton'), onClick: handleImport, disabled: isImporting }]
                    : [{ icon: UserPlus, label: t('importCta.signUp'), onClick: handleSignUpToImport }]),
                ]}
              />
            </div>

            {/* Shared by — desktop only */}
            {transcription.sharedBy && (
              <span className="hidden sm:inline-flex items-center gap-x-3">
                <span className="text-gray-300">|</span>
                <span>{transcription.sharedBy}</span>
              </span>
            )}
            {/* Views — desktop only */}
            {transcription.viewCount !== undefined && (
              <span className="hidden sm:inline-flex items-center gap-x-3">
                <span className="text-gray-300">|</span>
                <span>{transcription.viewCount} {transcription.viewCount === 1 ? 'view' : 'views'}</span>
              </span>
            )}

            {/* Desktop inline actions */}
            <TooltipProvider>
              <div className="hidden sm:flex items-center gap-3 ml-2">
                {/* Tab switchers — desktop only */}
                {availableTabs > 1 && (
                  <>
                    <span className="text-gray-300">|</span>
                    {hasSummary && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveTab('summary')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              activeTab === 'summary'
                                ? 'text-[#8D6AFA] bg-purple-50'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6}>
                          Summary
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {hasTranscript && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveTab('transcript')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              activeTab === 'transcript'
                                ? 'text-[#8D6AFA] bg-purple-50'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6}>
                          Transcript
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {hasAIAssets && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveTab('ai-assets')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              activeTab === 'ai-assets'
                                ? 'text-[#8D6AFA] bg-purple-50'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <AiIcon size={16} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6}>
                          {t('aiAssets')}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}

                <span className="text-gray-300">|</span>

                {/* Copy */}
                <Tooltip open={copiedSummary || undefined}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopySummary}
                      className={`p-1.5 rounded-lg transition-colors ${
                        copiedSummary
                          ? 'text-green-500'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    {copiedSummary ? t('copied') : t('copy')}
                  </TooltipContent>
                </Tooltip>

                {/* Language switcher */}
                {translationStatus && translationStatus.availableLocales.length > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            aria-label="Change language"
                          >
                            <Globe className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        {!showLanguageMenu && (
                          <TooltipContent side="bottom" sideOffset={6}>
                            {currentLocale === 'original'
                              ? (translationStatus.originalLocale?.toUpperCase() || 'Original')
                              : currentLocale.toUpperCase()}
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {showLanguageMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowLanguageMenu(false)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]">
                            <button
                              onClick={() => {
                                setLocale('original');
                                setShowLanguageMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                currentLocale === 'original'
                                  ? 'bg-purple-50 text-[#8D6AFA] font-medium'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>
                                {translationStatus.originalLocale
                                  ? `${translationStatus.availableLocales.find(l => l.code.toLowerCase() === translationStatus.originalLocale?.toLowerCase())?.nativeName || translationStatus.originalLocale} (Original)`
                                  : 'Original'}
                              </span>
                              {currentLocale === 'original' && <Check className="w-4 h-4" />}
                            </button>

                            {translationStatus.availableLocales.filter(l =>
                              l.code.toLowerCase() !== translationStatus.originalLocale?.toLowerCase()
                            ).map((loc) => (
                              <button
                                key={loc.code}
                                onClick={() => {
                                  setLocale(loc.code);
                                  setShowLanguageMenu(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                  currentLocale === loc.code
                                    ? 'bg-purple-50 text-[#8D6AFA] font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span>{loc.nativeName}</span>
                                {currentLocale === loc.code && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Import */}
                <span className="text-gray-300">|</span>
                {user ? (
                  isImported ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg text-green-500 cursor-default" disabled>
                          <Check className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>
                        {t('importCta.imported')}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleImport}
                          disabled={isImporting}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>
                        {isImporting ? t('importCta.importing') : t('importCta.importButton')}
                      </TooltipContent>
                    </Tooltip>
                  )
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleSignUpToImport}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6}>
                      {t('importCta.signUp')}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>

          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 lg:py-8">
        {/* Editorial rule — desktop only, right above content */}
        <hr className="hidden lg:block border-t-2 border-gray-300 dark:border-gray-400 mb-0" />

        {/* Tab navigation — pill style */}
        {availableTabs > 1 && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SharedTab)} className="sm:hidden mt-2">
            <TabsList className="bg-gray-100 h-7 sm:h-8 p-0.5 rounded-full">
              {hasSummary && (
                <TabsTrigger
                  value="summary"
                  className="text-[11px] sm:text-xs font-medium h-6 sm:h-7 px-3 sm:px-4 rounded-full text-gray-600 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  Summary
                </TabsTrigger>
              )}
              {hasTranscript && (
                <TabsTrigger
                  value="transcript"
                  className="text-[11px] sm:text-xs font-medium h-6 sm:h-7 px-3 sm:px-4 rounded-full text-gray-600 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  Transcript
                </TabsTrigger>
              )}
              {hasAIAssets && (
                <TabsTrigger
                  value="ai-assets"
                  className="text-[11px] sm:text-xs font-medium h-6 sm:h-7 px-3 sm:px-4 rounded-full text-gray-600 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  {t('aiAssets')}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}

        {/* Content area — two-column: main + key points sidebar */}
        <div className="lg:flex pt-6 lg:pt-10">
          <div className="flex-1 min-w-0 lg:pr-10">
            {/* Summary */}
            {hasSummary && (
              <div className={activeTab === 'summary' ? '' : 'hidden'}>
                <TranslatedSummaryRenderer
                  summaryV2={transcription.summaryV2}
                  summaryText={transcription.analyses?.summary || ''}
                  sourceId={transcription.id}
                  currentLocale={currentLocale}
                  getTranslatedContent={getTranslatedContent}
                />
              </div>
            )}

            {/* Transcript */}
            {hasTranscript && (
              <div className={activeTab === 'transcript' ? '' : 'hidden'}>
                <InlineTranscript
                  speakerSegments={transcription.speakerSegments}
                  text={transcription.transcriptText}
                />
              </div>
            )}

            {/* AI Assets — clickable cards that open slide panel */}
            {hasAIAssets && (
              <div className={activeTab === 'ai-assets' ? '' : 'hidden'}>
                <div className="flex flex-col gap-3">
                  {transcription.generatedAnalyses?.map((analysis) => {
                    const OutputIcon = getOutputIcon(analysis.templateId);
                    const relativeTime = formatRelativeTime(new Date(analysis.generatedAt));

                    return (
                      <button
                        key={analysis.id}
                        onClick={() => openAssetPanel(analysis)}
                        className="w-full p-3 text-left rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors group"
                      >
                        <div className="flex gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50 group-hover:bg-[#8D6AFA] transition-colors duration-200">
                            {OutputIcon ? (
                              <OutputIcon className="w-4 h-4 text-[#8D6AFA] group-hover:text-white transition-colors duration-200" />
                            ) : (
                              <AiIcon size={16} className="text-[#8D6AFA] group-hover:text-white transition-colors duration-200" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-[#8D6AFA] truncate transition-colors duration-200">
                                {analysis.templateName}
                              </p>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {relativeTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No content message */}
            {!hasSummary && !hasTranscript && !hasAIAssets && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700">No content available for this shared conversation.</p>
              </div>
            )}
          </div>{/* end flex-1 main content */}

          {/* Key Points sidebar — desktop only, shown on summary tab */}
          {(() => {
            if (activeTab !== 'summary') return null;
            const summaryTranslation = currentLocale !== 'original'
              ? getTranslatedContent('summary', transcription.id)
              : null;
            const kp = summaryTranslation?.content.type === 'summaryV2'
              ? summaryTranslation.content.keyPoints
              : transcription.summaryV2?.keyPoints;
            if (!kp || kp.length === 0) return null;
            return <KeyPointsSidebar keyPoints={kp} />;
          })()}
        </div>
      </div>

      {/* AI Asset Slide Panel */}
      <AIAssetSlidePanel
        asset={selectedAsset}
        isOpen={isPanelOpen}
        isClosing={isPanelClosing}
        onClose={closeAssetPanel}
        locale={locale}
        currentTranslationLocale={currentLocale}
        getTranslatedContent={getTranslatedContent}
      />

      {/* Footer */}
      <div className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>
              {t('footer.poweredBy')}{' '}
              <a
                href="https://neuralsummary.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8D6AFA] hover:underline font-medium"
              >
                Neural Summary
              </a>
            </p>
            <p className="mt-2">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>

      {/* Mobile scroll-to-top button */}
      <button
        onClick={scrollToTop}
        className={`md:hidden fixed bottom-6 right-6 w-12 h-12 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
}
