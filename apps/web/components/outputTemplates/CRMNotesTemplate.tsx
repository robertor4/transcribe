'use client';

import {
  Calendar,
  User,
  Building2,
  Phone,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Users,
} from 'lucide-react';
import type { CRMNotesOutput } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialNumberedList,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
} from './shared';

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
  other: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
};

export function CRMNotesTemplate({ data }: CRMNotesTemplateProps) {
  const callTypeLabel = CALL_TYPE_LABELS[data.callType] || 'Call';
  const callTypeColor = CALL_TYPE_COLORS[data.callType] || CALL_TYPE_COLORS.other;

  const metadata = (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.contact && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span className="text-gray-400">Contact:</span> {data.contact}
        </span>
      )}
      {data.company && (
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-gray-400">Company:</span> {data.company}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${callTypeColor}`}>
        {callTypeLabel}
      </span>
    </div>
  );

  return (
    <EditorialArticle>
      <EditorialTitle title="CRM Notes" metadata={metadata} />

      {/* Deal Stage */}
      {data.dealStage && (
        <div className="flex items-center gap-3 mb-10">
          <GitBranch className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className={EDITORIAL.sectionLabel}>Deal Stage</span>
          <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
            {data.dealStage}
          </span>
        </div>
      )}

      {/* Summary */}
      <EditorialPullQuote cite="Call Summary">
        <p>{data.summary}</p>
      </EditorialPullQuote>

      {/* Key Points */}
      {data.keyPoints && data.keyPoints.length > 0 && (
        <EditorialSection label="Key Points" icon={Phone} borderTop>
          <BulletList items={data.keyPoints} bulletColor="bg-gray-400 dark:bg-gray-500" />
        </EditorialSection>
      )}

      {/* Pain Points */}
      {data.painPoints && data.painPoints.length > 0 && (
        <EditorialSection label="Pain Points Identified" icon={AlertTriangle} borderTop>
          <BulletList items={data.painPoints} bulletColor="bg-red-400 dark:bg-red-500" />
        </EditorialSection>
      )}

      {/* Competitors Mentioned */}
      {data.competitorsMentioned && data.competitorsMentioned.length > 0 && (
        <EditorialSection label="Competitors Mentioned" icon={Users} borderTop>
          <div className="flex flex-wrap gap-2">
            {data.competitorsMentioned.map((competitor, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {competitor}
              </span>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <EditorialSection label="Next Steps" icon={ArrowRight} borderTop>
          <EditorialNumberedList
            items={data.nextSteps.map((step) => ({
              primary: step,
            }))}
          />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
