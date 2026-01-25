'use client';

import {
  Newspaper,
  MapPin,
  Quote,
  Building2,
  Phone,
  FileText,
} from 'lucide-react';
import type { PressReleaseOutput } from '@transcribe/shared';
import { SectionCard, InfoBox } from './shared';

interface PressReleaseTemplateProps {
  data: PressReleaseOutput;
}

export function PressReleaseTemplate({ data }: PressReleaseTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Newspaper className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words uppercase">
              {data.headline}
            </h2>
            {data.subheadline && (
              <p className="mt-2 text-lg text-gray-700 dark:text-gray-300 italic">
                {data.subheadline}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{data.dateline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Paragraph */}
      <div className="text-lg text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
        {data.lead}
      </div>

      {/* Body */}
      {data.body && data.body.length > 0 && (
        <div className="space-y-4">
          {data.body.map((paragraph, idx) => (
            <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Quotes */}
      {data.quotes && data.quotes.length > 0 && (
        <div className="space-y-4">
          {data.quotes.map((quote, idx) => (
            <div
              key={idx}
              className="border-l-4 border-[#8D6AFA] bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10 rounded-r-xl p-4"
            >
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-[#8D6AFA] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                    &ldquo;{quote.quote}&rdquo;
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{quote.attribution}</span>
                    {quote.title && <span>, {quote.title}</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Boilerplate */}
      <SectionCard
        title="About"
        icon={Building2}
        iconColor="text-gray-500"
        className="bg-gray-50 dark:bg-gray-800/50"
      >
        <p className="text-gray-600 dark:text-gray-400 text-sm">{data.boilerplate}</p>
      </SectionCard>

      {/* Contact Info */}
      {data.contactInfo && (
        <SectionCard title="Media Contact" icon={Phone} iconColor="text-gray-500">
          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
            {data.contactInfo}
          </p>
        </SectionCard>
      )}

      {/* Footer marker */}
      <div className="text-center text-gray-400 dark:text-gray-500 text-sm font-medium">
        ###
      </div>
    </div>
  );
}
