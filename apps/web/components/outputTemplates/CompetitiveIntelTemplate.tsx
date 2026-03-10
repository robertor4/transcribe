'use client';

import {
  Eye,
  Users,
  ThumbsUp,
  ThumbsDown,
  Shield,
  ArrowRight,
} from 'lucide-react';
import type { CompetitiveIntelOutput, CompetitorInsight } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
} from './shared';

interface CompetitiveIntelTemplateProps {
  data: CompetitiveIntelOutput;
}

function CompetitorCard({ competitor }: { competitor: CompetitorInsight }) {
  return (
    <div className="py-6 first:pt-0 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {competitor.competitor}
        </h4>
      </div>

      {/* Positioning */}
      <p className={`${EDITORIAL.body} mb-4`}>{competitor.positioning}</p>

      {/* Mentions */}
      {competitor.mentions && competitor.mentions.length > 0 && (
        <div className="mb-4">
          <span className={`${EDITORIAL.sectionLabel} text-[10px]`}>
            Key Mentions
          </span>
          <BulletList
            items={competitor.mentions}
            bulletColor="bg-blue-500"
            className="mt-2"
          />
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {competitor.strengths && competitor.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                Their Strengths
              </span>
            </div>
            <BulletList
              items={competitor.strengths}
              bulletColor="bg-green-500"
            />
          </div>
        )}
        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Their Weaknesses
              </span>
            </div>
            <BulletList
              items={competitor.weaknesses}
              bulletColor="bg-red-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CompetitiveIntelTemplate({ data }: CompetitiveIntelTemplateProps) {
  const metadata = data.source ? (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
      <Eye className="w-3.5 h-3.5" />
      <span className="text-gray-400">Source:</span> {data.source}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title="Competitive Intelligence" metadata={metadata} />

      {/* Threat Assessment */}
      {data.threatAssessment && (
        <EditorialPullQuote color="#f59e0b">
          <p>{data.threatAssessment}</p>
        </EditorialPullQuote>
      )}

      {/* Competitors */}
      {data.competitors && data.competitors.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Competitor Analysis</EditorialHeading>
          {data.competitors.map((comp, idx) => (
            <CompetitorCard key={idx} competitor={comp} />
          ))}
        </section>
      )}

      {/* Our Advantages */}
      {data.ourAdvantages && data.ourAdvantages.length > 0 && (
        <EditorialSection label="Our Competitive Advantages" icon={Shield} borderTop>
          <BulletList items={data.ourAdvantages} bulletColor="bg-green-500" />
        </EditorialSection>
      )}

      {/* Recommended Actions */}
      {data.recommendedActions && data.recommendedActions.length > 0 && (
        <EditorialSection label="Recommended Actions" icon={ArrowRight} borderTop>
          <EditorialNumberedList
            items={data.recommendedActions.map(action => ({
              primary: action,
            }))}
          />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
