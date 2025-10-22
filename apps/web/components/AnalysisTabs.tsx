'use client';

import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';
import { AnalysisResults, ANALYSIS_TYPE_INFO, SUPPORTED_LANGUAGES, Transcription, TranslationData } from '@transcribe/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { SummaryWithComments } from './SummaryWithComments';
import TranscriptTimeline from './TranscriptTimeline';
import { ActionItemsTable } from './ActionItemsTable';
import { transcriptionApi } from '@/lib/api';

interface AnalysisTabsProps {
  analyses: AnalysisResults;
  transcriptionId?: string;
  transcription?: Transcription;
  speakerSegments?: Array<{ speakerTag: string; startTime: number; endTime: number; text: string; confidence?: number }>;
  speakers?: Array<{ speakerId: number; speakerTag: string; totalSpeakingTime: number; wordCount: number; firstAppearance: number }>;
}

// Blog-style content component for non-summary analysis tabs
const BlogStyleContent: React.FC<{ content: string }> = ({ content }) => {
  // Process the content to handle HTML-styled intro paragraph
  const processedContent = React.useMemo(() => {
    const htmlParagraphRegex = /<p\s+style="font-size:\s*1\.4em;">([^<]+)<\/p>/;
    const match = content.match(htmlParagraphRegex);

    if (match) {
      const introText = match[1];
      return content.replace(htmlParagraphRegex, `[INTRO]${introText}[/INTRO]`);
    }
    return content;
  }, [content]);

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8">
      <div className="prose prose-gray prose-lg max-w-none prose-p:text-base prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({children}) => {
              // Check if this is the intro paragraph
              if (typeof children === 'string' && children.includes('[INTRO]')) {
                const introText = children.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                return (
                  <p className="text-2xl leading-relaxed font-medium text-gray-700 dark:text-gray-300 mb-8 border-l-4 border-[#cc3399] pl-6">
                    {introText}
                  </p>
                );
              }

              // Handle arrays of children (mixed content)
              if (Array.isArray(children)) {
                const textContent = children.map(child =>
                  typeof child === 'string' ? child : ''
                ).join('');

                if (textContent.includes('[INTRO]')) {
                  const introText = textContent.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                  return (
                    <p className="text-2xl leading-relaxed font-medium text-gray-700 dark:text-gray-300 mb-8 border-l-4 border-[#cc3399] pl-6">
                      {introText}
                    </p>
                  );
                }
              }

              return <p className="text-base leading-relaxed mb-4 text-gray-700 dark:text-gray-300">{children}</p>;
            },
            h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8">{children}</h1>,
            h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 mt-6">{children}</h2>,
            h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3 mt-4">{children}</h3>,
            ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300">{children}</ol>,
            li: ({children}) => <li className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{children}</li>,
            strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
            em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
            code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm">{children}</code>,
            blockquote: ({children}) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300">
                {children}
              </blockquote>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ analyses, speakerSegments, transcriptionId, transcription }) => {
  const [activeTab, setActiveTab] = useState<keyof AnalysisResults>('summary');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [transcriptView, setTranscriptView] = useState<'timeline' | 'raw'>('timeline');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('original');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState<AnalysisResults>(analyses);
  const [translationError, setTranslationError] = useState<string | null>(null);

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
      if (response.success && response.data) {
        const translationData = response.data as TranslationData;
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
      default: return MessageSquare;
    }
  };

  const getIconColor = (color: string, isActive: boolean) => {
    if (!isActive) {
      return 'text-gray-500 dark:text-gray-400';
    }

    const colors = {
      'blue': 'text-blue-600 dark:text-blue-500',
      'purple': 'text-purple-600 dark:text-purple-500',
      'green': 'text-green-600 dark:text-green-500',
      'pink': 'text-pink-600 dark:text-pink-500',
      'orange': 'text-orange-600 dark:text-orange-500',
      'teal': 'text-teal-600 dark:text-teal-500',
    };

    return colors[color as keyof typeof colors] || 'text-[#cc3399]';
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap gap-x-6 overflow-x-auto">
          {ANALYSIS_TYPE_INFO.map((info) => {
            const Icon = getIconComponent(info.icon);
            const hasContent = analyses[info.key];

            if (!hasContent) return null;

            const isActive = activeTab === info.key;
            const iconColor = getIconColor(info.color, isActive);

            return (
              <button
                key={info.key}
                onClick={() => setActiveTab(info.key)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap
                  transition-colors duration-200
                  ${isActive
                    ? 'border-[#cc3399] text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
                title={info.description}
              >
                <Icon className={`h-4 w-4 ${iconColor}`} />
                <span>{info.label}</span>
              </button>
            );
          })}
        </nav>
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
          if (!content || activeTab !== info.key) return null;

          return (
            <div key={info.key}>
              {/* Header with Copy Button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{info.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{info.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Language Selector */}
                    {transcriptionId && (
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
                      onClick={() => handleCopy(content, info.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                      title={`Copy ${info.label}`}
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
                  <SummaryWithComments
                    summary={content}
                  />
                ) : info.key === 'actionItems' ? (
                  <ActionItemsTable content={content} />
                ) : (
                  <BlogStyleContent content={content} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};