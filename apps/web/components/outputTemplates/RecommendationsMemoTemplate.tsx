'use client';

import {
  FileText,
  Calendar,
  User,
  Users,
  Lightbulb,
  Search,
  ArrowRight,
  Paperclip,
} from 'lucide-react';
import type { RecommendationsMemoOutput, Recommendation } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, StatusBadge } from './shared';

interface RecommendationsMemoTemplateProps {
  data: RecommendationsMemoOutput;
}

function RecommendationCard({ recommendation, index }: { recommendation: Recommendation; index: number }) {
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-gray-400',
  };

  return (
    <div className={`border-l-4 ${priorityColors[recommendation.priority]} bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-r-xl p-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#8D6AFA]">{index + 1}</span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {recommendation.recommendation}
          </h4>
        </div>
        <StatusBadge status={recommendation.priority} variant="priority" className="flex-shrink-0" />
      </div>
      <div className="ml-9">
        <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.rationale}</p>
        {(recommendation.impact || recommendation.effort) && (
          <div className="flex gap-4 mt-2">
            {recommendation.impact && (
              <span className="text-xs">
                <span className="text-gray-500">Impact:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{recommendation.impact}</span>
              </span>
            )}
            {recommendation.effort && (
              <span className="text-xs">
                <span className="text-gray-500">Effort:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{recommendation.effort}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RecommendationsMemoTemplate({ data }: RecommendationsMemoTemplateProps) {
  // Group recommendations by priority
  const highPriority = data.recommendations?.filter(r => r.priority === 'high') || [];
  const mediumPriority = data.recommendations?.filter(r => r.priority === 'medium') || [];
  const lowPriority = data.recommendations?.filter(r => r.priority === 'low') || [];

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header - Memo Style */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words mb-3">
              {data.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {data.to && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">To:</span>
                  <span className="text-gray-900 dark:text-gray-100">{data.to}</span>
                </div>
              )}
              {data.from && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">From:</span>
                  <span className="text-gray-900 dark:text-gray-100">{data.from}</span>
                </div>
              )}
              {data.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900 dark:text-gray-100">{data.date}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <InfoBox title="Executive Summary" icon={Lightbulb} variant="purple">
        {data.executiveSummary}
      </InfoBox>

      {/* Background */}
      <SectionCard title="Background" icon={FileText} iconColor="text-gray-500">
        <p className="text-gray-700 dark:text-gray-300">{data.background}</p>
      </SectionCard>

      {/* Findings */}
      {data.findings && data.findings.length > 0 && (
        <SectionCard title="Key Findings" icon={Search} iconColor="text-blue-500">
          <BulletList items={data.findings} bulletColor="bg-blue-500" />
        </SectionCard>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Recommendations
          </h3>

          {highPriority.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                High Priority ({highPriority.length})
              </h4>
              {highPriority.map((rec, idx) => (
                <RecommendationCard key={idx} recommendation={rec} index={idx} />
              ))}
            </div>
          )}

          {mediumPriority.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Medium Priority ({mediumPriority.length})
              </h4>
              {mediumPriority.map((rec, idx) => (
                <RecommendationCard key={idx} recommendation={rec} index={highPriority.length + idx} />
              ))}
            </div>
          )}

          {lowPriority.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Low Priority ({lowPriority.length})
              </h4>
              {lowPriority.map((rec, idx) => (
                <RecommendationCard key={idx} recommendation={rec} index={highPriority.length + mediumPriority.length + idx} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <SectionCard title="Next Steps" icon={ArrowRight} iconColor="text-[#14D0DC]">
          <div className="space-y-2">
            {data.nextSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#14D0DC]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#14D0DC]">{idx + 1}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 break-words">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Appendix */}
      {data.appendix && data.appendix.length > 0 && (
        <SectionCard title="Appendix" icon={Paperclip} iconColor="text-gray-500">
          <BulletList items={data.appendix} bulletColor="bg-gray-400" />
        </SectionCard>
      )}
    </div>
  );
}
