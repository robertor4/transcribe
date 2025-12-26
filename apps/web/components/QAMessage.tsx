'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Quote, Bug } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import type { AskResponse, Citation } from '@transcribe/shared';
import { CitationCard } from './CitationCard';
import { GeneratingLoader } from './GeneratingLoader';
import { InlineCitation } from './InlineCitation';
import { useUsage } from '@/contexts/UsageContext';

interface QAMessageProps {
  question: string;
  answer?: AskResponse;
  isLoading?: boolean;
  showConversationTitle?: boolean;
}

// Parse text segment and replace citation patterns like [12:34, Speaker A] with styled components
function parseTextWithCitations(
  text: string,
  citations: Citation[],
  keyPrefix: string
): React.ReactNode[] {
  // Match patterns like [12:34, Speaker A] or [1:23:45, Speaker B]
  const citationRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?),\s*([^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
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
          key={`${keyPrefix}-citation-${match.index}`}
          citation={matchingCitation}
        />
      );
    } else {
      // No matching citation found, render as styled but non-interactive (gray indicates no popover)
      parts.push(
        <span
          key={`${keyPrefix}-citation-${match.index}`}
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
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Process children from ReactMarkdown to inject citation components
function processChildrenWithCitations(
  children: React.ReactNode,
  citations: Citation[],
  keyPrefix: string
): React.ReactNode {
  if (typeof children === 'string') {
    const parts = parseTextWithCitations(children, citations, keyPrefix);
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
  }

  if (Array.isArray(children)) {
    return children.map((child, idx) =>
      processChildrenWithCitations(child, citations, `${keyPrefix}-${idx}`)
    );
  }

  return children;
}

const MAX_VISIBLE_SOURCES = 3;

export function QAMessage({
  question,
  answer,
  isLoading = false,
  showConversationTitle = false,
}: QAMessageProps) {
  const t = useTranslations('qa');
  const { isAdmin } = useUsage();
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

  // Memoize citations for the markdown component
  const citations = answer?.citations ?? [];

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
            <div className="px-3 py-2.5 rounded-2xl rounded-bl-md bg-gray-50 dark:bg-gray-800">
              <GeneratingLoader size="xs" />
            </div>
          ) : answer ? (
            <div className="space-y-2">
              {/* Answer bubble with action icons */}
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-50 dark:bg-gray-800">
                <div className="qa-answer text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">
                          {processChildrenWithCitations(children, citations, 'p')}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-gray-100">
                          {processChildrenWithCitations(children, citations, 'strong')}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">
                          {processChildrenWithCitations(children, citations, 'em')}
                        </em>
                      ),
                      li: ({ children }) => (
                        <li className="ml-4">
                          {processChildrenWithCitations(children, citations, 'li')}
                        </li>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {answer.answer}
                  </ReactMarkdown>
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

                    {/* Debug toggle button - admin only */}
                    {isAdmin && answer.debug && (
                      <button
                        type="button"
                        onClick={() => setIsDebugExpanded(!isDebugExpanded)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isDebugExpanded
                            ? 'text-[#14D0DC] bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20'
                            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title="Debug info (Admin)"
                      >
                        <Bug className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Debug info panel - admin only */}
                {isAdmin && isDebugExpanded && answer.debug && (
                  <div className="mt-2 p-3 rounded-lg bg-[#3F38A0]/5 dark:bg-[#3F38A0]/20 border border-[#3F38A0]/20 dark:border-[#3F38A0]/40 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700 dark:text-gray-300">
                      <div className="font-semibold text-[#3F38A0] dark:text-[#14D0DC] col-span-2 mb-1">
                        Token Usage
                      </div>
                      <div>Summary:</div>
                      <div className="text-right">{answer.debug.summaryTokens.toLocaleString()} tokens</div>
                      <div>Chunks ({answer.debug.chunksCount}):</div>
                      <div className="text-right">{answer.debug.chunksTokens.toLocaleString()} tokens</div>
                      <div>History ({answer.debug.historyCount} Q&As):</div>
                      <div className="text-right">{answer.debug.historyTokens.toLocaleString()} tokens</div>
                      <div>Question:</div>
                      <div className="text-right">{answer.debug.questionTokens.toLocaleString()} tokens</div>
                      <div>System prompt:</div>
                      <div className="text-right">{answer.debug.systemPromptTokens.toLocaleString()} tokens</div>

                      <div className="col-span-2 border-t border-[#3F38A0]/20 dark:border-[#3F38A0]/40 my-1" />

                      <div className="font-semibold">Total input:</div>
                      <div className="text-right font-semibold">{answer.debug.totalInputTokens.toLocaleString()} tokens</div>
                      <div>Output:</div>
                      <div className="text-right">{answer.debug.outputTokens.toLocaleString()} tokens</div>

                      <div className="col-span-2 border-t border-[#3F38A0]/20 dark:border-[#3F38A0]/40 my-1" />

                      <div>Model:</div>
                      <div className="text-right">{answer.debug.model}</div>
                      <div>Est. cost:</div>
                      <div className="text-right text-[#14D0DC] dark:text-[#14D0DC]">
                        ${answer.debug.estimatedCostUsd.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}
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
