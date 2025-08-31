'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  ListChecks, 
  Brain, 
  Target, 
  TrendingUp,
  FileText,
  Copy,
  Check,
  Calendar,
  FileCode
} from 'lucide-react';
import { AnalysisResults, ANALYSIS_TYPE_INFO } from '@transcribe/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTranslations } from 'next-intl';
import { SummaryWithComments } from './SummaryWithComments';
import TranscriptTimeline from './TranscriptTimeline';
import { ActionItemsTable } from './ActionItemsTable';

interface AnalysisTabsProps {
  analyses: AnalysisResults;
  transcriptionId: string;
  speakerSegments?: Array<{ speakerTag: string; startTime: number; endTime: number; text: string; confidence?: number }>;
  speakers?: Array<{ speakerId: number; speakerTag: string; totalSpeakingTime: number; wordCount: number; firstAppearance: number }>;
}

// Blog-style content component for non-summary analysis tabs
const BlogStyleContent: React.FC<{ content: string }> = ({ content }) => {
  // Process the content to handle HTML-styled intro paragraph
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
              
              return <p className="text-base leading-relaxed mb-4 text-gray-600">{children}</p>;
            },
            h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8">{children}</h1>,
            h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">{children}</h2>,
            h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">{children}</h3>,
            ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-6">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-6">{children}</ol>,
            li: ({children}) => <li className="text-base leading-relaxed text-gray-600">{children}</li>,
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

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ analyses, transcriptionId, speakerSegments, speakers }) => {
  const t = useTranslations('analyses');
  const [activeTab, setActiveTab] = useState<keyof AnalysisResults>('summary');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [transcriptView, setTranscriptView] = useState<'timeline' | 'raw'>('timeline');

  const handleCopy = async (content: string, tabKey: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTab(tabKey);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch(iconName) {
      case 'MessageSquare': return MessageSquare;
      case 'Users': return Users;
      case 'ListChecks': return ListChecks;
      case 'Brain': return Brain;
      case 'Target': return Target;
      case 'TrendingUp': return TrendingUp;
      case 'FileText': return FileText;
      default: return MessageSquare;
    }
  };

  const getTabColor = (color: string, isActive: boolean) => {
    // Keep original color for text, only change border when active
    const baseColors = {
      'blue': 'text-blue-600',
      'purple': 'text-purple-600',
      'green': 'text-green-600',
      'pink': 'text-pink-600',
      'orange': 'text-orange-600',
      'teal': 'text-teal-600',
    };
    
    const borderColors = {
      'blue': 'border-blue-600',
      'purple': 'border-purple-600',
      'green': 'border-green-600',
      'pink': 'border-pink-600',
      'orange': 'border-orange-600',
      'teal': 'border-teal-600',
    };
    
    const hoverColors = {
      'blue': 'hover:text-blue-700 hover:border-blue-300',
      'purple': 'hover:text-purple-700 hover:border-purple-300',
      'green': 'hover:text-green-700 hover:border-green-300',
      'pink': 'hover:text-pink-700 hover:border-pink-300',
      'orange': 'hover:text-orange-700 hover:border-orange-300',
      'teal': 'hover:text-teal-700 hover:border-teal-300',
    };
    
    const textColor = baseColors[color as keyof typeof baseColors] || 'text-gray-500';
    const borderColor = isActive ? (borderColors[color as keyof typeof borderColors] || 'border-gray-500') : '';
    const hoverStyle = isActive ? '' : (hoverColors[color as keyof typeof hoverColors] || 'hover:text-gray-700 hover:border-gray-300');
    
    return { textColor, borderColor, hoverStyle };
  };

  const getBackgroundColor = (color: string) => {
    switch(color) {
      case 'blue': return 'from-blue-50 to-indigo-50';
      case 'purple': return 'from-purple-50 to-pink-50';
      case 'green': return 'from-green-50 to-emerald-50';
      case 'pink': return 'from-pink-50 to-rose-50';
      case 'orange': return 'from-orange-50 to-amber-50';
      case 'teal': return 'from-teal-50 to-cyan-50';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="-mb-px flex flex-wrap gap-x-4 overflow-x-auto">
          {ANALYSIS_TYPE_INFO.map((info) => {
            const Icon = getIconComponent(info.icon);
            const hasContent = analyses[info.key];
            
            if (!hasContent) return null;
            
            const tabStyles = getTabColor(info.color, activeTab === info.key);
            
            return (
              <button
                key={info.key}
                onClick={() => setActiveTab(info.key)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap
                  transition-colors duration-200
                  ${tabStyles.textColor} ${tabStyles.hoverStyle}
                  ${activeTab === info.key 
                    ? tabStyles.borderColor 
                    : 'border-transparent'
                  }
                `}
                title={info.description}
              >
                <Icon className="h-4 w-4" />
                <span>{info.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg">
        {ANALYSIS_TYPE_INFO.map((info) => {
          const content = analyses[info.key];
          if (!content || activeTab !== info.key) return null;
          
          const Icon = getIconComponent(info.icon);
          
          return (
            <div key={info.key} className="space-y-4">
              {/* Header with Copy Button */}
              <div className={`bg-gradient-to-r ${getBackgroundColor(info.color)} p-4 rounded-t-lg border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                      <Icon className={`h-5 w-5 text-${info.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{info.label}</h3>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {info.key === 'transcript' && speakerSegments && speakerSegments.length > 0 && (
                      <>
                        <button
                          onClick={() => setTranscriptView('timeline')}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            transcriptView === 'timeline' 
                              ? 'text-[#cc3399] bg-white' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title="Timeline view"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>Timeline</span>
                        </button>
                        <button
                          onClick={() => setTranscriptView('raw')}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            transcriptView === 'raw' 
                              ? 'text-[#cc3399] bg-white' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title="Raw text view"
                        >
                          <FileCode className="h-4 w-4" />
                          <span>Raw</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleCopy(content, info.key)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-[#cc3399] hover:bg-white rounded-lg transition-colors"
                      title={`Copy ${info.label}`}
                    >
                      {copiedTab === info.key ? (
                        <>
                          <Check className="h-4 w-4 text-[#cc3399]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="py-6">
                {info.key === 'transcript' ? (
                  <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    {/* Show timeline or raw view based on selection */}
                    {speakerSegments && speakerSegments.length > 0 && transcriptView === 'timeline' ? (
                      <TranscriptTimeline segments={speakerSegments} />
                    ) : speakerSegments && speakerSegments.length > 0 && transcriptView === 'raw' ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono">
                          {speakerSegments.map(segment => segment.text).join(' ')}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono">
                          {content}
                        </p>
                      </div>
                    )}
                  </div>
                ) : info.key === 'summary' ? (
                  <SummaryWithComments
                    summary={content}
                  />
                ) : info.key === 'actionItems' ? (
                  <ActionItemsTable content={content} />
                ) : (
                  <BlogStyleContent content={content} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};