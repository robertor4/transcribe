'use client';

import {
  RotateCcw,
  ThumbsUp,
  AlertTriangle,
  ListTodo,
  Award,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import type { RetrospectiveOutput } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow } from './shared';

interface RetrospectiveTemplateProps {
  data: RetrospectiveOutput;
}

function getMoodIcon(mood?: string) {
  if (!mood) return null;
  const lowerMood = mood.toLowerCase();
  if (lowerMood.includes('positive') || lowerMood.includes('happy') || lowerMood.includes('good')) {
    return <Smile className="w-5 h-5 text-green-500" />;
  }
  if (lowerMood.includes('negative') || lowerMood.includes('frustrated') || lowerMood.includes('bad')) {
    return <Frown className="w-5 h-5 text-red-500" />;
  }
  return <Meh className="w-5 h-5 text-amber-500" />;
}

export function RetrospectiveTemplate({ data }: RetrospectiveTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <RotateCcw className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              Sprint Retrospective
            </h2>
            <MetadataRow
              items={[
                { label: 'Sprint/Period', value: data.sprintOrPeriod },
                { label: 'Team', value: data.team },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Team Mood */}
      {data.teamMood && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          {getMoodIcon(data.teamMood)}
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Team Mood:</span>
            <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">{data.teamMood}</span>
          </div>
        </div>
      )}

      {/* What Went Well & What to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Went Well */}
        {data.wentWell && data.wentWell.length > 0 && (
          <SectionCard
            title="What Went Well"
            icon={ThumbsUp}
            iconColor="text-green-500"
            className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30"
          >
            <BulletList
              items={data.wentWell}
              bulletColor="bg-green-500"
              className="text-gray-700 dark:text-gray-300"
            />
          </SectionCard>
        )}

        {/* To Improve */}
        {data.toImprove && data.toImprove.length > 0 && (
          <SectionCard
            title="What to Improve"
            icon={AlertTriangle}
            iconColor="text-amber-500"
            className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
          >
            <BulletList
              items={data.toImprove}
              bulletColor="bg-amber-500"
              className="text-gray-700 dark:text-gray-300"
            />
          </SectionCard>
        )}
      </div>

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <SectionCard title="Action Items" icon={ListTodo} iconColor="text-[#8D6AFA]">
          <div className="space-y-3">
            {data.actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#8D6AFA]">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 dark:text-gray-300 break-words">{item.action}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {item.owner && <span>Owner: {item.owner}</span>}
                    {item.dueDate && <span>Due: {item.dueDate}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Shoutouts */}
      {data.shoutouts && data.shoutouts.length > 0 && (
        <SectionCard
          title="Shoutouts"
          icon={Award}
          iconColor="text-yellow-500"
          className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30"
        >
          <BulletList
            items={data.shoutouts}
            bulletColor="bg-yellow-500"
            className="text-gray-700 dark:text-gray-300"
          />
        </SectionCard>
      )}
    </div>
  );
}
