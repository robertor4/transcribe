'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Mic,
  Monitor,
  Upload,
} from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { ConversationCreateModal, type CreateStep } from '@/components/ConversationCreateModal';
import { toast } from 'sonner';
import { TwoColumnDashboardLayout } from '@/components/dashboard/TwoColumnDashboardLayout';
import { DashboardInlineSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { deleteConversation } from '@/lib/services/conversationService';
import { getCreativeGreeting } from '@/lib/userHelpers';
import { useTranslations } from 'next-intl';
import { OnboardingQuestionnaire } from '@/components/onboarding/OnboardingQuestionnaire';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import type { LucideIcon } from 'lucide-react';

// Quick create button config - defined outside component to avoid recreation
interface QuickCreateButton {
  Icon: LucideIcon;
  labelKey: 'recordRoom' | 'recordTab' | 'uploadFileLabel';
  descKey: 'recordRoomDesc' | 'recordTabDesc' | 'uploadFileDesc';
  action: 'record-microphone' | 'record-tab-audio' | 'upload';
  color: string;
  hoverColor: string;
  borderColor: string;
  bgColor: string;
}

const QUICK_CREATE_BUTTONS: QuickCreateButton[] = [
  {
    Icon: Mic,
    labelKey: 'recordRoom',
    descKey: 'recordRoomDesc',
    action: 'record-microphone',
    color: 'bg-[#8D6AFA]',
    hoverColor: 'group-hover:bg-[#7A5AE0]',
    borderColor: 'border-[#8D6AFA]',
    bgColor: 'bg-[#8D6AFA]/10',
  },
  {
    Icon: Monitor,
    labelKey: 'recordTab',
    descKey: 'recordTabDesc',
    action: 'record-tab-audio',
    color: 'bg-[#14D0DC]',
    hoverColor: 'group-hover:bg-[#10B8C4]',
    borderColor: 'border-[#14D0DC]',
    bgColor: 'bg-[#14D0DC]/10',
  },
  {
    Icon: Upload,
    labelKey: 'uploadFileLabel',
    descKey: 'uploadFileDesc',
    action: 'upload',
    color: 'bg-[#3F38A0]',
    hoverColor: 'group-hover:bg-[#352F88]',
    borderColor: 'border-[#3F38A0]',
    bgColor: 'bg-[#3F38A0]/10',
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

  const { conversations, isLoading: conversationsLoading, refresh: refreshConversations } = useConversationsContext();
  const { isLoading: foldersLoading } = useFoldersContext();

  // Memoize filtered ungrouped conversations
  const ungroupedConversations = useMemo(
    () => conversations.filter((c) => !c.folderId),
    [conversations]
  );

  const [createModalConfig, setCreateModalConfig] = useState<CreateModalConfig>({
    isOpen: false,
  });

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


  const handleCreateComplete = useCallback((conversationId: string) => {
    router.push(`/${locale}/conversation/${conversationId}`);
  }, [router, locale]);

  // Handle deleting conversation
  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await deleteConversation(conversationId);
        await refreshConversations();
        toast.success(t('table.deleteSuccess'));
      } catch {
        toast.error(t('table.deleteError'));
      }
    },
    [refreshConversations, t]
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
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation onNewConversation={handleMoreTemplates} />}
          showRightPanel={false}
          mobileTitle={
            <h1
              className="text-lg font-bold text-[#8D6AFA] truncate"
              style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
            >
              {getCreativeGreeting(user?.displayName || user?.email || 'there')}
            </h1>
          }
          mainContent={
          <div className="px-4 sm:px-6 lg:px-12 pt-4 sm:pt-4 lg:pt-[38px] pb-12">
            {/* Personalized Greeting - hidden on mobile (shown in top bar) */}
            <div className="mb-4 hidden sm:block">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}>
                {getCreativeGreeting(user?.displayName || user?.email || 'there')}
              </h1>
            </div>

            {/* Quick Create Buttons */}
            <section className="mb-6 sm:mb-10" data-tour-step="dashboard-create">
              {/* Mobile: Primary action + secondary row */}
              <div className="sm:hidden space-y-2">
                {/* Primary: Record the room */}
                <button
                  onClick={handleRecordMicrophone}
                  aria-label={`${t('recordRoom')}: ${t('recordRoomDesc')}`}
                  className="group relative w-full flex items-center overflow-hidden bg-white dark:bg-gray-800/40 border-2 border-gray-200 dark:border-gray-700/50 rounded-2xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA]/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out text-left active:scale-[0.98]"
                >
                  <div className="w-1/4 flex-shrink-0 bg-[#8D6AFA] flex items-center justify-center py-4">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] transition-colors duration-200">
                      {t('recordRoom')}
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

              {/* Desktop: Inline action buttons */}
              <div className="hidden sm:flex gap-3 items-center">
                {QUICK_CREATE_BUTTONS.map((type) => (
                  <button
                    key={type.action}
                    onClick={getButtonHandler(type.action)}
                    className={`group flex items-center overflow-hidden h-10 ${type.bgColor} dark:bg-gray-800/60 border ${type.borderColor} dark:border-gray-600/50 rounded-lg hover:shadow-md hover:scale-[1.02] transition-all duration-200`}
                  >
                    <div className={`w-10 h-10 flex-shrink-0 ${type.color} ${type.hoverColor} flex items-center justify-center transition-colors duration-200`}>
                      <type.Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-3 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors">
                      {t(type.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Loading State */}
            {isLoading ? (
              <DashboardInlineSkeleton />
            ) : (
              <>
                <TwoColumnDashboardLayout
                  ungroupedConversations={ungroupedConversations}
                  locale={locale}
                  onNewConversation={handleMoreTemplates}
                  onDeleteConversation={handleDeleteConversation}
                />

              </>
            )}
          </div>
        }
      />

      {/* Conversation Create Modal */}
      <ConversationCreateModal
        isOpen={createModalConfig.isOpen}
        onClose={() => setCreateModalConfig({ isOpen: false })}
        onComplete={handleCreateComplete}
        initialStep={createModalConfig.initialStep}
        uploadMethod={createModalConfig.uploadMethod}
      />

      {/* Onboarding */}
      <OnboardingQuestionnaire />
      <OnboardingTour />
      </div>
  );
}
