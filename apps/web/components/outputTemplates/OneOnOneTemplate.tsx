'use client';

import {
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ListTodo,
  CalendarClock,
} from 'lucide-react';
import type { OneOnOneNotesOutput } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox } from './shared';

interface OneOnOneTemplateProps {
  data: OneOnOneNotesOutput;
}

export function OneOnOneTemplate({ data }: OneOnOneTemplateProps) {
  const hasGivenFeedback = data.feedback?.given && data.feedback.given.length > 0;
  const hasReceivedFeedback = data.feedback?.received && data.feedback.received.length > 0;
  const hasFeedback = hasGivenFeedback || hasReceivedFeedback;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Users className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              1:1 Meeting Notes
            </h2>
            <MetadataRow
              items={[{ label: 'Date', value: data.date, icon: Calendar }]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Participants */}
      {data.participants && (
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Manager:</span>
            <span className="text-gray-900 dark:text-gray-100">{data.participants.manager}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Report:</span>
            <span className="text-gray-900 dark:text-gray-100">{data.participants.report}</span>
          </div>
        </div>
      )}

      {/* Topics Discussed */}
      {data.topics && data.topics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#8D6AFA]" />
            Topics Discussed
          </h3>
          {data.topics.map((topic, idx) => (
            <SectionCard key={idx} variant="outlined">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {topic.topic}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 break-words">{topic.notes}</p>
              {topic.followUp && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Follow-up
                  </span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{topic.followUp}</p>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      {/* Feedback */}
      {hasFeedback && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasGivenFeedback && (
            <SectionCard title="Feedback Given" icon={TrendingUp} iconColor="text-green-500">
              <BulletList
                items={data.feedback!.given!}
                bulletColor="bg-green-500"
                className="text-gray-600 dark:text-gray-400"
              />
            </SectionCard>
          )}
          {hasReceivedFeedback && (
            <SectionCard title="Feedback Received" icon={TrendingDown} iconColor="text-blue-500">
              <BulletList
                items={data.feedback!.received!}
                bulletColor="bg-blue-500"
                className="text-gray-600 dark:text-gray-400"
              />
            </SectionCard>
          )}
        </div>
      )}

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <SectionCard title="Action Items" icon={ListTodo} iconColor="text-amber-500">
          <div className="space-y-3">
            {data.actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 dark:text-gray-300 break-words">{item.task}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {item.owner && <span>Owner: {item.owner}</span>}
                    {item.deadline && <span>Due: {item.deadline}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Next Meeting */}
      {data.nextMeeting && (
        <InfoBox title="Next 1:1" icon={CalendarClock} variant="purple">
          {data.nextMeeting}
        </InfoBox>
      )}
    </div>
  );
}
