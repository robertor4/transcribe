'use client';

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Flag,
  AlertTriangle,
  XCircle,
  Target,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { ProjectStatusOutput, ProjectMilestone } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox, StatusBadge } from './shared';

interface ProjectStatusTemplateProps {
  data: ProjectStatusOutput;
}

const STATUS_STYLES = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    label: 'On Track',
    icon: CheckCircle2,
  },
  yellow: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'At Risk',
    icon: AlertTriangle,
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Off Track',
    icon: XCircle,
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
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-lg">
      <StatusIcon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-gray-900 dark:text-gray-100">{milestone.milestone}</p>
          <StatusBadge status={milestone.status} variant="rag" className="flex-shrink-0" />
        </div>
        {milestone.date && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{milestone.date}</p>
        )}
        {milestone.notes && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 italic">{milestone.notes}</p>
        )}
      </div>
    </div>
  );
}

export function ProjectStatusTemplate({ data }: ProjectStatusTemplateProps) {
  const statusStyle = STATUS_STYLES[data.overallStatus] || STATUS_STYLES.yellow;
  const StatusIcon = statusStyle.icon;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.projectName}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Period: {data.reportingPeriod}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`${statusStyle.bg} rounded-xl p-6 flex items-center gap-4`}>
        <StatusIcon className={`w-10 h-10 ${statusStyle.text}`} />
        <div>
          <p className={`text-2xl font-bold ${statusStyle.text}`}>{statusStyle.label}</p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{data.summary}</p>
        </div>
      </div>

      {/* Accomplishments */}
      {data.accomplishments && data.accomplishments.length > 0 && (
        <SectionCard
          title="Accomplishments"
          icon={CheckCircle2}
          iconColor="text-green-500"
          className="bg-green-50/50 dark:bg-green-900/10"
        >
          <BulletList items={data.accomplishments} bulletColor="bg-green-500" />
        </SectionCard>
      )}

      {/* Milestones */}
      {data.milestones && data.milestones.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Flag className="w-5 h-5 text-[#8D6AFA]" />
            Milestones
          </h3>
          {data.milestones.map((milestone, idx) => (
            <MilestoneRow key={idx} milestone={milestone} />
          ))}
        </div>
      )}

      {/* Risks */}
      {data.risks && data.risks.length > 0 && (
        <SectionCard title="Risks & Mitigations" icon={AlertTriangle} iconColor="text-amber-500">
          <div className="space-y-3">
            {data.risks.map((risk, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{risk.risk}</p>
                  <StatusBadge status={risk.severity} variant="priority" className="flex-shrink-0" />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Mitigation:</span> {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Blockers */}
      {data.blockers && data.blockers.length > 0 && (
        <InfoBox title="Blockers" icon={XCircle} variant="red">
          <BulletList items={data.blockers} bulletColor="bg-red-500" />
        </InfoBox>
      )}

      {/* Next Period Goals */}
      {data.nextPeriodGoals && data.nextPeriodGoals.length > 0 && (
        <SectionCard title="Next Period Goals" icon={Target} iconColor="text-[#14D0DC]">
          <BulletList items={data.nextPeriodGoals} bulletColor="bg-[#14D0DC]" />
        </SectionCard>
      )}

      {/* Budget Status */}
      {data.budgetStatus && (
        <InfoBox title="Budget Status" icon={DollarSign} variant="gray">
          {data.budgetStatus}
        </InfoBox>
      )}
    </div>
  );
}
