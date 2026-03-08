'use client';

import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  Lightbulb,
} from 'lucide-react';
import type { IncidentPostmortemOutput, IncidentTimelineEntry } from '@transcribe/shared';
import {
  StatusBadge,
  BulletList,
  safeString,
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EditorialParagraphs,
} from './shared';

interface IncidentPostmortemTemplateProps {
  data: IncidentPostmortemOutput;
}

function TimelineItem({ entry, index }: { entry: IncidentTimelineEntry; index: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-[#8D6AFA] flex-shrink-0" />
        {index < 999 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono text-sm text-[#8D6AFA]">{safeString(entry.timestamp)}</span>
          {entry.actor && (
            <span className="text-xs text-gray-500 dark:text-gray-400">({safeString(entry.actor)})</span>
          )}
        </div>
        <p className={`${EDITORIAL.body} mt-1`}>{safeString(entry.event)}</p>
      </div>
    </div>
  );
}

export function IncidentPostmortemTemplate({ data }: IncidentPostmortemTemplateProps) {
  const metadata = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      <StatusBadge status={data.severity} variant="priority" />
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      {data.duration && (
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Duration: {data.duration}
        </span>
      )}
    </div>
  );

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Impact Summary */}
      {safeString(data.impactSummary) && (
        <EditorialPullQuote color="#ef4444">
          <EditorialParagraphs text={data.impactSummary} />
        </EditorialPullQuote>
      )}

      {/* Timeline */}
      {data.timeline && data.timeline.length > 0 && (
        <EditorialSection label="Incident Timeline" icon={Clock} borderTop>
          <div className="mt-2">
            {data.timeline.map((entry, idx) => (
              <TimelineItem key={idx} entry={entry} index={idx} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Root Cause */}
      {safeString(data.rootCause) && (
        <EditorialSection label="Root Cause" icon={Target} borderTop>
          <EditorialPullQuote color="#f59e0b">
            <EditorialParagraphs text={data.rootCause} />
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Contributing Factors */}
      {data.contributingFactors && data.contributingFactors.length > 0 && (
        <EditorialSection label="Contributing Factors" icon={AlertTriangle} borderTop>
          <BulletList items={data.contributingFactors} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* What Went Well & What Went Poorly — side by side */}
      {((data.whatWentWell && data.whatWentWell.length > 0) ||
        (data.whatWentPoorly && data.whatWentPoorly.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {data.whatWentWell && data.whatWentWell.length > 0 && (
            <EditorialSection label="What Went Well" icon={CheckCircle2}>
              <BulletList items={data.whatWentWell} bulletColor="bg-green-500" />
            </EditorialSection>
          )}
          {data.whatWentPoorly && data.whatWentPoorly.length > 0 && (
            <EditorialSection label="What Went Poorly" icon={XCircle}>
              <BulletList items={data.whatWentPoorly} bulletColor="bg-red-500" />
            </EditorialSection>
          )}
        </div>
      )}

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Action Items</EditorialHeading>
          <EditorialNumberedList
            items={data.actionItems.map(item => {
              const owner = safeString(item.owner);
              const dueDate = safeString(item.dueDate);
              const meta = [owner && `Owner: ${owner}`, dueDate && `Due: ${dueDate}`]
                .filter(Boolean)
                .join(' · ');

              return {
                primary: (
                  <>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {safeString(item.action)}
                    </span>
                  </>
                ),
                badge: <StatusBadge status={item.priority} variant="priority" />,
                secondary: meta || undefined,
              };
            })}
          />
        </section>
      )}

      {/* Lessons Learned */}
      {data.lessonsLearned && data.lessonsLearned.length > 0 && (
        <EditorialSection label="Lessons Learned" icon={Lightbulb} borderTop>
          <BulletList items={data.lessonsLearned} bulletColor="bg-[#8D6AFA]" />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
