'use client';

import React from 'react';
import type { SummaryV2 } from '@transcribe/shared';
import { SummaryV1Renderer } from './SummaryV1Renderer';

/**
 * SummaryRenderer - V2 Design with Version Detection
 *
 * This component renders summaries in the V2 visual design. It supports both:
 * - V2 structured JSON summaries (new, preferred)
 * - V1 markdown summaries (legacy, for backwards compatibility)
 *
 * If summaryV2 is provided, it renders directly from structured data.
 * Otherwise, it delegates to SummaryV1Renderer to parse markdown.
 */

interface SummaryRendererProps {
  /** V1 markdown content (for backwards compatibility) */
  content: string;
  /** V2 structured summary (preferred, if available) */
  summaryV2?: SummaryV2;
}

export const SummaryRenderer: React.FC<SummaryRendererProps> = ({ content, summaryV2 }) => {
  // If V2 structured data is available, render it directly
  if (summaryV2) {
    return <SummaryV2Renderer summary={summaryV2} />;
  }

  // LEGACY V1: Fall back to parsing markdown content
  return <SummaryV1Renderer content={content} />;
};

/**
 * SummaryV2Renderer - Renders structured V2 summary data
 *
 * This component renders directly from the SummaryV2 JSON structure
 * without needing to parse markdown. This is the preferred rendering path.
 */
interface SummaryV2RendererProps {
  summary: SummaryV2;
}

const SummaryV2Renderer: React.FC<SummaryV2RendererProps> = ({ summary }) => {
  return (
    <div className="space-y-8">
      {/* Intro Paragraph */}
      {summary.intro && (
        <p className="text-xl font-light text-gray-700 dark:text-gray-300 leading-relaxed">
          {summary.intro}
        </p>
      )}

      {/* Key Points Box */}
      {summary.keyPoints.length > 0 && (
        <div className="px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#8D6AFA] rounded-r-lg">
          <h3 className="text-lg font-bold text-[#8D6AFA] mb-5 uppercase tracking-wide">
            Key Points
          </h3>
          <ol className="space-y-5 mx-4 list-decimal list-inside">
            {summary.keyPoints.map((point, idx) => (
              <li key={idx} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {point.topic}:
                </span>{' '}
                {point.description}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Detailed Discussion Sections */}
      {summary.detailedSections.length > 0 && (
        <div className="space-y-6 mt-2">
          {summary.detailedSections.map((section, idx) => (
            <div key={idx} className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {section.topic}
              </h4>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-loose">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Decisions (only shown if present) */}
      {summary.decisions && summary.decisions.length > 0 && (
        <div className="px-6 py-6 bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20 border-l-4 border-[#14D0DC] rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 uppercase tracking-wide">
            Decisions Made
          </h3>
          <ol className="space-y-5 mx-4 list-decimal list-inside">
            {summary.decisions.map((decision, idx) => (
              <li key={idx} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {decision}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Next Steps (only shown if present) */}
      {summary.nextSteps && summary.nextSteps.length > 0 && (
        <div className="px-6 py-6 bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20 border-l-4 border-[#3F38A0] rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 uppercase tracking-wide">
            Next Steps
          </h3>
          <ol className="space-y-5 mx-4 list-decimal list-inside">
            {summary.nextSteps.map((step, idx) => (
              <li key={idx} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export { SummaryV2Renderer };
