'use client';

import {
  ClipboardList,
  User,
  Target,
  Ban,
  Users,
  CheckSquare,
  BarChart3,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import type { PRDOutput, PRDRequirement } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, StatusBadge, safeString } from './shared';

interface PRDTemplateProps {
  data: PRDOutput;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
  review: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
};

function RequirementCard({ requirement, index }: { requirement: PRDRequirement; index: number }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-lg">
      <div className="flex-shrink-0">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{requirement.id || `REQ-${String(index + 1).padStart(3, '0')}`}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-gray-700 dark:text-gray-300 break-words">{safeString(requirement.requirement)}</p>
          <StatusBadge status={requirement.priority} variant="priority" className="flex-shrink-0" />
        </div>
        {requirement.rationale && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
            {safeString(requirement.rationale)}
          </p>
        )}
      </div>
    </div>
  );
}

export function PRDTemplate({ data }: PRDTemplateProps) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.draft;

  // Group requirements by priority
  const mustHave = data.requirements?.filter(r => r.priority === 'must-have') || [];
  const shouldHave = data.requirements?.filter(r => r.priority === 'should-have') || [];
  const couldHave = data.requirements?.filter(r => r.priority === 'could-have') || [];
  const wontHave = data.requirements?.filter(r => r.priority === 'wont-have') || [];

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <ClipboardList className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
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
                { label: 'Owner', value: data.owner, icon: User },
                { label: 'Timeline', value: data.timeline, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <InfoBox title="Problem Statement" icon={Target} variant="red">
        {data.problemStatement}
      </InfoBox>

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

      {/* User Stories */}
      {data.userStories && data.userStories.length > 0 && (
        <SectionCard title="User Stories" icon={Users} iconColor="text-blue-500">
          <div className="space-y-2">
            {data.userStories.map((story, idx) => (
              <div
                key={idx}
                className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg"
              >
                <p className="text-gray-700 dark:text-gray-300 italic">&ldquo;{safeString(story)}&rdquo;</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Requirements by Priority */}
      {data.requirements && data.requirements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#8D6AFA]" />
            Requirements (MoSCoW)
          </h3>

          {mustHave.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Must Have ({mustHave.length})
              </h4>
              {mustHave.map((req, idx) => (
                <RequirementCard key={idx} requirement={req} index={idx} />
              ))}
            </div>
          )}

          {shouldHave.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Should Have ({shouldHave.length})
              </h4>
              {shouldHave.map((req, idx) => (
                <RequirementCard key={idx} requirement={req} index={mustHave.length + idx} />
              ))}
            </div>
          )}

          {couldHave.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Could Have ({couldHave.length})
              </h4>
              {couldHave.map((req, idx) => (
                <RequirementCard key={idx} requirement={req} index={mustHave.length + shouldHave.length + idx} />
              ))}
            </div>
          )}

          {wontHave.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Won&apos;t Have ({wontHave.length})
              </h4>
              {wontHave.map((req, idx) => (
                <RequirementCard key={idx} requirement={req} index={mustHave.length + shouldHave.length + couldHave.length + idx} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success Metrics */}
      {data.successMetrics && data.successMetrics.length > 0 && (
        <SectionCard title="Success Metrics" icon={BarChart3} iconColor="text-[#14D0DC]">
          <BulletList items={data.successMetrics} bulletColor="bg-[#14D0DC]" />
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
