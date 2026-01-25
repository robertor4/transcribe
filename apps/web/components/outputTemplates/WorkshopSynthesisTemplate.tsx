'use client';

import {
  Presentation,
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
import { SectionCard, BulletList, MetadataRow, InfoBox, safeString } from './shared';

interface WorkshopSynthesisTemplateProps {
  data: WorkshopSynthesisOutput;
}

export function WorkshopSynthesisTemplate({ data }: WorkshopSynthesisTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Presentation className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {safeString(data.title) || 'Workshop Synthesis'}
            </h2>
            <MetadataRow
              items={[
                { label: 'Date', value: safeString(data.date), icon: Calendar },
                { label: 'Facilitator', value: safeString(data.facilitator) },
                { label: 'Participants', value: data.participants?.length, icon: Users },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Participants */}
      {data.participants && data.participants.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
        <InfoBox title="Workshop Objectives" icon={Target} variant="purple">
          <BulletList items={data.objectives} bulletColor="bg-[#8D6AFA]" />
        </InfoBox>
      )}

      {/* Outcomes */}
      {data.outcomes && data.outcomes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Key Outcomes
          </h3>
          {data.outcomes.map((outcome, idx) => (
            <SectionCard key={idx} variant="outlined">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {safeString(outcome.topic)}
              </h4>

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
                    className="text-gray-600 dark:text-gray-400"
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
                    className="text-gray-600 dark:text-gray-400"
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
                    className="text-gray-600 dark:text-gray-400"
                  />
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}

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
                  <p className="text-gray-700 dark:text-gray-300 break-words">{safeString(item.action)}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {item.owner && <span>Owner: {safeString(item.owner)}</span>}
                    {item.dueDate && <span>Due: {safeString(item.dueDate)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <InfoBox title="Next Steps" icon={ArrowRight} variant="cyan">
          <BulletList items={data.nextSteps} bulletColor="bg-[#14D0DC]" />
        </InfoBox>
      )}

      {/* Parking Lot */}
      {data.parkingLot && data.parkingLot.length > 0 && (
        <SectionCard
          title="Parking Lot"
          icon={ParkingSquare}
          iconColor="text-gray-500"
          className="bg-gray-50 dark:bg-gray-800/50"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Items to address in future discussions
          </p>
          <BulletList
            items={data.parkingLot}
            bulletColor="bg-gray-400"
            className="text-gray-600 dark:text-gray-400"
          />
        </SectionCard>
      )}
    </div>
  );
}
