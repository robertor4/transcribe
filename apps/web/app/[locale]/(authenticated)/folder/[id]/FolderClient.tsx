'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Folder,
  AlertCircle,
  ArrowLeft,
  Trash2,
  MoreVertical,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { Button } from '@/components/Button';
import { DropdownMenu } from '@/components/DropdownMenu';
import { ConversationCreateModal } from '@/components/ConversationCreateModal';
import { DeleteFolderModal } from '@/components/DeleteFolderModal';
import { AIAssetSlidePanel } from '@/components/AIAssetSlidePanel';
import { FolderAssetCard } from '@/components/FolderAssetCard';
import { QASlidePanel } from '@/components/QASlidePanel';
import { ConversationsTable } from '@/components/dashboard/conversations-table/ConversationsTable';
import type { FolderContext } from '@/components/dashboard/conversations-table/types';
import { useFolderConversations } from '@/hooks/useFolderConversations';
import { useFolders } from '@/hooks/useFolders';
import { useUsage } from '@/contexts/UsageContext';
import { useSlidePanel } from '@/hooks/useSlidePanel';
import { deleteConversation } from '@/lib/services/conversationService';
import { transcriptionApi, type RecentAnalysis } from '@/lib/api';
import { formatRelativeTime } from '@/lib/formatters';
import { AiIcon } from '@/components/icons/AiIcon';
import { AnimatedAiIcon } from '@/components/icons/AnimatedAiIcon';
import { FolderSkeleton } from '@/components/skeletons/FolderSkeleton';
import { AssetListSkeleton } from '@/components/skeletons/AssetListSkeleton';

interface FolderClientProps {
  folderId: string;
}

