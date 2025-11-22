'use client';

import Link from 'next/link';
import { Mail, CheckSquare, Edit3, Share2, FileText, Copy, Download, RefreshCw, MoreVertical } from 'lucide-react';
import { DetailPageLayout } from '@/components/detail-pages/DetailPageLayout';
import { DetailPageHeader } from '@/components/detail-pages/DetailPageHeader';
import { DetailMetadataPanel } from '@/components/detail-pages/DetailMetadataPanel';
import { RightPanelSection } from '@/components/detail-pages/RightPanelSection';
import { PrototypeNotice } from '@/components/detail-pages/PrototypeNotice';
import { Button } from '@/components/Button';
import { DropdownMenu } from '@/components/DropdownMenu';
import { EmailTemplate } from '@/components/output-templates/EmailTemplate';
import { BlogPostTemplate } from '@/components/output-templates/BlogPostTemplate';
import { PlaceholderTemplate } from '@/components/output-templates/PlaceholderTemplate';
import { mockConversations, getOutput, EmailOutputContent, BlogPostOutputContent } from '@/lib/mockData';

interface OutputDetailClientProps {
  conversationId: string;
  outputId: string;
}

export function OutputDetailClient({ conversationId, outputId }: OutputDetailClientProps) {
  const conversation = mockConversations.find(c => c.id === conversationId) || mockConversations[0];
  const output = getOutput(conversationId, outputId);

  if (!output) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Output not found
          </h1>
          <Link href={`/en/prototype-conversation-v2/${conversationId}`} className="text-[#cc3399] hover:underline">
            ← Back to conversation
          </Link>
        </div>
      </div>
    );
  }

  // Icon mapping for output types
  const getOutputIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'actionItems': return CheckSquare;
      case 'blogPost': return Edit3;
      case 'linkedin': return Share2;
      case 'userStories': return FileText;
      default: return FileText;
    }
  };

  const OutputIcon = getOutputIcon(output.type);

  const detailsData = [
    {
      label: 'Type',
      value: output.type === 'blogPost' ? 'Blog Post' :
             output.type === 'actionItems' ? 'Action Items' :
             output.type === 'userStories' ? 'User Stories' :
             output.type.charAt(0).toUpperCase() + output.type.slice(1)
    },
    { label: 'Generated', value: output.generatedAt.toLocaleDateString() },
    ...(output.createdBy ? [{ label: 'Created by', value: output.createdBy }] : []),
    ...(output.metadata?.wordCount ? [{ label: 'Word count', value: output.metadata.wordCount.toLocaleString() }] : [])
  ];

  return (
    <DetailPageLayout
      conversationId={conversationId}
      rightPanel={
        <DetailMetadataPanel
          conversation={{
            id: conversation.id,
            title: conversation.title,
            audioDuration: conversation.source.audioDuration
          }}
          details={detailsData}
          detailsIcon={FileText}
          actionsIcon={Share2}
          customSections={
            output.context ? (
              <RightPanelSection icon={Edit3} title="Instructions" showBorder>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">
                    &ldquo;{output.context}&rdquo;
                  </p>
                </div>
              </RightPanelSection>
            ) : undefined
          }
        />
      }
    >
      <DetailPageHeader
        conversationId={conversationId}
        conversationTitle={conversation.title}
        icon={OutputIcon}
        title={output.title}
        actions={
          <>
            <Button
              variant="ghost"
              size="md"
              icon={<Copy className="w-4 h-4" />}
              onClick={() => {
                // Copy logic will be implemented
                console.log('Copy to clipboard');
              }}
            >
              Copy
            </Button>
            <DropdownMenu
              trigger={
                <Button variant="ghost" size="md" icon={<MoreVertical className="w-4 h-4" />} />
              }
              items={[
                {
                  icon: Download,
                  label: 'Export as PDF',
                  onClick: () => console.log('Export as PDF')
                },
                {
                  icon: Mail,
                  label: 'Send via Email',
                  onClick: () => console.log('Send via Email')
                },
                {
                  icon: RefreshCw,
                  label: 'Regenerate',
                  onClick: () => console.log('Regenerate')
                },
                {
                  icon: Share2,
                  label: 'Share',
                  onClick: () => console.log('Share')
                }
              ]}
            />
          </>
        }
      />

      <div className="max-w-4xl mx-auto px-6 pb-8">
        {/* Template-Specific Content */}
        {output.type === 'email' && (
          <EmailTemplate content={output.content as EmailOutputContent} />
        )}

        {output.type === 'blogPost' && (
          <BlogPostTemplate content={output.content as BlogPostOutputContent} />
        )}

        {/* Placeholder for other output types */}
        {!['email', 'blogPost'].includes(output.type) && (
          <PlaceholderTemplate outputType={output.type} />
        )}

        <PrototypeNotice
          title="Generated Output Detail Page (V2)"
          description="Dedicated page for each output type with custom formatting and metadata panel."
        />
      </div>
    </DetailPageLayout>
  );
}
