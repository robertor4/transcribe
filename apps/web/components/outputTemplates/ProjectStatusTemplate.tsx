'use client';

import {
  Calendar,
  CheckCircle2,
  Flag,
  AlertTriangle,
  XCircle,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { ProjectStatusOutput, ProjectMilestone } from '@transcribe/shared';
import {
  BulletList,
  StatusBadge,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EDITORIAL,
} from './shared';

interface ProjectStatusTemplateProps {
  data: ProjectStatusOutput;
}

const STATUS_STYLES = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    label: 'On Track',
    icon: CheckCircle2,
    border: '#22c55e',
  },
  yellow: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'At Risk',
    icon: AlertTriangle,
    border: '#f59e0b',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Off Track',
    icon: XCircle,
    border: '#ef4444',
  },
};

function MilestoneRow({ milestone }: { milestone: ProjectMilestone }) {
  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-green-500' },
    'on-track': { icon: TrendingUp, color: 'text-blue-500' },
    'at-risk': { icon: AlertTriangle, color: 'text-amber-500' },
    delayed: { icon: XCircle, color: 'text-red-500' },
  };

  const config = statusConfig[milestone.status] || statusConfig['on-track'];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-start gap-3 py-4">
      <StatusIcon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{milestone.milestone}</p>
          <StatusBadge status={milestone.status} variant="rag" className="flex-shrink-0" />
        </div>
        {milestone.date && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{milestone.date}</p>
        )}
        {milestone.notes && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">{milestone.notes}</p>
        )}
      </div>
    </div>
  );
}

export function ProjectStatusTemplate({ data }: ProjectStatusTemplateProps) {
  const statusStyle = STATUS_STYLES[data.overallStatus] || STATUS_STYLES.yellow;
  const StatusIcon = statusStyle.icon;

  const metadata = (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        Period: {data.reportingPeriod}
      </span>
      <span className={`flex items-center gap-1.5 font-medium ${statusStyle.text}`}>
        <StatusIcon className="w-3.5 h-3.5" />
        {statusStyle.label}
      </span>
    </div>
  );

  return (
    <EditorialArticle>
      <EditorialTitle title={data.projectName} metadata={metadata} />

      {/* Overall Status — pull-quote style */}
      <EditorialPullQuote color={statusStyle.border}>
        <p>{data.summary}</p>
      </EditorialPullQuote>

      {/* Accomplishments */}
      {data.accomplishments && data.accomplishments.length > 0 && (
        <EditorialSection label="Accomplishments" icon={CheckCircle2}>
          <BulletList items={data.accomplishments} bulletColor="bg-green-500" />
        </EditorialSection>
      )}

      {/* Milestones */}
      {data.milestones && data.milestones.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>
            <span className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-[#8D6AFA]" />
              Milestones
            </span>
          </EditorialHeading>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.milestones.map((milestone, idx) => (
              <MilestoneRow key={idx} milestone={milestone} />
            ))}
          </div>
        </section>
      )}

      {/* Risks & Mitigations */}
      {data.risks && data.risks.length > 0 && (
        <EditorialSection label="Risks & Mitigations" icon={AlertTriangle} borderTop>
          <EditorialNumberedList
            items={data.risks.map(risk => ({
              primary: (
                <>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{risk.risk}</span>
                  <StatusBadge status={risk.severity} variant="priority" className="ml-2 align-middle flex-shrink-0" />
                </>
              ),
              secondary: (
                <>
                  <span className="font-medium not-italic text-gray-600 dark:text-gray-400">Mitigation:</span>{' '}
                  {risk.mitigation}
                </>
              ),
            }))}
          />
        </EditorialSection>
      )}

      {/* Blockers */}
      {data.blockers && data.blockers.length > 0 && (
        <EditorialSection label="Blockers" icon={XCircle} borderTop>
          <BulletList items={data.blockers} bulletColor="bg-red-500" />
        </EditorialSection>
      )}

      {/* Next Period Goals */}
      {data.nextPeriodGoals && data.nextPeriodGoals.length > 0 && (
        <EditorialSection label="Next Period Goals" icon={Target} borderTop>
          <BulletList items={data.nextPeriodGoals} bulletColor="bg-[#14D0DC]" />
        </EditorialSection>
      )}

      {/* Budget Status */}
      {data.budgetStatus && (
        <EditorialSection label="Budget Status" borderTop>
          <p className={EDITORIAL.body}>{data.budgetStatus}</p>
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
