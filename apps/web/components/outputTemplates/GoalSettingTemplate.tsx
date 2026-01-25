'use client';

import {
  Target,
  Calendar,
  User,
  Eye,
  CheckSquare,
  Ruler,
  Award,
  Link,
  Clock,
  Flag,
  AlertTriangle,
  HelpCircle,
  CalendarDays,
} from 'lucide-react';
import type { GoalSettingOutput, SmartGoal } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox } from './shared';

interface GoalSettingTemplateProps {
  data: GoalSettingOutput;
}

function SmartGoalCard({ goal, index }: { goal: SmartGoal; index: number }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
      {/* Goal Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10 border-b border-gray-200 dark:border-gray-700/50">
        <div className="w-8 h-8 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[#8D6AFA]">{index + 1}</span>
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{goal.goal}</h4>
      </div>

      {/* SMART Breakdown */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Specific */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-medium text-blue-700 dark:text-blue-400 flex-shrink-0">
              <CheckSquare className="w-3 h-3" />
              S
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{goal.specific}</p>
          </div>

          {/* Measurable */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-xs font-medium text-green-700 dark:text-green-400 flex-shrink-0">
              <Ruler className="w-3 h-3" />
              M
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{goal.measurable}</p>
          </div>

          {/* Achievable */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs font-medium text-amber-700 dark:text-amber-400 flex-shrink-0">
              <Award className="w-3 h-3" />
              A
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{goal.achievable}</p>
          </div>

          {/* Relevant */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-medium text-purple-700 dark:text-purple-400 flex-shrink-0">
              <Link className="w-3 h-3" />
              R
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{goal.relevant}</p>
          </div>
        </div>

        {/* Time-Bound */}
        <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#14D0DC]/10 rounded text-xs font-medium text-[#14D0DC] flex-shrink-0">
            <Clock className="w-3 h-3" />
            T
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{goal.timeBound}</p>
        </div>

        {/* Milestones */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-4 h-4 text-[#8D6AFA]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestones</span>
            </div>
            <div className="space-y-1.5">
              {goal.milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full border-2 border-[#8D6AFA]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-[#8D6AFA]">{idx + 1}</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">{milestone}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function GoalSettingTemplate({ data }: GoalSettingTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Goal Setting Document
            </h2>
            <MetadataRow
              items={[
                { label: 'Participant', value: data.participant, icon: User },
                { label: 'Period', value: data.period, icon: CalendarDays },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Vision */}
      {data.vision && (
        <InfoBox title="Vision" icon={Eye} variant="purple">
          {data.vision}
        </InfoBox>
      )}

      {/* SMART Goals */}
      {data.goals && data.goals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#8D6AFA]" />
            SMART Goals
          </h3>
          {data.goals.map((goal, idx) => (
            <SmartGoalCard key={idx} goal={goal} index={idx} />
          ))}
        </div>
      )}

      {/* Obstacles and Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.potentialObstacles && data.potentialObstacles.length > 0 && (
          <SectionCard
            title="Potential Obstacles"
            icon={AlertTriangle}
            iconColor="text-amber-500"
            className="bg-amber-50/50 dark:bg-amber-900/10"
          >
            <BulletList items={data.potentialObstacles} bulletColor="bg-amber-500" />
          </SectionCard>
        )}
        {data.supportNeeded && data.supportNeeded.length > 0 && (
          <SectionCard
            title="Support Needed"
            icon={HelpCircle}
            iconColor="text-blue-500"
            className="bg-blue-50/50 dark:bg-blue-900/10"
          >
            <BulletList items={data.supportNeeded} bulletColor="bg-blue-500" />
          </SectionCard>
        )}
      </div>

      {/* Check-in Schedule */}
      {data.checkInSchedule && (
        <SectionCard title="Check-in Schedule" icon={CalendarDays} iconColor="text-[#14D0DC]">
          <p className="text-gray-700 dark:text-gray-300">{data.checkInSchedule}</p>
        </SectionCard>
      )}
    </div>
  );
}
