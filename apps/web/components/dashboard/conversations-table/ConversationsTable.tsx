'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/Button';
import { ConversationsTableRow } from './ConversationsTableRow';
import { ConversationsTableToolbar } from './ConversationsTableToolbar';
import { ConversationsTablePagination } from './ConversationsTablePagination';
import { useConversationsTable, type SortColumn } from './useConversationsTable';
import type { Conversation } from '@/lib/types/conversation';

interface ConversationsTableProps {
  conversations: Conversation[];
  locale: string;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  onNewConversation: () => void;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function ConversationsTable({
  conversations,
  locale,
  onDeleteConversation,
  onNewConversation,
}: ConversationsTableProps) {
  const t = useTranslations('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const {
    displayedConversations,
    sortColumn,
    sortDirection,
    onSort,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    selectedIds,
    onSelectRow,
    setSelectedIds,
    clearSelection,
  } = useConversationsTable({ conversations });

  // All data is loaded client-side — pagination is purely local
  const totalPages = Math.ceil(displayedConversations.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleConversations = displayedConversations.slice(startIndex, startIndex + pageSize);

  // Page-aware select all: only affects visible rows
  const visibleIds = useMemo(() => visibleConversations.map((c) => c.id), [visibleConversations]);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const isPartiallySelected = !isAllSelected && visibleIds.some((id) => selectedIds.has(id));

  const onSelectAll = useCallback(() => {
    setSelectedIds((prev: Set<string>) => {
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        // Deselect only the visible page items
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      // Select all visible page items (additive — keeps other selections)
      return new Set([...prev, ...visibleIds]);
    });
  }, [visibleIds, setSelectedIds]);

  // Reset to page 1 when filters/search/pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // Clamp page when data changes (e.g. after deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (!onDeleteConversation) return;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await onDeleteConversation(id);
    }
  }, [selectedIds, onDeleteConversation]);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-[#8D6AFA]" />
      : <ArrowDown className="w-3.5 h-3.5 text-[#8D6AFA]" />;
  };

  const SortableHeader = ({ column, children, className }: { column: SortColumn; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-[#8D6AFA] transition-colors"
      >
        {children}
        {getSortIcon(column)}
      </button>
    </TableHead>
  );

  // Empty state
  if (conversations.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#8D6AFA] uppercase tracking-wider">
            {t('conversations')}
          </h2>
        </div>
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('emptyConversationsHint')}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewConversation}
          >
            {t('startFirstConversation')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#8D6AFA] uppercase tracking-wider">
          {t('conversations')}
        </h2>
      </div>

      <ConversationsTableToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        selectedIds={selectedIds}
        clearSelection={clearSelection}
        onDeleteSelected={handleDeleteSelected}
        onNewConversation={onNewConversation}
      />

      {displayedConversations.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('table.noResults')}
          </p>
        </div>
      ) : (
        <>
        <div className="border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                {/* Checkbox */}
                <TableHead className="w-[40px] pr-0">
                  <div className="flex items-center pl-5 lg:pl-0">
                    <Checkbox
                      checked={isPartiallySelected ? 'indeterminate' : isAllSelected}
                      onCheckedChange={onSelectAll}
                      aria-label={t('table.selectAll')}
                    />
                  </div>
                </TableHead>

                {/* Title */}
                <SortableHeader column="title">{t('table.title')}</SortableHeader>

                {/* Status */}
                <SortableHeader column="status" className="hidden lg:table-cell w-[120px]">
                  {t('table.status')}
                </SortableHeader>

                {/* AI Assets */}
                <SortableHeader column="assetsCount" className="hidden lg:table-cell w-[100px]">
                  {t('table.aiAssets')}
                </SortableHeader>

                {/* Duration */}
                <SortableHeader column="duration" className="hidden lg:table-cell w-[100px]">
                  {t('table.duration')}
                </SortableHeader>

                {/* Shared */}
                <SortableHeader column="shared" className="hidden lg:table-cell w-[90px]">
                  {t('table.shared')}
                </SortableHeader>

                {/* Date */}
                <SortableHeader column="createdAt" className="w-[120px]">
                  {t('table.date')}
                </SortableHeader>

                {/* Actions */}
                <TableHead className="w-[50px]">
                  <span className="sr-only">{t('table.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visibleConversations.map((conversation) => (
                <ConversationsTableRow
                  key={conversation.id}
                  conversation={conversation}
                  locale={locale}
                  isSelected={selectedIds.has(conversation.id)}
                  onSelect={onSelectRow}
                  onDelete={onDeleteConversation}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <ConversationsTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayedConversations.length}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
        </>
      )}
    </div>
  );
}
