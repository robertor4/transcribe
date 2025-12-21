'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { deleteConversation } from '@/lib/services/conversationService';
import { getCreativeGreeting, getMilestoneMessage } from '@/lib/userHelpers';
import type { LucideIcon } from 'lucide-react';

// Quick create button config - defined outside component to avoid recreation
interface QuickCreateButton {
  Icon: LucideIcon;
  label: string;
  desc: string;
  action: 'record' | 'upload';
}

const QUICK_CREATE_BUTTONS: QuickCreateButton[] = [
  {
    Icon: Mic,
    label: 'Record audio',
    desc: 'Start live conversation',
    action: 'record',
  },
  {
    Icon: Upload,
    label: 'Import audio',
    desc: 'Upload audio/video file',
    action: 'upload',
  },
];

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

  const { conversations, isLoading: conversationsLoading, total, refresh: refreshConversations } = useConversationsContext();
  const { folders, isLoading: foldersLoading, createFolder, moveToFolder } = useFoldersContext();

  // Memoize filtered ungrouped conversations
  const ungroupedConversations = useMemo(
    () => conversations.filter((c) => !c.folderId),
    [conversations]
  );

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

  // Handle deleting conversation
  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      await deleteConversation(conversationId);
      await refreshConversations();
    },
    [refreshConversations]
  );

  // Pre-compute folder stats map to avoid O(n*m) filtering in render
  const folderStatsMap = useMemo(() => {
    const map = new Map<string, { count: number; duration: number }>();
    for (const conv of conversations) {
      if (conv.folderId) {
        const existing = map.get(conv.folderId) || { count: 0, duration: 0 };
        map.set(conv.folderId, {
          count: existing.count + 1,
          duration: existing.duration + (conv.source?.audioDuration || 0),
        });
      }
    }
    return map;
  }, [conversations]);

  // Memoized getter for folder stats - O(1) lookup instead of O(n) filter
  const getFolderStats = useCallback(
    (folderId: string) => {
      return folderStatsMap.get(folderId) || { count: 0, duration: 0 };
    },
    [folderStatsMap]
  );

  // Context-aware button handlers - memoized to prevent re-renders
  const handleRecordAudio = useCallback(() => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
      uploadMethod: 'record',
    });
  }, []);

  const handleImportAudio = useCallback(() => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
      uploadMethod: 'file',
    });
  }, []);

  const handleMoreTemplates = useCallback(() => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
    });
  }, []);

  // Memoized handler getter for quick create buttons
  const getButtonHandler = useCallback((action: 'record' | 'upload') => {
    return action === 'record' ? handleRecordAudio : handleImportAudio;
  }, [handleRecordAudio, handleImportAudio]);

  const isLoading = conversationsLoading || foldersLoading;

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation onNewConversation={handleMoreTemplates} />}
        showRightPanel={false}
        mainContent={
          <div className="px-12 pt-[38px] pb-12">
            {/* Personalized Greeting - aligned with logo bottom */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7A5AE0] via-[#8D6AFA] to-[#ff66cc] bg-clip-text text-transparent">
                {getCreativeGreeting(user?.displayName || user?.email || 'there')}
              </h1>
            </div>

            {/* Quick Create Buttons */}
            <section className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                {QUICK_CREATE_BUTTONS.map((type) => (
                  <button
                    key={type.label}
                    onClick={getButtonHandler(type.action)}
                    aria-label={`Create ${type.label}: ${type.desc}`}
                    className="group relative flex items-center gap-4 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-700 dark:hover:border-gray-300 hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0 group-hover:from-gray-700 group-hover:to-gray-800 dark:group-hover:from-gray-700 dark:group-hover:to-gray-800 group-hover:scale-105 transition-all duration-200">
                      <type.Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-200">
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
                <Loader2 className="w-8 h-8 animate-spin text-[#8D6AFA]" />
              </div>
            ) : (
              <TwoColumnDashboardLayout
                folders={folders}
                ungroupedConversations={ungroupedConversations}
                locale={locale}
                getFolderStats={getFolderStats}
                onMoveToFolder={handleMoveToFolder}
                onCreateFolder={handleCreateFolder}
                onNewConversation={handleMoreTemplates}
                onDeleteConversation={handleDeleteConversation}
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
