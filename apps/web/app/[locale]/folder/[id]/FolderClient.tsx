'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Folder,
  MessageSquare,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Trash2,
  MoreVertical,
  FolderMinus,
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
import { useFolderConversations } from '@/hooks/useFolderConversations';
import { useFolders } from '@/hooks/useFolders';
import { useSlidePanel } from '@/hooks/useSlidePanel';
import { deleteConversation } from '@/lib/services/conversationService';
import { transcriptionApi, type RecentAnalysis } from '@/lib/api';
import { formatRelativeTime } from '@/lib/formatters';
import { AssetsCountBadge } from '@/components/dashboard/AssetsCountBadge';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // AI Assets sidebar state
  const [assets, setAssets] = useState<RecentAnalysis[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

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

  // Handle removing a conversation from this folder
  const handleRemoveFromFolder = async (conversationId: string) => {
    try {
      await moveToFolder(conversationId, null);
      await refresh();
    } catch (err) {
      console.error('Failed to remove conversation from folder:', err);
    }
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
    return (
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation />}
          showRightPanel={false}
          mainContent={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#8D6AFA] mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading folder...</p>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // Error or not found state
  if (error || !folder) {
    return (
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation />}
          showRightPanel={false}
          mainContent={
            <div className="flex items-center justify-center h-full">
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
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={true}
        rightPanel={
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`p-4 ${assets.length > 0 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8D6AFA] to-[#7A5AE0] flex items-center justify-center">
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
                // Loading skeleton
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-lg animate-pulse"
                    >
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1">
                          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <Image
                    src="/assets/symbols/ai-icon-brand-color.svg"
                    alt="AI Assets"
                    width={48}
                    height={48}
                    className="mx-auto mb-3 opacity-50"
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
          <div className="px-12 py-8">
            {/* Back Button */}
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            {/* Folder Header */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-800"
                    style={folder.color ? {
                      backgroundColor: `${folder.color}20`,
                    } : undefined}
                  >
                    <Folder
                      className="w-8 h-8 text-gray-500 dark:text-gray-400"
                      style={folder.color ? {
                        color: folder.color,
                      } : undefined}
                    />
                  </div>
                  <div>
                    {isEditingName ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={handleNameKeyDown}
                        className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-[#8D6AFA] outline-none w-full font-[Montserrat]"
                      />
                    ) : (
                      <h1
                        onClick={handleStartEditName}
                        className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 cursor-text hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                        title="Click to rename"
                      >
                        {folder.name}
                      </h1>
                    )}
                  </div>
                </div>
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
            </div>

            {/* Conversations in Folder */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#8D6AFA] uppercase tracking-wider">
                  Conversations ({conversations.length})
                </h2>
                {conversations.length > 0 && (
                  <Button variant="brand" size="md" onClick={() => setIsCreateModalOpen(true)}>
                    + New Conversation
                  </Button>
                )}
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800/40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700/50">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-6">
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
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700/50 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="group relative flex items-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <Link
                        href={`/${locale}/conversation/${conversation.id}`}
                        className="flex items-center justify-between py-3 px-4 flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-[#8D6AFA] group-hover:scale-110 transition-all duration-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA] transition-colors duration-200 truncate">
                                {conversation.title}
                              </span>
                              <AssetsCountBadge count={conversation.assetsCount} />
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              <span>{formatRelativeTime(conversation.createdAt)}</span>
                            </div>
                          </div>
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
                        <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#8D6AFA] group-hover:translate-x-1 transition-all duration-200 ml-2">
                          →
                        </div>
                      </Link>
                      {/* Context menu for folder actions */}
                      <div
                        className="flex-shrink-0 pr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu
                          trigger={
                            <button className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          }
                          items={[
                            {
                              icon: FolderMinus,
                              label: 'Remove from folder',
                              onClick: () => handleRemoveFromFolder(conversation.id),
                            },
                            {
                              icon: Trash2,
                              label: 'Delete',
                              onClick: () => handleDeleteConversation(conversation.id),
                              variant: 'danger',
                            },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
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
    </div>
  );
}
