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
import { MetadataRow, safeString } from './shared';

interface MeetingMinutesTemplateProps {
  data: MeetingMinutesOutput;
}

export function MeetingMinutesTemplate({ data }: MeetingMinutesTemplateProps) {
  return (
    <div className="space-y-10 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {safeString(data.title)}
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

      {/* Attendees - No box, just badges */}
      {data.attendees && data.attendees.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4" />
            Attendees
          </h3>
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
        </div>
      )}

      {/* Agenda Items - Clean paragraph style */}
      {data.agendaItems && data.agendaItems.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-[#8D6AFA]" />
            Agenda & Discussion
          </h3>
          <div className="space-y-8">
            {data.agendaItems.map((item, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {idx + 1}. {safeString(item.topic)}
                </h4>
                {item.discussion && item.discussion.length > 0 && (
                  <div className="text-gray-600 dark:text-gray-400 space-y-2">
                    {item.discussion.map((point, pointIdx) => (
                      <p key={pointIdx} className="break-words">
                        {safeString(point)}
                      </p>
                    ))}
                  </div>
                )}
                {item.decisions && item.decisions.length > 0 && (
                  <div className="mt-2 px-4 py-3 bg-[#14D0DC]/10 dark:bg-[#14D0DC]/15 rounded-lg">
                    <span className="text-xs font-semibold text-[#14D0DC] uppercase tracking-wide">
                      Decisions
                    </span>
                    <div className="mt-2 text-gray-700 dark:text-gray-300 space-y-1.5">
                      {item.decisions.map((decision, decIdx) => (
                        <p key={decIdx} className="break-words">
                          {safeString(decision)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Decisions - Prominent cyan accent box */}
      {data.decisions && data.decisions.length > 0 && (
        <div className="px-6 py-5 bg-[#14D0DC]/15 dark:bg-[#14D0DC]/25 border-l-4 border-[#14D0DC] rounded-r-lg">
          <h3 className="text-base font-bold text-[#14D0DC] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Key Decisions
          </h3>
          <div className="space-y-2.5 text-gray-700 dark:text-gray-300">
            {data.decisions.map((decision, idx) => (
              <p key={idx} className="break-words">
                {safeString(decision)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Action Items - Numbered circles with indentation */}
      {data.actionItems && data.actionItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-amber-500" />
            Action Items
          </h3>
          <div className="space-y-4 ml-2">
            {data.actionItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 dark:text-gray-300 break-words">{safeString(item.task)}</p>
                  {(item.owner || item.deadline) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.owner && safeString(item.owner)}
                      {item.owner && item.deadline && ' · '}
                      {item.deadline && safeString(item.deadline)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Meeting - Purple accent box (V2 style) */}
      {data.nextMeeting && (
        <div className="px-6 py-4 bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 border-l-4 border-[#8D6AFA] rounded-r-lg">
          <div className="flex items-start gap-3">
            <CalendarClock className="w-5 h-5 text-[#8D6AFA] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Next Meeting: </span>
              <span className="text-gray-700 dark:text-gray-300">{safeString(data.nextMeeting)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
