'use client';

import { useState } from 'react';
import type { BlogPostOutput } from '@transcribe/shared';
import { EditorialArticle, EditorialHeading, serifFont, EDITORIAL } from './shared';

interface BlogPostTemplateProps {
  data: BlogPostOutput;
}

export function BlogPostTemplate({ data }: BlogPostTemplateProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <EditorialArticle>
      {/* Headline */}
      <h1
        className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-snug"
        style={serifFont}
      >
        {data.headline}
      </h1>

      {/* Subheading */}
      {data.subheading && (
        <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 italic mb-6">
          {data.subheading}
        </p>
      )}

      {/* Editorial rule */}
      <hr className={`hidden lg:block ${EDITORIAL.rule} mb-8`} />

      {/* Hero Image — magazine-style float right */}
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

      {/* Hook — first paragraph with drop cap */}
      <p
        className="text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-16 lg:first-letter:text-4xl lg:first-letter:font-bold lg:first-letter:float-left lg:first-letter:mr-2 lg:first-letter:leading-[1] lg:first-letter:text-gray-900 dark:lg:first-letter:text-gray-100"
        style={serifFont}
      >
        {data.hook}
      </p>

      {/* Sections */}
      {data.sections.map((section, index) => (
        <section key={index} className="mb-8">
          <EditorialHeading className="mb-6 mt-10">{section.heading}</EditorialHeading>

          {section.paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className={`${EDITORIAL.body} mb-6`}>
              {paragraph}
            </p>
          ))}

          {section.bulletPoints && section.bulletPoints.length > 0 && (
            <ul className="list-none pl-0 space-y-2.5 pt-4 mb-2">
              {section.bulletPoints.map((point, bIndex) => (
                <li key={bIndex} className={`flex items-start gap-3 ${EDITORIAL.listItem}`}>
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-bold flex items-center justify-center mt-[3px]">&gt;</span>
                  <span className="flex-1">{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                </li>
              ))}
            </ul>
          )}

          {section.quotes && section.quotes.length > 0 && (
            <div className="space-y-4 pt-2 mb-6">
              {section.quotes.map((quote, qIndex) => (
                <blockquote
                  key={qIndex}
                  className="border-l-4 border-[#8D6AFA] pl-6 pr-5 py-5 my-6 bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10 rounded-r-lg"
                >
                  <p className="text-[16px] text-gray-700 dark:text-gray-300 leading-relaxed italic" style={serifFont}>{quote.text}</p>
                  <cite className="block mt-3 text-sm text-gray-500 dark:text-gray-400 not-italic font-medium">
                    — {quote.attribution}
                  </cite>
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
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
          {data.callToAction}
        </p>
      </div>
    </EditorialArticle>
  );
}
