'use client';

import { useState } from 'react';
import type { BlogPostOutput } from '@transcribe/shared';

interface BlogPostTemplateProps {
  data: BlogPostOutput;
}

export function BlogPostTemplate({ data }: BlogPostTemplateProps) {
  const [imageError, setImageError] = useState(false);

  const serifFont = { fontFamily: 'var(--font-merriweather), Georgia, serif' };

  return (
    <article className="max-w-[680px] overflow-x-hidden">
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
      <hr className="hidden lg:block border-t-2 border-gray-300 dark:border-gray-600 mb-8" />

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
        className="text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 lg:first-letter:text-4xl lg:first-letter:font-bold lg:first-letter:float-left lg:first-letter:mr-2 lg:first-letter:leading-[1] lg:first-letter:text-gray-900 dark:lg:first-letter:text-gray-100"
        style={serifFont}
      >
        {data.hook}
      </p>

      {/* Sections */}
      {data.sections.map((section, index) => (
        <section key={index} className="mb-8">
          <h2
            className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 mt-10 pb-3 border-b border-gray-200 dark:border-gray-700"
            style={serifFont}
          >
            {section.heading}
          </h2>

          {section.paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className="text-[16px] text-gray-700 dark:text-gray-300 leading-[1.35] mb-6">
              {paragraph}
            </p>
          ))}

          {section.bulletPoints && section.bulletPoints.length > 0 && (
            <ul className="list-none pl-0 space-y-2.5 mb-6">
              {section.bulletPoints.map((point, bIndex) => (
                <li key={bIndex} className="flex items-start gap-3 text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-[10px] font-bold flex items-center justify-center mt-[3px]">&gt;</span>
                  <span className="flex-1">{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                </li>
              ))}
            </ul>
          )}

          {section.quotes && section.quotes.length > 0 && (
            <div className="space-y-4 my-6">
              {section.quotes.map((quote, qIndex) => (
                <blockquote
                  key={qIndex}
                  className="border-l-2 border-[#8D6AFA] pl-5 my-6 text-gray-600 dark:text-gray-400 italic"
                >
                  <p className="leading-relaxed">{quote.text}</p>
                  <cite className="block mt-2 text-sm text-gray-500 dark:text-gray-400 not-italic">
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
    </article>
  );
}
