'use client';

import React from 'react';
import type {
  StructuredOutput,
  ActionItemsOutput,
  EmailOutput,
  BlogPostOutput,
  LinkedInOutput,
  CommunicationAnalysisOutput,
} from '@transcribe/shared';
import { ActionItemsTemplate } from './ActionItemsTemplate';
import { EmailTemplate } from './EmailTemplate';
import { BlogPostTemplate } from './BlogPostTemplate';
import { LinkedInTemplate } from './LinkedInTemplate';
import { CommunicationAnalysisTemplate } from './CommunicationAnalysisTemplate';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Re-export individual templates
export { ActionItemsTemplate } from './ActionItemsTemplate';
export { EmailTemplate } from './EmailTemplate';
export { BlogPostTemplate } from './BlogPostTemplate';
export { LinkedInTemplate } from './LinkedInTemplate';
export { CommunicationAnalysisTemplate } from './CommunicationAnalysisTemplate';

/**
 * Template component registry - add new templates here
 * This eliminates the need for a switch statement when adding new template types
 */
const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<{ data: unknown }>> = {
  actionItems: ActionItemsTemplate as React.ComponentType<{ data: unknown }>,
  email: EmailTemplate as React.ComponentType<{ data: unknown }>,
  blogPost: BlogPostTemplate as React.ComponentType<{ data: unknown }>,
  linkedin: LinkedInTemplate as React.ComponentType<{ data: unknown }>,
  communicationAnalysis: CommunicationAnalysisTemplate as React.ComponentType<{ data: unknown }>,
};

interface OutputRendererProps {
  content: string | StructuredOutput;
  contentType?: 'markdown' | 'structured';
  templateId?: string;
}

/**
 * Smart output renderer that automatically selects the appropriate template
 * based on content type and structure.
 */
export function OutputRenderer({ content, contentType }: OutputRendererProps) {
  // If contentType is explicitly markdown or content is a string, render as markdown
  if (contentType === 'markdown' || typeof content === 'string') {
    return (
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <ReactMarkdown>{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</ReactMarkdown>
      </div>
    );
  }

  // Handle structured content
  if (typeof content === 'object' && content !== null) {
    const structuredContent = content as StructuredOutput;
    const Component = TEMPLATE_COMPONENTS[structuredContent.type];

    if (Component) {
      return <Component data={structuredContent} />;
    }

    // Unknown structured type - render as JSON
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">Structured Output</span>
        </div>
        <pre className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto text-sm">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  }

  // Fallback for unexpected content
  return (
    <div className="text-gray-500 dark:text-gray-500">
      Unable to render content
    </div>
  );
}

/**
 * Helper to get a preview string from structured content
 */
export function getStructuredOutputPreview(content: StructuredOutput): string {
  switch (content.type) {
    case 'actionItems': {
      const data = content as ActionItemsOutput;
      const total =
        data.immediateActions.length +
        data.shortTermActions.length +
        data.longTermActions.length;
      return `${total} action item${total !== 1 ? 's' : ''} extracted`;
    }

    case 'email': {
      const data = content as EmailOutput;
      return data.subject;
    }

    case 'blogPost': {
      const data = content as BlogPostOutput;
      return data.headline;
    }

    case 'linkedin': {
      const data = content as LinkedInOutput;
      return data.hook.slice(0, 100) + (data.hook.length > 100 ? '...' : '');
    }

    case 'communicationAnalysis': {
      const data = content as CommunicationAnalysisOutput;
      return `Overall score: ${data.overallScore}/100`;
    }

    default:
      return 'Structured output';
  }
}
