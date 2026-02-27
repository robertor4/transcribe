'use client';

import { useState } from 'react';
import {
  X,
  Folder,
  FolderPlus,
  Check,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { moveConversationToFolder } from '@/lib/services/conversationService';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface FolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle: string;
  currentFolderId?: string | null;
  onMoveComplete?: (newFolderId: string | null) => void;
}

/**
 * Modal for selecting a folder to move a conversation into
 * Mobile-friendly with touch-optimized list items
 */
export function FolderPickerModal({
  isOpen,
  onClose,
  conversationId,
  conversationTitle,
  currentFolderId,
  onMoveComplete,
}: FolderPickerModalProps) {
  const t = useTranslations('folderPicker');
  const { folders, isLoading: foldersLoading, createFolder } = useFoldersContext();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId ?? null);
  const [isMoving, setIsMoving] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleMove = async () => {
    if (selectedFolderId === currentFolderId) {
      onClose();
      return;
    }

    setIsMoving(true);
    setError(null);

    try {
      await moveConversationToFolder(conversationId, selectedFolderId);
      onMoveComplete?.(selectedFolderId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('moveError'));
    } finally {
      setIsMoving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    setError(null);

    try {
      const newFolder = await createFolder(newFolderName.trim());
      setSelectedFolderId(newFolder.id);
      setNewFolderName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="bg-white dark:bg-gray-800 rounded-2xl max-w-md p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('title')}
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[250px]">
              {conversationTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Create new folder input */}
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                  placeholder={t('createPlaceholder')}
                  className="w-full pl-10 pr-3 py-2.5 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/50 focus:border-[#8D6AFA]
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <Button
                variant="brand"
                size="sm"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
              >
                {isCreatingFolder ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('add')
                )}
              </Button>
            </div>
          </div>

          {/* Folder list */}
          <div className="py-2">
            {/* "No folder" option to remove from folder */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${
                selectedFolderId === null
                  ? 'bg-purple-50 dark:bg-purple-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('noFolder')}
                </span>
              </div>
              {selectedFolderId === null && (
                <Check className="w-5 h-5 text-[#8D6AFA]" />
              )}
            </button>

            {/* Loading state */}
            {foldersLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}

            {/* Folder items */}
            {!foldersLoading && folders.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-5">
                {t('noFoldersYet')}
              </p>
            )}

            {!foldersLoading &&
              folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-purple-50 dark:bg-purple-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: folder.color || '#9ca3af' }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {folder.name}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {folder.conversationCount ?? 0}
                    </span>
                  </div>
                  {selectedFolderId === folder.id && (
                    <Check className="w-5 h-5 text-[#8D6AFA] flex-shrink-0" />
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-5 py-2 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="ghost" onClick={onClose} disabled={isMoving}>
            {t('cancel')}
          </Button>
          <Button
            variant="brand"
            onClick={handleMove}
            disabled={isMoving || selectedFolderId === currentFolderId}
          >
            {isMoving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('moving')}
              </>
            ) : (
              t('move')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
