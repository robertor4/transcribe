'use client';

import {
  Megaphone,
  Calendar,
  MessageSquare,
  Building2,
  Trophy,
  Bell,
  Target,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import type { AllHandsTalkingPointsOutput } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox, MetadataRow } from './shared';

interface AllHandsTalkingPointsTemplateProps {
  data: AllHandsTalkingPointsOutput;
}

export function AllHandsTalkingPointsTemplate({ data }: AllHandsTalkingPointsTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Megaphone className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {data.title || 'All Hands Talking Points'}
            </h2>
            <MetadataRow
              items={[{ label: 'Date', value: data.date, icon: Calendar }]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Opening Remarks */}
      <InfoBox title="Opening Remarks" icon={MessageSquare} variant="purple">
        {data.openingRemarks}
      </InfoBox>

      {/* Company Updates */}
      {data.companyUpdates && data.companyUpdates.length > 0 && (
        <SectionCard title="Company Updates" icon={Building2} iconColor="text-blue-500">
          <BulletList items={data.companyUpdates} bulletColor="bg-blue-500" />
        </SectionCard>
      )}

      {/* Team Wins */}
      {data.teamWins && data.teamWins.length > 0 && (
        <SectionCard
          title="Team Wins"
          icon={Trophy}
          iconColor="text-yellow-500"
          className="bg-yellow-50/50 dark:bg-yellow-900/10"
        >
          <BulletList items={data.teamWins} bulletColor="bg-yellow-500" />
        </SectionCard>
      )}

      {/* Announcements */}
      {data.announcements && data.announcements.length > 0 && (
        <SectionCard
          title="Announcements"
          icon={Bell}
          iconColor="text-red-500"
          className="bg-red-50/30 dark:bg-red-900/10"
        >
          <BulletList items={data.announcements} bulletColor="bg-red-500" />
        </SectionCard>
      )}

      {/* Upcoming Priorities */}
      {data.upcomingPriorities && data.upcomingPriorities.length > 0 && (
        <SectionCard title="Upcoming Priorities" icon={Target} iconColor="text-[#14D0DC]">
          <div className="space-y-2">
            {data.upcomingPriorities.map((priority, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#14D0DC]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#14D0DC]">{idx + 1}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 break-words">{priority}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Q&A Topics */}
      {data.qaTopics && data.qaTopics.length > 0 && (
        <SectionCard title="Suggested Q&A Topics" icon={HelpCircle} iconColor="text-amber-500">
          <BulletList items={data.qaTopics} bulletColor="bg-amber-500" />
        </SectionCard>
      )}

      {/* Closing Remarks */}
      <InfoBox title="Closing Remarks" icon={MessageCircle} variant="gray">
        {data.closingRemarks}
      </InfoBox>
    </div>
  );
}
