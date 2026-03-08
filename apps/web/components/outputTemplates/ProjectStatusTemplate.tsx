'use client';

import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
} from 'lucide-react';
import type { ProjectStatusOutput } from '@transcribe/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  EDITORIAL,
} from './shared';

interface ProjectStatusTemplateProps {
  data: ProjectStatusOutput;
}

const STATUS_STYLES = {
  green: {
    text: 'text-green-700 dark:text-green-400',
    label: 'On Track',
    icon: CheckCircle2,
    border: '#22c55e',
  },
  yellow: {
    text: 'text-amber-700 dark:text-amber-400',
    label: 'At Risk',
    icon: AlertTriangle,
    border: '#f59e0b',
  },
  red: {
    text: 'text-red-700 dark:text-red-400',
    label: 'Off Track',
    icon: XCircle,
    border: '#ef4444',
  },
};

const MILESTONE_BADGE_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'on-track': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'at-risk': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  delayed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const SEVERITY_BADGE_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
};

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

      {/* Summary — concise pull-quote */}
      <EditorialPullQuote color={statusStyle.border}>
        <p>{data.summary}</p>
      </EditorialPullQuote>

      {/* Accomplishments — blog-style bullets */}
      {data.accomplishments && data.accomplishments.length > 0 && (
        <EditorialSection label="Accomplishments" icon={CheckCircle2}>
          <ul className="list-none pl-0 space-y-2.5">
            {data.accomplishments.map((item, idx) => (
              <li key={idx} className={`flex items-start gap-3 ${EDITORIAL.listItem}`}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-bold flex items-center justify-center mt-[3px]">&gt;</span>
                <span className="flex-1">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        </EditorialSection>
      )}

      {/* Milestones — table with badges */}
      {data.milestones && data.milestones.length > 0 && (
        <EditorialSection label="Milestones" borderTop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Milestone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.milestones.map((milestone, idx) => (
                <TableRow key={idx}>
                  <TableCell className="pl-0 font-medium text-gray-900 dark:text-gray-100 whitespace-normal">
                    {milestone.milestone || milestone.notes || '—'}
                    {milestone.milestone && milestone.date && (
                      <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{milestone.date}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-transparent capitalize ${MILESTONE_BADGE_STYLES[milestone.status || ''] || ''}`}>
                      {(milestone.status || 'on-track').replace(/-/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-gray-500 dark:text-gray-400 italic whitespace-normal">
                    {milestone.milestone ? (milestone.notes || '—') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </EditorialSection>
      )}

      {/* Risks — table with severity badges */}
      {data.risks && data.risks.length > 0 && (
        <EditorialSection label="Risks & Mitigations" icon={AlertTriangle} borderTop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Risk</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="hidden sm:table-cell">Mitigation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.risks.map((risk, idx) => (
                <TableRow key={idx}>
                  <TableCell className="pl-0 font-medium text-gray-900 dark:text-gray-100 whitespace-normal">
                    {risk.risk || risk.mitigation || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-transparent capitalize ${SEVERITY_BADGE_STYLES[risk.severity || ''] || ''}`}>
                      {risk.severity || 'medium'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-gray-500 dark:text-gray-400 whitespace-normal">
                    {risk.risk ? risk.mitigation : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </EditorialSection>
      )}

      {/* Blockers — filled circles with ! */}
      {data.blockers && data.blockers.length > 0 && (
        <EditorialSection label="Blockers" icon={XCircle} borderTop>
          <ul className="list-none pl-0 space-y-2.5">
            {data.blockers.map((item, idx) => (
              <li key={idx} className={`flex items-start gap-3 ${EDITORIAL.listItem}`}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center mt-[3px]">!</span>
                <span className="flex-1">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        </EditorialSection>
      )}

      {/* Next Period Goals — blog-style bullets */}
      {data.nextPeriodGoals && data.nextPeriodGoals.length > 0 && (
        <EditorialSection label="Next Period Goals" icon={Target} borderTop>
          <ul className="list-none pl-0 space-y-2.5">
            {data.nextPeriodGoals.map((item, idx) => (
              <li key={idx} className={`flex items-start gap-3 ${EDITORIAL.listItem}`}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-bold flex items-center justify-center mt-[3px]">&gt;</span>
                <span className="flex-1">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
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
