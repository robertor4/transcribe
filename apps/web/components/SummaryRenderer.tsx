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
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
          {summary.intro}
        </p>
      )}

      {/* Key Points Box */}
      {summary.keyPoints.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#cc3399] rounded-r-lg">
          <h3 className="text-lg font-bold text-[#cc3399] mb-5">
            Key Points
          </h3>
          <ul className="space-y-4 pl-4 list-outside" style={{ listStyleType: 'square' }}>
            {summary.keyPoints.map((point, idx) => (
              <li key={idx} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {point.topic}:
                </span>{' '}
                {point.description}
              </li>
            ))}
          </ul>
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
        <div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            Decisions Made
          </h3>
          <ul className="space-y-2 list-disc list-inside">
            {summary.decisions.map((decision, idx) => (
              <li key={idx} className="text-gray-700 dark:text-gray-300">
                {decision}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps (only shown if present) */}
      {summary.nextSteps && summary.nextSteps.length > 0 && (
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            Next Steps
          </h3>
          <ul className="space-y-2 list-disc list-inside">
            {summary.nextSteps.map((step, idx) => (
              <li key={idx} className="text-gray-700 dark:text-gray-300">
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { SummaryV2Renderer };
