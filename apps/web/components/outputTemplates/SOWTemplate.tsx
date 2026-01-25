'use client';

import {
  FileSignature,
  Calendar,
  User,
  Building2,
  Target,
  CheckSquare,
  Ban,
  Package,
  Clock,
  AlertCircle,
  Link2,
  FileText,
} from 'lucide-react';
import type { SOWOutput, SOWDeliverable } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, safeString } from './shared';

interface SOWTemplateProps {
  data: SOWOutput;
}

function DeliverableCard({ deliverable, index }: { deliverable: SOWDeliverable; index: number }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[#8D6AFA]">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{safeString(deliverable.deliverable)}</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{safeString(deliverable.description)}</p>
          {deliverable.acceptanceCriteria && deliverable.acceptanceCriteria.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Acceptance Criteria
              </span>
              <BulletList
                items={deliverable.acceptanceCriteria}
                bulletColor="bg-green-500"
                className="mt-1 text-sm text-gray-600 dark:text-gray-400"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SOWTemplate({ data }: SOWTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <FileSignature className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.projectTitle}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Statement of Work</p>
            <MetadataRow
              items={[
                { label: 'Client', value: data.client, icon: Building2 },
                { label: 'Prepared By', value: data.preparedBy, icon: User },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Background */}
      <InfoBox title="Background" icon={FileText} variant="gray">
        {data.background}
      </InfoBox>

      {/* Objectives */}
      {data.objectives && data.objectives.length > 0 && (
        <SectionCard title="Objectives" icon={Target} iconColor="text-[#8D6AFA]">
          <BulletList items={data.objectives} bulletColor="bg-[#8D6AFA]" />
        </SectionCard>
      )}

      {/* Scope */}
      {data.scope && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.scope.inScope && data.scope.inScope.length > 0 && (
            <SectionCard
              title="In Scope"
              icon={CheckSquare}
              iconColor="text-green-500"
              className="bg-green-50/50 dark:bg-green-900/10"
            >
              <BulletList items={data.scope.inScope} bulletColor="bg-green-500" />
            </SectionCard>
          )}
          {data.scope.outOfScope && data.scope.outOfScope.length > 0 && (
            <SectionCard
              title="Out of Scope"
              icon={Ban}
              iconColor="text-red-500"
              className="bg-red-50/50 dark:bg-red-900/10"
            >
              <BulletList items={data.scope.outOfScope} bulletColor="bg-red-500" />
            </SectionCard>
          )}
        </div>
      )}

      {/* Deliverables */}
      {data.deliverables && data.deliverables.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#8D6AFA]" />
            Deliverables
          </h3>
          {data.deliverables.map((deliverable, idx) => (
            <DeliverableCard key={idx} deliverable={deliverable} index={idx} />
          ))}
        </div>
      )}

      {/* Timeline */}
      {data.timeline && (
        <InfoBox title="Timeline" icon={Clock} variant="cyan">
          {data.timeline}
        </InfoBox>
      )}

      {/* Assumptions */}
      {data.assumptions && data.assumptions.length > 0 && (
        <SectionCard title="Assumptions" icon={AlertCircle} iconColor="text-amber-500">
          <BulletList items={data.assumptions} bulletColor="bg-amber-500" />
        </SectionCard>
      )}

      {/* Dependencies */}
      {data.dependencies && data.dependencies.length > 0 && (
        <SectionCard title="Dependencies" icon={Link2} iconColor="text-blue-500">
          <BulletList items={data.dependencies} bulletColor="bg-blue-500" />
        </SectionCard>
      )}

      {/* Terms */}
      {data.terms && (
        <SectionCard title="Terms & Conditions" icon={FileSignature} iconColor="text-gray-500">
          <p className="text-gray-700 dark:text-gray-300">{safeString(data.terms)}</p>
        </SectionCard>
      )}
    </div>
  );
}
