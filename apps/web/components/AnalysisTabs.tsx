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
import OutdatedAnalysisWarning from './OutdatedAnalysisWarning';
import { transcriptionApi } from '@/lib/api';

interface AnalysisTabsProps {
  analyses: AnalysisResults;
  transcriptionId?: string;
  transcription?: Partial<Transcription>;
  generatedAnalyses?: GeneratedAnalysis[];
  speakerSegments?: Array<{ speakerTag: string; startTime: number; endTime: number; text: string; confidence?: number }>;
  speakers?: Array<{ speakerId: number; speakerTag: string; totalSpeakingTime: number; wordCount: number; firstAppearance: number }>;
  readOnlyMode?: boolean; // Disable translation API calls for shared/public views
  onTranscriptionUpdate?: () => void; // Callback to refresh transcription after corrections
}

// V2 ARCHITECTURE: Map analysis keys to their template IDs in generatedAnalyses
const ANALYSIS_TO_TEMPLATE_MAP: Record<string, string> = {
  actionItems: 'actionItems',
  communicationStyles: 'communicationAnalysis',
};

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ analyses, generatedAnalyses, speakerSegments, transcriptionId, transcription, readOnlyMode, onTranscriptionUpdate }) => {
  const [activeTab, setActiveTab] = useState<keyof AnalysisResults | 'moreAnalyses' | string>('summary');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [transcriptView, setTranscriptView] = useState<'timeline' | 'raw'>('timeline');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('original');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState<AnalysisResults>(analyses);
  const [translationError, setTranslationError] = useState<string | null>(null);

  /**
   * V2 ARCHITECTURE: Find generated analysis by template ID
   * For actionItems and communicationStyles, we now store them in generatedAnalyses collection
   */
  const findGeneratedAnalysisByKey = (analysisKey: string): GeneratedAnalysis | undefined => {
    const templateId = ANALYSIS_TO_TEMPLATE_MAP[analysisKey];
    if (!templateId || !generatedAnalyses) return undefined;
    return generatedAnalyses.find(a => a.templateId === templateId);
  };

  /**
   * V2 ARCHITECTURE: Check if an analysis has content (from either location)
   * Priority: generatedAnalyses > analyses (backwards compat)
   */
  const hasAnalysisContent = (analysisKey: string): boolean => {
    // For action items and communication, check generatedAnalyses first
    if (ANALYSIS_TO_TEMPLATE_MAP[analysisKey]) {
      const generated = findGeneratedAnalysisByKey(analysisKey);
      if (generated) return true;
    }
    // Fall back to analyses for backwards compat
    return !!currentAnalyses[analysisKey as keyof AnalysisResults];
  };

  // Scroll state for horizontal tabs
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (content: string | object, tabKey: string) => {
    try {
      const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(textContent);
      setCopiedTab(tabKey);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatTimelineTranscript = (segments: Array<{ speakerTag: string; startTime: number; endTime: number; text: string; confidence?: number }>): string => {
    if (!segments || segments.length === 0) return '';

    // Helper to format time as MM:SS or HH:MM:SS
    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Helper to format duration as "Xm Ys" or "Xs"
    const formatDuration = (startTime: number, endTime: number): string => {
      const duration = endTime - startTime;
      if (duration < 60) {
        return `${Math.floor(duration)}s`;
      }
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}m ${seconds}s`;
    };

    // Group consecutive segments by same speaker
    const groupedSegments: Array<{ speakerTag: string; startTime: number; endTime: number; text: string }> = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const lastGroup = groupedSegments[groupedSegments.length - 1];

      if (lastGroup && lastGroup.speakerTag === segment.speakerTag) {
        // Merge with previous segment
        lastGroup.endTime = segment.endTime;
        lastGroup.text += ' ' + segment.text;
      } else {
        // Create new group
        groupedSegments.push({
          speakerTag: segment.speakerTag,
          startTime: segment.startTime,
          endTime: segment.endTime,
          text: segment.text
        });
      }
    }

    // Format as markdown-style text
    return groupedSegments.map(group => {
      const timestamp = formatTime(group.startTime);
      const duration = formatDuration(group.startTime, group.endTime);
      return `${timestamp} ${group.speakerTag} (${duration})\n${group.text}`;
    }).join('\n\n');
  };

  const handleLanguageChange = async (languageCode: string) => {
    setShowLanguageDropdown(false);
    setTranslationError(null);

    // NEW: For shared/read-only mode, only switch to existing translations (no API calls)
    if (readOnlyMode) {
      if (languageCode === 'original') {
        setSelectedLanguage('original');
        setCurrentAnalyses(analyses);
        return;
      }

      // Switch to existing translation (analyses only - transcript always stays original)
      const existingTranslation = transcription?.translations?.[languageCode];
      if (existingTranslation) {
        setSelectedLanguage(languageCode);
        setCurrentAnalyses({
          ...existingTranslation.analyses,
          transcript: analyses.transcript // Always use original transcript
        });
      }
      return; // Don't proceed to API calls in read-only mode
    }

    // Authenticated user mode - requires transcriptionId for API calls
    if (!transcriptionId) return;

    // If switching to original, reset to original analyses and save preference
    if (languageCode === 'original') {
      setSelectedLanguage('original');
      setCurrentAnalyses(analyses);

      // Save preference for "original" language
      try {
        await transcriptionApi.updateTranslationPreference(transcriptionId, 'original');
        if (transcription) {
          transcription.preferredTranslationLanguage = 'original';
        }
      } catch (error) {
        console.error('Failed to update preference:', error);
      }
      return;
    }

    // Check if translation already exists (analyses only - transcript always stays original)
    const existingTranslation = transcription?.translations?.[languageCode];
    if (existingTranslation) {
      setSelectedLanguage(languageCode);
      setCurrentAnalyses({
        ...existingTranslation.analyses,
        transcript: analyses.transcript // Always use original transcript
      });

      // Save preference when switching to existing translation
      try {
        await transcriptionApi.updateTranslationPreference(transcriptionId, languageCode);
        if (transcription) {
          transcription.preferredTranslationLanguage = languageCode;
        }
      } catch (error) {
        console.error('Failed to update preference:', error);
      }
      return;
    }

    // Create new translation (preference is auto-saved by backend during translation)
    setIsTranslating(true);
    try {
      const response = await transcriptionApi.translate(transcriptionId, languageCode);

      if (response.success && response.data) {
        const translationData = response.data as TranslationData;

        setSelectedLanguage(languageCode);
        setCurrentAnalyses({
          ...translationData.analyses,
          transcript: analyses.transcript // Always use original transcript
        });

        // Update the transcription object with the new translation and preference
        if (transcription) {
          transcription.translations = transcription.translations || {};
          transcription.translations[languageCode] = translationData;
          transcription.preferredTranslationLanguage = languageCode; // Backend auto-saves this, but update locally too
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

  // Auto-load preferred translation language on mount
  useEffect(() => {
    const preferredLang = transcription?.preferredTranslationLanguage;

    // Only auto-load if:
    // 1. There's a preferred language set
    // 2. It's not 'original' (which is the default)
    // 3. The translation exists in the transcription
    // 4. We're currently showing 'original' (to avoid overriding user's current selection)
    if (preferredLang && preferredLang !== 'original' && selectedLanguage === 'original') {
      const translation = transcription?.translations?.[preferredLang];
      if (translation) {
        setSelectedLanguage(preferredLang);
        setCurrentAnalyses({
          ...translation.analyses,
          transcript: analyses.transcript // Always use original transcript
        });
      }
    }
  }, [transcription]); // Only run when transcription changes (on mount or update)

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
      text: 'text-[#8D6AFA] dark:text-[#8D6AFA]',
      border: 'border-[#8D6AFA]',
      icon: 'text-[#8D6AFA]'
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
              // V2 ARCHITECTURE: Check both generatedAnalyses and analyses for content
              const hasContent = hasAnalysisContent(info.key);

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
                    py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0
                    transition-all duration-200 border-b-2
                    ${isActive ? colors.border : 'border-transparent'}
                    ${colors.text}
                    ${!isActive && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  title={info.description}
                >
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${colors.icon}`} />
                  <span>{info.label}</span>
                </button>
              );
            })}

            {/* On-Demand Generated Analyses Tabs */}
            {generatedAnalyses && generatedAnalyses.map((analysis) => {
              const isActive = activeTab === `generated-${analysis.id}`;

              return (
                <button
                  key={`generated-${analysis.id}`}
                  data-active={isActive}
                  onClick={() => setActiveTab(`generated-${analysis.id}`)}
                  className={`
                    py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0
                    transition-all duration-200 border-b-2
                    ${isActive ? 'border-blue-600 dark:border-blue-400' : 'border-transparent'}
                    ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}
                    ${!isActive && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  title={analysis.templateName}
                >
                  <Sparkles className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{analysis.templateName}</span>
                </button>
              );
            })}

            {/* More Analyses Tab - render before Details (only for authors, not in read-only mode) */}
            {transcriptionId && transcription && !readOnlyMode && (
              <button
                data-active={activeTab === 'moreAnalyses'}
                onClick={() => setActiveTab('moreAnalyses')}
                className={`
                  py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0
                  transition-all duration-200 border-b-2
                  ${activeTab === 'moreAnalyses' ? 'border-[#8D6AFA] text-[#8D6AFA]' : 'border-transparent text-gray-600 dark:text-gray-400'}
                  ${activeTab !== 'moreAnalyses' && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                `}
                title="Generate additional analyses on-demand"
              >
                <Sparkles className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'moreAnalyses' ? 'text-[#8D6AFA]' : 'text-gray-500 dark:text-gray-400'}`} />
                <span>More Analyses</span>
              </button>
            )}

            {/* Details Tab - render last (only for authors, not in read-only mode) */}
            {transcription && !readOnlyMode && (() => {
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
                    py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0
                    transition-all duration-200 border-b-2
                    ${isActive ? colors.border : 'border-transparent'}
                    ${colors.text}
                    ${!isActive && 'hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  title={detailsInfo.description}
                >
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${colors.icon}`} />
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
          // V2 ARCHITECTURE: Check for generated analysis first, then fall back to analyses
          const generatedAnalysis = findGeneratedAnalysisByKey(info.key);
          const legacyContent = currentAnalyses[info.key];
          const content = generatedAnalysis?.content || legacyContent;

          // Show Details tab even without content
          if (activeTab !== info.key) return null;
          if (!content && info.key !== 'details') return null;

          return (
            <div key={info.key}>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-6">
                    {/* Language Selector - only show for non-transcript tabs (transcript is always in original language) */}
                    {transcriptionId && transcription && info.key !== 'transcript' && (
                      <div className="relative w-full sm:w-auto order-1 sm:order-none">
                        <button
                          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                          disabled={isTranslating}
                          className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 w-full sm:w-auto"
                          title="Change language"
                        >
                          {isTranslating ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                              <span className="text-gray-800 dark:text-gray-200">Translating...</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="text-gray-800 dark:text-gray-200">{currentLanguageName}</span>
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
                                      ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA] dark:text-[#8D6AFA] font-medium'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <span>Original</span>
                                  {selectedLanguage === 'original' && (
                                    <Check className="h-4 w-4 text-[#8D6AFA]" />
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
                                              ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA] dark:text-[#8D6AFA] font-medium'
                                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{lang.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{lang.nativeName}</span>
                                          </div>
                                          {selectedLanguage === langCode && (
                                            <Check className="h-4 w-4 text-[#8D6AFA]" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Available Languages - Only show in authenticated mode */}
                                {!readOnlyMode && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {info.key === 'transcript' && speakerSegments && speakerSegments.length > 0 && (
                      <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-none">
                        <button
                          onClick={() => setTranscriptView('timeline')}
                          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors border flex-1 sm:flex-none ${
                            transcriptView === 'timeline'
                              ? 'text-[#8D6AFA] bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                              : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          title="Timeline view"
                        >
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-gray-800 dark:text-gray-200">Timeline</span>
                        </button>
                        <button
                          onClick={() => setTranscriptView('raw')}
                          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors border flex-1 sm:flex-none ${
                            transcriptView === 'raw'
                              ? 'text-[#8D6AFA] bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                              : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          title="Raw text view"
                        >
                          <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-gray-800 dark:text-gray-200">Raw</span>
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        // For transcript tab in timeline mode, use formatted output
                        if (info.key === 'transcript' && transcriptView === 'timeline' && speakerSegments && speakerSegments.length > 0) {
                          handleCopy(formatTimelineTranscript(speakerSegments), info.key);
                        } else {
                          handleCopy(content || '', info.key);
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 order-3 sm:order-none w-full sm:w-auto"
                      title={`Copy ${info.label}`}
                      disabled={!content}
                    >
                      {copiedTab === info.key ? (
                        <>
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8D6AFA]" />
                          <span className="text-gray-800 dark:text-gray-200">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline text-gray-800 dark:text-gray-200">Copy</span>
                          <span className="sm:hidden text-gray-800 dark:text-gray-200">Copy {info.label}</span>
                        </>
                      )}
                    </button>
              </div>

              {/* Outdated Analysis Warning - Show below action buttons for affected tabs */}
              {transcription?.coreAnalysesOutdated && transcriptionId && (
                (info.key === 'summary' || info.key === 'actionItems' || info.key === 'communicationStyles') && (
                  <div className="mb-6">
                    <OutdatedAnalysisWarning
                      analysisType={
                        info.key === 'summary' ? 'Summary' :
                        info.key === 'actionItems' ? 'Action Items' :
                        'Communication Styles'
                      }
                      transcriptionId={transcriptionId}
                      onRegenerate={() => onTranscriptionUpdate?.()}
                    />
                  </div>
                )
              )}

              {/* Analysis Content */}
              <div>
                {info.key === 'transcript' ? (
                  <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    {/* Show timeline or raw view if speaker segments exist (transcript is always in original) */}
                    {speakerSegments && speakerSegments.length > 0 ? (
                      transcriptView === 'timeline' ? (
                        <TranscriptTimeline
                          transcriptionId={transcriptionId!}
                          segments={speakerSegments}
                          onRefresh={onTranscriptionUpdate}
                          readOnlyMode={readOnlyMode}
                        />
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                            {speakerSegments.map(segment => segment.text).join(' ')}
                          </p>
                        </div>
                      )
                    ) : (
                      /* Show plain text when no speaker segments available */
                      <div>
                        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                          {typeof content === 'string' ? content : ''}
                        </p>
                      </div>
                    )}
                  </div>
                ) : info.key === 'summary' ? (
                  <AnalysisContentRenderer content={typeof content === 'string' ? content : ''} />
                ) : info.key === 'actionItems' ? (
                  // V2 ARCHITECTURE: Use structured renderer if from generatedAnalyses, else legacy table
                  generatedAnalysis && generatedAnalysis.content ? (
                    <AnalysisContentRenderer
                      content={generatedAnalysis.content}
                      contentType={generatedAnalysis.contentType}
                    />
                  ) : (
                    <ActionItemsTable content={typeof content === 'string' ? content : ''} />
                  )
                ) : info.key === 'details' ? (
                  // Details tab should never render in read-only mode (filtered out from tabs)
                  transcription && transcription.id && !readOnlyMode ? (
                    <TranscriptionDetails
                      transcription={transcription as Partial<Transcription> & { id: string }}
                      onRefresh={onTranscriptionUpdate}
                    />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No transcription data available
                    </div>
                  )
                ) : info.key === 'communicationStyles' ? (
                  // V2 ARCHITECTURE: Use structured renderer if from generatedAnalyses
                  generatedAnalysis && generatedAnalysis.content ? (
                    <AnalysisContentRenderer
                      content={generatedAnalysis.content}
                      contentType={generatedAnalysis.contentType}
                    />
                  ) : (
                    <AnalysisContentRenderer content={typeof content === 'string' ? content : ''} />
                  )
                ) : (
                  <AnalysisContentRenderer content={typeof content === 'string' ? content : ''} />
                )}
              </div>
            </div>
          );
        })}

        {/* More Analyses Tab Content (only for authors, not in read-only mode) */}
        {activeTab === 'moreAnalyses' && transcriptionId && transcription && transcription.id && !readOnlyMode && (
          <MoreAnalysesTab
            transcriptionId={transcriptionId}
            transcription={transcription as Partial<Transcription> & { id: string }}
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
                  className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 w-full sm:w-auto"
                  title="Copy to clipboard"
                >
                  {copiedTab === `generated-${analysis.id}` ? (
                    <>
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline text-gray-800 dark:text-gray-200">Copy</span>
                      <span className="sm:hidden text-gray-800 dark:text-gray-200">Copy Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <AnalysisContentRenderer
                  content={analysis.content}
                  contentType={analysis.contentType}
                />
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