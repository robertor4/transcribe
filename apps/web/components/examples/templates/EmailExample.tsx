'use client';

import { useState } from 'react';
import { TypewriterText } from '../TypewriterText';
import type { EmailExampleData } from '../exampleData';

interface EmailExampleProps {
  data: EmailExampleData;
  isActive: boolean;
  onComplete?: () => void;
}

export function EmailExample({ data, isActive, onComplete }: EmailExampleProps) {
  // Track which sections have completed typing
  const [sectionsComplete, setSectionsComplete] = useState({
    subject: false,
    greeting: false,
    intro: false,
    decisionsHeader: false,
    decisions: [false, false, false],
    closing: false,
  });

  // Calculate delays based on estimated typing times
  const subjectTime = data.subject.length * 25;
  const greetingTime = data.greeting.length * 25;
  const introTime = data.intro.length * 20;

  const delays = {
    subject: 0,
    greeting: subjectTime + 200,
    intro: subjectTime + greetingTime + 400,
    decisionsHeader: subjectTime + greetingTime + introTime + 600,
    decision0: subjectTime + greetingTime + introTime + 800,
    decision1: subjectTime + greetingTime + introTime + 800 + data.decisions[0].length * 20 + 200,
    decision2: subjectTime + greetingTime + introTime + 800 + (data.decisions[0].length + data.decisions[1].length) * 20 + 400,
    closing: subjectTime + greetingTime + introTime + 800 + (data.decisions[0].length + data.decisions[1].length + data.decisions[2].length) * 20 + 600,
  };

  return (
    <div className="space-y-3 text-sm">
      {/* Subject line */}
      <div className="pb-2 border-b border-gray-100">
        <span className="text-gray-500">Subject: </span>
        <TypewriterText
          text={data.subject}
          speed={25}
          delay={delays.subject}
          isActive={isActive}
          onComplete={() => setSectionsComplete(prev => ({ ...prev, subject: true }))}
          className="text-gray-900 font-medium"
        />
      </div>

      {/* Greeting */}
      <div>
        <TypewriterText
          text={data.greeting}
          speed={25}
          delay={delays.greeting}
          isActive={isActive}
          onComplete={() => setSectionsComplete(prev => ({ ...prev, greeting: true }))}
          className="text-gray-700"
        />
      </div>

      {/* Intro paragraph */}
      <div>
        <TypewriterText
          text={data.intro}
          speed={20}
          delay={delays.intro}
          isActive={isActive}
          onComplete={() => setSectionsComplete(prev => ({ ...prev, intro: true }))}
          className="text-gray-700"
        />
      </div>

      {/* Decisions section - only show header after intro completes */}
      {sectionsComplete.intro && (
        <div className="pt-2">
          <div className="text-gray-900 font-medium text-xs uppercase tracking-wide mb-2">
            {data.decisionsLabel || 'Decisions confirmed'}
          </div>
          <ul className="space-y-1">
            {data.decisions.slice(0, 3).map((decision, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-[#14D0DC] mt-0.5">•</span>
                <TypewriterText
                  text={decision}
                  speed={20}
                  delay={index * 400}
                  isActive={isActive}
                  onComplete={() => {
                    setSectionsComplete(prev => {
                      const newDecisions = [...prev.decisions];
                      newDecisions[index] = true;
                      return { ...prev, decisions: newDecisions };
                    });
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Closing - only show after all decisions complete */}
      {sectionsComplete.decisions.every(Boolean) && (
        <div className="pt-2">
          <TypewriterText
            text={data.closing}
            speed={25}
            delay={200}
            isActive={isActive}
            onComplete={() => {
              setSectionsComplete(prev => ({ ...prev, closing: true }));
              onComplete?.();
            }}
            className="text-gray-700"
          />
        </div>
      )}

      {/* Email Signature - show after closing */}
      {sectionsComplete.closing && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Avatar with initials */}
            <div className="w-10 h-10 rounded-full bg-[#8D6AFA] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {data.signature.initials}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {data.signature.name}
              </div>
              <div className="text-xs text-gray-500">
                {data.signature.title}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailExample;
