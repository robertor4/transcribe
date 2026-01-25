'use client';

import {
  Compass,
  Calendar,
  User,
  Users,
  Hash,
  Target,
  Lightbulb,
  CheckCircle2,
  ListTodo,
  ArrowRight,
} from 'lucide-react';
import type { CoachingNotesOutput, CoachingInsight } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox } from './shared';

interface CoachingNotesTemplateProps {
  data: CoachingNotesOutput;
}

function InsightCard({ insight }: { insight: CoachingInsight }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{insight.topic}</h4>
      <p className="text-gray-600 dark:text-gray-400">{insight.insight}</p>
      {insight.actionItem && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-[#14D0DC] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#14D0DC]">{insight.actionItem}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function CoachingNotesTemplate({ data }: CoachingNotesTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Compass className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Coaching Session Notes
            </h2>
            <MetadataRow
              items={[
                { label: 'Client', value: data.client, icon: User },
                { label: 'Coach', value: data.coach, icon: Users },
                { label: 'Session', value: data.sessionNumber ? `#${data.sessionNumber}` : undefined, icon: Hash },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Session Focus */}
      <InfoBox title="Session Focus" icon={Target} variant="purple">
        {data.focus}
      </InfoBox>

      {/* Progress on Previous Actions */}
      {data.progressOnPreviousActions && data.progressOnPreviousActions.length > 0 && (
        <SectionCard
          title="Progress on Previous Actions"
          icon={CheckCircle2}
          iconColor="text-green-500"
          className="bg-green-50/50 dark:bg-green-900/10"
        >
          <BulletList items={data.progressOnPreviousActions} bulletColor="bg-green-500" />
        </SectionCard>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Key Insights
          </h3>
          {data.insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      )}

      {/* New Action Items */}
      {data.newActionItems && data.newActionItems.length > 0 && (
        <SectionCard title="Action Items" icon={ListTodo} iconColor="text-[#8D6AFA]">
          <div className="space-y-2">
            {data.newActionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#8D6AFA]">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 dark:text-gray-300 break-words">{item.action}</p>
                  {item.dueDate && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Due: {item.dueDate}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Next Session Focus */}
      {data.nextSessionFocus && (
        <InfoBox title="Next Session Focus" icon={ArrowRight} variant="cyan">
          {data.nextSessionFocus}
        </InfoBox>
      )}
    </div>
  );
}
