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
  Check
} from 'lucide-react';
import { AnalysisResults, ANALYSIS_TYPE_INFO } from '@transcribe/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTranslations } from 'next-intl';

interface AnalysisTabsProps {
  analyses: AnalysisResults;
  transcriptionId: string;
}

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ analyses, transcriptionId }) => {
  const t = useTranslations('analyses');
  const [activeTab, setActiveTab] = useState<keyof AnalysisResults>('summary');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

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
    if (isActive) return 'border-[#cc3399] text-[#cc3399]';
    
    switch(color) {
      case 'blue': return 'text-blue-600 hover:text-blue-700 hover:border-blue-300';
      case 'purple': return 'text-purple-600 hover:text-purple-700 hover:border-purple-300';
      case 'green': return 'text-green-600 hover:text-green-700 hover:border-green-300';
      case 'pink': return 'text-pink-600 hover:text-pink-700 hover:border-pink-300';
      case 'orange': return 'text-orange-600 hover:text-orange-700 hover:border-orange-300';
      case 'teal': return 'text-teal-600 hover:text-teal-700 hover:border-teal-300';
      default: return 'text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }
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
            
            return (
              <button
                key={info.key}
                onClick={() => setActiveTab(info.key)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap
                  transition-colors duration-200
                  ${activeTab === info.key 
                    ? 'border-[#cc3399] text-[#cc3399]' 
                    : `border-transparent ${getTabColor(info.color, false)}`
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

              {/* Analysis Content */}
              <div className="p-6">
                {info.key === 'transcript' ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed font-mono">
                      {content}
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">{children}</h3>,
                        ul: ({children}) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-gray-600">{children}</li>,
                        p: ({children}) => <p className="text-gray-600 mb-3">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};