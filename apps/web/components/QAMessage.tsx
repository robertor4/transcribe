'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AskResponse, Citation } from '@transcribe/shared';
import { CitationCard } from './CitationCard';
import { GeneratingLoader } from './GeneratingLoader';
import { InlineCitation } from './InlineCitation';

interface QAMessageProps {
  question: string;
  answer?: AskResponse;
  isLoading?: boolean;
  showConversationTitle?: boolean;
}

// Parse answer text and replace citation patterns like [12:34, Speaker A] with styled components
function parseAnswerWithCitations(
  answerText: string,
  citations: Citation[]
): React.ReactNode[] {
  // Match patterns like [12:34, Speaker A] or [1:23:45, Speaker B]
  const citationRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?),\s*([^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(answerText)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(answerText.slice(lastIndex, match.index));
    }

    const timestamp = match[1];
    const speaker = match[2].trim();

    // Find matching citation in citations array
    const matchingCitation = citations.find((c) => {
      // Match by timestamp (exact or close) and speaker (fuzzy match)
      const speakerMatch =
        c.speaker.toLowerCase().includes(speaker.toLowerCase()) ||
        speaker.toLowerCase().includes(c.speaker.toLowerCase());
      const timestampMatch = c.timestamp === timestamp;
      return speakerMatch && timestampMatch;
    });

    if (matchingCitation) {
      // Render as styled citation with popover
      parts.push(
        <InlineCitation
          key={`citation-${match.index}`}
          citation={matchingCitation}
        />
      );
    } else {
      // No matching citation found, render as styled but non-interactive
      parts.push(
        <span
          key={`citation-${match.index}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-medium
            bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
        >
          {match[0]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < answerText.length) {
    parts.push(answerText.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [answerText];
}

const MAX_VISIBLE_SOURCES = 3;

export function QAMessage({
  question,
  answer,
  isLoading = false,
  showConversationTitle = false,
}: QAMessageProps) {
  const t = useTranslations('qa');
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Parse answer text with inline citations
  const parsedAnswer = useMemo(() => {
    if (!answer?.answer || !answer?.citations) return null;
    return parseAnswerWithCitations(answer.answer, answer.citations);
  }, [answer]);

  // Determine which citations to show
  const visibleCitations = useMemo(() => {
    if (!answer?.citations) return [];
    if (showAllSources) return answer.citations;
    return answer.citations.slice(0, MAX_VISIBLE_SOURCES);
  }, [answer?.citations, showAllSources]);

  const hasMoreSources = (answer?.citations?.length ?? 0) > MAX_VISIBLE_SOURCES;
  const hasSources = (answer?.citations?.length ?? 0) > 0;

  // Copy answer text to clipboard
  const handleCopy = useCallback(async () => {
    if (!answer?.answer) return;
    try {
      await navigator.clipboard.writeText(answer.answer);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [answer?.answer]);

  return (
    <div className="space-y-3">
      {/* User Question - right aligned */}
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20">
          <p className="text-sm text-gray-900 dark:text-gray-100">{question}</p>
        </div>
      </div>

      {/* AI Answer - left aligned */}
      <div className="flex justify-start">
        <div className="max-w-[90%]">
          {isLoading ? (
            <div className="px-4 py-4 rounded-2xl rounded-bl-md bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <GeneratingLoader size="sm" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('loading')}
                </span>
              </div>
            </div>
          ) : answer ? (
            <div className="space-y-2">
              {/* Answer bubble with action icons */}
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-50 dark:bg-gray-800">
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {parsedAnswer}
                </div>

                {/* Bottom row: processing time + action icons */}
                <div className="mt-2 flex items-center justify-between">
                  {answer.processingTimeMs ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {t('answeredIn', { time: `${(answer.processingTimeMs / 1000).toFixed(1)}s` })}
                    </span>
                  ) : (
                    <span />
                  )}

                  {/* Action icons */}
                  <div className="flex items-center gap-1">
                    {/* Sources toggle */}
                    {hasSources && (
                      <button
                        type="button"
                        onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isSourcesExpanded
                            ? 'text-[#8D6AFA] bg-[#8D6AFA]/10'
                            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={`${t('sources')} (${answer.citations?.length})`}
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`p-1.5 rounded-md transition-colors ${
                        isCopied
                          ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={isCopied ? t('copied') : t('copy')}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable sources panel */}
              {isSourcesExpanded && hasSources && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-2 space-y-2">
                    {visibleCitations.map((citation, index) => (
                      <CitationCard
                        key={`${citation.transcriptionId}-${citation.timestampSeconds}-${index}`}
                        citation={citation}
                        showConversationTitle={showConversationTitle}
                      />
                    ))}

                    {/* Show more/less button */}
                    {hasMoreSources && (
                      <button
                        type="button"
                        onClick={() => setShowAllSources(!showAllSources)}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-[#8D6AFA] hover:text-[#7A5AE0] transition-colors"
                      >
                        {showAllSources ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            {t('showLess')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            {t('showMore', { count: answer.citations!.length - MAX_VISIBLE_SOURCES })}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
