'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TypewriterText } from '../TypewriterText';
import type { BlogPostExampleData } from '../exampleData';

interface BlogPostExampleProps {
  data: BlogPostExampleData;
  isActive: boolean;
  onComplete?: () => void;
}

export function BlogPostExample({ data, isActive, onComplete }: BlogPostExampleProps) {
  const [sectionsComplete, setSectionsComplete] = useState({
    headline: false,
    subheading: false,
    hook: false,
    body: false,
    quote: false,
  });

  // Calculate delays based on typing speeds
  const headlineTime = data.headline.length * 30;
  const subheadingTime = data.subheading.length * 25;
  const hookTime = data.hook.length * 20;
  const bodyTime = data.body.length * 15;

  const delays = {
    headline: 0,
    subheading: headlineTime + 300,
    hook: headlineTime + subheadingTime + 500,
    body: headlineTime + subheadingTime + hookTime + 700,
    quote: headlineTime + subheadingTime + hookTime + bodyTime + 900,
  };

  return (
    <div className="space-y-4">
      {/* Headline */}
      <div>
        <TypewriterText
          text={data.headline}
          speed={30}
          delay={delays.headline}
          isActive={isActive}
          onComplete={() => setSectionsComplete(prev => ({ ...prev, headline: true }))}
          className="text-lg font-bold text-gray-900 leading-tight"
          as="h3"
        />
      </div>

      {/* Subheading - show after headline completes */}
      {sectionsComplete.headline && (
        <div>
          <TypewriterText
            text={data.subheading}
            speed={25}
            delay={0}
            isActive={isActive}
            onComplete={() => setSectionsComplete(prev => ({ ...prev, subheading: true }))}
            className="text-sm text-gray-500 italic"
          />
        </div>
      )}

      {/* Content with floated image - show after subheading completes */}
      {sectionsComplete.subheading && (
        <div className="relative">
          {/* Floated image - magazine style */}
          <div className="sm:float-right sm:ml-4 sm:mb-3 mb-3 w-full sm:w-32">
            <div className="aspect-[4/5] relative rounded-lg overflow-hidden shadow-md">
              <Image
                src={data.image.url}
                alt={data.image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 128px"
              />
            </div>
          </div>

          {/* Hook paragraph */}
          <div className="mb-3">
            <TypewriterText
              text={data.hook}
              speed={20}
              delay={0}
              isActive={isActive}
              onComplete={() => setSectionsComplete(prev => ({ ...prev, hook: true }))}
              className="text-sm text-gray-700"
            />
          </div>

          {/* Body paragraph - show after hook completes */}
          {sectionsComplete.hook && (
            <div>
              <TypewriterText
                text={data.body}
                speed={15}
                delay={0}
                isActive={isActive}
                onComplete={() => setSectionsComplete(prev => ({ ...prev, body: true }))}
                className="text-sm text-gray-700 leading-relaxed"
              />
            </div>
          )}

          {/* Clear float */}
          <div className="clear-both" />
        </div>
      )}

      {/* Quote - show after body completes */}
      {sectionsComplete.body && (
        <div className="border-l-2 border-[#8D6AFA] pl-4 py-1">
          <TypewriterText
            text={`"${data.quote.text}"`}
            speed={25}
            delay={0}
            isActive={isActive}
            onComplete={() => {
              setSectionsComplete(prev => ({ ...prev, quote: true }));
              onComplete?.();
            }}
            className="text-sm text-gray-600 italic"
          />
          {sectionsComplete.quote && (
            <div className="text-xs text-gray-400 mt-1">— {data.quote.attribution}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default BlogPostExample;
