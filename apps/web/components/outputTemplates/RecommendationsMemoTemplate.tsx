'use client';

import {
  Calendar,
  User,
  Users,
  Search,
  Paperclip,
} from 'lucide-react';
import type { RecommendationsMemoOutput, Recommendation } from '@transcribe/shared';
import { safeString } from './shared/safeDisplay';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EditorialParagraphs,
  EditorialCollapsible,
} from './shared';

interface RecommendationsMemoTemplateProps {
  data: RecommendationsMemoOutput;
}

/**
 * Normalizes any value to an array. Handles AI returning strings, objects,
 * or other non-array types where an array is expected.
 */
function safeArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined) return [];
  return [value] as T[];
}

/**
 * Filters out JSON blobs from appendix items.
 * AI sometimes dumps raw JSON instead of plain-text summaries.
 */
function filterAppendixItems(items: unknown[]): string[] {
  return items
    .map(item => safeString(item))
    .filter(text => text && !text.trimStart().startsWith('{') && !text.trimStart().startsWith('['));
}

export function RecommendationsMemoTemplate({ data }: RecommendationsMemoTemplateProps) {
  const recommendations = safeArray<Recommendation>(data.recommendations);
  const findings = safeArray(data.findings);
  const appendix = filterAppendixItems(safeArray(data.appendix));

  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');
  const allGrouped = [...highPriority, ...mediumPriority, ...lowPriority];

  const priorityLabel: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };

  const metadata = (data.to || data.from || data.date) ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.to && (
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span className="text-gray-400">To:</span> {data.to}
        </span>
      )}
      {data.from && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span className="text-gray-400">From:</span> {data.from}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Top Line — single-sentence verdict before everything */}
      {safeString(data.topLine) && (
        <EditorialPullQuote color="#8D6AFA">
          <p>{data.topLine}</p>
        </EditorialPullQuote>
      )}

      {/* Executive Summary — pull-quote style */}
      {safeString(data.executiveSummary) && (
        <EditorialPullQuote>
          <EditorialParagraphs text={data.executiveSummary} />
        </EditorialPullQuote>
      )}

      {/* Background */}
      <EditorialSection label="Background">
        <EditorialParagraphs text={data.background} />
      </EditorialSection>

      {/* Key Findings */}
      {findings.length > 0 && (
        <EditorialSection label="Key Findings" icon={Search} borderTop>
          <EditorialNumberedList
            items={findings.map(finding => ({
              primary: safeString(finding),
            }))}
          />
        </EditorialSection>
      )}

      {/* Key Recommendations */}
      {allGrouped.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Key Recommendations</EditorialHeading>
          <div className="space-y-3">
            {allGrouped.map((rec, idx) => {
              const recText = safeString(rec.recommendation);
              const rationale = safeString(rec.rationale);
              const impact = safeString(rec.impact);
              const hasRationale = rationale && rationale !== recText;
              const borderColors: Record<string, string> = {
                high: 'border-l-4 border-red-500',
                medium: 'border-l-4 border-amber-400',
                low: 'border-l-4 border-gray-300 dark:border-gray-600',
              };
              const priorityBadge: Record<string, string> = {
                high: 'text-red-600 dark:text-red-400',
                medium: 'text-amber-600 dark:text-amber-400',
                low: 'text-gray-400 dark:text-gray-500',
              };
              return (
                <div key={idx} className={`pl-4 py-3 ${borderColors[rec.priority] || borderColors.medium}`}>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-[3px]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-gray-900 dark:text-gray-100 font-semibold leading-[1.65]">
                        {recText}
                        <span className={`ml-2 text-[10px] font-bold uppercase tracking-wide align-middle ${priorityBadge[rec.priority] || priorityBadge.medium}`}>
                          {priorityLabel[rec.priority] || 'Medium'}
                        </span>
                      </p>
                      {hasRationale && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rationale}</p>
                      )}
                      {impact && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">{impact}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Appendix — collapsible */}
      {appendix.length > 0 && (
        <EditorialCollapsible label="Appendix" icon={Paperclip} count={appendix.length}>
          <div className="space-y-2">
            {appendix.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="mt-2 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                <span className="leading-relaxed">{safeString(item)}</span>
              </div>
            ))}
          </div>
        </EditorialCollapsible>
      )}
    </EditorialArticle>
  );
}
