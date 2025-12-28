'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Folder,
  FolderPlus,
  Check,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { useFoldersContext } from '@/contexts/FoldersContext';
import { moveConversationToFolder } from '@/lib/services/conversationService';
import { Button } from '@/components/Button';

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
  const { folders, isLoading: foldersLoading, createFolder } = useFoldersContext();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId ?? null);
  const [isMoving, setIsMoving] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || typeof window === 'undefined') {
    return null;
  }

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
      setError(err instanceof Error ? err.message : 'Failed to move conversation');
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
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm animate-backdropFadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl animate-bounceIn overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="folder-picker-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2
                id="folder-picker-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Move to folder
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[250px]">
                {conversationTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
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
                    placeholder="Create new folder..."
                    className="w-full pl-10 pr-3 py-2.5 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/50 focus:border-[#8D6AFA]
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                >
                  {isCreatingFolder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Add'
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
                    No folder (ungrouped)
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
                  No folders yet. Create one above.
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
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleMove}
              disabled={isMoving || selectedFolderId === currentFolderId}
            >
              {isMoving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Moving...
                </>
              ) : (
                'Move'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
