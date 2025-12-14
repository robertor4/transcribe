import { FileText, Quote } from 'lucide-react';
import type { BlogPostOutput } from '@transcribe/shared';
import { TemplateHeader, BulletList } from './shared';

interface BlogPostTemplateProps {
  data: BlogPostOutput;
}

export function BlogPostTemplate({ data }: BlogPostTemplateProps) {
  const metadata = (
    <>
      <span>{data.metadata.wordCount} words</span>
      <span>•</span>
      <span className="capitalize">{data.metadata.tone} tone</span>
      {data.metadata.targetAudience && (
        <>
          <span>•</span>
          <span>For {data.metadata.targetAudience}</span>
        </>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <TemplateHeader icon={FileText} label="Blog Post" metadata={metadata} />

      {/* Article Preview */}
      <article className="prose prose-gray dark:prose-invert max-w-none">
        {/* Headline */}
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
          {data.headline}
        </h1>

        {/* Subheading */}
        {data.subheading && (
          <p className="text-xl text-gray-600 dark:text-gray-400 italic mb-6">
            {data.subheading}
          </p>
        )}

        {/* Hook */}
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8 first-letter:text-4xl first-letter:font-bold first-letter:text-[#cc3399]">
          {data.hook}
        </p>

        {/* Sections */}
        {data.sections.map((section, index) => (
          <section key={index} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {section.heading}
            </h2>

            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}

            {section.bulletPoints && section.bulletPoints.length > 0 && (
              <BulletList items={section.bulletPoints} className="mb-4" />
            )}

            {section.quotes && section.quotes.length > 0 && (
              <div className="space-y-4 my-6">
                {section.quotes.map((quote, qIndex) => (
                  <blockquote
                    key={qIndex}
                    className="border-l-4 border-[#cc3399] pl-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg"
                  >
                    <div className="flex items-start gap-2">
                      <Quote className="w-5 h-5 text-[#cc3399] flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-gray-700 dark:text-gray-300 italic mb-1">
                          &ldquo;{quote.text}&rdquo;
                        </p>
                        <cite className="text-sm text-gray-500 dark:text-gray-500 not-italic">
                          — {quote.attribution}
                        </cite>
                      </div>
                    </div>
                  </blockquote>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Call to Action */}
        <div className="mt-8 p-6 bg-gradient-to-r from-[#cc3399]/10 to-purple-500/10 dark:from-[#cc3399]/20 dark:to-purple-500/20 rounded-xl border border-[#cc3399]/20">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {data.callToAction}
          </p>
        </div>
      </article>
    </div>
  );
}
