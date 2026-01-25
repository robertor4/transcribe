'use client';

import {
  Eye,
  Users,
  ThumbsUp,
  ThumbsDown,
  Target,
  Shield,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import type { CompetitiveIntelOutput, CompetitorInsight } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox } from './shared';

interface CompetitiveIntelTemplateProps {
  data: CompetitiveIntelOutput;
}

function CompetitorCard({ competitor }: { competitor: CompetitorInsight }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-[#8D6AFA]" />
        <h4 className="font-bold text-gray-900 dark:text-gray-100">{competitor.competitor}</h4>
      </div>

      {/* Positioning */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">{competitor.positioning}</p>
      </div>

      {/* Mentions */}
      {competitor.mentions && competitor.mentions.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Key Mentions
          </span>
          <BulletList
            items={competitor.mentions}
            bulletColor="bg-blue-500"
            className="mt-1 text-sm"
          />
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {competitor.strengths && competitor.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 mb-1">
              <ThumbsUp className="w-3 h-3" />
              Their Strengths
            </div>
            <BulletList
              items={competitor.strengths}
              bulletColor="bg-green-500"
              className="text-xs text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 mb-1">
              <ThumbsDown className="w-3 h-3" />
              Their Weaknesses
            </div>
            <BulletList
              items={competitor.weaknesses}
              bulletColor="bg-red-500"
              className="text-xs text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CompetitiveIntelTemplate({ data }: CompetitiveIntelTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Eye className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Competitive Intelligence
            </h2>
            {data.source && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Source: {data.source}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Threat Assessment */}
      {data.threatAssessment && (
        <InfoBox title="Threat Assessment" icon={AlertTriangle} variant="amber">
          {data.threatAssessment}
        </InfoBox>
      )}

      {/* Competitors */}
      {data.competitors && data.competitors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Competitor Analysis
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {data.competitors.map((comp, idx) => (
              <CompetitorCard key={idx} competitor={comp} />
            ))}
          </div>
        </div>
      )}

      {/* Our Advantages */}
      {data.ourAdvantages && data.ourAdvantages.length > 0 && (
        <SectionCard
          title="Our Competitive Advantages"
          icon={Shield}
          iconColor="text-green-500"
          className="bg-green-50/50 dark:bg-green-900/10"
        >
          <BulletList items={data.ourAdvantages} bulletColor="bg-green-500" />
        </SectionCard>
      )}

      {/* Recommended Actions */}
      {data.recommendedActions && data.recommendedActions.length > 0 && (
        <SectionCard title="Recommended Actions" icon={ArrowRight} iconColor="text-[#14D0DC]">
          <div className="space-y-2">
            {data.recommendedActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#14D0DC]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#14D0DC]">{idx + 1}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 break-words">{action}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
