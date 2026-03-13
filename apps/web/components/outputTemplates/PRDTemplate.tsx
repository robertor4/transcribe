'use client';

import {
  Target,
  Ban,
  CheckSquare,
  BarChart3,
  HelpCircle,
  User,
  Calendar,
} from 'lucide-react';
import type { PRDOutput, PRDRequirement } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialCollapsible,
  BulletList,
  StatusBadge,
  safeString,
} from './shared';

interface PRDTemplateProps {
  data: PRDOutput;
}

const PRIORITY_STYLE: Record<string, { border: string; id: string }> = {
  'must-have':   { border: 'border-red-400 dark:border-red-500/50',   id: 'text-red-500 dark:text-red-400' },
  'should-have': { border: 'border-blue-400 dark:border-blue-500/50', id: 'text-blue-500 dark:text-blue-400' },
  'could-have':  { border: 'border-amber-400 dark:border-amber-500/50', id: 'text-amber-500 dark:text-amber-400' },
  'wont-have':   { border: 'border-gray-300 dark:border-gray-600',    id: 'text-gray-400 dark:text-gray-500' },
};

function RequirementRow({ req, idx }: { req: PRDRequirement; idx: number }) {
  const style = PRIORITY_STYLE[req.priority] || PRIORITY_STYLE['could-have'];
  const id = req.id || `REQ-${String(idx + 1).padStart(3, '0')}`;
  return (
    <div className={`flex items-start gap-3 pl-3 border-l-2 ${style.border} py-2.5`}>
      <span className={`font-mono text-[11px] font-medium ${style.id} flex-shrink-0 pt-[3px] w-16`}>
        {id}
      </span>
      <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.65] flex-1">
        {safeString(req.requirement)}
      </p>
      <StatusBadge status={req.priority} variant="priority" />
    </div>
  );
}

function MetricCard({ text }: { text: string }) {
  const colonIdx = text.indexOf(':');
  const hasColon = colonIdx > 0 && colonIdx < 80;
  const label = hasColon ? text.slice(0, colonIdx).trim() : text;
  const value = hasColon ? text.slice(colonIdx + 1).trim() : '';
  return (
    <div className="rounded-lg border border-[#14D0DC]/30 dark:border-[#14D0DC]/20 bg-[#14D0DC]/5 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#14D0DC] mb-1 leading-tight">
        {label}
      </p>
      {value && (
        <p className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">
          {value}
        </p>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  review:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

export function PRDTemplate({ data }: PRDTemplateProps) {
  const mustHave   = data.requirements?.filter(r => r.priority === 'must-have')   || [];
  const shouldHave = data.requirements?.filter(r => r.priority === 'should-have') || [];
  const couldHave  = data.requirements?.filter(r => r.priority === 'could-have')  || [];
  const wontHave   = data.requirements?.filter(r => r.priority === 'wont-have')   || [];

  // Handle legacy string format for problemStatement
  const problemBullets: string[] = Array.isArray(data.problemStatement)
    ? data.problemStatement
    : [data.problemStatement as unknown as string];

  const metadata = (data.owner || data.timeline || data.status) ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.owner && (
        <span className="inline-flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> {safeString(data.owner)}
        </span>
      )}
      {data.timeline && (
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> {safeString(data.timeline)}
        </span>
      )}
      {data.status && (
        <StatusBadge status={data.status} variant="custom" className={STATUS_COLORS[data.status] || STATUS_COLORS.draft} />
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Problem — chevron bullets, bold label before → or : */}
      {problemBullets.length > 0 && (
        <EditorialSection label="Problem" icon={Target} borderTop={false}>
          <BulletList
            items={problemBullets}
            bulletColor="bg-red-500"
            variant="chevron"
            boldBeforeColon
          />
        </EditorialSection>
      )}

      {/* Goals + Non-Goals side by side */}
      {(data.goals?.length || data.nonGoals?.length) ? (
        <section className="mb-10">
          <div className="border-t border-gray-200 dark:border-gray-700 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {data.goals && data.goals.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-500 mb-4 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Goals
                </h2>
                <BulletList items={data.goals} bulletColor="bg-green-500" variant="chevron" />
              </div>
            )}
            {data.nonGoals && data.nonGoals.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                  <Ban className="w-3.5 h-3.5" />
                  Non-Goals
                </h2>
                <BulletList items={data.nonGoals} bulletColor="bg-gray-400" variant="chevron" />
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Requirements — color-coded left-border rows, flat sorted by priority */}
      {data.requirements && data.requirements.length > 0 && (
        <EditorialSection label="Requirements" icon={CheckSquare} borderTop>
          <div className="space-y-1">
            {mustHave.map((req, idx) => (
              <RequirementRow key={req.id || idx} req={req} idx={idx} />
            ))}
            {shouldHave.map((req, idx) => (
              <RequirementRow key={req.id || idx} req={req} idx={mustHave.length + idx} />
            ))}
            {couldHave.map((req, idx) => (
              <RequirementRow key={req.id || idx} req={req} idx={mustHave.length + shouldHave.length + idx} />
            ))}
          </div>
          {wontHave.length > 0 && (
            <div className="mt-4">
              <EditorialCollapsible label="Won't Have" count={wontHave.length} defaultOpen={false}>
                <div className="space-y-1">
                  {wontHave.map((req, idx) => (
                    <RequirementRow
                      key={req.id || idx}
                      req={req}
                      idx={mustHave.length + shouldHave.length + couldHave.length + idx}
                    />
                  ))}
                </div>
              </EditorialCollapsible>
            </div>
          )}
        </EditorialSection>
      )}

      {/* Success Metrics — metric cards in a 2-col grid */}
      {data.successMetrics && data.successMetrics.length > 0 && (
        <EditorialSection label="Success Metrics" icon={BarChart3} borderTop>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.successMetrics.map((metric, idx) => (
              <MetricCard key={idx} text={safeString(metric)} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Open Questions */}
      {data.openQuestions && data.openQuestions.length > 0 && (
        <EditorialSection label="Open Questions" icon={HelpCircle} borderTop>
          <BulletList items={data.openQuestions} variant="chevron" boldBeforeColon />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
