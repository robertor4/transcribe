'use client';

import {
  Clock,
  Users,
  User,
  Hash,
  Calendar,
  Lightbulb,
  Link,
  ArrowRight,
  Quote,
} from 'lucide-react';
import type { PodcastShowNotesOutput, PodcastSegment } from '@transcribe/shared';
import {
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  EditorialNumberedList,
} from './shared';

interface PodcastShowNotesTemplateProps {
  data: PodcastShowNotesOutput;
}

function SegmentCard({ segment, index }: { segment: PodcastSegment; index: number }) {
  return (
    <div className="flex gap-3 py-4">
      <span className={EDITORIAL.numbering}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-[15px]">
            {segment.topic}
          </h4>
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500 flex-shrink-0">
            {segment.timestamp}
          </span>
        </div>
        {segment.notes && segment.notes.length > 0 && (
          <ul className="space-y-1.5 mt-2">
            {segment.notes.map((note, idx) => (
              <li key={idx} className={`flex items-start gap-2 ${EDITORIAL.listItem}`}>
                <span className="mt-2 w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
        {segment.quotes && segment.quotes.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {segment.quotes.map((quote, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-[#14D0DC] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PodcastShowNotesTemplate({ data }: PodcastShowNotesTemplateProps) {
  const metadata = (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.episodeNumber && (
        <span className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5" />
          <span className="text-gray-400">Episode</span> #{data.episodeNumber}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      {data.hosts && data.hosts.length > 0 && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span className="text-gray-400">Host{data.hosts.length > 1 ? 's' : ''}:</span> {data.hosts.join(', ')}
        </span>
      )}
      {data.guests && data.guests.length > 0 && (
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span className="text-gray-400">Guest{data.guests.length > 1 ? 's' : ''}:</span> {data.guests.join(', ')}
        </span>
      )}
    </div>
  );

  const hasMetadata = data.episodeNumber || data.date ||
    (data.hosts && data.hosts.length > 0) ||
    (data.guests && data.guests.length > 0);

  return (
    <EditorialArticle>
      <EditorialTitle
        title={data.episodeTitle}
        metadata={hasMetadata ? metadata : undefined}
      />

      {/* Episode Summary */}
      {data.summary && (
        <EditorialPullQuote>
          <p>{data.summary}</p>
        </EditorialPullQuote>
      )}

      {/* Episode Segments */}
      {data.segments && data.segments.length > 0 && (
        <EditorialSection label="Episode Segments" icon={Clock} borderTop>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.segments.map((segment, idx) => (
              <SegmentCard key={idx} segment={segment} index={idx} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Key Takeaways */}
      {data.keyTakeaways && data.keyTakeaways.length > 0 && (
        <EditorialSection label="Key Takeaways" icon={Lightbulb} borderTop>
          <EditorialNumberedList
            items={data.keyTakeaways.map(takeaway => ({
              primary: takeaway,
            }))}
          />
        </EditorialSection>
      )}

      {/* Resources & Links */}
      {data.resources && data.resources.length > 0 && (
        <EditorialSection label="Resources & Links" icon={Link} borderTop>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.resources.map((resource, idx) => (
              <div key={idx} className="flex items-start gap-3 py-3">
                <span className={EDITORIAL.numbering}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`${EDITORIAL.listItem} font-medium text-gray-900 dark:text-gray-100`}>
                    {resource.title}
                  </span>
                  {resource.url && (
                    <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-all">
                      {resource.url}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Call to Action */}
      {data.callToAction && (
        <EditorialSection label="Call to Action" icon={ArrowRight} borderTop>
          <p className={EDITORIAL.body}>{data.callToAction}</p>
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
