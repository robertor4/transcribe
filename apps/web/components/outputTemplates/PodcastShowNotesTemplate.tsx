'use client';

import {
  Mic,
  Calendar,
  Users,
  User,
  Hash,
  Clock,
  MessageSquare,
  Lightbulb,
  Link,
  ArrowRight,
  Quote,
} from 'lucide-react';
import type { PodcastShowNotesOutput, PodcastSegment } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox } from './shared';

interface PodcastShowNotesTemplateProps {
  data: PodcastShowNotesOutput;
}

function SegmentCard({ segment }: { segment: PodcastSegment }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 bg-[#8D6AFA]/10 rounded text-xs font-mono text-[#8D6AFA]">
            <Clock className="w-3 h-3" />
            {segment.timestamp}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{segment.topic}</h4>
          {segment.notes && segment.notes.length > 0 && (
            <ul className="space-y-1 mb-3">
              {segment.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
          {segment.quotes && segment.quotes.length > 0 && (
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
              {segment.quotes.map((quote, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-[#14D0DC] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">&ldquo;{quote}&rdquo;</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PodcastShowNotesTemplate({ data }: PodcastShowNotesTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Mic className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.episodeTitle}
            </h2>
            <MetadataRow
              items={[
                { label: 'Episode', value: data.episodeNumber ? `#${data.episodeNumber}` : undefined, icon: Hash },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Hosts & Guests */}
      {(data.hosts && data.hosts.length > 0) || (data.guests && data.guests.length > 0) ? (
        <div className="flex flex-wrap gap-4">
          {data.hosts && data.hosts.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Host{data.hosts.length > 1 ? 's' : ''}: {data.hosts.join(', ')}
              </span>
            </div>
          )}
          {data.guests && data.guests.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Guest{data.guests.length > 1 ? 's' : ''}: {data.guests.join(', ')}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* Summary */}
      <InfoBox title="Episode Summary" icon={MessageSquare} variant="purple">
        {data.summary}
      </InfoBox>

      {/* Segments */}
      {data.segments && data.segments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#8D6AFA]" />
            Episode Segments
          </h3>
          {data.segments.map((segment, idx) => (
            <SegmentCard key={idx} segment={segment} />
          ))}
        </div>
      )}

      {/* Key Takeaways */}
      {data.keyTakeaways && data.keyTakeaways.length > 0 && (
        <SectionCard
          title="Key Takeaways"
          icon={Lightbulb}
          iconColor="text-amber-500"
          className="bg-amber-50/50 dark:bg-amber-900/10"
        >
          <BulletList items={data.keyTakeaways} bulletColor="bg-amber-500" />
        </SectionCard>
      )}

      {/* Resources */}
      {data.resources && data.resources.length > 0 && (
        <SectionCard title="Resources & Links" icon={Link} iconColor="text-blue-500">
          <div className="space-y-2">
            {data.resources.map((resource, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Link className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-700 dark:text-gray-300">{resource.title}</span>
                  {resource.url && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({resource.url})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Call to Action */}
      {data.callToAction && (
        <InfoBox title="Call to Action" icon={ArrowRight} variant="cyan">
          {data.callToAction}
        </InfoBox>
      )}
    </div>
  );
}
