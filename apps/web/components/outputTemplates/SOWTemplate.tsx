'use client';

import {
  Calendar,
  User,
  Building2,
  Target,
  CheckSquare,
  Ban,
  Clock,
  AlertCircle,
  Link2,
  FileSignature,
} from 'lucide-react';
import type { SOWOutput, SOWDeliverable } from '@transcribe/shared';
import {
  safeString,
  BulletList,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EditorialParagraphs,
  EditorialCollapsible,
} from './shared';

interface SOWTemplateProps {
  data: SOWOutput;
}

function deliverableToItem({ deliverable }: { deliverable: SOWDeliverable }) {
  return {
    primary: (
      <>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {safeString(deliverable.deliverable)}
        </span>
        {' '}
        {safeString(deliverable.description)}
      </>
    ),
    secondary: deliverable.acceptanceCriteria && deliverable.acceptanceCriteria.length > 0
      ? (
          <div className="mt-1">
            <span className="text-xs font-bold uppercase tracking-widest text-green-500 dark:text-green-400">
              Acceptance Criteria
            </span>
            <BulletList
              items={deliverable.acceptanceCriteria}
              bulletColor="bg-green-500"
              className="mt-1"
            />
          </div>
        )
      : undefined,
  };
}

export function SOWTemplate({ data }: SOWTemplateProps) {
  const metadata = (data.client || data.preparedBy || data.date) ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.client && (
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-gray-400">Client:</span> {data.client}
        </span>
      )}
      {data.preparedBy && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span className="text-gray-400">Prepared by:</span> {data.preparedBy}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.projectTitle} metadata={metadata} />

      {/* Background */}
      {safeString(data.background) && (
        <EditorialPullQuote>
          <EditorialParagraphs text={data.background} />
        </EditorialPullQuote>
      )}

      {/* Objectives */}
      {data.objectives && data.objectives.length > 0 && (
        <EditorialSection label="Objectives" icon={Target} borderTop>
          <BulletList items={data.objectives} bulletColor="bg-[#8D6AFA]" />
        </EditorialSection>
      )}

      {/* Scope */}
      {data.scope && (
        <>
          {data.scope.inScope && data.scope.inScope.length > 0 && (
            <EditorialSection label="In Scope" icon={CheckSquare}>
              <BulletList items={data.scope.inScope} bulletColor="bg-green-500" />
            </EditorialSection>
          )}
          {data.scope.outOfScope && data.scope.outOfScope.length > 0 && (
            <EditorialSection label="Out of Scope" icon={Ban}>
              <BulletList items={data.scope.outOfScope} bulletColor="bg-red-500" />
            </EditorialSection>
          )}
        </>
      )}

      {/* Deliverables */}
      {data.deliverables && data.deliverables.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Deliverables</EditorialHeading>
          <EditorialNumberedList
            items={data.deliverables.map((deliverable) => deliverableToItem({ deliverable }))}
          />
        </section>
      )}

      {/* Timeline */}
      {safeString(data.timeline) && (
        <EditorialSection label="Timeline" icon={Clock} borderTop>
          <EditorialParagraphs text={data.timeline} />
        </EditorialSection>
      )}

      {/* Assumptions */}
      {data.assumptions && data.assumptions.length > 0 && (
        <EditorialCollapsible label="Assumptions" icon={AlertCircle} count={data.assumptions.length}>
          <BulletList items={data.assumptions} bulletColor="bg-amber-500" />
        </EditorialCollapsible>
      )}

      {/* Dependencies */}
      {data.dependencies && data.dependencies.length > 0 && (
        <EditorialCollapsible label="Dependencies" icon={Link2} count={data.dependencies.length}>
          <BulletList items={data.dependencies} bulletColor="bg-blue-500" />
        </EditorialCollapsible>
      )}

      {/* Terms & Conditions */}
      {safeString(data.terms) && (
        <EditorialSection label="Terms & Conditions" icon={FileSignature} borderTop>
          <EditorialParagraphs text={data.terms} />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
