'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import type { StructuredOutput } from '@transcribe/shared';
import { OutputRenderer } from './outputTemplates';

interface AnalysisContentRendererProps {
  content: string | StructuredOutput;
  contentType?: 'markdown' | 'structured';
}

export const AnalysisContentRenderer: React.FC<AnalysisContentRendererProps> = ({
  content,
  contentType,
}) => {
  // If content is structured, use the OutputRenderer
  if (contentType === 'structured' || (typeof content === 'object' && content !== null)) {
    return <OutputRenderer content={content} contentType={contentType} />;
  }

  // For markdown content, use the existing markdown renderer
  const markdownContent = typeof content === 'string' ? content : JSON.stringify(content);

  // Process the content to handle HTML-styled intro paragraph
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const processedContent = useMemo(() => {
    const htmlParagraphRegex = /<p\s+style="font-size:\s*1\.4em;">([^<]+)<\/p>/;
    const match = markdownContent.match(htmlParagraphRegex);

    if (match) {
      // Replace the HTML with markdown that we'll style specially
      const introText = match[1];
      return markdownContent.replace(htmlParagraphRegex, `[INTRO]${introText}[/INTRO]`);
    }
    return markdownContent;
  }, [markdownContent]);

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-6 lg:px-8">
      <div className="prose prose-gray prose-lg max-w-none prose-p:text-base prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-li:text-base">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({children}) => {
              // Check if this is the intro paragraph
              if (typeof children === 'string' && children.includes('[INTRO]')) {
                const introText = children.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                return (
                  <div className="bg-gradient-to-r from-purple-50 to-purple-50 dark:from-purple-950/30 dark:to-purple-950/30 border-l-4 border-[#8D6AFA] rounded-r-lg p-6 mb-8">
                    <p className="text-2xl leading-relaxed font-medium text-gray-800 dark:text-gray-200">
                      {introText}
                    </p>
                  </div>
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
                    <div className="bg-gradient-to-r from-purple-50 to-purple-50 dark:from-purple-950/30 dark:to-purple-950/30 border-l-4 border-[#8D6AFA] rounded-r-lg p-6 mb-8">
                      <p className="text-2xl leading-relaxed font-medium text-gray-800 dark:text-gray-200">
                        {introText}
                      </p>
                    </div>
                  );
                }
              }

              return <p className="text-base leading-relaxed mb-4 text-gray-700 dark:text-gray-300">{children}</p>;
            },
            h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8">{children}</h1>,
            h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 mt-6">{children}</h2>,
            h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3 mt-4">{children}</h3>,
            ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300">{children}</ol>,
            li: ({children}) => <li className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{children}</li>,
            strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
            em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
            code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm">{children}</code>,
            blockquote: ({children}) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300">
                {children}
              </blockquote>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};
