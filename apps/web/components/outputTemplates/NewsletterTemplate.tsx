'use client';

import {
  Mail,
  Calendar,
  Eye,
  BookOpen,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import type { NewsletterOutput, NewsletterSection } from '@transcribe/shared';
import { SectionCard, InfoBox } from './shared';

interface NewsletterTemplateProps {
  data: NewsletterOutput;
}

function NewsletterSectionCard({ section, index }: { section: NewsletterSection; index: number }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[#8D6AFA]">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{section.heading}</h4>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{section.content}</p>
          {section.cta && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-2 text-[#14D0DC]">
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{section.cta}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewsletterTemplate({ data }: NewsletterTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Mail className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.subject}
            </h2>
            {data.preheader && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span className="italic">{data.preheader}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Greeting & Intro */}
      <div className="space-y-3">
        <p className="text-gray-900 dark:text-gray-100 font-medium">{data.greeting}</p>
        <p className="text-gray-700 dark:text-gray-300">{data.intro}</p>
      </div>

      {/* Sections */}
      {data.sections && data.sections.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#8D6AFA]" />
            Content
          </h3>
          {data.sections.map((section, idx) => (
            <NewsletterSectionCard key={idx} section={section} index={idx} />
          ))}
        </div>
      )}

      {/* Closing CTA */}
      <InfoBox title="Call to Action" icon={ArrowRight} variant="cyan">
        {data.closingCta}
      </InfoBox>

      {/* Closing */}
      <SectionCard title="Closing" icon={MessageSquare} iconColor="text-gray-500">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.closing}</p>
      </SectionCard>
    </div>
  );
}
