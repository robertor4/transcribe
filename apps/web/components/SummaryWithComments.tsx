'use client';

import React from 'react';
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
  return (
    <div className="space-y-4">
      <div className="prose prose-gray prose-base max-w-none prose-p:text-base prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
        >
          {summary}
        </ReactMarkdown>
      </div>
    </div>
  );
};