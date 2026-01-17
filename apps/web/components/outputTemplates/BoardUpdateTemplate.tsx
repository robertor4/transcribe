'use client';

import {
  Building2,
  Calendar,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  DollarSign,
  HelpCircle,
  Flag,
} from 'lucide-react';
import type { BoardUpdateOutput, BoardMetric } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox } from './shared';

interface BoardUpdateTemplateProps {
  data: BoardUpdateOutput;
}

function MetricCard({ metric }: { metric: BoardMetric }) {
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    down: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    flat: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  };

  const config = trendConfig[metric.trend] || trendConfig.flat;
  const TrendIcon = config.icon;

  return (
    <div className={`${config.bg} rounded-xl p-4 border border-gray-200 dark:border-gray-700/50`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">{metric.metric}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{metric.value}</p>
          {metric.context && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{metric.context}</p>
          )}
        </div>
        <TrendIcon className={`w-6 h-6 ${config.color} flex-shrink-0`} />
      </div>
    </div>
  );
}

export function BoardUpdateTemplate({ data }: BoardUpdateTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Board Update
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {data.company && <span>{data.company}</span>}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {data.period}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <InfoBox title="Executive Summary" icon={Lightbulb} variant="purple">
        {data.executiveSummary}
      </InfoBox>

      {/* Highlights */}
      {data.highlights && data.highlights.length > 0 && (
        <SectionCard
          title="Highlights"
          icon={TrendingUp}
          iconColor="text-green-500"
          className="bg-green-50/50 dark:bg-green-900/10"
        >
          <BulletList items={data.highlights} bulletColor="bg-green-500" />
        </SectionCard>
      )}

      {/* Key Metrics */}
      {data.metrics && data.metrics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Key Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.metrics.map((metric, idx) => (
              <MetricCard key={idx} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* Challenges */}
      {data.challenges && data.challenges.length > 0 && (
        <SectionCard
          title="Challenges"
          icon={AlertTriangle}
          iconColor="text-amber-500"
          className="bg-amber-50/50 dark:bg-amber-900/10"
        >
          <BulletList items={data.challenges} bulletColor="bg-amber-500" />
        </SectionCard>
      )}

      {/* Strategic Updates */}
      {data.strategicUpdates && data.strategicUpdates.length > 0 && (
        <SectionCard title="Strategic Updates" icon={Target} iconColor="text-[#8D6AFA]">
          <BulletList items={data.strategicUpdates} bulletColor="bg-[#8D6AFA]" />
        </SectionCard>
      )}

      {/* Financial Summary */}
      {data.financialSummary && (
        <InfoBox title="Financial Summary" icon={DollarSign} variant="cyan">
          {data.financialSummary}
        </InfoBox>
      )}

      {/* Asks */}
      {data.asks && data.asks.length > 0 && (
        <InfoBox title="Board Asks" icon={HelpCircle} variant="amber">
          <BulletList items={data.asks} bulletColor="bg-amber-500" />
        </InfoBox>
      )}

      {/* Upcoming Milestones */}
      {data.upcomingMilestones && data.upcomingMilestones.length > 0 && (
        <SectionCard title="Upcoming Milestones" icon={Flag} iconColor="text-[#14D0DC]">
          <BulletList items={data.upcomingMilestones} bulletColor="bg-[#14D0DC]" />
        </SectionCard>
      )}
    </div>
  );
}
