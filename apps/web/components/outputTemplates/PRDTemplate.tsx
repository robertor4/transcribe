'use client';

import {
  Target,
  Ban,
  Users,
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
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EditorialParagraphs,
  EditorialCollapsible,
  BulletList,
  StatusBadge,
  EDITORIAL,
  safeString,
} from './shared';

interface PRDTemplateProps {
  data: PRDOutput;
}

function requirementItems(requirements: PRDRequirement[], startIndex: number) {
  return requirements.map((req, idx) => ({
    primary: (
      <span className="break-words">
        <span className="font-mono text-xs text-gray-400 dark:text-gray-500 mr-2">
          {req.id || `REQ-${String(startIndex + idx + 1).padStart(3, '0')}`}
        </span>
        {safeString(req.requirement)}
      </span>
    ),
    secondary: req.rationale ? safeString(req.rationale) : undefined,
    badge: <StatusBadge status={req.priority} variant="priority" />,
  }));
}

export function PRDTemplate({ data }: PRDTemplateProps) {
  // Group requirements by priority
  const mustHave = data.requirements?.filter(r => r.priority === 'must-have') || [];
  const shouldHave = data.requirements?.filter(r => r.priority === 'should-have') || [];
  const couldHave = data.requirements?.filter(r => r.priority === 'could-have') || [];
  const wontHave = data.requirements?.filter(r => r.priority === 'wont-have') || [];

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
        <StatusBadge status={data.status} variant="custom" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" />
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      {/* Title */}
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Problem Statement */}
      <EditorialSection label="Problem Statement" icon={Target} borderTop={false}>
        <EditorialPullQuote color="#ef4444">
          <EditorialParagraphs text={data.problemStatement} />
        </EditorialPullQuote>
      </EditorialSection>

      {/* Goals */}
      {data.goals && data.goals.length > 0 && (
        <EditorialSection label="Goals" icon={Target} borderTop>
          <BulletList items={data.goals} bulletColor="bg-green-500" />
        </EditorialSection>
      )}

      {/* Non-Goals */}
      {data.nonGoals && data.nonGoals.length > 0 && (
        <EditorialSection label="Non-Goals" icon={Ban} borderTop>
          <BulletList items={data.nonGoals} bulletColor="bg-gray-400" />
        </EditorialSection>
      )}

      {/* User Stories */}
      {data.userStories && data.userStories.length > 0 && (
        <EditorialSection label="User Stories" icon={Users} borderTop>
          <div className="space-y-4">
            {data.userStories.map((story, idx) => (
              <EditorialPullQuote key={idx} color="#3b82f6">
                <p>{safeString(story)}</p>
              </EditorialPullQuote>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Requirements (MoSCoW) */}
      {data.requirements && data.requirements.length > 0 && (
        <EditorialSection label="Requirements (MoSCoW)" icon={CheckSquare} borderTop>
          {mustHave.length > 0 && (
            <div className="mb-8">
              <EditorialHeading>Must Have ({mustHave.length})</EditorialHeading>
              <EditorialNumberedList items={requirementItems(mustHave, 0)} />
            </div>
          )}

          {shouldHave.length > 0 && (
            <div className="mb-8">
              <EditorialHeading>Should Have ({shouldHave.length})</EditorialHeading>
              <EditorialNumberedList
                items={requirementItems(shouldHave, mustHave.length)}
              />
            </div>
          )}

          {couldHave.length > 0 && (
            <div className="mb-8">
              <EditorialHeading>Could Have ({couldHave.length})</EditorialHeading>
              <EditorialNumberedList
                items={requirementItems(couldHave, mustHave.length + shouldHave.length)}
              />
            </div>
          )}

          {wontHave.length > 0 && (
            <EditorialCollapsible
              label={`Won't Have`}
              count={wontHave.length}
              defaultOpen={false}
            >
              <EditorialNumberedList
                items={requirementItems(
                  wontHave,
                  mustHave.length + shouldHave.length + couldHave.length,
                )}
              />
            </EditorialCollapsible>
          )}
        </EditorialSection>
      )}

      {/* Success Metrics */}
      {data.successMetrics && data.successMetrics.length > 0 && (
        <EditorialSection label="Success Metrics" icon={BarChart3} borderTop>
          <BulletList items={data.successMetrics} bulletColor="bg-[#14D0DC]" />
        </EditorialSection>
      )}

      {/* Open Questions */}
      {data.openQuestions && data.openQuestions.length > 0 && (
        <EditorialSection label="Open Questions" icon={HelpCircle} borderTop>
          <EditorialNumberedList
            items={data.openQuestions.map(q => ({
              primary: <span className={EDITORIAL.listItem}>{safeString(q)}</span>,
            }))}
          />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
