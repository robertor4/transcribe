'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  ChevronDown,
  FileText,
  BarChart3,
  Mail,
  CheckSquare,
  Edit3,
  Share2,
  MessageSquareQuote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SummaryRenderer } from '@/components/SummaryRenderer';
import TranscriptTimeline from '@/components/TranscriptTimeline';
import { AnalysisContentRenderer } from '@/components/AnalysisContentRenderer';
import { Button } from '@/components/Button';
import { AiIcon } from '@/components/icons/AiIcon';
import type { SharedTranscriptionView, SummaryV2 } from '@transcribe/shared';
import type { StructuredOutput } from '@transcribe/shared';
import { getStructuredOutputPreview } from '@/components/outputTemplates';
import { formatRelativeTime } from '@/lib/formatters';

// Icon mapping for output types
function getOutputIcon(type: string): LucideIcon | null {
  switch (type) {
    case 'email':
    case 'followUpEmail':
    case 'salesEmail':
    case 'internalUpdate':
    case 'clientProposal':
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
      return null;
  }
}

// Get content preview from asset
function getContentPreview(content: unknown, contentType: string): string {
  if (contentType === 'structured' && typeof content === 'object') {
    return getStructuredOutputPreview(content as StructuredOutput);
  }

  const contentStr = typeof content === 'string'
    ? content
    : JSON.stringify(content);

  return contentStr
    .replace(/^#+ /gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .slice(0, 100)
    .trim() + (contentStr.length > 100 ? '...' : '');
}

interface TranslationContent {
  type: 'summaryV1' | 'summaryV2';
  text?: string;
  title?: string;
  intro?: string;
  keyPoints?: SummaryV2['keyPoints'];
  detailedSections?: SummaryV2['detailedSections'];
  decisions?: SummaryV2['decisions'];
  nextSteps?: SummaryV2['nextSteps'];
}

interface Translation {
  content: TranslationContent;
  translatedAt: string;
}

interface SharedContentViewProps {
  /** The shared transcription data */
  transcription: SharedTranscriptionView;
  /** Labels for UI text */
  labels: {
    summary: string;
    transcript: string;
    aiAssets: string;
    copy: string;
    copied: string;
    noContent: string;
  };
  /** Current translation locale ('original' or locale code) */
  currentLocale?: string;
  /** Function to get translated content */
  getTranslatedContent?: (type: string, id: string) => Translation | null;
  /** Optional action buttons to render in the tab bar */
  actionButtons?: React.ReactNode;
}

/**
 * Shared content view component used by both /shared and /imported pages.
 * Renders tabs (Summary, Transcript, AI Assets) with consistent styling.
 */
export function SharedContentView({
  transcription,
  labels,
  currentLocale = 'original',
  getTranslatedContent,
  actionButtons,
}: SharedContentViewProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'ai-assets'>('summary');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Determine which tabs are available
  const hasSummary = !!(transcription.summaryV2 || transcription.analyses?.summary);
  const hasTranscript = !!(transcription.transcriptText || (transcription.speakerSegments && transcription.speakerSegments.length > 0));
  const hasAIAssets = !!(transcription.generatedAnalyses && transcription.generatedAnalyses.length > 0);

  // Copy summary to clipboard
  const handleCopySummary = async () => {
    if (!transcription.summaryV2 && !transcription.analyses?.summary) return;

    try {
      // Create rich HTML content for V2 summaries
      if (transcription.summaryV2) {
        const summary = transcription.summaryV2;
        let htmlContent = '';
        let plainContent = '';

        if (summary.title) {
          htmlContent += `<h1>${summary.title}</h1>`;
          plainContent += `${summary.title}\n\n`;
        }
        if (summary.intro) {
          htmlContent += `<p>${summary.intro}</p>`;
          plainContent += `${summary.intro}\n\n`;
        }
        if (summary.keyPoints && summary.keyPoints.length > 0) {
          htmlContent += '<h2>Key Points</h2><ul>';
          plainContent += 'KEY POINTS\n';
          summary.keyPoints.forEach((point) => {
            htmlContent += `<li><strong>${point.topic}:</strong> ${point.description}</li>`;
            plainContent += `• ${point.topic}: ${point.description}\n`;
          });
          htmlContent += '</ul>';
          plainContent += '\n';
        }
        if (summary.detailedSections && summary.detailedSections.length > 0) {
          summary.detailedSections.forEach((section) => {
            htmlContent += `<h2>${section.topic}</h2><p>${section.content}</p>`;
            plainContent += `${section.topic.toUpperCase()}\n${section.content}\n\n`;
          });
        }
        if (summary.decisions && summary.decisions.length > 0) {
          htmlContent += '<h2>Decisions</h2><ul>';
          plainContent += 'DECISIONS\n';
          summary.decisions.forEach((decision) => {
            htmlContent += `<li>${decision}</li>`;
            plainContent += `• ${decision}\n`;
          });
          htmlContent += '</ul>';
          plainContent += '\n';
        }
        if (summary.nextSteps && summary.nextSteps.length > 0) {
          htmlContent += '<h2>Next Steps</h2><ul>';
          plainContent += 'NEXT STEPS\n';
          summary.nextSteps.forEach((step) => {
            htmlContent += `<li>${step}</li>`;
            plainContent += `• ${step}\n`;
          });
          htmlContent += '</ul>';
        }

        // Try to copy as rich text with HTML
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const textBlob = new Blob([plainContent], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': blob,
              'text/plain': textBlob,
            }),
          ]);
        } else {
          await navigator.clipboard.writeText(plainContent);
        }
      } else if (transcription.analyses?.summary) {
        await navigator.clipboard.writeText(transcription.analyses.summary);
      }

      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <nav className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between py-1 gap-2">
          {/* Tabs - scrollable on mobile */}
          <div
            className="flex items-center gap-1 overflow-x-auto min-w-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {hasSummary && (
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                  activeTab === 'summary'
                    ? 'text-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <BarChart3 className="w-4 h-4" />
                  {labels.summary}
                </span>
              </button>
            )}
            {hasTranscript && (
              <button
                onClick={() => setActiveTab('transcript')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                  activeTab === 'transcript'
                    ? 'text-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <FileText className="w-4 h-4" />
                  {labels.transcript}
                </span>
              </button>
            )}
            {hasAIAssets && (
              <button
                onClick={() => setActiveTab('ai-assets')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                  activeTab === 'ai-assets'
                    ? 'text-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:text-[#8D6AFA] hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <AiIcon size={16} />
                  {labels.aiAssets}
                </span>
              </button>
            )}
          </div>

          {/* Action Buttons - icon-only on mobile */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Copy button */}
            <Button
              variant="ghost"
              size="sm"
              icon={copiedSummary ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopySummary}
              disabled={!hasSummary}
            >
              <span className="hidden sm:inline">{copiedSummary ? labels.copied : labels.copy}</span>
            </Button>
            {/* Additional action buttons passed from parent */}
            {actionButtons}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <div>
        {/* Summary Tab Content */}
        {hasSummary && (
          <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
            {(() => {
              // Check if viewing a translation
              const summaryTranslation = currentLocale !== 'original' && getTranslatedContent
                ? getTranslatedContent('summary', transcription.id)
                : null;

              if (summaryTranslation && summaryTranslation.content.type === 'summaryV2') {
                const translated = summaryTranslation.content;
                return (
                  <SummaryRenderer
                    content=""
                    summaryV2={{
                      version: 2,
                      title: translated.title || '',
                      intro: translated.intro || '',
                      keyPoints: translated.keyPoints || [],
                      detailedSections: translated.detailedSections || [],
                      decisions: translated.decisions,
                      nextSteps: translated.nextSteps,
                      generatedAt: new Date(summaryTranslation.translatedAt),
                    }}
                  />
                );
              } else if (summaryTranslation && summaryTranslation.content.type === 'summaryV1') {
                return (
                  <SummaryRenderer
                    content={summaryTranslation.content.text || ''}
                  />
                );
              }

              // Display original summary
              return (
                <SummaryRenderer
                  content={transcription.analyses?.summary || ''}
                  summaryV2={transcription.summaryV2}
                />
              );
            })()}
          </div>
        )}

        {/* Transcript Tab Content */}
        {hasTranscript && (
          <div className={activeTab === 'transcript' ? 'block' : 'hidden'}>
            {transcription.speakerSegments && transcription.speakerSegments.length > 0 ? (
              <TranscriptTimeline
                segments={transcription.speakerSegments}
                className="!bg-transparent"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                {transcription.transcriptText}
              </p>
            )}
          </div>
        )}

        {/* AI Assets Tab Content */}
        {hasAIAssets && (
          <div className={activeTab === 'ai-assets' ? 'block' : 'hidden'}>
            <div className="flex flex-col gap-3">
              {transcription.generatedAnalyses?.map((analysis) => {
                const isExpanded = expandedAssetId === analysis.id;
                const OutputIcon = getOutputIcon(analysis.templateId);
                const preview = getContentPreview(analysis.content, analysis.contentType);
                const relativeTime = formatRelativeTime(new Date(analysis.generatedAt));

                return (
                  <div
                    key={analysis.id}
                    className={`rounded-lg overflow-hidden transition-all duration-200 ${
                      isExpanded
                        ? 'bg-white dark:bg-gray-800 border border-[#8D6AFA] shadow-sm'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedAssetId(isExpanded ? null : analysis.id)}
                      className="w-full p-3 text-left transition-colors group"
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`
                          w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
                          ${isExpanded
                            ? 'bg-[#8D6AFA] text-white'
                            : 'bg-purple-50 dark:bg-purple-900/30 group-hover:bg-[#8D6AFA]'
                          }
                        `}>
                          {OutputIcon ? (
                            <OutputIcon className={`
                              w-4 h-4 transition-colors duration-200
                              ${isExpanded
                                ? 'text-white'
                                : 'text-[#8D6AFA] group-hover:text-white'
                              }
                            `} />
                          ) : (
                            <AiIcon size={16} className={`
                              transition-colors duration-200
                              ${isExpanded
                                ? 'text-white'
                                : 'text-[#8D6AFA] group-hover:text-white'
                              }
                            `} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className={`
                              text-sm font-semibold truncate transition-colors duration-200
                              ${isExpanded
                                ? 'text-[#8D6AFA]'
                                : 'text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA]'
                              }
                            `}>
                              {analysis.templateName}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {relativeTime}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {preview}
                          </p>
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="pt-4">
                          <AnalysisContentRenderer
                            content={analysis.content}
                            contentType={analysis.contentType}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show message if no content was shared */}
        {!hasSummary && !hasTranscript && !hasAIAssets && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300">{labels.noContent}</p>
          </div>
        )}
      </div>
    </div>
  );
}
