'use client';

import {
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  MinusCircle,
  GitBranch,
  Link2,
} from 'lucide-react';
import type { ADROutput } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  EditorialNumberedList,
  StatusBadge,
  EDITORIAL,
} from './shared';

interface ADRTemplateProps {
  data: ADROutput;
}

const STATUS_VARIANT_MAP: Record<string, string> = {
  proposed: 'Proposed',
  accepted: 'Accepted',
  deprecated: 'Deprecated',
  superseded: 'Superseded',
};

const CONSEQUENCE_ICONS = {
  positive: <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />,
  negative: <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />,
  neutral: <MinusCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />,
};

const CONSEQUENCE_COLORS = {
  positive: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30',
  negative: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30',
  neutral: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50',
};

export function ADRTemplate({ data }: ADRTemplateProps) {
  const statusLabel = STATUS_VARIANT_MAP[data.status] || STATUS_VARIANT_MAP.proposed;

  const metadata = (data.id || data.date || data.deciders?.length) ? (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.id && (
        <span className="font-mono text-gray-400 dark:text-gray-500">{data.id}</span>
      )}
      <StatusBadge status={statusLabel} variant="rag" />
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      {data.deciders && data.deciders.length > 0 && (
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {data.deciders.join(', ')}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Context */}
      {data.context && (
        <EditorialSection label="Context" icon={FileText}>
          <p className={EDITORIAL.body}>{data.context}</p>
        </EditorialSection>
      )}

      {/* Decision — pull-quote style for emphasis */}
      {data.decision && (
        <EditorialPullQuote color="#22c55e">
          <p>{data.decision}</p>
        </EditorialPullQuote>
      )}

      {/* Consequences */}
      {data.consequences && data.consequences.length > 0 && (
        <EditorialSection label="Consequences" borderTop>
          <div className="space-y-2">
            {data.consequences.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 border rounded-lg ${CONSEQUENCE_COLORS[item.type]}`}
              >
                <span className="flex-shrink-0 mt-0.5">{CONSEQUENCE_ICONS[item.type]}</span>
                <p className={EDITORIAL.listItem}>{item.consequence}</p>
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Alternatives Considered */}
      {data.alternatives && data.alternatives.length > 0 && (
        <EditorialSection label="Alternatives Considered" icon={GitBranch} borderTop>
          <EditorialNumberedList
            items={data.alternatives.map((alt) => ({
              primary: (
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {alt.alternative}
                </span>
              ),
              secondary: <>Not chosen because: {alt.reason}</>,
            }))}
          />
        </EditorialSection>
      )}

      {/* Related Decisions */}
      {data.relatedDecisions && data.relatedDecisions.length > 0 && (
        <EditorialSection label="Related Decisions" icon={Link2} borderTop>
          <div className="flex flex-wrap gap-2">
            {data.relatedDecisions.map((decision, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30"
              >
                {decision}
              </span>
            ))}
          </div>
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
