'use client';

import {
  Calendar,
  User,
  Users,
  Search,
  ArrowRight,
  Paperclip,
} from 'lucide-react';
import type { RecommendationsMemoOutput, Recommendation } from '@transcribe/shared';
import { safeString } from './shared/safeDisplay';

interface RecommendationsMemoTemplateProps {
  data: RecommendationsMemoOutput;
}

const serifFont = { fontFamily: 'var(--font-merriweather), Georgia, serif' };

/**
 * Normalizes any value to an array. Handles AI returning strings, objects,
 * or other non-array types where an array is expected.
 */
function safeArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined) return [];
  // AI returned a single item instead of an array — wrap it
  return [value] as T[];
}

/**
 * Splits a block of text into paragraphs by double-newline.
 * Safely handles non-string values from AI.
 */
function splitParagraphs(value: unknown): string[] {
  const text = safeString(value);
  if (!text) return [];
  const parts = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

function RecommendationCard({ recommendation, index }: { recommendation: Recommendation; index: number }) {
  const recText = safeString(recommendation.recommendation);
  const rationale = safeString(recommendation.rationale);
  const impact = safeString(recommendation.impact);
  const priorityLabel = { high: 'High', medium: 'Medium', low: 'Low' };

  // Combine recommendation + rationale into body text.
  // If the AI put everything in one field, this still renders well.
  const hasRationale = rationale && rationale !== recText;

  return (
    <div className="flex gap-3 py-4">
      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6 flex-shrink-0 pt-1">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{recText}</span>
          {hasRationale && <>{' '}{rationale}</>}
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide align-middle">
            {priorityLabel[recommendation.priority] || 'Medium'}
          </span>
        </p>
        {impact && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
            {impact}
          </p>
        )}
      </div>
    </div>
  );
}

export function RecommendationsMemoTemplate({ data }: RecommendationsMemoTemplateProps) {
  const recommendations = safeArray<Recommendation>(data.recommendations);
  const findings = safeArray(data.findings);
  const nextSteps = safeArray(data.nextSteps);
  const appendix = safeArray(data.appendix);

  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');
  const allGrouped = [...highPriority, ...mediumPriority, ...lowPriority];

  return (
    <article className="max-w-[680px] overflow-x-hidden">
      {/* Title */}
      <h1
        className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug mb-3"
        style={serifFont}
      >
        {data.title}
      </h1>

      {/* Memo metadata */}
      {(data.to || data.from || data.date) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6">
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
      )}

      {/* Editorial rule */}
      <hr className="border-t-2 border-gray-300 dark:border-gray-600 mb-8" />

      {/* Executive Summary — pull-quote style */}
      {safeString(data.executiveSummary) && (
        <div className="border-l-4 border-[#8D6AFA] pl-5 py-2 mb-10 space-y-3">
          {splitParagraphs(data.executiveSummary).map((paragraph, idx) => (
            <p
              key={idx}
              className="text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed italic"
              style={serifFont}
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Background — split into readable paragraphs */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">
          Background
        </h2>
        <div className="space-y-4">
          {splitParagraphs(data.background).map((paragraph, idx) => (
            <p key={idx} className="text-[16px] text-gray-700 dark:text-gray-300 leading-[1.8]">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Key Findings */}
      {findings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Key Findings
          </h2>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            {findings.map((finding, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6 flex-shrink-0 pt-1">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
                  {safeString(finding)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations — clean numbered list, no color coding */}
      {allGrouped.length > 0 && (
        <section className="mb-10">
          <h2
            className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1 pb-3 border-b border-gray-200 dark:border-gray-700"
            style={serifFont}
          >
            Recommendations
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {allGrouped.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5" />
            Next Steps
          </h2>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            {nextSteps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6 flex-shrink-0 pt-1">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
                  {safeString(step)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Appendix */}
      {appendix.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Paperclip className="w-3.5 h-3.5" />
            Appendix
          </h2>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            {appendix.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="mt-2 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                <span className="leading-relaxed">{safeString(item)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
