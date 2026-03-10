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
          <EditorialNumberedList
            items={allGrouped.map(rec => {
              const recText = safeString(rec.recommendation);
              const rationale = safeString(rec.rationale);
              const impact = safeString(rec.impact);
              const hasRationale = rationale && rationale !== recText;

              return {
                primary: (
                  <>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{recText}</span>
                    {hasRationale && <>{' '}{rationale}</>}
                    <span className={`ml-2 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide align-middle`}>
                      {priorityLabel[rec.priority] || 'Medium'}
                    </span>
                  </>
                ),
                secondary: impact || undefined,
              };
            })}
          />
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
