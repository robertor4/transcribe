'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Conversation, ConversationStatus } from '@/lib/types/conversation';

export type SortColumn = 'title' | 'status' | 'assetsCount' | 'duration' | 'shared' | 'createdAt';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = ConversationStatus | 'all';

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const SORT_STORAGE_KEY = 'neural-summary-conversations-sort';

function loadSortState(): SortState {
  if (typeof window === 'undefined') return { column: 'createdAt', direction: 'desc' };
  try {
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.column && parsed.direction) return parsed;
    }
  } catch {
    // Ignore invalid stored state
  }
  return { column: 'createdAt', direction: 'desc' };
}

interface UseConversationsTableOptions {
  conversations: Conversation[];
}

export function useConversationsTable({ conversations }: UseConversationsTableOptions) {
  const [sortState, setSortState] = useState<SortState>(loadSortState);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Persist sort state
  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortState));
  }, [sortState]);

  // Clear selection when conversations change (e.g., after delete or refresh)
  useEffect(() => {
    setSelectedIds((prev) => {
      const conversationIds = new Set(conversations.map((c) => c.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (conversationIds.has(id)) next.add(id);
      });
      if (next.size !== prev.size) return next;
      return prev;
    });
  }, [conversations]);

  // Filter and sort
  const displayedConversations = useMemo(() => {
    let filtered = conversations;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(query));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Sort
    const { column, direction } = sortState;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      const statusOrder = { ready: 0, processing: 1, pending: 2, failed: 3 };
      switch (column) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
          break;
        case 'assetsCount':
          cmp = a.assetsCount - b.assetsCount;
          break;
        case 'duration':
          cmp = a.source.audioDuration - b.source.audioDuration;
          break;
        case 'shared': {
          const aShared = (a.sharing.isPublic ? 1 : 0) + a.sharing.sharedWith.length;
          const bShared = (b.sharing.isPublic ? 1 : 0) + b.sharing.sharedWith.length;
          cmp = aShared - bShared;
          break;
        }
        case 'createdAt':
          cmp = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      return direction === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [conversations, searchQuery, statusFilter, sortState]);

  const onSort = useCallback((column: SortColumn) => {
    setSortState((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const onSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    displayedConversations,
    sortColumn: sortState.column,
    sortDirection: sortState.direction,
    onSort,
    searchQuery,
    onSearchChange: setSearchQuery,
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    selectedIds,
    setSelectedIds,
    onSelectRow,
    clearSelection,
  };
}
