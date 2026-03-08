'use client';

import {
  ThumbsUp,
  AlertTriangle,
  ListTodo,
  Award,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import type { RetrospectiveOutput } from '@transcribe/shared';
import {
  MetadataRow,
  safeString,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialNumberedList,
  EditorialPullQuote,
  EDITORIAL,
} from './shared';

interface RetrospectiveTemplateProps {
  data: RetrospectiveOutput;
}

function getMoodIcon(mood?: string) {
  if (!mood) return null;
  const lowerMood = mood.toLowerCase();
  if (lowerMood.includes('positive') || lowerMood.includes('happy') || lowerMood.includes('good') || lowerMood.includes('constructive') || lowerMood.includes('aligned')) {
    return <Smile className="w-4 h-4 text-green-500" />;
  }
  if (lowerMood.includes('negative') || lowerMood.includes('frustrated') || lowerMood.includes('bad')) {
    return <Frown className="w-4 h-4 text-red-500" />;
  }
  return <Meh className="w-4 h-4 text-amber-500" />;
}

function getMoodColor(mood?: string): string {
  if (!mood) return '#8D6AFA';
  const lowerMood = mood.toLowerCase();
  if (lowerMood.includes('positive') || lowerMood.includes('happy') || lowerMood.includes('good') || lowerMood.includes('constructive') || lowerMood.includes('aligned')) {
    return '#22c55e';
  }
  if (lowerMood.includes('negative') || lowerMood.includes('frustrated') || lowerMood.includes('bad')) {
    return '#ef4444';
  }
  return '#f59e0b';
}

/** Parse team into an array of name strings */
function parseTeam(team: unknown): string[] {
  if (!team) return [];
  if (Array.isArray(team)) {
    return team.map((t) => {
      if (typeof t === 'string') return t;
      if (typeof t === 'object' && t !== null) {
        const obj = t as Record<string, unknown>;
        return String(obj.name || obj.title || obj.label || t);
      }
      return String(t);
    }).filter(Boolean);
  }
  if (typeof team === 'string') {
    return team.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [safeString(team)].filter(Boolean);
}

/** Chevron bullet list matching blog post style */
function ChevronList({ items, color }: { items: string[]; color: 'green' | 'amber' | 'neutral' }) {
  const bgColor = color === 'green' ? 'bg-green-600 dark:bg-green-500' : color === 'amber' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-gray-800 dark:bg-gray-200';
  const textColor = color === 'neutral' ? 'text-white dark:text-gray-800' : 'text-white dark:text-gray-800';

  return (
    <ul className="list-none pl-0 space-y-2.5">
      {items.map((item, idx) => {
        const text = safeString(item);
        if (!text) return null;
        return (
          <li key={idx} className={`flex items-start gap-3 ${EDITORIAL.listItem}`}>
            <span className={`flex-shrink-0 w-5 h-5 rounded-full ${bgColor} ${textColor} text-[10px] font-bold flex items-center justify-center mt-[3px]`}>&gt;</span>
            <span className="flex-1">{text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function RetrospectiveTemplate({ data }: RetrospectiveTemplateProps) {
  const teamMembers = parseTeam(data.team);

  const metadata = data.sprintOrPeriod ? (
    <MetadataRow
      items={[
        { label: 'Sprint/Period', value: data.sprintOrPeriod },
      ]}
    />
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title="Sprint Retrospective" metadata={metadata} />

      {/* Team Members as badges */}
      {teamMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {teamMembers.map((name, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Team Mood */}
      {data.teamMood && (
        <EditorialPullQuote color={getMoodColor(data.teamMood)}>
          <p className="flex items-center gap-2 not-italic">
            {getMoodIcon(data.teamMood)}
            <span className={`${EDITORIAL.sectionLabel} not-italic`}>Team Mood:</span>
            <span className="text-base font-medium text-gray-900 dark:text-gray-100 not-italic" style={{ fontFamily: 'inherit' }}>
              {safeString(data.teamMood)}
            </span>
          </p>
        </EditorialPullQuote>
      )}

      {/* What Went Well */}
      {data.wentWell && data.wentWell.length > 0 && (
        <EditorialSection label="What Went Well" icon={ThumbsUp} borderTop>
          <ChevronList items={data.wentWell} color="green" />
        </EditorialSection>
      )}

      {/* What to Improve */}
      {data.toImprove && data.toImprove.length > 0 && (
        <EditorialSection label="What to Improve" icon={AlertTriangle} borderTop>
          <ChevronList items={data.toImprove} color="amber" />
        </EditorialSection>
      )}

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <EditorialSection label="Action Items" icon={ListTodo} borderTop>
          <EditorialNumberedList
            items={data.actionItems.map((item) => {
              const owner = item.owner ? safeString(item.owner) : '';
              const dueDate = item.dueDate ? safeString(item.dueDate) : '';
              const secondaryParts: string[] = [];
              if (owner) secondaryParts.push(`Owner: ${owner}`);
              if (dueDate) secondaryParts.push(`Due: ${dueDate}`);

              return {
                primary: (
                  <span className="text-gray-700 dark:text-gray-300">
                    {safeString(item.action)}
                  </span>
                ),
                secondary: secondaryParts.length > 0
                  ? secondaryParts.join(' · ')
                  : undefined,
              };
            })}
          />
        </EditorialSection>
      )}

      {/* Shoutouts */}
      {data.shoutouts && data.shoutouts.length > 0 && (
        <EditorialSection label="Shoutouts" icon={Award} borderTop>
          <ChevronList
            items={data.shoutouts.map((shoutout) => {
              if (typeof shoutout === 'string') return shoutout;
              const obj = shoutout as unknown as { name?: string; reason?: string };
              if (obj.name && obj.reason) return `${obj.name}: ${obj.reason}`;
              if (obj.name) return obj.name;
              return String(shoutout);
            })}
            color="neutral"
          />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
