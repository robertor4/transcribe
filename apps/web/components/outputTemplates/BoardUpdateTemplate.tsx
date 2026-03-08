'use client';

import {
  Building2,
  Calendar,
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
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
} from './shared';

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
  const metadata = (data.company || data.period) ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.company && (
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          {data.company}
        </span>
      )}
      {data.period && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.period}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title="Board Update" metadata={metadata} />

      {/* Executive Summary */}
      {data.executiveSummary && (
        <EditorialPullQuote>
          <p>{data.executiveSummary}</p>
        </EditorialPullQuote>
      )}

      {/* Highlights */}
      {data.highlights && data.highlights.length > 0 && (
        <EditorialSection label="Highlights" icon={TrendingUp}>
          <BulletList items={data.highlights} bulletColor="bg-green-500" />
        </EditorialSection>
      )}

      {/* Key Metrics */}
      {data.metrics && data.metrics.length > 0 && (
        <EditorialSection label="Key Metrics" borderTop>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.metrics.map((metric, idx) => (
              <MetricCard key={idx} metric={metric} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Challenges */}
      {data.challenges && data.challenges.length > 0 && (
        <EditorialSection label="Challenges" icon={AlertTriangle} borderTop>
          <BulletList items={data.challenges} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* Strategic Updates */}
      {data.strategicUpdates && data.strategicUpdates.length > 0 && (
        <EditorialSection label="Strategic Updates" icon={Target} borderTop>
          <BulletList items={data.strategicUpdates} bulletColor="bg-[#8D6AFA]" />
        </EditorialSection>
      )}

      {/* Financial Summary */}
      {data.financialSummary && (
        <EditorialSection label="Financial Summary" icon={DollarSign} borderTop>
          <p className={EDITORIAL.body}>{data.financialSummary}</p>
        </EditorialSection>
      )}

      {/* Board Asks */}
      {data.asks && data.asks.length > 0 && (
        <EditorialSection label="Board Asks" icon={HelpCircle} borderTop>
          <BulletList items={data.asks} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* Upcoming Milestones */}
      {data.upcomingMilestones && data.upcomingMilestones.length > 0 && (
        <EditorialSection label="Upcoming Milestones" icon={Flag} borderTop>
          <BulletList items={data.upcomingMilestones} bulletColor="bg-[#14D0DC]" />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
