'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Mic,
  Monitor,
  Upload,
} from 'lucide-react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { ConversationCreateModal, type CreateStep } from '@/components/ConversationCreateModal';
import { toast } from 'sonner';
import { TwoColumnDashboardLayout } from '@/components/dashboard/TwoColumnDashboardLayout';
import { DashboardSkeleton, DashboardInlineSkeleton } from '@/components/skeletons/DashboardSkeleton';
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
  const { user, loading: authLoading } = useAuth();
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
  const milestoneShownRef = useRef(false);

  // Refresh user on mount to get latest email verification status
  // This handles the case where user returns from email verification link
  const { refreshUser } = useAuth();
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!authLoading && user && !user.emailVerified && !hasRefreshedRef.current) {
        hasRefreshedRef.current = true;
        // Refresh to get latest verification status from Firebase
        await refreshUser();
      }
    };
    checkVerification();
  }, [authLoading, user, refreshUser]);

  // Redirect unverified users to verify-email page (after refresh attempt)
  useEffect(() => {
    if (!authLoading && user && !user.emailVerified && hasRefreshedRef.current) {
      router.replace(`/${locale}/verify-email`);
    }
  }, [authLoading, user, router, locale]);

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
    if (!conversationsLoading && conversations.length > 0 && !milestoneShownRef.current) {
      const message = getMilestoneMessage(conversations.length);
      if (message) {
        milestoneShownRef.current = true;
        toast(message, {
          duration: 5000,
          className: 'border-2 border-[#8D6AFA]',
        });
      }
    }
  }, [conversationsLoading, conversations.length]);

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

  // Show loading state while checking auth, or if user is unverified (redirect in progress)
  if (authLoading || (user && !user.emailVerified)) {
    return <DashboardSkeleton />;
  }

  return (
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

              {/* Desktop: Inline action buttons */}
              <div className="hidden sm:flex gap-3">
                {QUICK_CREATE_BUTTONS.map((type) => (
                  <ShadcnButton
                    key={type.action}
                    variant="outline"
                    onClick={getButtonHandler(type.action)}
                    className="h-10 px-4 gap-2 bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800/40 hover:text-[#8D6AFA] hover:border-[#8D6AFA] transition-colors"
                  >
                    <type.Icon className="w-4 h-4" />
                    {t(type.labelKey)}
                  </ShadcnButton>
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
      </div>
  );
}
