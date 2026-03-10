'use client';

import {
  Calendar,
  User,
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
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialNumberedList,
  EditorialPullQuote,
  BulletList,
  StatusBadge,
  EDITORIAL,
} from './shared';

interface BugReportTemplateProps {
  data: BugReportOutput;
}

export function BugReportTemplate({ data }: BugReportTemplateProps) {
  const metadata = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
      {data.reportedBy && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {data.reportedBy}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      <StatusBadge status={data.severity} variant="priority" />
      <StatusBadge status={data.priority} variant="priority" />
    </div>
  );

  return (
    <EditorialArticle>
      {/* Title */}
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Summary */}
      <EditorialPullQuote color="#ef4444">
        <p>{data.summary}</p>
      </EditorialPullQuote>

      {/* Steps to Reproduce */}
      {data.stepsToReproduce && data.stepsToReproduce.length > 0 && (
        <EditorialSection label="Steps to Reproduce" icon={ListOrdered}>
          <EditorialNumberedList
            items={data.stepsToReproduce.map((step) => ({
              primary: step,
            }))}
          />
        </EditorialSection>
      )}

      {/* Expected vs Actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <EditorialSection label="Expected Behavior" icon={Check}>
          <p className={EDITORIAL.body}>{data.expectedBehavior}</p>
        </EditorialSection>
        <EditorialSection label="Actual Behavior" icon={X}>
          <p className={EDITORIAL.body}>{data.actualBehavior}</p>
        </EditorialSection>
      </div>

      {/* Environment */}
      {data.environment && (
        <EditorialSection label="Environment" icon={Monitor} borderTop>
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
            {data.environment}
          </p>
        </EditorialSection>
      )}

      {/* Possible Cause */}
      {data.possibleCause && (
        <EditorialSection label="Possible Cause" icon={Lightbulb} borderTop>
          <EditorialPullQuote color="#f59e0b">
            <p>{data.possibleCause}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Suggested Fix */}
      {data.suggestedFix && (
        <EditorialSection label="Suggested Fix" icon={Wrench} borderTop>
          <EditorialPullQuote color="#8D6AFA">
            <p>{data.suggestedFix}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Workaround */}
      {data.workaround && (
        <EditorialSection label="Workaround" icon={RefreshCw} borderTop>
          <EditorialPullQuote color="#14D0DC">
            <p>{data.workaround}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Attachments */}
      {data.attachments && data.attachments.length > 0 && (
        <EditorialSection label="Attachments" icon={Paperclip} borderTop>
          <BulletList items={data.attachments} bulletColor="bg-gray-400" />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
