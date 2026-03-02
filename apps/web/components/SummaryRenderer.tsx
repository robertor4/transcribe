'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { SummaryV2 } from '@transcribe/shared';
import { SummaryV1Renderer } from './SummaryV1Renderer';
import { TextHighlighter, type HighlightOptions } from './TextHighlighter';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

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
  /** Highlight options for Find & Replace feature */
  highlightOptions?: HighlightOptions;
}

export const SummaryRenderer: React.FC<SummaryRendererProps> = ({ content, summaryV2, highlightOptions }) => {
  // If V2 structured data is available, render it directly
  if (summaryV2) {
    return <SummaryV2Renderer summary={summaryV2} highlightOptions={highlightOptions} />;
  }

  // LEGACY V1: Fall back to parsing markdown content (no highlighting support)
  return <SummaryV1Renderer content={content} />;
};

/**
 * SummaryV2Renderer - Renders structured V2 summary data
 *
 * Drop-cap intro, compact key points strip, collapsible "Deep Dives"
 * sections, and styled decision/next-step boxes.
 */
interface SummaryV2RendererProps {
  summary: SummaryV2;
  highlightOptions?: HighlightOptions;
}

const SummaryV2Renderer: React.FC<SummaryV2RendererProps> = ({ summary, highlightOptions }) => {
  // All deep dives collapsed by default
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set());

  const toggleSection = (idx: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="max-w-[680px] space-y-10">
      {/* Intro paragraph with drop cap */}
      {summary.intro && (
        <p
          className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-[1] first-letter:text-gray-900 dark:first-letter:text-gray-100"
          style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
        >
          <TextHighlighter text={summary.intro} highlight={highlightOptions} />
        </p>
      )}

      {/* Key Points — shown inline on mobile, hidden on desktop (sidebar takes over) */}
      {summary.keyPoints.length > 0 && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-widest">
            Key Points
          </h3>
          <ol className="space-y-4">
            {summary.keyPoints.map((point, idx) => (
              <li key={idx} className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  <TextHighlighter text={point.topic} highlight={highlightOptions} />
                </span>
                <span className="ml-1.5 text-[15px]">
                  <TextHighlighter text={point.description} highlight={highlightOptions} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Collapsible Deep Dives */}
      {summary.detailedSections.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-widest">
            Deep Dives
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700">
            {summary.detailedSections.map((section, idx) => (
              <Collapsible
                key={idx}
                open={openSections.has(idx)}
                onOpenChange={() => toggleSection(idx)}
              >
                <CollapsibleTrigger className="flex items-center gap-3 w-full py-4 text-left group cursor-pointer">
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6 flex-shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    <TextHighlighter text={section.topic} highlight={highlightOptions} />
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                      openSections.has(idx) ? 'rotate-90' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pb-5 pl-9">
                    <p className="text-[16px] text-gray-700 dark:text-gray-300 leading-[1.8]">
                      <TextHighlighter text={section.content} highlight={highlightOptions} />
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {summary.decisions && summary.decisions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-widest">
            Decisions Made
          </h3>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-4">
            {summary.decisions.map((decision, idx) => (
              <p key={idx} className="text-[16px] text-gray-700 dark:text-gray-300 leading-[1.8]">
                <TextHighlighter text={decision} highlight={highlightOptions} />
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {summary.nextSteps && summary.nextSteps.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-widest">
            Next Steps
          </h3>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-4">
            {summary.nextSteps.map((step, idx) => (
              <p key={idx} className="text-[16px] text-gray-700 dark:text-gray-300 leading-[1.8]">
                <TextHighlighter text={step} highlight={highlightOptions} />
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { SummaryV2Renderer };
