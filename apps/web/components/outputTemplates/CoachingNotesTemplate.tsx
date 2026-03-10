'use client';

import {
  Calendar,
  User,
  Users,
  Hash,
  CheckCircle2,
  ListTodo,
  ArrowRight,
} from 'lucide-react';
import type { CoachingNotesOutput, CoachingInsight } from '@transcribe/shared';
import {
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  BulletList,
  MetadataRow,
} from './shared';

interface CoachingNotesTemplateProps {
  data: CoachingNotesOutput;
}

function InsightCard({ insight }: { insight: CoachingInsight }) {
  return (
    <div className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{insight.topic}</h4>
      <p className={EDITORIAL.body}>{insight.insight}</p>
      {insight.actionItem && (
        <div className="mt-3 flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-[#14D0DC] flex-shrink-0 mt-1" />
          <p className="text-sm text-[#14D0DC] dark:text-[#14D0DC] leading-relaxed">{insight.actionItem}</p>
        </div>
      )}
    </div>
  );
}

export function CoachingNotesTemplate({ data }: CoachingNotesTemplateProps) {
  const metadata = (data.client || data.coach || data.sessionNumber || data.date) ? (
    <MetadataRow
      items={[
        { label: 'Client', value: data.client, icon: User },
        { label: 'Coach', value: data.coach, icon: Users },
        { label: 'Session', value: data.sessionNumber ? `#${data.sessionNumber}` : undefined, icon: Hash },
        { label: 'Date', value: data.date, icon: Calendar },
      ]}
    />
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title="Coaching Session Notes" metadata={metadata} />

      {/* Session Focus */}
      {data.focus && (
        <EditorialPullQuote cite="Session Focus">
          <p>{data.focus}</p>
        </EditorialPullQuote>
      )}

      {/* Progress on Previous Actions */}
      {data.progressOnPreviousActions && data.progressOnPreviousActions.length > 0 && (
        <EditorialSection label="Progress on Previous Actions" icon={CheckCircle2} borderTop>
          <BulletList items={data.progressOnPreviousActions} bulletColor="bg-green-500" />
        </EditorialSection>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Key Insights</EditorialHeading>
          {data.insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </section>
      )}

      {/* New Action Items */}
      {data.newActionItems && data.newActionItems.length > 0 && (
        <EditorialSection label="Action Items" icon={ListTodo} borderTop>
          <EditorialNumberedList
            items={data.newActionItems.map(item => ({
              primary: (
                <span className="text-gray-700 dark:text-gray-300">{item.action}</span>
              ),
              secondary: item.dueDate ? `Due: ${item.dueDate}` : undefined,
            }))}
          />
        </EditorialSection>
      )}

      {/* Next Session Focus */}
      {data.nextSessionFocus && (
        <EditorialPullQuote color="#14D0DC" cite="Next Session Focus">
          <p>{data.nextSessionFocus}</p>
        </EditorialPullQuote>
      )}
    </EditorialArticle>
  );
}
