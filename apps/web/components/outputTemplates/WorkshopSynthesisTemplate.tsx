'use client';

import {
  Calendar,
  Users,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  ArrowRight,
  ParkingSquare,
} from 'lucide-react';
import type { WorkshopSynthesisOutput } from '@transcribe/shared';
import {
  BulletList,
  MetadataRow,
  safeString,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EditorialCollapsible,
  EDITORIAL,
} from './shared';

interface WorkshopSynthesisTemplateProps {
  data: WorkshopSynthesisOutput;
}

export function WorkshopSynthesisTemplate({ data }: WorkshopSynthesisTemplateProps) {
  const metadata = (data.date || data.facilitator || (data.participants && data.participants.length > 0)) ? (
    <MetadataRow
      items={[
        { label: 'Date', value: safeString(data.date), icon: Calendar },
        { label: 'Facilitator', value: safeString(data.facilitator) },
        { label: 'Participants', value: data.participants?.length, icon: Users },
      ]}
    />
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle
        title={safeString(data.title) || 'Workshop Synthesis'}
        metadata={metadata}
      />

      {/* Participants */}
      {data.participants && data.participants.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {data.participants.map((participant, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
            >
              {safeString(participant)}
            </span>
          ))}
        </div>
      )}

      {/* Objectives */}
      {data.objectives && data.objectives.length > 0 && (
        <EditorialPullQuote color="#8D6AFA">
          <p className={`${EDITORIAL.sectionLabel} mb-3 not-italic flex items-center gap-2`}>
            <Target className="w-3.5 h-3.5" />
            Workshop Objectives
          </p>
          <BulletList items={data.objectives} bulletColor="bg-[#8D6AFA]" />
        </EditorialPullQuote>
      )}

      {/* Outcomes */}
      {data.outcomes && data.outcomes.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>
            <span className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Key Outcomes
            </span>
          </EditorialHeading>

          <div className="space-y-6 mt-4">
            {data.outcomes.map((outcome, idx) => (
              <div
                key={idx}
                className={`${idx > 0 ? EDITORIAL.sectionBorder + ' pt-6' : ''}`}
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {safeString(outcome.topic)}
                </h3>

                {/* Insights */}
                {outcome.insights && outcome.insights.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                      <Lightbulb className="w-4 h-4" />
                      Insights
                    </div>
                    <BulletList
                      items={outcome.insights}
                      bulletColor="bg-blue-500"
                      className={EDITORIAL.listItem}
                    />
                  </div>
                )}

                {/* Decisions */}
                {outcome.decisions && outcome.decisions.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Decisions
                    </div>
                    <BulletList
                      items={outcome.decisions}
                      bulletColor="bg-green-500"
                      className={EDITORIAL.listItem}
                    />
                  </div>
                )}

                {/* Open Items */}
                {outcome.openItems && outcome.openItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      Open Items
                    </div>
                    <BulletList
                      items={outcome.openItems}
                      bulletColor="bg-amber-500"
                      className={EDITORIAL.listItem}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <EditorialSection label="Action Items" icon={ListTodo} borderTop>
          <EditorialNumberedList
            items={data.actionItems.map((item) => ({
              primary: (
                <span className={EDITORIAL.listItem}>
                  {safeString(item.action)}
                </span>
              ),
              secondary: (item.owner || item.dueDate) ? (
                <span className="flex flex-wrap gap-3">
                  {item.owner && <span>Owner: {safeString(item.owner)}</span>}
                  {item.dueDate && <span>Due: {safeString(item.dueDate)}</span>}
                </span>
              ) : undefined,
            }))}
          />
        </EditorialSection>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <EditorialSection label="Next Steps" icon={ArrowRight} borderTop>
          <BulletList items={data.nextSteps} bulletColor="bg-[#14D0DC]" className={EDITORIAL.listItem} />
        </EditorialSection>
      )}

      {/* Parking Lot */}
      {data.parkingLot && data.parkingLot.length > 0 && (
        <EditorialCollapsible label="Parking Lot" icon={ParkingSquare} count={data.parkingLot.length}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 italic">
            Items to address in future discussions
          </p>
          <BulletList
            items={data.parkingLot}
            bulletColor="bg-gray-400"
            className={EDITORIAL.listItem}
          />
        </EditorialCollapsible>
      )}
    </EditorialArticle>
  );
}
