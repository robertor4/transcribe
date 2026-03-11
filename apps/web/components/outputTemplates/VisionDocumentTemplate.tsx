'use client';

import {
  Compass,
  User,
  Calendar,
  Target,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  Flag,
  HelpCircle,
  Layers,
  Zap,
  Sparkles,
} from 'lucide-react';
import type {
  VisionDocumentOutput,
  StrategicPillar,
  VisionRisk,
  VisionMilestone,
} from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  EditorialParagraphs,
  BulletList,
  StatusBadge,
  safeString,
} from './shared';

interface VisionDocumentTemplateProps {
  data: VisionDocumentOutput;
}

const PRIORITY_CONFIG = {
  foundational: {
    label: 'Foundational',
    icon: Layers,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  accelerator: {
    label: 'Accelerator',
    icon: Zap,
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  aspirational: {
    label: 'Aspirational',
    icon: Sparkles,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  },
} as const;

function PillarCard({ pillar, index }: { pillar: StrategicPillar; index: number }) {
  const config = PRIORITY_CONFIG[pillar.priority] || PRIORITY_CONFIG.foundational;
  const PriorityIcon = config.icon;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#8D6AFA] text-white text-xs font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {safeString(pillar.name)}
            </h4>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${config.color}`}>
              <PriorityIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {safeString(pillar.description)}
          </p>
        </div>
      </div>
      {pillar.initiatives && pillar.initiatives.length > 0 && (
        <div className="ml-10">
          <BulletList items={pillar.initiatives} bulletColor="bg-[#8D6AFA]" variant="chevron" />
        </div>
      )}
      {pillar.outcomes && pillar.outcomes.length > 0 && (
        <div className="ml-10 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Target outcomes</p>
          <BulletList items={pillar.outcomes} bulletColor="bg-[#14D0DC]" variant="chevron" />
        </div>
      )}
    </div>
  );
}

function RiskRow({ item }: { item: VisionRisk & { severity?: string } }) {
  // Support both new (likelihood x impact) and legacy (severity) data
  const likelihood = item.likelihood || (item.severity as VisionRisk['likelihood']);
  const impact = item.impact || (item.severity as VisionRisk['impact']);
  const riskLevel = (likelihood === 'high' && impact === 'high') ? 'high'
    : (likelihood === 'low' && impact === 'low') ? 'low'
    : 'medium';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <StatusBadge status={riskLevel} variant="priority" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {safeString(item.risk)}
        </p>
        {(likelihood || impact) && (
          <div className="flex gap-3 mt-1">
            {likelihood && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Likelihood: {likelihood}
              </span>
            )}
            {impact && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Impact: {impact}
              </span>
            )}
          </div>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {safeString(item.mitigation)}
        </p>
      </div>
    </div>
  );
}

function MilestoneRow({ item }: { item: VisionMilestone }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">
        {safeString(item.timeframe)}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
        {safeString(item.milestone)}
      </span>
      {item.pillar && (
        <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0 max-w-[140px] truncate">
          {safeString(item.pillar)}
        </span>
      )}
      {item.status && (
        <StatusBadge
          status={item.status}
          variant="rag"
          className={
            item.status === 'completed'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : item.status === 'in-progress'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
          }
        />
      )}
    </div>
  );
}

export function VisionDocumentTemplate({ data }: VisionDocumentTemplateProps) {
  const metadata =
    data.author || data.timeHorizon ? (
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
        {data.author && (
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {safeString(data.author)}
          </span>
        )}
        {data.timeHorizon && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> {safeString(data.timeHorizon)}
          </span>
        )}
      </div>
    ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title || 'Vision Document'} metadata={metadata} />

      {/* Vision Statement */}
      {data.visionStatement && (
        <EditorialSection label="Vision" icon={Compass} borderTop={false}>
          <EditorialPullQuote color="#8D6AFA">
            <p>{safeString(data.visionStatement)}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Mission Statement */}
      {data.missionStatement && (
        <EditorialSection label="Mission" icon={Target} borderTop>
          <EditorialPullQuote color="#3b82f6">
            <p>{safeString(data.missionStatement)}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Strategic Context — Why Now */}
      {data.strategicContext && (
        <EditorialSection label="Why now" icon={Zap} borderTop>
          <EditorialParagraphs text={data.strategicContext} />
        </EditorialSection>
      )}

      {/* Current State */}
      {data.currentState && (
        <EditorialSection label="Current state" borderTop>
          <EditorialParagraphs text={data.currentState} />
        </EditorialSection>
      )}

      {/* Strategic Pillars */}
      {data.strategicPillars && data.strategicPillars.length > 0 && (
        <EditorialSection label="Strategic pillars" icon={Lightbulb} borderTop>
          <div className="space-y-4">
            {data.strategicPillars.map((pillar, idx) => (
              <PillarCard key={idx} pillar={pillar} index={idx} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Success Metrics */}
      {data.successMetrics && data.successMetrics.length > 0 && (
        <EditorialSection label="Success metrics" icon={BarChart3} borderTop>
          <BulletList items={data.successMetrics} bulletColor="bg-[#14D0DC]" variant="chevron" boldBeforeColon />
        </EditorialSection>
      )}

      {/* Risks & Mitigations */}
      {data.risksAndMitigations && data.risksAndMitigations.length > 0 && (
        <EditorialSection label="Risks and mitigations" icon={AlertTriangle} borderTop>
          <div>
            {data.risksAndMitigations.map((item, idx) => (
              <RiskRow key={idx} item={item} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Milestones */}
      {data.milestones && data.milestones.filter(m => m.milestone?.trim()).length > 0 && (
        <EditorialSection label="Milestones" icon={Flag} borderTop>
          <div>
            {data.milestones.filter(m => m.milestone?.trim()).map((item, idx) => (
              <MilestoneRow key={idx} item={item} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Open Questions */}
      {data.openQuestions && data.openQuestions.length > 0 && (
        <EditorialSection label="Open questions" icon={HelpCircle} borderTop>
          <BulletList items={data.openQuestions} variant="chevron" boldBeforeColon />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
