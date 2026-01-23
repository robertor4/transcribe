'use client';

import {
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  ListTodo,
  CalendarClock,
} from 'lucide-react';
import type { MeetingMinutesOutput } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, safeString } from './shared';

interface MeetingMinutesTemplateProps {
  data: MeetingMinutesOutput;
}

export function MeetingMinutesTemplate({ data }: MeetingMinutesTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.title}
            </h2>
            <MetadataRow
              items={[
                { label: 'Date', value: data.date, icon: Calendar },
                { label: 'Attendees', value: data.attendees?.length, icon: Users },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Attendees */}
      {data.attendees && data.attendees.length > 0 && (
        <SectionCard title="Attendees" icon={Users} iconColor="text-blue-500">
          <div className="flex flex-wrap gap-2">
            {data.attendees.map((attendee, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
              >
                {safeString(attendee)}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Agenda Items */}
      {data.agendaItems && data.agendaItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-[#8D6AFA]" />
            Agenda & Discussion
          </h3>
          {data.agendaItems.map((item, idx) => (
            <SectionCard key={idx} variant="outlined">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {idx + 1}. {safeString(item.topic)}
              </h4>
              {item.discussion && item.discussion.length > 0 && (
                <div className="mb-3">
                  <BulletList
                    items={item.discussion}
                    bulletColor="bg-gray-400"
                    className="text-gray-600 dark:text-gray-400"
                  />
                </div>
              )}
              {item.decisions && item.decisions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                    Decisions
                  </span>
                  <BulletList
                    items={item.decisions}
                    bulletColor="bg-green-500"
                    className="mt-1"
                  />
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      {/* All Decisions Summary */}
      {data.decisions && data.decisions.length > 0 && (
        <InfoBox title="Key Decisions" icon={CheckCircle2} variant="green">
          <BulletList items={data.decisions} bulletColor="bg-green-500" />
        </InfoBox>
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
                  <p className="text-gray-700 dark:text-gray-300 break-words">{safeString(item.task)}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {item.owner && <span>Owner: {safeString(item.owner)}</span>}
                    {item.deadline && <span>Due: {safeString(item.deadline)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Next Meeting */}
      {data.nextMeeting && (
        <InfoBox title="Next Meeting" icon={CalendarClock} variant="purple">
          {data.nextMeeting}
        </InfoBox>
      )}
    </div>
  );
}
