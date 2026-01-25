'use client';

import {
  Scale,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import type { DecisionDocumentOutput, DecisionOption } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, safeString } from './shared';

interface DecisionDocumentTemplateProps {
  data: DecisionDocumentOutput;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  proposed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Proposed' },
  decided: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', label: 'Decided' },
  implemented: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', label: 'Implemented' },
  deprecated: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Deprecated' },
};

function OptionCard({ option, index, isSelected }: { option: DecisionOption; index: number; isSelected?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${
      isSelected
        ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
        : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
            {index + 1}
          </span>
          {safeString(option.option)}
        </h4>
        {isSelected && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {option.pros && option.pros.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mb-2">
              <ThumbsUp className="w-4 h-4" />
              Pros
            </div>
            <BulletList
              items={option.pros}
              bulletColor="bg-green-500"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
        {option.cons && option.cons.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              <ThumbsDown className="w-4 h-4" />
              Cons
            </div>
            <BulletList
              items={option.cons}
              bulletColor="bg-red-500"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function DecisionDocumentTemplate({ data }: DecisionDocumentTemplateProps) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.proposed;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Scale className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
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
                { label: 'Decision Makers', value: data.decisionMakers?.join(', '), icon: Users },
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

      {/* Options Considered */}
      {data.options && data.options.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Options Considered
          </h3>
          {data.options.map((option, idx) => (
            <OptionCard
              key={idx}
              option={option}
              index={idx}
              isSelected={data.decision?.toLowerCase().includes(option.option.toLowerCase())}
            />
          ))}
        </div>
      )}

      {/* Decision */}
      <InfoBox title="Decision" icon={CheckCircle2} variant="green">
        <p className="font-medium">{data.decision}</p>
      </InfoBox>

      {/* Rationale */}
      {data.rationale && (
        <SectionCard title="Rationale" icon={FileText} iconColor="text-blue-500">
          <p className="text-gray-700 dark:text-gray-300">{safeString(data.rationale)}</p>
        </SectionCard>
      )}

      {/* Consequences */}
      {data.consequences && data.consequences.length > 0 && (
        <SectionCard title="Consequences" icon={AlertTriangle} iconColor="text-amber-500">
          <BulletList items={data.consequences} bulletColor="bg-amber-500" />
        </SectionCard>
      )}

      {/* Review Date */}
      {data.reviewDate && (
        <InfoBox title="Review Date" icon={CalendarClock} variant="purple">
          {data.reviewDate}
        </InfoBox>
      )}
    </div>
  );
}
