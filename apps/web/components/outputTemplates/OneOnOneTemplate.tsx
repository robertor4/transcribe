'use client';

import {
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ListTodo,
} from 'lucide-react';
import type { OneOnOneNotesOutput } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
  safeString,
} from './shared';

interface OneOnOneTemplateProps {
  data: OneOnOneNotesOutput;
}

export function OneOnOneTemplate({ data }: OneOnOneTemplateProps) {
  const hasGivenFeedback = data.feedback?.given && data.feedback.given.length > 0;
  const hasReceivedFeedback = data.feedback?.received && data.feedback.received.length > 0;
  const hasFeedback = hasGivenFeedback || hasReceivedFeedback;

  const metadata = data.date ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {safeString(data.date)}
      </span>
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title="1:1 Meeting Notes" metadata={metadata} />

      {/* Participants */}
      {data.participants && (
        <div className="flex flex-wrap gap-4 mb-10">
          {data.participants.manager && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Manager:</span>
              <span className="text-gray-900 dark:text-gray-100">{safeString(data.participants.manager)}</span>
            </div>
          )}
          {data.participants.report && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Report:</span>
              <span className="text-gray-900 dark:text-gray-100">{safeString(data.participants.report)}</span>
            </div>
          )}
        </div>
      )}

      {/* Topics Discussed */}
      {data.topics && data.topics.length > 0 && (
        <EditorialSection label="Topics Discussed" icon={MessageSquare} borderTop>
          <div className="space-y-6">
            {data.topics.map((topic, idx) => (
              <div key={idx} className={`${idx > 0 ? `pt-6 ${EDITORIAL.sectionBorder}` : ''}`}>
                <EditorialHeading>{safeString(topic.topic)}</EditorialHeading>
                <p className={`${EDITORIAL.body} mt-3`}>{safeString(topic.notes)}</p>
                {topic.followUp && (
                  <div className="mt-4">
                    <span className={EDITORIAL.sectionLabel}>Follow-up</span>
                    <p className={`${EDITORIAL.body} mt-1`}>{safeString(topic.followUp)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Feedback */}
      {hasFeedback && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {hasGivenFeedback && (
            <EditorialSection label="Feedback Given" icon={TrendingUp}>
              <BulletList
                items={data.feedback!.given!}
                bulletColor="bg-green-500"
                variant="chevron"
                boldBeforeColon
                className={EDITORIAL.listItem}
              />
            </EditorialSection>
          )}
          {hasReceivedFeedback && (
            <EditorialSection label="Feedback Received" icon={TrendingDown}>
              <BulletList
                items={data.feedback!.received!}
                bulletColor="bg-blue-500"
                variant="chevron"
                boldBeforeColon
                className={EDITORIAL.listItem}
              />
            </EditorialSection>
          )}
        </div>
      )}

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <EditorialSection label="Action Items" icon={ListTodo} borderTop>
          <EditorialNumberedList
            items={data.actionItems.map((item) => ({
              primary: (
                <>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{safeString(item.task)}</span>
                </>
              ),
              secondary: [
                item.owner ? `Owner: ${safeString(item.owner)}` : null,
                item.deadline ? `Due: ${safeString(item.deadline)}` : null,
              ].filter(Boolean).join(' · ') || undefined,
            }))}
          />
        </EditorialSection>
      )}

      {/* Next Meeting */}
      {data.nextMeeting && (
        <EditorialPullQuote cite="Next 1:1" color="#8D6AFA">
          <p>{safeString(data.nextMeeting)}</p>
        </EditorialPullQuote>
      )}
    </EditorialArticle>
  );
}
