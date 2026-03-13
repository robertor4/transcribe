'use client';

import {
  Calendar,
  Building2,
  Trophy,
  Bell,
  HelpCircle,
  Megaphone,
} from 'lucide-react';
import type { AllHandsTalkingPointsOutput } from '@transcribe/shared';
import {
  BulletList,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  EDITORIAL,
} from './shared';

interface AllHandsTalkingPointsTemplateProps {
  data: AllHandsTalkingPointsOutput;
}

export function AllHandsTalkingPointsTemplate({ data }: AllHandsTalkingPointsTemplateProps) {
  const metadata = data.date ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {data.date}
      </span>
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle
        title={data.title || 'All Hands Talking Points'}
        metadata={metadata}
      />

      {/* Opening Remarks */}
      {data.openingRemarks && (
        <EditorialPullQuote>
          {Array.isArray(data.openingRemarks) ? (
            data.openingRemarks.map((line, i) => <p key={i}>{line}</p>)
          ) : (
            <p>{data.openingRemarks}</p>
          )}
        </EditorialPullQuote>
      )}

      {/* Key Announcements — high-signal items before detail */}
      {data.keyAnnouncements && data.keyAnnouncements.length > 0 && (
        <EditorialSection label="Key Announcements" icon={Megaphone} borderTop={false}>
          <BulletList items={data.keyAnnouncements} bulletColor="bg-[#8D6AFA]" variant="chevron" boldBeforeColon />
        </EditorialSection>
      )}

      {/* Company Updates */}
      {data.companyUpdates && data.companyUpdates.length > 0 && (
        <EditorialSection label="Company Updates" icon={Building2}>
          <BulletList items={data.companyUpdates} bulletColor="bg-blue-500" />
        </EditorialSection>
      )}

      {/* Team Wins */}
      {data.teamWins && data.teamWins.length > 0 && (
        <EditorialSection label="Team Wins" icon={Trophy} borderTop>
          <BulletList items={data.teamWins} bulletColor="bg-yellow-500" />
        </EditorialSection>
      )}

      {/* Announcements */}
      {data.announcements && data.announcements.length > 0 && (
        <EditorialSection label="Announcements" icon={Bell} borderTop>
          <BulletList items={data.announcements} bulletColor="bg-red-500" />
        </EditorialSection>
      )}

      {/* Upcoming Priorities */}
      {data.upcomingPriorities && data.upcomingPriorities.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Upcoming Priorities</EditorialHeading>
          <EditorialNumberedList
            items={data.upcomingPriorities.map((priority) => ({
              primary: <span className={EDITORIAL.listItem}>{priority}</span>,
            }))}
          />
        </section>
      )}

      {/* Q&A Topics */}
      {data.qaTopics && data.qaTopics.length > 0 && (
        <EditorialSection label="Suggested Q&A Topics" icon={HelpCircle} borderTop>
          <BulletList items={data.qaTopics} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* Closing Remarks */}
      {data.closingRemarks && (
        <EditorialSection label="Closing Remarks" borderTop>
          {Array.isArray(data.closingRemarks) ? (
            <div className="space-y-2">
              {data.closingRemarks.map((line, i) => (
                <p key={i} className={EDITORIAL.body}>{line}</p>
              ))}
            </div>
          ) : (
            <p className={EDITORIAL.body}>{data.closingRemarks}</p>
          )}
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
