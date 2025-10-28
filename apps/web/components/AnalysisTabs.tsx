'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  ListChecks,
  Brain,
  Target,
  TrendingUp,
  FileText,
  Copy,
  Check,
  FileCode,
  Calendar,
  Languages,
  Loader2,
  Globe,
  Info,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AnalysisResults, ANALYSIS_TYPE_INFO, SUPPORTED_LANGUAGES, Transcription, TranslationData, GeneratedAnalysis } from '@transcribe/shared';
import { AnalysisContentRenderer } from './AnalysisContentRenderer';
import TranscriptTimeline from './TranscriptTimeline';
import { ActionItemsTable } from './ActionItemsTable';
import { TranscriptionDetails } from './TranscriptionDetails';
import { MoreAnalysesTab } from './MoreAnalysesTab';
import { transcriptionApi } from '@/lib/api';

interface AnalysisTabsProps {
  analyses: AnalysisResults;
  transcriptionId?: string;
  transcription?: Transcription;
  generatedAnalyses?: GeneratedAnalysis[];
  speakerSegments?: Array<{ speakerTag: string; startTime: number; endTime: number; text: string; confidence?: number }>;
  speakers?: Array<{ speakerId: number; speakerTag: string; totalSpeakingTime: number; wordCount: number; firstAppearance: number }>;
}

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ analyses, generatedAnalyses, speakerSegments, transcriptionId, transcription }) => {
  const [activeTab, setActiveTab] = useState<keyof AnalysisResults | 'moreAnalyses'>('summary');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [transcriptView, setTranscriptView] = useState<'timeline' | 'raw'>('timeline');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('original');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState<AnalysisResults>(analyses);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Scroll state for horizontal tabs
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (content: string, tabKey: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTab(tabKey);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    if (!transcriptionId) return;

    setShowLanguageDropdown(false);
    setTranslationError(null);

    // If switching to original, reset to original analyses
    if (languageCode === 'original') {
      setSelectedLanguage('original');
      setCurrentAnalyses(analyses);
      return;
    }

    // Check if translation already exists
    const existingTranslation = transcription?.translations?.[languageCode];
    if (existingTranslation) {
      setSelectedLanguage(languageCode);
      setCurrentAnalyses({
        ...existingTranslation.analyses,
        transcript: existingTranslation.transcriptText
      });
      return;
    }

    // Create new translation
    setIsTranslating(true);
    try {
      const response = await transcriptionApi.translate(transcriptionId, languageCode);
      console.log('[Translation] Response:', response);

      if (response.success && response.data) {
        const translationData = response.data as TranslationData;
        console.log('[Translation] Translation data:', translationData);
        console.log('[Translation] Analyses:', translationData.analyses);

        setSelectedLanguage(languageCode);
        setCurrentAnalyses({
          ...translationData.analyses,
          transcript: translationData.transcriptText
        });

        // Update the transcription object with the new translation
        if (transcription) {
          transcription.translations = transcription.translations || {};
          transcription.translations[languageCode] = translationData;
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslationError('Failed to translate. Please try again.');
      setTimeout(() => setTranslationError(null), 5000);
    } finally {
      setIsTranslating(false);
    }
  };

  // Scroll handling for horizontal tabs
  const checkScrollButtons = () => {
    if (!tabsContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsContainerRef.current) return;
    const scrollAmount = 200;
    tabsContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Check scroll buttons on mount and when tabs change
  useEffect(() => {
    checkScrollButtons();
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [analyses, transcription]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const activeButton = tabsContainerRef.current.querySelector('[data-active="true"]');
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  // Get translated languages
  const translatedLanguages = transcription?.translations
    ? Object.keys(transcription.translations)
    : [];

  const currentLanguageName = selectedLanguage === 'original'
    ? 'Original'
    : SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage;

  const getIconComponent = (iconName: string) => {
    switch(iconName) {
      case 'MessageSquare': return MessageSquare;
      case 'Users': return Users;
      case 'ListChecks': return ListChecks;
      case 'Brain': return Brain;
      case 'Target': return Target;
      case 'TrendingUp': return TrendingUp;
      case 'FileText': return FileText;
      case 'Info': return Info;
      default: return MessageSquare;
    }
  };

  const getTabColors = (color: string, isActive: boolean) => {
    if (!isActive) {
      return {
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-transparent',
        icon: 'text-gray-500 dark:text-gray-400'
      };
    }

    const colorMap = {
      'blue': {
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-600 dark:border-blue-500',
        icon: 'text-blue-600 dark:text-blue-500'
      },
      'purple': {
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-600 dark:border-purple-500',
        icon: 'text-purple-600 dark:text-purple-500'
      },
      'green': {
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-600 dark:border-green-500',
        icon: 'text-green-600 dark:text-green-500'
      },
      'pink': {
        text: 'text-pink-700 dark:text-pink-400',
        border: 'border-pink-600 dark:border-pink-500',
        icon: 'text-pink-600 dark:text-pink-500'
      },
      'orange': {
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-600 dark:border-orange-500',
        icon: 'text-orange-600 dark:text-orange-500'
      },
      'teal': {
        text: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-600 dark:border-teal-500',
        icon: 'text-teal-600 dark:text-teal-500'
      },
    };

    return colorMap[color as keyof typeof colorMap] || {
      text: 'text-[#cc3399] dark:text-[#cc3399]',
      border: 'border-[#cc3399]',
      icon: 'text-[#cc3399]'
    };
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scrollTabs('left')}
              className="absolute left-0 top-0 bottom-0 z-20 hidden md:flex items-center justify-center w-12 bg-gradient-to-r from-white dark:from-gray-900 to-transparent hover:from-gray-50 dark:hover:from-gray-800 transition-colors"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Scrollable tabs container */}
          <nav
            ref={tabsContainerRef}
            className="flex overflow-x-auto scroll-smooth -mb-px scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Render all tabs EXCEPT Details */}
            {ANALYSIS_TYPE_INFO.filter(info => info.key !== 'details').map((info) => {
              const Icon = getIconComponent(info.icon);
              const hasContent = analyses[info.key];

              // Skip tabs without content
              if (!hasContent) return null;

              const isActive = activeTab === info.key;
              const colors = getTabColors(info.color, isActive);

              return (
                <button
                  key={info.key}
                  data-active={isActive}
                  onClick={() => setActiveTab(info.key)}
                  className={`
                    py-3 px-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0
                    transition-all duration-200 border-b-2
                    ${isActive ? colors.border : 'border-transparent'}
                    ${colors.text}
                    ${!isActive && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  title={info.description}
                >
                  <Icon className={`h-4 w-4 ${colors.icon}`} />
                  <span>{info.label}</span>
                </button>
              );
            })}

            {/* On-Demand Generated Analyses Tabs */}
            {generatedAnalyses && generatedAnalyses.map((analysis) => {
              const isActive = activeTab === `generated-${analysis.id}`;
              const colors = getTabColors('text-blue-600 dark:text-blue-400', isActive);

              return (
                <button
                  key={`generated-${analysis.id}`}
                  data-active={isActive}
                  onClick={() => setActiveTab(`generated-${analysis.id}` as any)}
                  className={`
                    py-3 px-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0
                    transition-all duration-200 border-b-2
                    ${isActive ? 'border-blue-600 dark:border-blue-400' : 'border-transparent'}
                    ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}
                    ${!isActive && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  title={analysis.templateName}
                >
                  <Sparkles className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{analysis.templateName}</span>
                </button>
              );
            })}

            {/* More Analyses Tab - render before Details */}
            {transcriptionId && transcription && (
              <button
                data-active={activeTab === 'moreAnalyses'}
                onClick={() => setActiveTab('moreAnalyses')}
                className={`
                  py-3 px-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0
                  transition-all duration-200 border-b-2
                  ${activeTab === 'moreAnalyses' ? 'border-[#cc3399] text-[#cc3399]' : 'border-transparent text-gray-600 dark:text-gray-400'}
                  ${activeTab !== 'moreAnalyses' && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                `}
                title="Generate additional analyses on-demand"
              >
                <Sparkles className={`h-4 w-4 ${activeTab === 'moreAnalyses' ? 'text-[#cc3399]' : 'text-gray-500 dark:text-gray-400'}`} />
                <span>More Analyses</span>
              </button>
            )}

            {/* Details Tab - render last */}
            {transcription && (() => {
              const detailsInfo = ANALYSIS_TYPE_INFO.find(info => info.key === 'details');
              if (!detailsInfo) return null;

              const Icon = getIconComponent(detailsInfo.icon);
              const isActive = activeTab === 'details';
              const colors = getTabColors(detailsInfo.color, isActive);

              return (
                <button
                  key="details"
                  data-active={isActive}
                  onClick={() => setActiveTab('details')}
                  className={`
                    py-3 px-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0
                    transition-all duration-200 border-b-2
                    ${isActive ? colors.border : 'border-transparent'}
                    ${colors.text}
                    ${!isActive && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  title={detailsInfo.description}
                >
                  <Icon className={`h-4 w-4 ${colors.icon}`} />
                  <span>{detailsInfo.label}</span>
                </button>
              );
            })()}
          </nav>

          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              onClick={() => scrollTabs('right')}
              className="absolute right-0 top-0 bottom-0 z-20 hidden md:flex items-center justify-center w-12 bg-gradient-to-l from-white dark:from-gray-900 to-transparent hover:from-gray-50 dark:hover:from-gray-800 transition-colors"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Translation Error Message */}
      {translationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700 dark:text-red-400">{translationError}</p>
        </div>
      )}

      {/* Tab Content */}
      <div>
        {ANALYSIS_TYPE_INFO.map((info) => {
          const content = currentAnalyses[info.key];
          // Show Details tab even without content
          if (activeTab !== info.key) return null;
          if (!content && info.key !== 'details') return null;

          return (
            <div key={info.key}>
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mb-6">
                    {/* Language Selector - only show if transcriptionId and transcription are available (authenticated context) */}
                    {transcriptionId && transcription && (
                      <div className="relative">
                        <button
                          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                          disabled={isTranslating}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                          title="Change language"
                        >
                          {isTranslating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Translating...</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4" />
                              <span>{currentLanguageName}</span>
                            </>
                          )}
                        </button>

                        {/* Language Dropdown */}
                        {showLanguageDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowLanguageDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
                              <div className="p-2">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-2">
                                  Select Language
                                </div>

                                {/* Original Language */}
                                <button
                                  onClick={() => handleLanguageChange('original')}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                                    selectedLanguage === 'original'
                                      ? 'bg-pink-50 dark:bg-pink-900/30 text-[#cc3399] dark:text-[#cc3399] font-medium'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <span>Original</span>
                                  {selectedLanguage === 'original' && (
                                    <Check className="h-4 w-4 text-[#cc3399]" />
                                  )}
                                </button>

                                {/* Translated Languages */}
                                {translatedLanguages.length > 0 && (
                                  <>
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                                      Translated
                                    </div>
                                    {translatedLanguages.map((langCode) => {
                                      const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                                      if (!lang) return null;
                                      return (
                                        <button
                                          key={langCode}
                                          onClick={() => handleLanguageChange(langCode)}
                                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                                            selectedLanguage === langCode
                                              ? 'bg-pink-50 dark:bg-pink-900/30 text-[#cc3399] dark:text-[#cc3399] font-medium'
                                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{lang.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{lang.nativeName}</span>
                                          </div>
                                          {selectedLanguage === langCode && (
                                            <Check className="h-4 w-4 text-[#cc3399]" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Available Languages */}
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                                  Translate to...
                                </div>
                                {SUPPORTED_LANGUAGES.filter(
                                  lang => !translatedLanguages.includes(lang.code)
                                ).slice(0, 10).map((lang) => (
                                  <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Languages className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                      <span>{lang.name}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{lang.nativeName}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {info.key === 'transcript' && speakerSegments && speakerSegments.length > 0 && selectedLanguage === 'original' && (
                      <>
                        <button
                          onClick={() => setTranscriptView('timeline')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors border ${
                            transcriptView === 'timeline'
                              ? 'text-[#cc3399] bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'
                              : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          title="Timeline view"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>Timeline</span>
                        </button>
                        <button
                          onClick={() => setTranscriptView('raw')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors border ${
                            transcriptView === 'raw'
                              ? 'text-[#cc3399] bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'
                              : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          title="Raw text view"
                        >
                          <FileCode className="h-4 w-4" />
                          <span>Raw</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleCopy(content || '', info.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                      title={`Copy ${info.label}`}
                      disabled={!content}
                    >
                      {copiedTab === info.key ? (
                        <>
                          <Check className="h-4 w-4 text-[#cc3399]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
              </div>

              {/* Analysis Content */}
              <div>
                {info.key === 'transcript' ? (
                  <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    {/* Show timeline or raw view for original language with speaker segments */}
                    {selectedLanguage === 'original' && speakerSegments && speakerSegments.length > 0 ? (
                      transcriptView === 'timeline' ? (
                        <TranscriptTimeline segments={speakerSegments} />
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                            {speakerSegments.map(segment => segment.text).join(' ')}
                          </p>
                        </div>
                      )
                    ) : (
                      /* Show plain text for translated language or when no speaker segments */
                      <div>
                        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                          {content}
                        </p>
                      </div>
                    )}
                  </div>
                ) : info.key === 'summary' ? (
                  <AnalysisContentRenderer content={content || ''} />
                ) : info.key === 'actionItems' ? (
                  <ActionItemsTable content={content || ''} />
                ) : info.key === 'details' ? (
                  transcription ? (
                    <TranscriptionDetails transcription={transcription} />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No transcription data available
                    </div>
                  )
                ) : (
                  <AnalysisContentRenderer content={content || ''} />
                )}
              </div>
            </div>
          );
        })}

        {/* More Analyses Tab Content */}
        {activeTab === 'moreAnalyses' && transcriptionId && transcription && (
          <MoreAnalysesTab
            transcriptionId={transcriptionId}
            transcription={transcription}
            selectedLanguage={selectedLanguage}
          />
        )}

        {/* Generated Analyses Content */}
        {generatedAnalyses && generatedAnalyses.map((analysis) => {
          if (activeTab !== `generated-${analysis.id}`) return null;

          return (
            <div key={`content-${analysis.id}`}>
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mb-6">
                <button
                  onClick={() => handleCopy(analysis.content, `generated-${analysis.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                  title="Copy to clipboard"
                >
                  {copiedTab === `generated-${analysis.id}` ? (
                    <>
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <AnalysisContentRenderer content={analysis.content} />
              </div>

              {/* Metadata */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Model: {analysis.model}</span>
                  {analysis.generationTimeMs && (
                    <span>Generated in {(analysis.generationTimeMs / 1000).toFixed(2)}s</span>
                  )}
                  {analysis.tokenUsage && (
                    <span>Tokens: {analysis.tokenUsage.total}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};