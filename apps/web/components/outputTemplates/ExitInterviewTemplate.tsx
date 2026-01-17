'use client';

import {
  DoorOpen,
  Calendar,
  User,
  Building2,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import type { ExitInterviewOutput, ExitTheme } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, StatusBadge } from './shared';

interface ExitInterviewTemplateProps {
  data: ExitInterviewOutput;
}

function ThemeCard({ theme }: { theme: ExitTheme }) {
  const sentimentConfig = {
    positive: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-green-200 dark:border-green-800/30',
    },
    negative: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800/30',
    },
    neutral: {
      icon: MinusCircle,
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-800/50',
      border: 'border-gray-200 dark:border-gray-700/50',
    },
  };

  const config = sentimentConfig[theme.sentiment];
  const Icon = config.icon;

  return (
    <div className={`border rounded-xl p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{theme.theme}</h4>
            <StatusBadge status={theme.sentiment} variant="sentiment" />
          </div>
          {theme.details && theme.details.length > 0 && (
            <ul className="space-y-1">
              {theme.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExitInterviewTemplate({ data }: ExitInterviewTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <DoorOpen className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Exit Interview Analysis
            </h2>
            <MetadataRow
              items={[
                { label: 'Employee', value: data.employee, icon: User },
                { label: 'Department', value: data.department, icon: Building2 },
                { label: 'Tenure', value: data.tenure, icon: Clock },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Reason for Leaving */}
      <InfoBox title="Primary Reason for Leaving" icon={MessageSquare} variant="purple">
        {data.reasonForLeaving}
      </InfoBox>

      {/* Themes */}
      {data.themes && data.themes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#8D6AFA]" />
            Key Themes
          </h3>
          {data.themes.map((theme, idx) => (
            <ThemeCard key={idx} theme={theme} />
          ))}
        </div>
      )}

      {/* What Worked Well vs Could Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.whatWorkedWell && data.whatWorkedWell.length > 0 && (
          <SectionCard
            title="What Worked Well"
            icon={ThumbsUp}
            iconColor="text-green-500"
            className="bg-green-50/50 dark:bg-green-900/10"
          >
            <BulletList items={data.whatWorkedWell} bulletColor="bg-green-500" />
          </SectionCard>
        )}
        {data.whatCouldImprove && data.whatCouldImprove.length > 0 && (
          <SectionCard
            title="Areas for Improvement"
            icon={ThumbsDown}
            iconColor="text-red-500"
            className="bg-red-50/50 dark:bg-red-900/10"
          >
            <BulletList items={data.whatCouldImprove} bulletColor="bg-red-500" />
          </SectionCard>
        )}
      </div>

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <SectionCard
          title="Suggestions"
          icon={Lightbulb}
          iconColor="text-amber-500"
          className="bg-amber-50/50 dark:bg-amber-900/10"
        >
          <BulletList items={data.suggestions} bulletColor="bg-amber-500" />
        </SectionCard>
      )}

      {/* Would Recommend / Would Return */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Would Recommend Company</span>
            {data.wouldRecommend === true && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
            {data.wouldRecommend === false && (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            {data.wouldRecommend === null && (
              <MinusCircle className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Would Return</span>
            {data.wouldReturn === true && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
            {data.wouldReturn === false && (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            {data.wouldReturn === null && (
              <MinusCircle className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
