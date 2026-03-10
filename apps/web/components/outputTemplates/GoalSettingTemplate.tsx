'use client';

import {
  Calendar,
  User,
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
import {
  BulletList,
  MetadataRow,
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialPullQuote,
  EditorialNumberedList,
} from './shared';

interface GoalSettingTemplateProps {
  data: GoalSettingOutput;
}

function SmartGoalCard({ goal, index }: { goal: SmartGoal; index: number }) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 pb-2">
      {/* Goal Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className={EDITORIAL.numbering}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {goal.goal}
        </h4>
      </div>

      {/* SMART Breakdown */}
      <div className="pl-9 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Specific */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-medium text-blue-700 dark:text-blue-400 flex-shrink-0">
              <CheckSquare className="w-3 h-3" />
              S
            </div>
            <p className={EDITORIAL.listItem}>{goal.specific}</p>
          </div>

          {/* Measurable */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-xs font-medium text-green-700 dark:text-green-400 flex-shrink-0">
              <Ruler className="w-3 h-3" />
              M
            </div>
            <p className={EDITORIAL.listItem}>{goal.measurable}</p>
          </div>

          {/* Achievable */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs font-medium text-amber-700 dark:text-amber-400 flex-shrink-0">
              <Award className="w-3 h-3" />
              A
            </div>
            <p className={EDITORIAL.listItem}>{goal.achievable}</p>
          </div>

          {/* Relevant */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-medium text-purple-700 dark:text-purple-400 flex-shrink-0">
              <Link className="w-3 h-3" />
              R
            </div>
            <p className={EDITORIAL.listItem}>{goal.relevant}</p>
          </div>
        </div>

        {/* Time-Bound */}
        <div className="flex items-start gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#14D0DC]/10 rounded text-xs font-medium text-[#14D0DC] flex-shrink-0">
            <Clock className="w-3 h-3" />
            T
          </div>
          <p className={EDITORIAL.listItem}>{goal.timeBound}</p>
        </div>

        {/* Milestones */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-3.5 h-3.5 text-[#8D6AFA]" />
              <span className={EDITORIAL.sectionLabel}>Milestones</span>
            </div>
            <EditorialNumberedList
              items={goal.milestones.map((milestone) => ({
                primary: milestone,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function GoalSettingTemplate({ data }: GoalSettingTemplateProps) {
  const metadata = (data.participant || data.period || data.date) ? (
    <MetadataRow
      items={[
        ...(data.participant ? [{ label: 'Participant', value: data.participant, icon: User }] : []),
        ...(data.period ? [{ label: 'Period', value: data.period, icon: CalendarDays }] : []),
        ...(data.date ? [{ label: 'Date', value: data.date, icon: Calendar }] : []),
      ]}
    />
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title="Goal Setting Document" metadata={metadata} />

      {/* Vision */}
      {data.vision && (
        <EditorialPullQuote cite="Vision">
          <p>{data.vision}</p>
        </EditorialPullQuote>
      )}

      {/* SMART Goals */}
      {data.goals && data.goals.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>SMART Goals</EditorialHeading>
          <div className="mt-2">
            {data.goals.map((goal, idx) => (
              <SmartGoalCard key={idx} goal={goal} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Obstacles and Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.potentialObstacles && data.potentialObstacles.length > 0 && (
          <EditorialSection label="Potential Obstacles" icon={AlertTriangle} borderTop>
            <BulletList items={data.potentialObstacles} bulletColor="bg-amber-500" />
          </EditorialSection>
        )}
        {data.supportNeeded && data.supportNeeded.length > 0 && (
          <EditorialSection label="Support Needed" icon={HelpCircle} borderTop>
            <BulletList items={data.supportNeeded} bulletColor="bg-blue-500" />
          </EditorialSection>
        )}
      </div>

      {/* Check-in Schedule */}
      {data.checkInSchedule && (
        <EditorialSection label="Check-in Schedule" icon={CalendarDays} borderTop>
          <p className={EDITORIAL.body}>{data.checkInSchedule}</p>
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
