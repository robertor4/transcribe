'use client';

import {
  Calendar,
  Users,
  CheckCircle2,
  ListTodo,
  CalendarClock,
  MessageSquare,
} from 'lucide-react';
import type { MeetingMinutesOutput } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EditorialCollapsible,
  EditorialSidebar,
  EDITORIAL,
  safeString,
} from './shared';

interface MeetingMinutesTemplateProps {
  data: MeetingMinutesOutput;
}

/** Generate an anchor ID for a topic */
function toSlug(_text: string, idx: number): string {
  return `topic-${idx + 1}`;
}

export function MeetingMinutesTemplate({ data }: MeetingMinutesTemplateProps) {
  const metadata = (data.date || (data.attendees && data.attendees.length > 0)) ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {safeString(data.date)}
        </span>
      )}
      {data.attendees && data.attendees.length > 0 && (
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {data.attendees.length} attendee{data.attendees.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  ) : undefined;

  const agendaItems = data.agendaItems ?? [];

  // Build sidebar TOC for desktop
  const sidebar = agendaItems.length > 1 ? (
    <EditorialSidebar title="Agenda">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {agendaItems.map((item, idx) => (
          <li key={idx}>
            <a
              href={`#${toSlug(safeString(item.topic), idx)}`}
              className="block text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug py-3 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(toSlug(safeString(item.topic), idx));
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {safeString(item.topic)}
            </a>
          </li>
        ))}
      </ul>
    </EditorialSidebar>
  ) : undefined;

  return (
    <EditorialArticle
      sidebar={sidebar}
      header={<EditorialTitle title={safeString(data.title) || 'Meeting Minutes'} metadata={metadata} rule={!sidebar} />}
    >

      {/* Attendees */}
      {data.attendees && data.attendees.length > 0 && (
        <EditorialSection label="Attendees" icon={Users}>
          <div className="flex flex-wrap gap-2">
            {data.attendees.map((attendee, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {safeString(attendee)}
              </span>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Discussion Sections */}
      {agendaItems.length > 0 && (
        <EditorialSection label="Agenda & Discussion" icon={MessageSquare} borderTop>
          <div className="space-y-10">
            {agendaItems.map((item, idx) => (
              <div key={idx} id={toSlug(safeString(item.topic), idx)} className="scroll-mt-24">
                <EditorialHeading>
                  {idx + 1}. {safeString(item.topic)}
                </EditorialHeading>
                {item.discussion && item.discussion.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {item.discussion.map((point, pointIdx) => (
                      <p key={pointIdx} className={`${EDITORIAL.body} break-words`}>
                        {safeString(point)}
                      </p>
                    ))}
                  </div>
                )}
                {item.decisions && item.decisions.length > 0 && (
                  <div className="mt-6 rounded-lg bg-cyan-50 dark:bg-cyan-900/15 border border-cyan-200 dark:border-cyan-800/40 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2">
                      Decisions
                    </p>
                    <div className="space-y-2">
                      {item.decisions.map((decision, decIdx) => (
                        <p key={decIdx} className="text-[15px] text-gray-800 dark:text-gray-200 leading-[1.7] font-medium break-words">
                          {safeString(decision)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Key Decisions */}
      {data.decisions && data.decisions.length > 0 && (
        <EditorialSection label="Key Decisions" icon={CheckCircle2} borderTop>
          <EditorialNumberedList
            items={data.decisions.map(decision => ({
              primary: (
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {safeString(decision)}
                </span>
              ),
            }))}
          />
        </EditorialSection>
      )}

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <EditorialSection label="Action Items" icon={ListTodo} borderTop>
          <EditorialNumberedList
            items={data.actionItems.map(item => ({
              primary: (
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {safeString(item.task)}
                </span>
              ),
              secondary: (item.owner || item.deadline) ? (
                <>
                  {item.owner && safeString(item.owner)}
                  {item.owner && item.deadline && ' \u00b7 '}
                  {item.deadline && safeString(item.deadline)}
                </>
              ) : undefined,
            }))}
          />
        </EditorialSection>
      )}

      {/* Next Meeting */}
      {data.nextMeeting && (
        <EditorialCollapsible label="Next Meeting" icon={CalendarClock} defaultOpen>
          <EditorialPullQuote>
            <p className="break-words">{safeString(data.nextMeeting)}</p>
          </EditorialPullQuote>
        </EditorialCollapsible>
      )}
    </EditorialArticle>
  );
}
