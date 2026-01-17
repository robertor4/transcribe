'use client';

import {
  Code2,
  Calendar,
  User,
  Target,
  Ban,
  FileText,
  GitBranch,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Shield,
  TestTube2,
  Rocket,
  HelpCircle,
} from 'lucide-react';
import type { TechnicalDesignDocOutput, DesignAlternative } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox } from './shared';

interface TechnicalDesignDocTemplateProps {
  data: TechnicalDesignDocOutput;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
  review: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  implemented: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
};

function AlternativeCard({ alternative, index }: { alternative: DesignAlternative; index: number }) {
  const isRejected = alternative.rejected;

  return (
    <div className={`border rounded-xl p-4 ${
      isRejected
        ? 'border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 opacity-75'
        : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isRejected
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}>
            {index + 1}
          </span>
          {alternative.approach}
        </h4>
        {isRejected && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        {alternative.pros && alternative.pros.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mb-2">
              <ThumbsUp className="w-4 h-4" />
              Pros
            </div>
            <BulletList
              items={alternative.pros}
              bulletColor="bg-green-500"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
        {alternative.cons && alternative.cons.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              <ThumbsDown className="w-4 h-4" />
              Cons
            </div>
            <BulletList
              items={alternative.cons}
              bulletColor="bg-red-500"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
      </div>

      {alternative.rejectionReason && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm text-red-700 dark:text-red-400">
          <span className="font-medium">Rejection reason:</span> {alternative.rejectionReason}
        </div>
      )}
    </div>
  );
}

export function TechnicalDesignDocTemplate({ data }: TechnicalDesignDocTemplateProps) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.draft;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Code2 className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
                {data.title}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {data.status}
              </span>
            </div>
            <MetadataRow
              items={[
                { label: 'Author', value: data.author, icon: User },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Overview */}
      <InfoBox title="Overview" icon={FileText} variant="purple">
        {data.overview}
      </InfoBox>

      {/* Background */}
      {data.background && (
        <SectionCard title="Background" icon={FileText} iconColor="text-gray-500">
          <p className="text-gray-700 dark:text-gray-300">{data.background}</p>
        </SectionCard>
      )}

      {/* Goals & Non-Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.goals && data.goals.length > 0 && (
          <SectionCard
            title="Goals"
            icon={Target}
            iconColor="text-green-500"
            className="bg-green-50/50 dark:bg-green-900/10"
          >
            <BulletList items={data.goals} bulletColor="bg-green-500" />
          </SectionCard>
        )}
        {data.nonGoals && data.nonGoals.length > 0 && (
          <SectionCard
            title="Non-Goals"
            icon={Ban}
            iconColor="text-gray-500"
            className="bg-gray-50 dark:bg-gray-800/50"
          >
            <BulletList items={data.nonGoals} bulletColor="bg-gray-400" />
          </SectionCard>
        )}
      </div>

      {/* Proposed Solution */}
      <InfoBox title="Proposed Solution" icon={GitBranch} variant="cyan">
        {data.proposedSolution}
      </InfoBox>

      {/* Alternatives Considered */}
      {data.alternatives && data.alternatives.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Alternatives Considered
          </h3>
          {data.alternatives.map((alt, idx) => (
            <AlternativeCard key={idx} alternative={alt} index={idx} />
          ))}
        </div>
      )}

      {/* Technical Details */}
      {data.technicalDetails && data.technicalDetails.length > 0 && (
        <SectionCard title="Technical Details" icon={Code2} iconColor="text-[#8D6AFA]">
          <BulletList items={data.technicalDetails} bulletColor="bg-[#8D6AFA]" />
        </SectionCard>
      )}

      {/* Security Considerations */}
      {data.securityConsiderations && data.securityConsiderations.length > 0 && (
        <SectionCard
          title="Security Considerations"
          icon={Shield}
          iconColor="text-red-500"
          className="bg-red-50/30 dark:bg-red-900/10"
        >
          <BulletList items={data.securityConsiderations} bulletColor="bg-red-500" />
        </SectionCard>
      )}

      {/* Testing Strategy */}
      {data.testingStrategy && (
        <SectionCard title="Testing Strategy" icon={TestTube2} iconColor="text-blue-500">
          <p className="text-gray-700 dark:text-gray-300">{data.testingStrategy}</p>
        </SectionCard>
      )}

      {/* Rollout Plan */}
      {data.rolloutPlan && (
        <SectionCard title="Rollout Plan" icon={Rocket} iconColor="text-amber-500">
          <p className="text-gray-700 dark:text-gray-300">{data.rolloutPlan}</p>
        </SectionCard>
      )}

      {/* Open Questions */}
      {data.openQuestions && data.openQuestions.length > 0 && (
        <InfoBox title="Open Questions" icon={HelpCircle} variant="amber">
          <BulletList items={data.openQuestions} bulletColor="bg-amber-500" />
        </InfoBox>
      )}
    </div>
  );
}
