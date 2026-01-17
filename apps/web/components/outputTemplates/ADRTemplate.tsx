'use client';

import {
  FileCode,
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
import { SectionCard, BulletList, MetadataRow, InfoBox } from './shared';

interface ADRTemplateProps {
  data: ADROutput;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  proposed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Proposed' },
  accepted: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', label: 'Accepted' },
  deprecated: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Deprecated' },
  superseded: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', label: 'Superseded' },
};

const CONSEQUENCE_ICONS = {
  positive: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  negative: <XCircle className="w-4 h-4 text-red-500" />,
  neutral: <MinusCircle className="w-4 h-4 text-gray-500" />,
};

const CONSEQUENCE_COLORS = {
  positive: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30',
  negative: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30',
  neutral: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50',
};

export function ADRTemplate({ data }: ADRTemplateProps) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.proposed;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <FileCode className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {data.id && (
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  {data.id}
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
                {data.title}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
            <MetadataRow
              items={[
                { label: 'Date', value: data.date, icon: Calendar },
                { label: 'Deciders', value: data.deciders?.join(', '), icon: Users },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Context */}
      <InfoBox title="Context" icon={FileText} variant="gray">
        {data.context}
      </InfoBox>

      {/* Decision */}
      <InfoBox title="Decision" icon={CheckCircle2} variant="green">
        {data.decision}
      </InfoBox>

      {/* Consequences */}
      {data.consequences && data.consequences.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Consequences</h3>
          <div className="space-y-2">
            {data.consequences.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 border rounded-lg ${CONSEQUENCE_COLORS[item.type]}`}
              >
                <span className="flex-shrink-0 mt-0.5">{CONSEQUENCE_ICONS[item.type]}</span>
                <p className="text-gray-700 dark:text-gray-300">{item.consequence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives Considered */}
      {data.alternatives && data.alternatives.length > 0 && (
        <SectionCard title="Alternatives Considered" icon={GitBranch} iconColor="text-gray-500">
          <div className="space-y-3">
            {data.alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">{alt.alternative}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 italic">
                  Not chosen because: {alt.reason}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Related Decisions */}
      {data.relatedDecisions && data.relatedDecisions.length > 0 && (
        <SectionCard title="Related Decisions" icon={Link2} iconColor="text-blue-500">
          <div className="flex flex-wrap gap-2">
            {data.relatedDecisions.map((decision, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
              >
                {decision}
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
