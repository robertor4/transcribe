'use client';

import { useState } from 'react';
import { Quote } from 'lucide-react';
import type { BlogPostOutput } from '@transcribe/shared';
import { BulletList } from './shared';

interface BlogPostTemplateProps {
  data: BlogPostOutput;
}

export function BlogPostTemplate({ data }: BlogPostTemplateProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="prose prose-gray dark:prose-invert max-w-none overflow-x-hidden">
        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 break-words">
          {data.headline}
        </h1>

        {/* Subheading */}
        {data.subheading && (
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 italic mb-6">
            {data.subheading}
          </p>
        )}

        {/* Hero Image - Magazine-style float right, positioned early so hook wraps around it */}
        {data.heroImage && !imageError && (
          <figure className="sm:float-right sm:ml-6 sm:mb-4 mb-6 w-full sm:w-56 md:w-64 lg:w-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.heroImage.url}
              alt={data.heroImage.alt}
              className="w-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
              onError={() => setImageError(true)}
            />
            <figcaption className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center italic">
              AI-generated
            </figcaption>
          </figure>
        )}

        {/* Hook */}
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8 first-letter:text-4xl first-letter:font-bold first-letter:text-[#8D6AFA]">
          {data.hook}
        </p>

        {/* Sections - text continues to wrap around the floated image */}
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
                    className="border-l-4 border-[#8D6AFA] pl-5 py-5 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg"
                  >
                    <div className="flex items-start gap-3">
                      <Quote className="w-7 h-7 text-[#8D6AFA] flex-shrink-0" />
                      <div className="pr-4">
                        <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed !mt-0">
                          {quote.text}
                        </p>
                        <cite className="block mt-2 text-sm text-gray-500 dark:text-gray-400 not-italic">
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

      {/* Clear float before Call to Action */}
      <div className="clear-both" />

      {/* Call to Action */}
      <div className="mt-4 border-l-4 border-[#14D0DC] pl-5 py-8 bg-[#14D0DC]/5 dark:bg-[#14D0DC]/10 rounded-r-lg">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed !my-0">
          {data.callToAction}
        </p>
      </div>
    </article>
  );
}