export function FolderClient({ folderId }: FolderClientProps) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { folder, conversations, isLoading, error, updateFolderLocally, refresh } = useFolderConversations(folderId);
  const { deleteFolder, updateFolder, moveToFolder } = useFolders();
  const { usageStats, isAdmin } = useUsage();
  const userTier = usageStats?.tier || 'free';
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // AI Assets sidebar state
  const [assets, setAssets] = useState<RecentAnalysis[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isQAPanelOpen, setIsQAPanelOpen] = useState(false);

  const {
    selectedItem: selectedAsset,
    isOpen: isPanelOpen,
    isClosing: isPanelClosing,
    open: openAssetPanel,
    close: closeAssetPanel,
  } = useSlidePanel<RecentAnalysis>();

  const handleDeleteFolder = async (deleteContents: boolean) => {
    setIsDeleting(true);
    try {
      await deleteFolder(folderId, deleteContents);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      console.error('Failed to delete folder:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteClick = () => {
    if (conversations.length > 0) {
      // Has conversations - show modal to choose move vs delete
      setIsDeleteModalOpen(true);
    } else {
      // Empty folder - use inline confirmation
      setShowDeleteConfirm(true);
    }
  };

  // Handle starting name edit
  const handleStartEditName = () => {
    if (folder) {
      setEditedName(folder.name);
      setIsEditingName(true);
    }
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Handle saving the edited name
  const handleSaveName = async () => {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== folder?.name) {
      try {
        await updateFolder(folderId, { name: trimmedName });
        updateFolderLocally({ name: trimmedName });
      } catch (err) {
        console.error('Failed to rename folder:', err);
      }
    }
    setIsEditingName(false);
  };

  // Handle key events in the name input
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingName(false);
    }
  };

  // Handle removing conversations from this folder
  const handleRemoveFromFolder = async (conversationIds: string[]) => {
    for (const id of conversationIds) {
      await moveToFolder(id, null);
    }
    await refresh();
  };

  const folderTableContext: FolderContext = {
    folderId,
    onRefresh: refresh,
    onRemoveFromFolder: handleRemoveFromFolder,
    extraToolbarActions: (
      <>
        <div className="hidden sm:block">
          <Button
            variant="ghost"
            size="sm"
            icon={<AnimatedAiIcon size={16} />}
            onClick={() => setIsQAPanelOpen(true)}
          >
            Ask Questions
          </Button>
        </div>
        <button
          onClick={() => setIsQAPanelOpen(true)}
          className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-[#8D6AFA] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Ask Questions"
        >
          <AnimatedAiIcon size={18} />
        </button>
      </>
    ),
  };

  // Fetch assets for this folder
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await transcriptionApi.getRecentAnalysesByFolder(folderId, 8);
        if (response.success && response.data) {
          setAssets(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch folder assets:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [folderId]);

  // Handle deleting an asset from the slide panel
  const handleDeleteAsset = async (assetId: string) => {
    if (!selectedAsset) return;
    await transcriptionApi.deleteAnalysis(selectedAsset.transcriptionId, assetId);
    setAssets(prev => prev.filter(a => a.id !== assetId));
    closeAssetPanel();
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      await refresh();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return <FolderSkeleton />;
  }

  // Error or not found state
  if (error || !folder) {
    return (
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation />}
          showRightPanel={false}
          mainContent={
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide">
                  Folder not found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error?.message || 'The folder you are looking for does not exist or you do not have access to it.'}
                </p>
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="primary">Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          }
        />
      </div>
    );
  }


  return (
    <>
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={true}
        rightPanel={
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`p-4 ${assets.length > 0 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#8D6AFA] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide leading-tight">
                    AI Assets
                  </h2>
                  {assets.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {assets.length} item{assets.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Asset List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-subtle">
              {isLoadingAssets ? (
                <AssetListSkeleton count={3} />
              ) : assets.length > 0 ? (
                assets.map((asset) => (
                  <FolderAssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => openAssetPanel(asset)}
                    isActive={selectedAsset?.id === asset.id}
                  />
                ))
              ) : (
                // Empty state
                <div className="text-center py-6 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <AiIcon
                    size={48}
                    className="mx-auto mb-3 text-[#8D6AFA] opacity-50"
                  />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    No AI Assets yet
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Generate assets from your conversations
                  </p>
                </div>
              )}
            </div>

            {/* Collapsible Folder Stats */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Folder Stats</span>
                {isStatsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              {isStatsExpanded && (
                <div className="px-4 pb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Conversations</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{conversations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Created</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatRelativeTime(folder.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
        mainContent={
          <div className="px-4 sm:px-6 lg:px-12 pt-8 sm:pt-6 lg:pt-8 pb-6 lg:pb-8">
            {/* Back Button */}
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] transition-colors mb-4 lg:mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            {/* Folder Header */}
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                  style={folder.color ? {
                    backgroundColor: `${folder.color}20`,
                  } : undefined}
                >
                  <Folder
                    className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 dark:text-gray-400"
                    style={folder.color ? {
                      color: folder.color,
                    } : undefined}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={handleNameKeyDown}
                      className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-[#8D6AFA] outline-none w-full font-[Montserrat]"
                    />
                  ) : (
                    <h1
                      onClick={handleStartEditName}
                      className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 cursor-text hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600 transition-all break-words"
                      title="Click to rename"
                    >
                      {folder.name}
                    </h1>
                  )}
                </div>
                {/* Desktop: Delete button */}
                <div className="hidden sm:block flex-shrink-0">
                  {!showDeleteConfirm ? (
                    <Button
                      variant="ghost"
                      size="md"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={handleDeleteClick}
                    >
                      Delete
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <span className="text-sm text-red-700 dark:text-red-300">Delete?</span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteFolder(false)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? '...' : 'Yes'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        No
                      </Button>
                    </div>
                  )}
                </div>
                {/* Mobile: Three-dot menu */}
                <div className="sm:hidden flex-shrink-0">
                  <DropdownMenu
                    trigger={
                      <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    }
                    items={[
                      {
                        icon: Trash2,
                        label: 'Delete folder',
                        onClick: handleDeleteClick,
                        variant: 'danger' as const,
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Conversations in Folder */}
            <ConversationsTable
              conversations={conversations}
              locale={locale}
              onDeleteConversation={handleDeleteConversation}
              onNewConversation={() => setIsCreateModalOpen(true)}
              folderContext={folderTableContext}
              paginationStorageKey="neural-summary-folder-pagination"
              emptyState={
                <div className="text-center py-16 bg-white dark:bg-gray-800/40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700/50">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                    <Folder className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
                    No conversations yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">
                    Create your first conversation in this folder
                  </p>
                  <Button variant="brand" size="md" onClick={() => setIsCreateModalOpen(true)}>
                    + New Conversation
                  </Button>
                </div>
              }
            />
          </div>
        }
      />

      {/* Q&A Slide Panel */}
      <QASlidePanel
        isOpen={isQAPanelOpen}
        onClose={() => setIsQAPanelOpen(false)}
        scope="folder"
        folderId={folderId}
        title={folder.name}
        userTier={userTier}
        isAdmin={isAdmin}
      />

      {/* AI Asset Slide Panel */}
      {selectedAsset && (
        <AIAssetSlidePanel
          asset={selectedAsset}
          isOpen={isPanelOpen}
          isClosing={isPanelClosing}
          onClose={closeAssetPanel}
          onDelete={handleDeleteAsset}
          conversationId={selectedAsset.transcriptionId}
          locale={locale}
        />
      )}

      {/* Conversation Create Modal */}
      <ConversationCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onComplete={(conversationId) => {
          router.push(`/${locale}/conversation/${conversationId}`);
        }}
        folderId={folderId}
      />

      {/* Delete Folder Modal */}
      <DeleteFolderModal
        isOpen={isDeleteModalOpen}
        folderName={folder?.name || ''}
        conversationCount={conversations.length}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteFolder}
      />

    </>
  );
}
