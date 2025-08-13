'use client';

import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { user } = useAuth();

  const handleRegenerateSummary = async () => {
    if (!user) return;
    
    setIsRegenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No auth token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transcriptions/${transcriptionId}/regenerate-summary`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instructions: 'Please regenerate the summary with improved formatting and ensure all headings are in the same language as the transcript.'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to regenerate summary');
      }

      const updatedTranscription = await response.json();
      if (onSummaryRegenerated && updatedTranscription.summary) {
        onSummaryRegenerated(updatedTranscription.summary);
      }
    } catch (error) {
      console.error('Error regenerating summary:', error);
      alert('Failed to regenerate summary. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };
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
      {isEditable && (
        <div className="flex justify-end">
          <button
            onClick={handleRegenerateSummary}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Summary'}
          </button>
        </div>
      )}
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