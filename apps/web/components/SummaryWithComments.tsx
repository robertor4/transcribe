'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface SummaryWithCommentsProps {
  transcriptionId: string;
  summary: string;
  isEditable?: boolean;
  onSummaryRegenerated?: (newSummary: string) => void;
}

export const SummaryWithComments: React.FC<SummaryWithCommentsProps> = ({
  transcriptionId,
  summary,
  isEditable = true,
  onSummaryRegenerated
}) => {
  // Process the summary to handle HTML-styled intro paragraph
  const processedSummary = useMemo(() => {
    // Check if summary contains the HTML-styled paragraph
    const htmlParagraphRegex = /<p\s+style="font-size:\s*1\.4em;">([^<]+)<\/p>/;
    const match = summary.match(htmlParagraphRegex);
    
    if (match) {
      // Replace the HTML with markdown that we'll style specially
      const introText = match[1];
      return summary.replace(htmlParagraphRegex, `[INTRO]${introText}[/INTRO]`);
    }
    return summary;
  }, [summary]);

  return (
    <div className="space-y-4">
      <div className="prose prose-gray prose-base max-w-none prose-p:text-base prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({children, ...props}) => {
              // Check if this is the intro paragraph
              if (typeof children === 'string' && children.includes('[INTRO]')) {
                const introText = children.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                return <p className="text-xl leading-relaxed font-medium mb-6">{introText}</p>;
              }
              
              // Handle arrays of children (mixed content)
              if (Array.isArray(children)) {
                const textContent = children.map(child => 
                  typeof child === 'string' ? child : ''
                ).join('');
                
                if (textContent.includes('[INTRO]')) {
                  const introText = textContent.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                  return <p className="text-xl leading-relaxed font-medium mb-6">{introText}</p>;
                }
              }
              
              return <p className="text-base">{children}</p>;
            }
          }}
        >
          {processedSummary}
        </ReactMarkdown>
      </div>
    </div>
  );
};