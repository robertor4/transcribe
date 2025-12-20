'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Mic,
  Upload,
  Loader2,
} from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { ConversationCreateModal, type CreateStep } from '@/components/ConversationCreateModal';
import { MilestoneToast } from '@/components/MilestoneToast';
import { TwoColumnDashboardLayout } from '@/components/dashboard/TwoColumnDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useFolders } from '@/hooks/useFolders';
import { getGreeting, getMilestoneMessage } from '@/lib/userHelpers';

interface CreateModalConfig {
  isOpen: boolean;
  initialStep?: CreateStep;
  uploadMethod?: 'file' | 'record' | null;
}

export function DashboardClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const { user } = useAuth();

  const { conversations, isLoading: conversationsLoading, total, refresh: refreshConversations } = useConversations();
  const { folders, isLoading: foldersLoading, createFolder, moveToFolder } = useFolders();

  // Filter ungrouped conversations (no folderId or folderId is null)
  const ungroupedConversations = conversations.filter((c) => !c.folderId);

  const [createModalConfig, setCreateModalConfig] = useState<CreateModalConfig>({
    isOpen: false,
  });
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');

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

  // Handle moving conversation to folder with refresh
  const handleMoveToFolder = useCallback(
    async (conversationId: string, folderId: string) => {
      await moveToFolder(conversationId, folderId);
      await refreshConversations();
    },
    [moveToFolder, refreshConversations]
  );

  // Handle creating folder
  const handleCreateFolder = useCallback(
    async (name: string) => {
      await createFolder(name);
    },
    [createFolder]
  );

  // Calculate folder stats
  const getFolderStats = useCallback(
    (folderId: string) => {
      const folderConversations = conversations.filter((c) => c.folderId === folderId);
      const totalDuration = folderConversations.reduce(
        (sum, c) => sum + (c.source?.audioDuration || 0),
        0
      );
      return {
        count: folderConversations.length,
        duration: totalDuration,
      };
    },
    [conversations]
  );

  // Context-aware button handlers
  const handleRecordAudio = () => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
      uploadMethod: 'record',
    });
  };

  const handleImportAudio = () => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
      uploadMethod: 'file',
    });
  };

  const handleMoreTemplates = () => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
    });
  };

  const isLoading = conversationsLoading || foldersLoading;

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation onNewConversation={handleMoreTemplates} />}
        showRightPanel={false}
        mainContent={
          <div className="px-8 pr-12 py-12">
            {/* Personalized Greeting */}
            <div className="mb-12">
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#b82d89] via-[#cc3399] to-[#ff66cc] bg-clip-text text-transparent">
                {getGreeting(user?.displayName || user?.email || '')}
              </h1>
            </div>

            {/* Quick Create Buttons */}
            <section className="mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
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
                ].map((type) => (
                  <button
                    key={type.label}
                    onClick={type.handler}
                    aria-label={`Create ${type.label}: ${type.desc}`}
                    className="group relative flex items-center gap-4 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-700 dark:hover:border-gray-300 hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc3399]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0 group-hover:from-gray-700 group-hover:to-gray-800 dark:group-hover:from-gray-700 dark:group-hover:to-gray-800 group-hover:scale-105 transition-all duration-200">
                      <type.Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399] mb-0.5 transition-colors duration-200">
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
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
              <TwoColumnDashboardLayout
                folders={folders}
                conversations={conversations}
                ungroupedConversations={ungroupedConversations}
                locale={locale}
                getFolderStats={getFolderStats}
                onMoveToFolder={handleMoveToFolder}
                onCreateFolder={handleCreateFolder}
                onNewConversation={handleMoreTemplates}
              />
            )}
          </div>
        }
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
        uploadMethod={createModalConfig.uploadMethod}
      />
    </div>
  );
}
