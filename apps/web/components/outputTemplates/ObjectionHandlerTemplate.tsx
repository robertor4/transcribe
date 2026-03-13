'use client';

import {
  User,
  MessageSquare,
  DollarSign,
  Clock,
  Users,
  Key,
  HelpCircle,
  Lock,
  MoreHorizontal,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { ObjectionHandlerOutput, Objection } from '@transcribe/shared';
import {
  BulletList,
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
} from './shared';

interface ObjectionHandlerTemplateProps {
  data: ObjectionHandlerOutput;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  price: { icon: DollarSign, color: 'text-green-500', label: 'Price' },
  timing: { icon: Clock, color: 'text-amber-500', label: 'Timing' },
  competition: { icon: Users, color: 'text-blue-500', label: 'Competition' },
  authority: { icon: Key, color: 'text-purple-500', label: 'Authority' },
  need: { icon: HelpCircle, color: 'text-cyan-500', label: 'Need' },
  trust: { icon: Lock, color: 'text-red-500', label: 'Trust' },
  other: { icon: MoreHorizontal, color: 'text-gray-500', label: 'Other' },
};

function ObjectionCard({ objection }: { objection: Objection }) {
  const config = CATEGORY_CONFIG[objection.category] || CATEGORY_CONFIG.other;
  const CategoryIcon = config.icon;

  return (
    <div className="py-6 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Objection Header */}
      <div className="flex items-start gap-3 mb-3">
        <CategoryIcon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-1`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">
              {objection.objection}
            </p>
            <span className={`text-xs font-bold uppercase tracking-wide ${config.color} flex-shrink-0`}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Response */}
      <div className="ml-7">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#8D6AFA]" />
          <span className={EDITORIAL.sectionLabel}>Recommended Response</span>
        </div>
        {Array.isArray(objection.response) ? (
          <div className="space-y-2">
            {(objection.response as string[]).map((step, stepIdx) => {
              const labels = ['Acknowledge', 'Reframe', 'Bridge'];
              return (
                <div key={stepIdx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#8D6AFA] w-20 mt-1">
                    {labels[stepIdx] || `Step ${stepIdx + 1}`}
                  </span>
                  <p className={`${EDITORIAL.body} mb-0 flex-1`}>{step}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={`${EDITORIAL.body} mb-0`}>{objection.response as string}</p>
        )}

        {/* Proof Points */}
        {objection.proofPoints && objection.proofPoints.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className={EDITORIAL.sectionLabel}>Proof Points</span>
            </div>
            <BulletList
              items={objection.proofPoints}
              bulletColor="bg-green-500"
              className="text-[15px] text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ObjectionHandlerTemplate({ data }: ObjectionHandlerTemplateProps) {
  const metadata = data.prospect ? (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <User className="w-3.5 h-3.5" />
      <span className="text-gray-400 dark:text-gray-500">Prospect:</span> {data.prospect}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle
        title="Objection Handler"
        metadata={metadata}
      />

      {/* Overall Strategy */}
      {data.overallStrategy && (
        <EditorialPullQuote cite="Overall Strategy">
          <p>{data.overallStrategy}</p>
        </EditorialPullQuote>
      )}

      {/* Objections */}
      {data.objections && data.objections.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>
            Objections &amp; Responses ({data.objections.length})
          </EditorialHeading>
          {data.objections.map((objection, idx) => (
            <ObjectionCard key={idx} objection={objection} />
          ))}
        </section>
      )}

      {/* Follow-Up Actions */}
      {data.followUpActions && data.followUpActions.length > 0 && (
        <EditorialSection label="Follow-Up Actions" icon={ArrowRight} borderTop>
          <EditorialNumberedList
            items={data.followUpActions.map(action => ({
              primary: action,
            }))}
          />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
