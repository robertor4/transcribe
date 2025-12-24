'use client';

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { Button } from '@/components/Button';
import { DropdownMenu } from '@/components/DropdownMenu';
import { ConversationCreateModal } from '@/components/ConversationCreateModal';
import { DeleteFolderModal } from '@/components/DeleteFolderModal';
import { useFolderConversations } from '@/hooks/useFolderConversations';
import { useFolders } from '@/hooks/useFolders';
import { deleteConversation } from '@/lib/services/conversationService';
import { formatRelativeTime } from '@/lib/formatters';
import { AssetsCountBadge } from '@/components/dashboard/AssetsCountBadge';
import { FolderRecentAssetsSection } from '@/components/dashboard/FolderRecentAssetsSection';

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
          <div className="p-6">
            {/* Folder Stats */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
                Folder Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Conversations
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {conversations.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Created
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatRelativeTime(folder.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
        mainContent={
          <div className="max-w-7xl mx-auto px-6 py-8">
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
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-20">
                <span>{conversations.length} conversations</span>
              </div>
            </div>

            {/* Conversations in Folder */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Conversations ({conversations.length})
                </h2>
                <Button variant="brand" size="md" onClick={() => setIsCreateModalOpen(true)}>
                  + New Conversation
                </Button>
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
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40">
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
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
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

            {/* Recent Outputs from this folder */}
            {conversations.length > 0 && (
              <FolderRecentAssetsSection folderId={folderId} locale={locale} />
            )}
          </div>
        }
      />

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
