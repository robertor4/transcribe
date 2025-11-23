'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mic, FileText, Users, BookOpen, Sparkles, Briefcase, Target, Heart, Folder, MessageSquare, Upload, Share2, Mail } from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { Button } from '@/components/Button';
import { FloatingRecordButton } from '@/components/FloatingRecordButton';
import { RecordingModal } from '@/components/RecordingModal';
import { ConversationCreateModal } from '@/components/ConversationCreateModal';
import { MilestoneToast } from '@/components/MilestoneToast';
import { EmptyState } from '@/components/EmptyState';
import { mockFolders, mockConversations, formatDuration, formatRelativeTime } from '@/lib/mockData';
import { getGreeting, getMilestoneMessage } from '@/lib/userHelpers';

type CreateStep = 'template' | 'upload' | 'processing' | 'complete';

interface CreateModalConfig {
  isOpen: boolean;
  initialStep?: CreateStep;
  preselectedTemplateId?: string | null;
  uploadMethod?: 'file' | 'record' | null;
  skipTemplate?: boolean;
}

export default function PrototypeDashboardV2() {
  const router = useRouter();
  const ungroupedConversations = mockConversations.filter(c => !c.folderId);
  const [isRecording, setIsRecording] = useState(false);
  const [createModalConfig, setCreateModalConfig] = useState<CreateModalConfig>({
    isOpen: false,
  });
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');

  // Mock user email for greeting (in production, get from auth context)
  const userEmail = 'roberto@dreamone.nl';

  // Check for milestone on mount
  useEffect(() => {
    const conversationCount = mockConversations.length;
    const message = getMilestoneMessage(conversationCount);

    if (message) {
      setMilestoneMessage(message);
      setShowMilestone(true);
    }
  }, []);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: In production, trigger actual recording stop and transcription
    console.log('Recording stopped - would trigger transcription');
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    console.log('Recording cancelled');
  };

  const handleCreateComplete = (conversationId: string) => {
    // Navigate to the new conversation
    router.push(`/prototype-conversation-v2/${conversationId}`);
  };

  // Context-aware button handlers
  const handleRecordAudio = () => {
    setCreateModalConfig({
      isOpen: true,
      skipTemplate: true,
      initialStep: 'upload',
      uploadMethod: 'record',
    });
  };

  const handleImportAudio = () => {
    setCreateModalConfig({
      isOpen: true,
      skipTemplate: true,
      initialStep: 'upload',
      uploadMethod: 'file',
    });
  };

  const handleTemplateCreate = (templateId: string) => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'template',
      preselectedTemplateId: templateId,
    });
  };

  const handleMoreTemplates = () => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'template',
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={false} // No right panel on dashboard
        mainContent={
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Personalized Greeting */}
            <div className="mb-12">
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#b82d89] via-[#cc3399] to-[#ff66cc] bg-clip-text text-transparent">
                {getGreeting(userEmail)}
              </h1>
            </div>

            {/* Quick Create Buttons */}
            <section className="mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { Icon: Mic, label: 'Record audio', desc: 'Start recording', handler: handleRecordAudio },
                  { Icon: Upload, label: 'Import audio', desc: 'Upload file', handler: handleImportAudio },
                  { Icon: FileText, label: 'Document', desc: 'Spec or brief', handler: () => handleTemplateCreate('blogPost') },
                  { Icon: Users, label: 'Meeting', desc: 'Summary & notes', handler: () => handleTemplateCreate('actionItems') },
                  { Icon: BookOpen, label: 'Article', desc: 'Blog or content', handler: () => handleTemplateCreate('blogPost') },
                  { Icon: Mail, label: 'Email', desc: 'Draft message', handler: () => handleTemplateCreate('email') },
                  { Icon: Share2, label: 'LinkedIn post', desc: 'Social content', handler: () => handleTemplateCreate('linkedinPost') },
                  { Icon: Sparkles, label: 'More templates', desc: 'Browse all', handler: handleMoreTemplates }
                ].map((type) => (
                  <button
                    key={type.label}
                    onClick={type.handler}
                    aria-label={`Create ${type.label}: ${type.desc}`}
                    className="group relative flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-700 dark:hover:border-gray-300 hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc3399]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0 group-hover:from-gray-700 group-hover:to-gray-800 dark:group-hover:from-gray-700 dark:group-hover:to-gray-800 group-hover:scale-105 transition-all duration-200">
                      <type.Icon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399] mb-0.5 truncate transition-colors duration-200">{type.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{type.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Folders Section */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Folder className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Folders</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-100 dark:border-gray-800">
                  {mockFolders.map((folder) => (
                    <Link
                      key={folder.id}
                      href={`/prototype-folder-v2/${folder.id}`}
                      className="group relative flex items-center justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {folder.color === 'purple' && <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-[#cc3399] group-hover:scale-110 transition-all duration-200" />}
                          {folder.color === 'blue' && <Target className="w-5 h-5 text-gray-500 group-hover:text-[#cc3399] group-hover:scale-110 transition-all duration-200" />}
                          {folder.color === 'green' && <Heart className="w-5 h-5 text-gray-500 group-hover:text-[#cc3399] group-hover:scale-110 transition-all duration-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 group-hover:text-[#cc3399] transition-colors duration-200">
                            {folder.name}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-gray-400">
                            <span>{folder.conversationCount} conversations</span>
                            <span>·</span>
                            <span>{formatDuration(folder.totalMinutes * 60)}</span>
                            <span>·</span>
                            <span>{folder.members.length} member{folder.members.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 pr-2 text-sm font-medium text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                        →
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Add New Folder Button */}
                <Button variant="ghost" fullWidth>
                  + New Folder
                </Button>
              </div>
            </section>

            {/* Ungrouped Conversations */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ungrouped Conversations</h2>
              </div>

              {ungroupedConversations.length === 0 ? (
                <EmptyState
                  icon={<Mic className="w-10 h-10 text-gray-400" />}
                  title="Welcome to Neural Summary"
                  description="Start by recording or uploading your first conversation. We'll transcribe and summarize it for you."
                  actionLabel="Create Conversation"
                  onAction={handleMoreTemplates}
                  actionIcon={<Mic className="w-5 h-5" />}
                />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-100 dark:border-gray-800">
                  {ungroupedConversations.map((conversation) => {
                    const folder = mockFolders.find(f => f.id === conversation.folderId);

                    return (
                      <Link
                        key={conversation.id}
                        href={`/prototype-conversation-v2/${conversation.id}`}
                        className="group relative flex items-center justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-[#cc3399] group-hover:scale-110 transition-all duration-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399] transition-colors duration-200 truncate">
                                {conversation.title}
                              </span>
                              {conversation.status === 'ready' && (
                                <span className="flex-shrink-0 text-gray-700 dark:text-gray-400">✓</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                            {folder && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Folder className="w-3 h-3" /> {folder.name}
                                </span>
                                <span>·</span>
                              </>
                            )}
                            <span>{formatDuration(conversation.source.audioDuration)}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(conversation.createdAt)}</span>
                            {conversation.sharing.viewCount > 0 && (
                              <>
                                <span>·</span>
                                <span>{conversation.sharing.viewCount} views</span>
                              </>
                            )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                          →
                        </div>
                        {conversation.status === 'processing' && (
                          <div className="ml-4 flex-shrink-0">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                              ⏳ Processing
                            </span>
                          </div>
                        )}
                        {conversation.status === 'failed' && (
                          <div className="ml-4 flex-shrink-0">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                              Failed
                            </span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Prototype Notice */}
            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399] rounded-xl">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🧪</div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Three-Pane UI Prototype (V2)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Modern three-pane layout with collapsible left sidebar.
                    Click any conversation to see the full three-pane experience with contextual right panel.
                    Use the floating button (bottom-right) for quick recording.
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Floating Action Button */}
      <FloatingRecordButton onClick={handleStartRecording} isRecording={isRecording} />

      {/* Recording Modal */}
      <RecordingModal
        isOpen={isRecording}
        onStop={handleStopRecording}
        onCancel={handleCancelRecording}
      />

      {/* Milestone Toast */}
      <MilestoneToast
        message={milestoneMessage}
        isVisible={showMilestone}
        onDismiss={() => setShowMilestone(false)}
      />

      {/* Conversation Create Modal */}
      <ConversationCreateModal
        isOpen={createModalConfig.isOpen}
        onClose={() => setCreateModalConfig({ isOpen: false })}
        onComplete={handleCreateComplete}
        initialStep={createModalConfig.initialStep}
        preselectedTemplateId={createModalConfig.preselectedTemplateId}
        uploadMethod={createModalConfig.uploadMethod}
        skipTemplate={createModalConfig.skipTemplate}
      />
    </div>
  );
}
