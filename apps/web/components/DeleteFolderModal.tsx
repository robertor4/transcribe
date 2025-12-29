'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Trash2, FolderMinus, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/Button';

interface DeleteFolderModalProps {
  isOpen: boolean;
  folderName: string;
  conversationCount: number;
  onClose: () => void;
  onDelete: (deleteContents: boolean) => Promise<void>;
}

export function DeleteFolderModal({
  isOpen,
  folderName,
  conversationCount,
  onClose,
  onDelete,
}: DeleteFolderModalProps) {
  const [selectedOption, setSelectedOption] = useState<'move' | 'delete'>('move');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(selectedOption === 'delete');
      onClose();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Delete Folder
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
                  {folderName}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                disabled={isDeleting}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-6">
            {conversationCount > 0 ? (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  This folder contains <strong>{conversationCount} conversation{conversationCount !== 1 ? 's' : ''}</strong>.
                  What would you like to do with them?
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {/* Option 1: Move to Ungrouped */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedOption === 'move'
                        ? 'border-[#8D6AFA] bg-purple-50/50 dark:bg-purple-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteOption"
                      value="move"
                      checked={selectedOption === 'move'}
                      onChange={() => setSelectedOption('move')}
                      className="mt-1 text-[#8D6AFA] focus:ring-[#8D6AFA]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderMinus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Move to Ungrouped
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Conversations will be moved out of this folder and remain accessible from your dashboard.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Delete Everything */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedOption === 'delete'
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteOption"
                      value="delete"
                      checked={selectedOption === 'delete'}
                      onChange={() => setSelectedOption('delete')}
                      className="mt-1 text-red-500 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Delete Everything
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Permanently delete this folder and all {conversationCount} conversation{conversationCount !== 1 ? 's' : ''} inside it.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Warning for delete option */}
                {selectedOption === 'delete' && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        This action cannot be undone. All conversations and their transcriptions will be permanently deleted.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This folder is empty. Are you sure you want to delete it?
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : selectedOption === 'delete' ? (
                'Delete Folder & Conversations'
              ) : (
                'Delete Folder'
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
