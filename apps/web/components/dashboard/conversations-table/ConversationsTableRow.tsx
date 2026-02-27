'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  MoreVertical,
  FolderInput,
  Link2,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatRelativeTime, formatDuration } from '@/lib/formatters';
import { AssetsCountBadge } from '../AssetsCountBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderPickerModal } from '@/components/FolderPickerModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableRow, TableCell } from '@/components/ui/table';
import type { Conversation, ConversationStatus } from '@/lib/types/conversation';

const statusConfig: Record<ConversationStatus, { dot: string; badge: string; label: string }> = {
  ready: {
    dot: 'bg-green-500',
    badge: 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    label: 'statusReady',
  },
  processing: {
    dot: 'bg-yellow-500 animate-pulse',
    badge: 'border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    label: 'statusProcessing',
  },
  pending: {
    dot: 'bg-gray-400',
    badge: 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
    label: 'statusPending',
  },
  failed: {
    dot: 'bg-red-500',
    badge: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    label: 'statusFailed',
  },
};

function StatusIndicator({ status, t }: { status: ConversationStatus; t: ReturnType<typeof useTranslations> }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.badge}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {t(`table.${config.label}`)}
    </Badge>
  );
}

interface ConversationsTableRowProps {
  conversation: Conversation;
  locale: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete?: (conversationId: string) => Promise<void>;
}

export const ConversationsTableRow = memo(function ConversationsTableRow({
  conversation,
  locale,
  isSelected,
  onSelect,
  onDelete,
}: ConversationsTableRowProps) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(conversation.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      throw error;
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (showDeleteConfirm) return;
    if ((e.target as HTMLElement).closest('[data-no-navigate]')) return;

    router.push(`/${locale}/conversation/${conversation.id}`);
  };

  const duration = conversation.source.audioDuration;

  return (
    <>
      <TableRow
        onClick={handleRowClick}
        data-state={isSelected ? 'selected' : undefined}
        className="group cursor-pointer"
      >
        {/* Checkbox */}
        <TableCell className="w-[40px] pr-0" data-no-navigate>
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(conversation.id)}
              aria-label={t('table.selectRow')}
            />
          </div>
        </TableCell>

        {/* Title */}
        <TableCell>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate transition-colors">
              {conversation.title}
            </span>
            {/* Mobile-only status indicator (hidden when Status column is visible) */}
            {conversation.status === 'processing' && (
              <span className="flex-shrink-0 lg:hidden px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                {t('table.statusProcessing')}
              </span>
            )}
            {conversation.status === 'failed' && (
              <span className="flex-shrink-0 lg:hidden px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {t('table.statusFailed')}
              </span>
            )}
            {/* Shared indicator (mobile only — desktop has its own column) */}
            {conversation.sharing.isPublic && (
              <Link2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 lg:hidden" />
            )}
          </div>
        </TableCell>

        {/* Status - hidden on smaller screens */}
        <TableCell className="hidden lg:table-cell w-[120px]">
          <StatusIndicator status={conversation.status} t={t} />
        </TableCell>

        {/* AI Assets - hidden on smaller screens */}
        <TableCell className="hidden lg:table-cell w-[100px]">
          <AssetsCountBadge count={conversation.assetsCount} />
        </TableCell>

        {/* Duration - hidden on smaller screens */}
        <TableCell className="hidden lg:table-cell w-[100px] text-right tabular-nums text-gray-500 dark:text-gray-400 text-sm">
          {duration > 0 ? formatDuration(duration) : t('table.noDuration')}
        </TableCell>

        {/* Shared - hidden on smaller screens */}
        <TableCell className="hidden lg:table-cell w-[90px]">
          {conversation.sharing.isPublic ? (
            <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
              <Link2 className="w-3 h-3" />
              {t('table.shared')}
            </Badge>
          ) : conversation.sharing.sharedWith.length > 0 ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('table.sharedWith', { count: conversation.sharing.sharedWith.length })}
            </span>
          ) : null}
        </TableCell>

        {/* Date */}
        <TableCell className="w-[120px] text-gray-500 dark:text-gray-400 text-sm">
          {formatRelativeTime(conversation.createdAt)}
        </TableCell>

        {/* Actions */}
        <TableCell className="w-[50px]" data-no-navigate>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                  aria-label={t('table.actions')}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-52 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
              >
                <DropdownMenuItem
                  disabled={conversation.status !== 'ready'}
                  onSelect={() => router.push(`/${locale}/conversation/${conversation.id}`)}
                  className="gap-3 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100"
                >
                  <FileText className="w-4 h-4" />
                  {t('table.openSummary')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={conversation.status !== 'ready'}
                  onSelect={() => router.push(`/${locale}/conversation/${conversation.id}/transcript`)}
                  className="gap-3 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100"
                >
                  <AlignLeft className="w-4 h-4" />
                  {t('table.openTranscript')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onSelect={() => setShowFolderPicker(true)}
                  className="gap-3 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100"
                >
                  <FolderInput className="w-4 h-4" />
                  {t('table.moveToFolder')}
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setShowDeleteConfirm(true)}
                      className="gap-3 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('table.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {/* Folder Picker Modal */}
      <FolderPickerModal
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        conversationId={conversation.id}
        conversationTitle={conversation.title}
        currentFolderId={conversation.folderId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('table.deleteTitle')}
        message={t('table.deleteMessage')}
        confirmLabel={t('table.delete')}
        cancelLabel={t('table.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
});
