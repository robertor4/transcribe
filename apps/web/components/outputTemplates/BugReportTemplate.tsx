'use client';

import {
  Bug,
  Calendar,
  User,
  AlertTriangle,
  ListOrdered,
  Check,
  X,
  Monitor,
  Lightbulb,
  Wrench,
  RefreshCw,
  Paperclip,
} from 'lucide-react';
import type { BugReportOutput } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, StatusBadge } from './shared';

interface BugReportTemplateProps {
  data: BugReportOutput;
}

export function BugReportTemplate({ data }: BugReportTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Bug className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.title}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge status={data.severity} variant="priority" />
              <StatusBadge status={data.priority} variant="priority" />
            </div>
            <MetadataRow
              items={[
                { label: 'Reported by', value: data.reportedBy, icon: User },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <InfoBox title="Summary" icon={AlertTriangle} variant="red">
        {data.summary}
      </InfoBox>

      {/* Steps to Reproduce */}
      {data.stepsToReproduce && data.stepsToReproduce.length > 0 && (
        <SectionCard title="Steps to Reproduce" icon={ListOrdered} iconColor="text-blue-500">
          <div className="space-y-2">
            {data.stepsToReproduce.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{idx + 1}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 break-words">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Expected vs Actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          title="Expected Behavior"
          icon={Check}
          iconColor="text-green-500"
          className="bg-green-50/50 dark:bg-green-900/10"
        >
          <p className="text-gray-700 dark:text-gray-300">{data.expectedBehavior}</p>
        </SectionCard>
        <SectionCard
          title="Actual Behavior"
          icon={X}
          iconColor="text-red-500"
          className="bg-red-50/50 dark:bg-red-900/10"
        >
          <p className="text-gray-700 dark:text-gray-300">{data.actualBehavior}</p>
        </SectionCard>
      </div>

      {/* Environment */}
      {data.environment && (
        <SectionCard title="Environment" icon={Monitor} iconColor="text-gray-500">
          <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">{data.environment}</p>
        </SectionCard>
      )}

      {/* Possible Cause */}
      {data.possibleCause && (
        <InfoBox title="Possible Cause" icon={Lightbulb} variant="amber">
          {data.possibleCause}
        </InfoBox>
      )}

      {/* Suggested Fix */}
      {data.suggestedFix && (
        <InfoBox title="Suggested Fix" icon={Wrench} variant="purple">
          {data.suggestedFix}
        </InfoBox>
      )}

      {/* Workaround */}
      {data.workaround && (
        <InfoBox title="Workaround" icon={RefreshCw} variant="cyan">
          {data.workaround}
        </InfoBox>
      )}

      {/* Attachments */}
      {data.attachments && data.attachments.length > 0 && (
        <SectionCard title="Attachments" icon={Paperclip} iconColor="text-gray-500">
          <BulletList items={data.attachments} bulletColor="bg-gray-400" />
        </SectionCard>
      )}
    </div>
  );
}
