'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface SummaryWithCommentsProps {
  summary: string;
}

export const SummaryWithComments: React.FC<SummaryWithCommentsProps> = ({
  summary
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
    <div className="max-w-4xl mx-auto px-6 lg:px-8">
      <div className="prose prose-gray prose-lg max-w-none prose-p:text-base prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-li:text-base">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({children}) => {
              // Check if this is the intro paragraph
              if (typeof children === 'string' && children.includes('[INTRO]')) {
                const introText = children.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                return (
                  <p className="text-2xl leading-relaxed font-medium text-gray-700 mb-8 border-l-4 border-[#cc3399] pl-6">
                    {introText}
                  </p>
                );
              }
              
              // Handle arrays of children (mixed content)
              if (Array.isArray(children)) {
                const textContent = children.map(child => 
                  typeof child === 'string' ? child : ''
                ).join('');
                
                if (textContent.includes('[INTRO]')) {
                  const introText = textContent.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                  return (
                    <p className="text-2xl leading-relaxed font-medium text-gray-700 mb-8 border-l-4 border-[#cc3399] pl-6">
                      {introText}
                    </p>
                  );
                }
              }
              
              return <p className="text-base leading-relaxed mb-4">{children}</p>;
            },
            h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8">{children}</h1>,
            h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">{children}</h2>,
            h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">{children}</h3>,
            ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-6">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-6">{children}</ol>,
            li: ({children}) => <li className="text-base leading-relaxed">{children}</li>,
          }}
        >
          {processedSummary}
        </ReactMarkdown>
      </div>
    </div>
  );
};