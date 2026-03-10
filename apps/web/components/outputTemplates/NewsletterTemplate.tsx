'use client';

import {
  Eye,
  BookOpen,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import type { NewsletterOutput } from '@transcribe/shared';
import {
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialNumberedList,
  EditorialPullQuote,
  EditorialParagraphs,
} from './shared';

interface NewsletterTemplateProps {
  data: NewsletterOutput;
}

export function NewsletterTemplate({ data }: NewsletterTemplateProps) {
  const metadata = data.preheader ? (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Eye className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="italic">{data.preheader}</span>
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.subject} metadata={metadata} />

      {/* Greeting & Intro */}
      <div className="mb-10">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">{data.greeting}</p>
        <EditorialParagraphs text={data.intro} />
      </div>

      {/* Sections */}
      {data.sections && data.sections.length > 0 && (
        <EditorialSection label="Content" icon={BookOpen} borderTop>
          <EditorialNumberedList
            items={data.sections.map(section => ({
              primary: (
                <>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{section.heading}</span>
                  {' '}
                  <span className={EDITORIAL.listItem}>{section.content}</span>
                </>
              ),
              secondary: section.cta ? (
                <span className="flex items-center gap-1.5 text-[#14D0DC] not-italic">
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                  {section.cta}
                </span>
              ) : undefined,
            }))}
          />
        </EditorialSection>
      )}

      {/* Closing CTA */}
      {data.closingCta && (
        <EditorialPullQuote color="#14D0DC" cite="Call to Action">
          <p>{data.closingCta}</p>
        </EditorialPullQuote>
      )}

      {/* Closing */}
      {data.closing && (
        <EditorialSection label="Closing" icon={MessageSquare} borderTop>
          <EditorialParagraphs text={data.closing} />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
