'use client';

import { useState } from 'react';
import { ThumbsUp, MessageCircle, Repeat2, Send } from 'lucide-react';
import { TypewriterText } from '../TypewriterText';
import type { LinkedInExampleData } from '../exampleData';

interface LinkedInExampleProps {
  data: LinkedInExampleData;
  isActive: boolean;
  onComplete?: () => void;
}

export function LinkedInExample({ data, isActive, onComplete }: LinkedInExampleProps) {
  const [sectionsComplete, setSectionsComplete] = useState({
    hook: false,
    intro: false,
    bullets: [false, false, false],
    result: false,
    hashtags: false,
  });

  const allContentComplete = sectionsComplete.hashtags;

  return (
    <div className="space-y-3">
      {/* LinkedIn Post Header */}
      <div className="flex items-start gap-3 pb-2">
        {/* Avatar with initials */}
        <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-semibold">
            {data.author.initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">
            {data.author.name}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {data.author.title}
          </div>
          <div className="text-xs text-gray-400">
            {data.timestamp} • 🌐
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="space-y-3">
        {/* Hook */}
        <div>
          <TypewriterText
            text={data.hook}
            speed={25}
            delay={0}
            isActive={isActive}
            onComplete={() => setSectionsComplete(prev => ({ ...prev, hook: true }))}
            className="text-sm font-semibold text-gray-900"
          />
        </div>

        {/* Intro text - show after hook */}
        {sectionsComplete.hook && (
          <div className="text-sm text-gray-700">
            <TypewriterText
              text="Here's why we didn't:"
              speed={25}
              delay={0}
              isActive={isActive}
              onComplete={() => setSectionsComplete(prev => ({ ...prev, intro: true }))}
            />
          </div>
        )}

        {/* Bullet points - show after intro */}
        {sectionsComplete.intro && (
          <div className="space-y-1.5 pl-1">
            {data.bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#0A66C2]">•</span>
                <TypewriterText
                  text={bullet}
                  speed={20}
                  delay={index * 400}
                  isActive={isActive}
                  onComplete={() => {
                    setSectionsComplete(prev => {
                      const newBullets = [...prev.bullets];
                      newBullets[index] = true;
                      return { ...prev, bullets: newBullets };
                    });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Result - show after all bullets */}
        {sectionsComplete.bullets.every(Boolean) && (
          <div className="pt-1">
            <TypewriterText
              text={data.result}
              speed={20}
              delay={200}
              isActive={isActive}
              onComplete={() => setSectionsComplete(prev => ({ ...prev, result: true }))}
              className="text-sm text-gray-700"
            />
          </div>
        )}

        {/* Hashtags - show after result */}
        {sectionsComplete.result && (
          <div className="pt-1 flex flex-wrap gap-1.5">
            {data.hashtags.map((tag, index) => (
              <span
                key={index}
                className="text-xs text-[#0A66C2] font-medium"
              >
                <TypewriterText
                  text={`#${tag}`}
                  speed={40}
                  delay={index * 150}
                  isActive={isActive}
                  onComplete={index === data.hashtags.length - 1 ? () => {
                    setSectionsComplete(prev => ({ ...prev, hashtags: true }));
                    onComplete?.();
                  } : undefined}
                  showCursor={false}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement stats - show after all content complete */}
      {allContentComplete && (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 pb-1 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0A66C2]">
                <ThumbsUp className="w-2.5 h-2.5 text-white" />
              </span>
              <span>{data.engagement.likes.toLocaleString()}</span>
            </div>
            <div>
              {data.engagement.comments} comments
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors">
              <ThumbsUp className="w-4 h-4" />
              <span>Like</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors">
              <Repeat2 className="w-4 h-4" />
              <span>Repost</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors">
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default LinkedInExample;
