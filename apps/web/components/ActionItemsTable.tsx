'use client';

import React, { useMemo } from 'react';
import { Clock, AlertCircle, User, Calendar, GitBranch } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface ActionItem {
  task: string;
  owner: string;
  deadline: string;
  dependencies: string;
  isCritical: boolean;
  needsClarification: boolean;
}

interface ActionSection {
  title: string;
  items: ActionItem[];
}

interface ActionItemsTableProps {
  content: string;
}

// Blog-style content component as fallback
const BlogStyleContent: React.FC<{ content: string }> = ({ content }) => {
  const processedContent = React.useMemo(() => {
    const htmlParagraphRegex = /<p\s+style="font-size:\s*1\.4em;">([^<]+)<\/p>/;
    const match = content.match(htmlParagraphRegex);
    
    if (match) {
      const introText = match[1];
      return content.replace(htmlParagraphRegex, `[INTRO]${introText}[/INTRO]`);
    }
    return content;
  }, [content]);

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8">
      <div className="prose prose-gray prose-lg max-w-none prose-p:text-base prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({children}) => {
              if (typeof children === 'string' && children.includes('[INTRO]')) {
                const introText = children.replace(/\[INTRO\]|\[\/INTRO\]/g, '');
                return (
                  <p className="text-2xl leading-relaxed font-medium text-gray-700 mb-8 border-l-4 border-[#cc3399] pl-6">
                    {introText}
                  </p>
                );
              }
              
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
              
              return <p className="text-base leading-relaxed mb-4 text-gray-600">{children}</p>;
            },
            h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8">{children}</h1>,
            h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">{children}</h2>,
            h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">{children}</h3>,
            ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-6">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-6">{children}</ol>,
            li: ({children}) => {
              // Check if this is an action item (contains pipes)
              const text = React.Children.toArray(children).join('');
              if (text.includes('|')) {
                // Parse as table row
                const parts = text.split('|').map(p => p.trim());
                if (parts.length >= 3) {
                  // Clean task text from special markers for display
                  const cleanTask = parts[0]
                    .replace('(CRITICAL)', '')
                    .replace('[NEEDS CLARIFICATION]', '')
                    .trim();
                  
                  return (
                    <li className="list-none -ml-6 mb-4">
                      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          {/* Left Column - Task Title */}
                          <div className="p-5 border-b md:border-b-0 md:border-r border-gray-200">
                            <div className="space-y-2">
                              <div className="font-medium text-gray-800 text-base leading-relaxed">
                                {cleanTask}
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {text.includes('(CRITICAL)') && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                    CRITICAL
                                  </span>
                                )}
                                {text.includes('[NEEDS CLARIFICATION]') && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                    NEEDS CLARIFICATION
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column - Details */}
                          <div className="p-5 bg-gray-50">
                            <div className="space-y-3">
                              {/* Owner */}
                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-xs text-gray-500 block">Owner</span>
                                  <span className="text-sm text-gray-700 font-medium">{parts[1] || 'Unassigned'}</span>
                                </div>
                              </div>
                              
                              {/* Deadline */}
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-xs text-gray-500 block">Deadline</span>
                                  <span className="text-sm text-gray-700 font-medium">{parts[2] || 'No deadline'}</span>
                                </div>
                              </div>
                              
                              {/* Dependencies */}
                              {parts[3] && parts[3] !== 'None' && parts[3].trim() !== '' && (
                                <div className="flex items-start gap-2">
                                  <GitBranch className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Dependencies</span>
                                    <span className="text-sm text-gray-700">{parts[3]}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                }
              }
              return <li className="text-base leading-relaxed text-gray-600">{children}</li>;
            },
            strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
            blockquote: ({children}) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
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

export const ActionItemsTable: React.FC<ActionItemsTableProps> = ({ content }) => {
  // For action items, we'll use the BlogStyleContent with custom list item rendering
  // that detects pipe-separated values and renders them as table-like cards
  return <BlogStyleContent content={content} />;
};