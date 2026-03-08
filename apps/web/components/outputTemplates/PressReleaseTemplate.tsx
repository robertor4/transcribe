'use client';

import {
  MapPin,
  Building2,
  Phone,
} from 'lucide-react';
import type { PressReleaseOutput } from '@transcribe/shared';
import {
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
} from './shared';

interface PressReleaseTemplateProps {
  data: PressReleaseOutput;
}

export function PressReleaseTemplate({ data }: PressReleaseTemplateProps) {
  const metadata = data.dateline ? (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
      <MapPin className="w-3.5 h-3.5" />
      <span className="font-medium">{data.dateline}</span>
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.headline} metadata={metadata} />

      {/* Subheadline as pull quote */}
      {data.subheadline && (
        <EditorialPullQuote>
          <p>{data.subheadline}</p>
        </EditorialPullQuote>
      )}

      {/* Lead Paragraph */}
      <p className={`${EDITORIAL.body} font-medium text-lg mb-8`}>
        {data.lead}
      </p>

      {/* Body */}
      {data.body && data.body.length > 0 && (
        <div className="space-y-4 mb-10">
          {data.body.map((paragraph, idx) => (
            <p key={idx} className={EDITORIAL.body}>
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Quotes */}
      {data.quotes && data.quotes.length > 0 && (
        <div className="space-y-6 mb-10">
          {data.quotes.map((quote, idx) => (
            <EditorialPullQuote
              key={idx}
              cite={
                quote.title
                  ? `${quote.attribution}, ${quote.title}`
                  : quote.attribution
              }
            >
              <p>&ldquo;{quote.quote}&rdquo;</p>
            </EditorialPullQuote>
          ))}
        </div>
      )}

      {/* Boilerplate */}
      <EditorialSection label="About" icon={Building2} borderTop>
        <p className={EDITORIAL.body}>{data.boilerplate}</p>
      </EditorialSection>

      {/* Contact Info */}
      {data.contactInfo && (
        <EditorialSection label="Media Contact" icon={Phone} borderTop>
          <p className={`${EDITORIAL.body} whitespace-pre-wrap`}>
            {data.contactInfo}
          </p>
        </EditorialSection>
      )}

      {/* Footer marker */}
      <div className={`text-center ${EDITORIAL.sectionBorder} pt-6`}>
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
          ###
        </span>
      </div>
    </EditorialArticle>
  );
}
