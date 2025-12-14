'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Mic,
  Users,
  Edit3,
  Sparkles,
  CheckSquare,
  Folder,
  MessageSquare,
  Upload,
  Share2,
  Mail,
  Loader2,
} from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { Button } from '@/components/Button';
import { FloatingRecordButton } from '@/components/FloatingRecordButton';
import { ConversationCreateModal, type CreateStep } from '@/components/ConversationCreateModal';
import { MilestoneToast } from '@/components/MilestoneToast';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useFolders } from '@/hooks/useFolders';
import { formatDuration, formatRelativeTime } from '@/lib/formatters';
import { getGreeting, getMilestoneMessage } from '@/lib/userHelpers';
import { Plus, X } from 'lucide-react';

interface CreateModalConfig {
  isOpen: boolean;
  initialStep?: CreateStep;
  preselectedTemplateId?: string | null;
  uploadMethod?: 'file' | 'record' | null;
  skipTemplate?: boolean;
}

export function DashboardClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const { user } = useAuth();

  const { conversations, isLoading: conversationsLoading, total } = useConversations();
  const { folders, isLoading: foldersLoading, createFolder } = useFolders();

  // Filter ungrouped conversations (no folderId or folderId is null)
  const ungroupedConversations = conversations.filter((c) => !c.folderId);

  const [createModalConfig, setCreateModalConfig] = useState<CreateModalConfig>({
    isOpen: false,
  });
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Check for newConversation query param to auto-open modal
  useEffect(() => {
    if (searchParams.get('newConversation') === 'true') {
      setCreateModalConfig({
        isOpen: true,
        initialStep: 'capture',
      });
      // Clear the query param from URL
      router.replace(`/${locale}/dashboard`);
    }
  }, [searchParams, router, locale]);

  // Check for milestone on mount
  useEffect(() => {
    if (!conversationsLoading && total > 0) {
      const message = getMilestoneMessage(total);
      if (message) {
        setMilestoneMessage(message);
        setShowMilestone(true);
      }
    }
  }, [conversationsLoading, total]);

  const handleCreateComplete = (conversationId: string) => {
    router.push(`/${locale}/conversation/${conversationId}`);
  };

  // Context-aware button handlers
  const handleRecordAudio = () => {
    setCreateModalConfig({
      isOpen: true,
      skipTemplate: false,
      initialStep: 'capture',
      uploadMethod: 'record',
    });
  };

  const handleImportAudio = () => {
    setCreateModalConfig({
      isOpen: true,
      skipTemplate: false,
      initialStep: 'capture',
      uploadMethod: 'file',
    });
  };

  const handleTemplateCreate = (templateId: string) => {
    setCreateModalConfig({
      isOpen: true,
      skipTemplate: false,
      initialStep: 'capture',
      preselectedTemplateId: templateId,
    });
  };

  const handleMoreTemplates = () => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleCancelFolderCreation = () => {
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Calculate folder stats
  const getFolderStats = (folderId: string) => {
    const folderConversations = conversations.filter((c) => c.folderId === folderId);
    const totalDuration = folderConversations.reduce(
      (sum, c) => sum + (c.source?.audioDuration || 0),
      0
    );
    return {
      count: folderConversations.length,
      duration: totalDuration,
    };
  };

  const isLoading = conversationsLoading || foldersLoading;

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation onNewConversation={handleMoreTemplates} />}
        showRightPanel={false}
        mainContent={
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Personalized Greeting */}
            <div className="mb-12">
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#b82d89] via-[#cc3399] to-[#ff66cc] bg-clip-text text-transparent">
                {getGreeting(user?.email || '')}
              </h1>
            </div>

            {/* Quick Create Buttons */}
            <section className="mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    Icon: Mic,
                    label: 'Record audio',
                    desc: 'Start live conversation',
                    handler: handleRecordAudio,
                  },
                  {
                    Icon: Upload,
                    label: 'Import audio',
                    desc: 'Upload audio/video file',
                    handler: handleImportAudio,
                  },
                  {
                    Icon: Users,
                    label: 'Meeting',
                    desc: 'Summary & transcribe',
                    handler: () => handleTemplateCreate('transcribe-only'),
                  },
                  {
                    Icon: Mail,
                    label: 'Email',
                    desc: 'Draft message',
                    handler: () => handleTemplateCreate('email'),
                  },
                  {
                    Icon: Edit3,
                    label: 'Blog Post',
                    desc: 'Publish-ready article',
                    handler: () => handleTemplateCreate('blogPost'),
                  },
                  {
                    Icon: Share2,
                    label: 'LinkedIn post',
                    desc: 'Social content',
                    handler: () => handleTemplateCreate('linkedin'),
                  },
                  {
                    Icon: CheckSquare,
                    label: 'Action Items',
                    desc: 'Task list',
                    handler: () => handleTemplateCreate('actionItems'),
                  },
                  {
                    Icon: Sparkles,
                    label: 'More templates',
                    desc: 'Browse all',
                    handler: handleMoreTemplates,
                  },
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
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399] mb-0.5 truncate transition-colors duration-200">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {type.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#cc3399]" />
              </div>
            ) : (
              <>
                {/* Folders Section */}
                {(folders.length > 0 || isCreatingFolder) && (
                  <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Folder className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Folders
                        </h2>
                      </div>
                      {!isCreatingFolder && (
                        <button
                          onClick={() => setIsCreatingFolder(true)}
                          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#cc3399] transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {folders.length > 0 && (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-100 dark:border-gray-800">
                          {folders.map((folder) => {
                            const stats = getFolderStats(folder.id);
                            return (
                              <Link
                                key={folder.id}
                                href={`/${locale}/folder/${folder.id}`}
                                className="group relative flex items-center justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    <Folder
                                      className="w-5 h-5 text-gray-500 group-hover:text-[#cc3399] group-hover:scale-110 transition-all duration-200"
                                      style={{
                                        color: folder.color || undefined,
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 group-hover:text-[#cc3399] transition-colors duration-200">
                                      {folder.name}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-gray-400">
                                      <span>{stats.count} conversations</span>
                                      <span>·</span>
                                      <span>{formatDuration(stats.duration)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 pr-2 text-sm font-medium text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                                  →
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Add New Folder */}
                      {isCreatingFolder ? (
                        <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Folder className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateFolder();
                              if (e.key === 'Escape') handleCancelFolderCreation();
                            }}
                            placeholder="Folder name..."
                            autoFocus
                            className="flex-1 px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
                          />
                          <button
                            onClick={handleCreateFolder}
                            disabled={!newFolderName.trim()}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Create folder"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelFolderCreation}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                            aria-label="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button variant="ghost" fullWidth onClick={() => setIsCreatingFolder(true)}>
                          + New Folder
                        </Button>
                      )}
                    </div>
                  </section>
                )}

                {/* Ungrouped Conversations */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {folders.length > 0 ? 'Ungrouped Conversations' : 'Your Conversations'}
                    </h2>
                  </div>

                  {conversations.length === 0 ? (
                    <EmptyState
                      icon={<Mic className="w-10 h-10 text-gray-400" />}
                      title="Welcome to Neural Summary"
                      description="Start by recording or uploading your first conversation. We'll transcribe and summarize it for you."
                      actionLabel="Create Conversation"
                      onAction={handleMoreTemplates}
                      actionIcon={<Mic className="w-5 h-5" />}
                    />
                  ) : ungroupedConversations.length === 0 && folders.length > 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        All conversations are organized in folders
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-100 dark:border-gray-800">
                      {(folders.length > 0 ? ungroupedConversations : conversations).map(
                        (conversation) => {
                          const folder = folders.find((f) => f.id === conversation.folderId);

                          return (
                            <Link
                              key={conversation.id}
                              href={`/${locale}/conversation/${conversation.id}`}
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
                                      <span className="flex-shrink-0 text-gray-700 dark:text-gray-400">
                                        ✓
                                      </span>
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
                                  </div>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                                →
                              </div>
                              {conversation.status === 'processing' && (
                                <div className="ml-4 flex-shrink-0">
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                                    Processing
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
                        }
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        }
      />

      {/* Floating Action Button - opens recording flow */}
      <FloatingRecordButton onClick={handleRecordAudio} isRecording={false} />

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
