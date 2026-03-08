'use client';

import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Users,
  DollarSign,
  Clock,
  HelpCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';
import type { InvestorUpdateOutput, BoardMetric } from '@transcribe/shared';
import {
  BulletList,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  EDITORIAL,
} from './shared';

interface InvestorUpdateTemplateProps {
  data: InvestorUpdateOutput;
}

function MetricCard({ metric }: { metric: BoardMetric }) {
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    down: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    flat: { icon: Minus, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  };

  const config = trendConfig[metric.trend] || trendConfig.flat;
  const TrendIcon = config.icon;

  return (
    <div className={`${config.bg} rounded-lg p-4 border border-gray-200 dark:border-gray-700/50`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {metric.metric}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{metric.value}</p>
          {metric.context && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{metric.context}</p>
          )}
        </div>
        <TrendIcon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
      </div>
    </div>
  );
}

export function InvestorUpdateTemplate({ data }: InvestorUpdateTemplateProps) {
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
      <EditorialTitle title="Investor Update" metadata={metadata} />

      {/* Headline */}
      {data.headline && (
        <EditorialPullQuote>
          <p>{data.headline}</p>
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

      {/* Product Updates */}
      {data.productUpdates && data.productUpdates.length > 0 && (
        <EditorialSection label="Product Updates" icon={Package} borderTop>
          <BulletList items={data.productUpdates} bulletColor="bg-[#8D6AFA]" />
        </EditorialSection>
      )}

      {/* Team Updates */}
      {data.teamUpdates && data.teamUpdates.length > 0 && (
        <EditorialSection label="Team Updates" icon={Users} borderTop>
          <BulletList items={data.teamUpdates} bulletColor="bg-blue-500" />
        </EditorialSection>
      )}

      {/* Financial Highlights */}
      {data.financials && data.financials.length > 0 && (
        <EditorialSection label="Financial Highlights" icon={DollarSign} borderTop>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.financials.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-3"
              >
                <span className={EDITORIAL.listItem}>{item.metric}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">{item.value}</span>
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Runway */}
      {data.runway && (
        <EditorialSection label="Runway" icon={Clock} borderTop>
          <p className={EDITORIAL.body}>{data.runway}</p>
        </EditorialSection>
      )}

      {/* Asks */}
      {data.asks && data.asks.length > 0 && (
        <EditorialSection label="Asks" icon={HelpCircle} borderTop>
          <BulletList items={data.asks} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* Upcoming Milestones */}
      {data.nextMilestones && data.nextMilestones.length > 0 && (
        <EditorialSection label="Coming Up" icon={ArrowRight} borderTop>
          <BulletList items={data.nextMilestones} bulletColor="bg-[#14D0DC]" />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
