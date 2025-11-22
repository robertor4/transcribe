'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Zap, FileText, Mail, CheckSquare, Edit3, Share2, ArrowLeft, Plus } from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { RightContextPanel } from '@/components/RightContextPanel';
import { Button } from '@/components/Button';
import { FloatingRecordButton } from '@/components/FloatingRecordButton';
import { RecordingModal } from '@/components/RecordingModal';
import { OutputGeneratorModal } from '@/components/OutputGeneratorModal';
import { mockConversations, mockFolders, getOutputsByConversation, formatRelativeTime } from '@/lib/mockData';

interface ConversationClientProps {
  conversationId: string;
}

export function ConversationClient({ conversationId }: ConversationClientProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const conversation = mockConversations.find(c => c.id === conversationId) || mockConversations[0];
  const folder = conversation.folderId ? mockFolders.find(f => f.id === conversation.folderId) : null;
  const outputs = getOutputsByConversation(conversation.id);

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

  // Conversation details for right panel
  const conversationDetails = {
    duration: conversation.source.audioDuration,
    fileSize: '8.5 MB',
    createdAt: conversation.createdAt,
    status: conversation.status,
    folder: folder ? { id: folder.id, name: folder.name } : undefined,
    tags: conversation.tags,
    speakers: conversation.source.transcript.speakers,
  };

  const handleGenerateOutput = (outputType: string) => {
    console.log('Generate output:', outputType);
  };

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        rightPanel={
          <RightContextPanel
            conversation={conversationDetails}
            onGenerateOutput={handleGenerateOutput}
          />
        }
        mainContent={
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              {folder && (
                <Link
                  href={`/prototype-folder-v2/${folder.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors mb-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {folder.name}
                </Link>
              )}
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                {conversation.title}
              </h1>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                <span>{Math.floor(conversation.source.audioDuration / 60)} min</span>
                <span>·</span>
                <span>Created {conversation.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Sticky Section Navigation */}
            <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-8 -mx-6 px-6">
              <div className="flex items-center gap-6 py-3">
                <a
                  href="#summary"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors duration-200"
                >
                  Summary
                </a>
                <a
                  href="#outputs"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors duration-200"
                >
                  Generated Outputs
                </a>
                <a
                  href="#transcript"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors duration-200"
                >
                  Transcript
                </a>
              </div>
            </nav>

            {/* VERTICAL SECTIONS (No Tabs!) */}

            {/* Section: Summary */}
            <section id="summary" className="mb-12 scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Summary
                </h2>
              </div>

              <div className="prose prose-lg max-w-none">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                  {conversation.source.summary.text}
                </p>

                {conversation.source.summary.keyPoints.length > 0 && (
                  <div className="mt-6 pl-6 py-1 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#cc3399]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Key Points</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      {conversation.source.summary.keyPoints.map((point, idx) => (
                        <li key={idx} className="font-medium text-gray-700 dark:text-gray-300">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Discussion of Key Points */}
                {conversation.source.summary.keyPointsDetailed && conversation.source.summary.keyPointsDetailed.length > 0 && (
                  <div className="mt-8 space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detailed Discussion</h3>
                    {conversation.source.summary.keyPointsDetailed.map((detail, idx) => (
                      <div key={idx} className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{detail.title}</h4>
                        <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                          {detail.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Section: Generated Outputs */}
            <section id="outputs" className="mb-12 scroll-mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Generated Outputs
                      </h2>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Transform this conversation into various formats
                    </p>
                  </div>
                  {outputs.length > 0 && (
                    <Button
                      variant="brand"
                      size="md"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setIsGeneratorOpen(true)}
                    >
                      New Output
                    </Button>
                  )}
                </div>
              </div>

              {/* Outputs Gallery */}
              {outputs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outputs.map((output) => {
                    const OutputIcon = getOutputIcon(output.type);
                    return (
                      <Link
                        key={output.id}
                        href={`/en/prototype-conversation-v2/${conversation.id}/outputs/${output.id}`}
                        className="group relative p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#cc3399] dark:hover:border-[#cc3399] hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0">
                            <OutputIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#cc3399] transition-colors">
                              {output.title}
                            </h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {output.preview}
                            </p>
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Generated {formatRelativeTime(output.generatedAt)}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                            →
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    No outputs yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">
                    Generate your first output to transform this conversation into a deliverable format.
                  </p>
                  <Button
                    variant="brand"
                    size="md"
                    onClick={() => setIsGeneratorOpen(true)}
                  >
                    Generate Output
                  </Button>
                </div>
              )}
            </section>

            {/* Section: Transcript */}
            <section id="transcript" className="mb-12 scroll-mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Transcript
                  </h2>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  View the full conversation with speaker diarization and timeline
                </p>
              </div>

              {/* Transcript Card - Links to dedicated page */}
              <Link
                href={`/en/prototype-conversation-v2/${conversation.id}/transcript`}
                className="group block p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#cc3399] dark:hover:border-[#cc3399] hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#cc3399] transition-colors">
                      Full Transcript with Timeline
                    </h3>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Interactive speaker timeline with {conversation.source.transcript.speakers} speakers and {Math.floor(conversation.source.transcript.confidence * 100)}% confidence
                    </p>
                    {conversation.source.transcript.speakerSegments && (
                      <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        <span>{conversation.source.transcript.speakerSegments.length} segments</span>
                        <span>·</span>
                        <span>{Math.floor(conversation.source.audioDuration / 60)} min duration</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                    →
                  </div>
                </div>
              </Link>
            </section>

            {/* Prototype Notice */}
            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399] rounded-xl">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🧪</div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Three-Pane UI Prototype (V2)</div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Conversation view with vertical sections (no tabs), professional icons, and contextual right panel.
                    Use the floating button (bottom-right) for quick recording.
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

      {/* Output Generator Modal */}
      <OutputGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        conversationTitle={conversation.title}
      />
    </div>
  );
}
