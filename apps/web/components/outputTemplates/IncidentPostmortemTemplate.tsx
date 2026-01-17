'use client';

import {
  AlertOctagon,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  Lightbulb,
  ListTodo,
} from 'lucide-react';
import type { IncidentPostmortemOutput, IncidentTimelineEntry } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox, StatusBadge } from './shared';

interface IncidentPostmortemTemplateProps {
  data: IncidentPostmortemOutput;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-800',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-300 dark:border-orange-800',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-800',
  },
  low: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
};

function TimelineItem({ entry, index }: { entry: IncidentTimelineEntry; index: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-[#8D6AFA] flex-shrink-0" />
        {index < 999 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono text-sm text-[#8D6AFA]">{entry.timestamp}</span>
          {entry.actor && (
            <span className="text-xs text-gray-500 dark:text-gray-400">({entry.actor})</span>
          )}
        </div>
        <p className="text-gray-700 dark:text-gray-300 mt-1">{entry.event}</p>
      </div>
    </div>
  );
}

export function IncidentPostmortemTemplate({ data }: IncidentPostmortemTemplateProps) {
  const severityStyle = SEVERITY_STYLES[data.severity] || SEVERITY_STYLES.medium;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className={`${severityStyle.bg} ${severityStyle.border} border rounded-xl p-4`}>
        <div className="flex items-start gap-3">
          <AlertOctagon className={`w-6 h-6 ${severityStyle.text} flex-shrink-0 mt-1`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
                {data.title}
              </h2>
              <StatusBadge status={data.severity} variant="priority" />
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {data.date}
              </span>
              {data.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duration: {data.duration}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <InfoBox title="Impact Summary" icon={AlertTriangle} variant="red">
        {data.impactSummary}
      </InfoBox>

      {/* Timeline */}
      {data.timeline && data.timeline.length > 0 && (
        <SectionCard title="Incident Timeline" icon={Clock} iconColor="text-[#8D6AFA]">
          <div className="mt-2">
            {data.timeline.map((entry, idx) => (
              <TimelineItem key={idx} entry={entry} index={idx} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Root Cause */}
      <InfoBox title="Root Cause" icon={Target} variant="amber">
        {data.rootCause}
      </InfoBox>

      {/* Contributing Factors */}
      {data.contributingFactors && data.contributingFactors.length > 0 && (
        <SectionCard title="Contributing Factors" icon={AlertTriangle} iconColor="text-amber-500">
          <BulletList items={data.contributingFactors} bulletColor="bg-amber-500" />
        </SectionCard>
      )}

      {/* What Went Well & What Went Poorly */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.whatWentWell && data.whatWentWell.length > 0 && (
          <SectionCard
            title="What Went Well"
            icon={CheckCircle2}
            iconColor="text-green-500"
            className="bg-green-50/50 dark:bg-green-900/10"
          >
            <BulletList items={data.whatWentWell} bulletColor="bg-green-500" />
          </SectionCard>
        )}
        {data.whatWentPoorly && data.whatWentPoorly.length > 0 && (
          <SectionCard
            title="What Went Poorly"
            icon={XCircle}
            iconColor="text-red-500"
            className="bg-red-50/50 dark:bg-red-900/10"
          >
            <BulletList items={data.whatWentPoorly} bulletColor="bg-red-500" />
          </SectionCard>
        )}
      </div>

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <SectionCard title="Action Items" icon={ListTodo} iconColor="text-[#8D6AFA]">
          <div className="space-y-3">
            {data.actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-gray-700 dark:text-gray-300 break-words">{item.action}</p>
                    <StatusBadge status={item.priority} variant="priority" className="flex-shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {item.owner && <span>Owner: {item.owner}</span>}
                    {item.dueDate && <span>Due: {item.dueDate}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Lessons Learned */}
      {data.lessonsLearned && data.lessonsLearned.length > 0 && (
        <InfoBox title="Lessons Learned" icon={Lightbulb} variant="purple">
          <BulletList items={data.lessonsLearned} bulletColor="bg-[#8D6AFA]" />
        </InfoBox>
      )}
    </div>
  );
}
