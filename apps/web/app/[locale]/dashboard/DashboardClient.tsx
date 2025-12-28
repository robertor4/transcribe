'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Mic,
  Monitor,
  Upload,
  Loader2,
} from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { ConversationCreateModal, type CreateStep } from '@/components/ConversationCreateModal';
import { MilestoneToast } from '@/components/MilestoneToast';
import { TwoColumnDashboardLayout } from '@/components/dashboard/TwoColumnDashboardLayout';
import { DashboardDndProvider } from '@/components/dashboard/DashboardDndProvider';
import { RecentAssetsSection } from '@/components/dashboard/RecentAssetsSection';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { deleteConversation } from '@/lib/services/conversationService';
import { getCreativeGreeting, getMilestoneMessage } from '@/lib/userHelpers';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

// Quick create button config - defined outside component to avoid recreation
interface QuickCreateButton {
  Icon: LucideIcon;
  labelKey: 'recordRoom' | 'recordTab' | 'uploadFileLabel';
  descKey: 'recordRoomDesc' | 'recordTabDesc' | 'uploadFileDesc';
  action: 'record-microphone' | 'record-tab-audio' | 'upload';
}

const QUICK_CREATE_BUTTONS: QuickCreateButton[] = [
  {
    Icon: Mic,
    labelKey: 'recordRoom',
    descKey: 'recordRoomDesc',
    action: 'record-microphone',
  },
  {
    Icon: Monitor,
    labelKey: 'recordTab',
    descKey: 'recordTabDesc',
    action: 'record-tab-audio',
  },
  {
    Icon: Upload,
    labelKey: 'uploadFileLabel',
    descKey: 'uploadFileDesc',
    action: 'upload',
  },
];

interface CreateModalConfig {
  isOpen: boolean;
  initialStep?: CreateStep;
  uploadMethod?: 'file' | 'record' | 'record-microphone' | 'record-tab-audio' | null;
}

export function DashboardClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const { user } = useAuth();
  const t = useTranslations('dashboard');

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
    async (conversationId: string, folderId: string, previousFolderId?: string | null) => {
      await moveToFolder(conversationId, folderId, previousFolderId);
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

  // Context-aware button handlers - memoized to prevent re-renders
  const handleRecordMicrophone = useCallback(() => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
      uploadMethod: 'record-microphone',
    });
  }, []);

  const handleRecordTabAudio = useCallback(() => {
    setCreateModalConfig({
      isOpen: true,
      initialStep: 'capture',
      uploadMethod: 'record-tab-audio',
    });
  }, []);

  const handleUploadFile = useCallback(() => {
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
  const getButtonHandler = useCallback((action: 'record-microphone' | 'record-tab-audio' | 'upload') => {
    switch (action) {
      case 'record-microphone': return handleRecordMicrophone;
      case 'record-tab-audio': return handleRecordTabAudio;
      case 'upload': return handleUploadFile;
    }
  }, [handleRecordMicrophone, handleRecordTabAudio, handleUploadFile]);

  const isLoading = conversationsLoading || foldersLoading;

  return (
    <DashboardDndProvider onMoveToFolder={handleMoveToFolder}>
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation onNewConversation={handleMoreTemplates} />}
          showRightPanel={false}
          mainContent={
          <div className="px-4 sm:px-6 lg:px-12 pt-8 sm:pt-4 lg:pt-[38px] pb-12">
            {/* Personalized Greeting - aligned with logo bottom */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-[#8D6AFA]">
                {getCreativeGreeting(user?.displayName || user?.email || 'there')}
              </h1>
            </div>

            {/* Quick Create Buttons */}
            <section className="mb-8 sm:mb-10">
              {/* Mobile: Primary action + secondary row */}
              <div className="sm:hidden space-y-2">
                {/* Primary: Record the room */}
                <button
                  onClick={handleRecordMicrophone}
                  aria-label={`${t('recordRoom')}: ${t('recordRoomDesc')}`}
                  className="group relative w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800/40 border-2 border-gray-200 dark:border-gray-700/50 rounded-2xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] group-hover:scale-105 transition-all duration-200">
                    <Mic className="w-7 h-7 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-200">
                      {t('recordRoom')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('recordRoomDesc')}
                    </div>
                  </div>
                </button>

                {/* Secondary: Browser tab & Upload */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={handleRecordTabAudio}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>{t('recordTab')}</span>
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <button
                    onClick={handleUploadFile}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t('uploadFileLabel')}</span>
                  </button>
                </div>
              </div>

              {/* Desktop: 3-column grid */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-4 max-w-4xl">
                {QUICK_CREATE_BUTTONS.map((type) => (
                  <button
                    key={type.action}
                    onClick={getButtonHandler(type.action)}
                    aria-label={`Create ${t(type.labelKey)}: ${t(type.descKey)}`}
                    className="group relative flex items-center gap-4 p-5 min-h-[88px] bg-white dark:bg-gray-800/40 border-2 border-gray-200 dark:border-gray-700/50 rounded-2xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-xl hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] group-hover:scale-105 transition-all duration-200">
                      <type.Icon className="w-7 h-7 text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] mb-0.5 transition-colors duration-200">
                        {t(type.labelKey)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 h-10 line-clamp-2">
                        {t(type.descKey)}
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
              <>
                <TwoColumnDashboardLayout
                  folders={folders}
                  ungroupedConversations={ungroupedConversations}
                  locale={locale}
                  onCreateFolder={handleCreateFolder}
                  onNewConversation={handleMoreTemplates}
                  onDeleteConversation={handleDeleteConversation}
                />

                {/* Recent AI Outputs Section */}
                <RecentAssetsSection locale={locale} />
              </>
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
    </DashboardDndProvider>
  );
}
