'use client';

import {
  Code2,
  Calendar,
  User,
  Target,
  Ban,
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
import {
  BulletList,
  StatusBadge,
  safeString,
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialPullQuote,
  EditorialParagraphs,
  EditorialCollapsible,
  EditorialNumberedList,
} from './shared';

interface TechnicalDesignDocTemplateProps {
  data: TechnicalDesignDocOutput;
}

const STATUS_VARIANT: Record<string, 'priority' | 'rag' | 'sentiment'> = {
  draft: 'priority',
  review: 'rag',
  approved: 'rag',
  implemented: 'rag',
};

const STATUS_MAP: Record<string, string> = {
  draft: 'low',
  review: 'amber',
  approved: 'green',
  implemented: 'on-track',
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
          {safeString(alternative.approach)}
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
          <span className="font-medium">Rejection reason:</span> {safeString(alternative.rejectionReason)}
        </div>
      )}
    </div>
  );
}

export function TechnicalDesignDocTemplate({ data }: TechnicalDesignDocTemplateProps) {
  const statusVariant = STATUS_VARIANT[data.status] || 'priority';
  const statusLabel = STATUS_MAP[data.status] || data.status;

  const metadata = (data.author || data.date || data.status) ? (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.author && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {data.author}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      {data.status && (
        <StatusBadge status={statusLabel} variant={statusVariant} />
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Overview — pull-quote style */}
      {safeString(data.overview) && (
        <EditorialPullQuote>
          <EditorialParagraphs text={data.overview} />
        </EditorialPullQuote>
      )}

      {/* Background */}
      {data.background && (
        <EditorialSection label="Background" borderTop>
          <EditorialParagraphs text={data.background} />
        </EditorialSection>
      )}

      {/* Goals & Non-Goals */}
      {data.goals && data.goals.length > 0 && (
        <EditorialSection label="Goals" icon={Target} borderTop>
          <BulletList items={data.goals} bulletColor="bg-green-500" className={EDITORIAL.listItem} />
        </EditorialSection>
      )}
      {data.nonGoals && data.nonGoals.length > 0 && (
        <EditorialSection label="Non-Goals" icon={Ban}>
          <BulletList items={data.nonGoals} bulletColor="bg-gray-400" className={EDITORIAL.listItem} />
        </EditorialSection>
      )}

      {/* Proposed Solution — pull-quote style */}
      {safeString(data.proposedSolution) && (
        <section className="mb-10">
          <EditorialHeading>Proposed Solution</EditorialHeading>
          <EditorialPullQuote color="#14D0DC">
            <EditorialParagraphs text={data.proposedSolution} />
          </EditorialPullQuote>
        </section>
      )}

      {/* Alternatives Considered */}
      {data.alternatives && data.alternatives.length > 0 && (
        <EditorialCollapsible
          label="Alternatives Considered"
          icon={GitBranch}
          count={data.alternatives.length}
          defaultOpen
        >
          <div className="space-y-4">
            {data.alternatives.map((alt, idx) => (
              <AlternativeCard key={idx} alternative={alt} index={idx} />
            ))}
          </div>
        </EditorialCollapsible>
      )}

      {/* Technical Details */}
      {data.technicalDetails && data.technicalDetails.length > 0 && (
        <EditorialSection label="Technical Details" icon={Code2} borderTop>
          <EditorialNumberedList
            items={data.technicalDetails.map(detail => ({
              primary: safeString(detail),
            }))}
          />
        </EditorialSection>
      )}

      {/* Security Considerations */}
      {data.securityConsiderations && data.securityConsiderations.length > 0 && (
        <EditorialSection label="Security Considerations" icon={Shield} borderTop>
          <BulletList items={data.securityConsiderations} bulletColor="bg-red-500" className={EDITORIAL.listItem} />
        </EditorialSection>
      )}

      {/* Testing Strategy */}
      {data.testingStrategy && (
        <EditorialSection label="Testing Strategy" icon={TestTube2} borderTop>
          <EditorialParagraphs text={data.testingStrategy} />
        </EditorialSection>
      )}

      {/* Rollout Plan */}
      {data.rolloutPlan && (
        <EditorialSection label="Rollout Plan" icon={Rocket} borderTop>
          <EditorialParagraphs text={data.rolloutPlan} />
        </EditorialSection>
      )}

      {/* Open Questions */}
      {data.openQuestions && data.openQuestions.length > 0 && (
        <EditorialCollapsible label="Open Questions" icon={HelpCircle} count={data.openQuestions.length} defaultOpen>
          <BulletList items={data.openQuestions} bulletColor="bg-amber-500" className={EDITORIAL.listItem} />
        </EditorialCollapsible>
      )}
    </EditorialArticle>
  );
}
