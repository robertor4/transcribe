'use client';

import { useState } from 'react';
import { Search, FolderInput, FolderMinus, Trash2, X, Mic } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/Button';
import { FolderPickerModal } from '@/components/FolderPickerModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { moveConversationToFolder } from '@/lib/services/conversationService';
import type { StatusFilter } from './useConversationsTable';
import type { FolderContext } from './types';

interface ConversationsTableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  selectedIds: Set<string>;
  clearSelection: () => void;
  onDeleteSelected: () => Promise<void>;
  onNewConversation: () => void;
  folderContext?: FolderContext;
}

export function ConversationsTableToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedIds,
  clearSelection,
  onDeleteSelected,
  onNewConversation,
  folderContext,
}: ConversationsTableToolbarProps) {
  const t = useTranslations('dashboard');
  const [showBulkFolderPicker, setShowBulkFolderPicker] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await onDeleteSelected();
      setShowBulkDeleteConfirm(false);
      clearSelection();
      await folderContext?.onRefresh();
    } catch (error) {
      console.error('Failed to delete conversations:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkMove = async (folderId: string | null) => {
    if (!folderId) return;
    setIsBulkMoving(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        moveConversationToFolder(id, folderId)
      );
      await Promise.all(promises);
      clearSelection();
      await folderContext?.onRefresh();
    } catch (error) {
      console.error('Failed to move conversations:', error);
    } finally {
      setIsBulkMoving(false);
    }
  };

  const handleBulkRemoveFromFolder = async () => {
    if (!folderContext) return;
    setIsBulkRemoving(true);
    try {
      await folderContext.onRemoveFromFolder(Array.from(selectedIds));
      setShowBulkRemoveConfirm(false);
      clearSelection();
    } catch (error) {
      console.error('Failed to remove conversations from folder:', error);
    } finally {
      setIsBulkRemoving(false);
    }
  };

  // Bulk actions bar
  if (hasSelection) {
    return (
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 mb-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
            {t('table.selected', { count: selectedCount })}
          </span>
          {folderContext && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkRemoveConfirm(true)}
              disabled={isBulkRemoving}
              icon={<FolderMinus className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">{t('table.removeFromFolder')}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBulkFolderPicker(true)}
            disabled={isBulkMoving}
            icon={<FolderInput className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">{t('table.moveToFolder')}</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowBulkDeleteConfirm(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">{t('table.delete')}</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          icon={<X className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">{t('table.clearSelection')}</span>
        </Button>

        {/* Bulk folder picker - uses first selected ID as placeholder */}
        {showBulkFolderPicker && (
          <FolderPickerModal
            isOpen={showBulkFolderPicker}
            onClose={() => setShowBulkFolderPicker(false)}
            conversationId={Array.from(selectedIds)[0]}
            conversationTitle={t('table.selected', { count: selectedCount })}
            onMoveComplete={handleBulkMove}
          />
        )}

        {/* Bulk delete confirmation */}
        <ConfirmModal
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          title={t('table.deleteMultipleTitle', { count: selectedCount })}
          message={t('table.deleteMultipleMessage')}
          confirmLabel={t('table.delete')}
          cancelLabel={t('table.cancel')}
          variant="danger"
          isLoading={isBulkDeleting}
        />

        {/* Bulk remove from folder confirmation */}
        {folderContext && (
          <ConfirmModal
            isOpen={showBulkRemoveConfirm}
            onClose={() => setShowBulkRemoveConfirm(false)}
            onConfirm={handleBulkRemoveFromFolder}
            title={t('table.removeFromFolderTitle')}
            message={t('table.removeFromFolderMessage')}
            confirmLabel={t('table.removeFromFolder')}
            cancelLabel={t('table.cancel')}
            variant="warning"
            isLoading={isBulkRemoving}
          />
        )}
      </div>
    );
  }

  // Normal toolbar
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 flex-1">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('table.searchPlaceholder')}
            className="pl-9 pr-8 h-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(val) => onStatusFilterChange(val as StatusFilter)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('table.statusAll')}</SelectItem>
            <SelectItem value="ready">{t('table.statusReady')}</SelectItem>
            <SelectItem value="processing">{t('table.statusProcessing')}</SelectItem>
            <SelectItem value="failed">{t('table.statusFailed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {folderContext?.extraToolbarActions}
        <Button
          variant="brand"
          size="sm"
          onClick={onNewConversation}
          icon={<Mic className="h-4 w-4" />}
        >
          {t('new')}
        </Button>
      </div>
    </div>
  );
}
