'use client';

import {
  Database,
  Calendar,
  User,
  Building2,
  Phone,
  FileText,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Users,
} from 'lucide-react';
import type { CRMNotesOutput } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, StatusBadge } from './shared';

interface CRMNotesTemplateProps {
  data: CRMNotesOutput;
}

const CALL_TYPE_LABELS: Record<string, string> = {
  discovery: 'Discovery Call',
  demo: 'Product Demo',
  'follow-up': 'Follow-Up',
  negotiation: 'Negotiation',
  other: 'Other',
};

const CALL_TYPE_COLORS: Record<string, string> = {
  discovery: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  demo: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'follow-up': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  negotiation: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  other: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

export function CRMNotesTemplate({ data }: CRMNotesTemplateProps) {
  const callTypeLabel = CALL_TYPE_LABELS[data.callType] || 'Call';
  const callTypeColor = CALL_TYPE_COLORS[data.callType] || CALL_TYPE_COLORS.other;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Database className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                CRM Notes
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${callTypeColor}`}>
                {callTypeLabel}
              </span>
            </div>
            <MetadataRow
              items={[
                { label: 'Contact', value: data.contact, icon: User },
                { label: 'Company', value: data.company, icon: Building2 },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Deal Stage */}
      {data.dealStage && (
        <div className="flex items-center gap-3 p-4 bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10 rounded-xl">
          <GitBranch className="w-5 h-5 text-[#8D6AFA]" />
          <span className="text-gray-600 dark:text-gray-400">Deal Stage:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.dealStage}</span>
        </div>
      )}

      {/* Summary */}
      <InfoBox title="Call Summary" icon={FileText} variant="gray">
        {data.summary}
      </InfoBox>

      {/* Key Points */}
      {data.keyPoints && data.keyPoints.length > 0 && (
        <SectionCard title="Key Points" icon={Phone} iconColor="text-blue-500">
          <BulletList items={data.keyPoints} bulletColor="bg-blue-500" />
        </SectionCard>
      )}

      {/* Pain Points */}
      {data.painPoints && data.painPoints.length > 0 && (
        <SectionCard
          title="Pain Points Identified"
          icon={AlertTriangle}
          iconColor="text-red-500"
          className="bg-red-50/50 dark:bg-red-900/10"
        >
          <BulletList items={data.painPoints} bulletColor="bg-red-500" />
        </SectionCard>
      )}

      {/* Competitors Mentioned */}
      {data.competitorsMentioned && data.competitorsMentioned.length > 0 && (
        <SectionCard title="Competitors Mentioned" icon={Users} iconColor="text-amber-500">
          <div className="flex flex-wrap gap-2">
            {data.competitorsMentioned.map((competitor, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              >
                {competitor}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <SectionCard title="Next Steps" icon={ArrowRight} iconColor="text-[#14D0DC]">
          <div className="space-y-2">
            {data.nextSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#14D0DC]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#14D0DC]">{idx + 1}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 break-words">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
