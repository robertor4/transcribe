'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckSquare, Edit3, Share2, FileText, Copy, Download, RefreshCw } from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { Button } from '@/components/Button';
import { FloatingRecordButton } from '@/components/FloatingRecordButton';
import { RecordingModal } from '@/components/RecordingModal';
import { mockConversations, getOutput, EmailOutputContent, BlogPostOutputContent } from '@/lib/mockData';

interface OutputDetailClientProps {
  conversationId: string;
  outputId: string;
}

export function OutputDetailClient({ conversationId, outputId }: OutputDetailClientProps) {
  const [isRecording, setIsRecording] = useState(false);

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

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        rightPanel={
          <div className="p-6">
            {/* Source Conversation */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Source
                </h2>
              </div>
              <Link
                href={`/en/prototype-conversation-v2/${conversation.id}`}
                className="block p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {conversation.title}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {Math.floor(conversation.source.audioDuration / 60)} min
                </div>
              </Link>
            </div>

            {/* Generation Details */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Details
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {output.type === 'blogPost' ? 'Blog Post' :
                     output.type === 'actionItems' ? 'Action Items' :
                     output.type === 'userStories' ? 'User Stories' :
                     output.type.charAt(0).toUpperCase() + output.type.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Generated
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {output.generatedAt.toLocaleDateString()}
                  </span>
                </div>
                {output.createdBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created by
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {output.createdBy}
                    </span>
                  </div>
                )}
                {output.metadata?.wordCount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Word count
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {output.metadata.wordCount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Instructions */}
            {output.context && (
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Instructions
                  </h2>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">
                    &ldquo;{output.context}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Actions
                </h2>
              </div>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Export as PDF</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>Send via Email</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
                  <Copy className="w-4 h-4 text-gray-500" />
                  <span>Copy to Clipboard</span>
                </button>
              </div>
            </div>
          </div>
        }
        mainContent={
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Breadcrumb Navigation */}
            <Link
              href={`/en/prototype-conversation-v2/${conversationId}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {conversation.title}
            </Link>

            {/* Output Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <OutputIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {output.title}
                  </h1>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-3">
                <Button variant="brand" size="md" icon={<Copy className="w-4 h-4" />}>
                  Copy to Clipboard
                </Button>
                <Button variant="ghost" size="md" icon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
                <Button variant="ghost" size="md" icon={<RefreshCw className="w-4 h-4" />}>
                  Regenerate
                </Button>
                <Button variant="ghost" size="md" icon={<Share2 className="w-4 h-4" />}>
                  Share
                </Button>
              </div>
            </div>

            {/* Template-Specific Content */}
            {output.type === 'email' && (
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8">
                {/* Email Subject */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                    Subject:
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {(output.content as EmailOutputContent).subject}
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-4">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {(output.content as EmailOutputContent).greeting}
                  </p>

                  {(output.content as EmailOutputContent).body.map((paragraph, idx) => (
                    <p key={idx} className="font-medium text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  ))}

                  {/* Key Points */}
                  {(output.content as EmailOutputContent).keyPoints.length > 0 && (
                    <div className="my-6 pl-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#cc3399] rounded">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                        Key Points:
                      </h3>
                      <ul className="space-y-2 list-disc list-inside">
                        {(output.content as EmailOutputContent).keyPoints.map((point, idx) => (
                          <li key={idx} className="font-medium text-gray-700 dark:text-gray-300">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {(output.content as EmailOutputContent).actionItems.length > 0 && (
                    <div className="my-6 pl-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-gray-300 dark:border-gray-600 rounded">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                        Action Items:
                      </h3>
                      <ul className="space-y-2 list-disc list-inside">
                        {(output.content as EmailOutputContent).actionItems.map((item, idx) => (
                          <li key={idx} className="font-medium text-gray-700 dark:text-gray-300">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="font-medium text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {(output.content as EmailOutputContent).closing}
                  </p>
                </div>
              </div>
            )}

            {output.type === 'blogPost' && (
              <article className="prose prose-lg max-w-none">
                {/* Hero Image Placeholder */}
                {(output.content as BlogPostOutputContent).images?.hero && (
                  <div className="mb-12 -mx-6 lg:-mx-12">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Hero Image
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                          {(output.content as BlogPostOutputContent).images?.hero?.altText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Title & Subtitle */}
                <header className="mb-8">
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
                    {(output.content as BlogPostOutputContent).headline}
                  </h1>
                  {(output.content as BlogPostOutputContent).subheading && (
                    <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
                      {(output.content as BlogPostOutputContent).subheading}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-500 mt-4">
                    <span>{(output.content as BlogPostOutputContent).metadata.wordCount} words</span>
                    <span>·</span>
                    <span>{Math.ceil((output.content as BlogPostOutputContent).metadata.wordCount / 200)} min read</span>
                    <span>·</span>
                    <span>{(output.content as BlogPostOutputContent).metadata.targetAudience}</span>
                  </div>
                </header>

                {/* Hook */}
                <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-8">
                  {(output.content as BlogPostOutputContent).hook}
                </div>

                {/* Sections */}
                {(output.content as BlogPostOutputContent).sections.map((section, idx) => (
                  <section key={idx} className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      {section.heading}
                    </h2>

                    {section.paragraphs.map((paragraph, pIdx) => (
                      <p key={pIdx} className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {paragraph}
                      </p>
                    ))}

                    {/* Bullet Points */}
                    {section.bulletPoints && section.bulletPoints.length > 0 && (
                      <ul className="list-disc list-inside space-y-2 mb-4">
                        {section.bulletPoints.map((point, bIdx) => (
                          <li key={bIdx} className="font-medium text-gray-700 dark:text-gray-300">
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Quotes */}
                    {section.quotes && section.quotes.length > 0 && (
                      <div className="my-6 pl-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#cc3399]">
                        {section.quotes.map((quote, qIdx) => (
                          <blockquote key={qIdx} className="mb-4 last:mb-0">
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 italic mb-2">
                              &ldquo;{quote.text}&rdquo;
                            </p>
                            <cite className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              — {quote.attribution}
                            </cite>
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </section>
                ))}

                {/* Call to Action */}
                <div className="mt-12 p-6 bg-[#cc3399]/10 border-2 border-[#cc3399] rounded-xl">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {(output.content as BlogPostOutputContent).callToAction}
                  </p>
                </div>
              </article>
            )}

            {/* Placeholder for other output types */}
            {!['email', 'blogPost'].includes(output.type) && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-4xl mb-3">🚧</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Template Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  The {output.type} template is under development.
                </p>
              </div>
            )}

            {/* Prototype Notice */}
            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399] rounded-xl">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🧪</div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Generated Output Detail Page (V2)
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Dedicated page for each output type with custom formatting and metadata panel.
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Floating Action Button */}
      <FloatingRecordButton onClick={() => setIsRecording(true)} isRecording={isRecording} />

      {/* Recording Modal */}
      <RecordingModal
        isOpen={isRecording}
        onStop={() => setIsRecording(false)}
        onCancel={() => setIsRecording(false)}
      />
    </div>
  );
}
