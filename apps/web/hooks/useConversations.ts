'use client';

/**
 * useConversations Hook - V2 UI
 *
 * Fetches and manages the list of conversations with pagination,
 * real-time progress updates via WebSocket, and automatic refresh.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listConversations,
  Conversation,
} from '@/lib/services/conversationService';
import websocketService from '@/lib/websocket';
import { WEBSOCKET_EVENTS } from '@transcribe/shared';
import type { TranscriptionProgress } from '@transcribe/shared';

export interface UseConversationsOptions {
  pageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseConversationsResult {
  conversations: Conversation[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  progressMap: Map<string, TranscriptionProgress>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useConversations(
  options: UseConversationsOptions = {}
): UseConversationsResult {
  const { pageSize = 20, autoRefresh = false, refreshInterval = 30000 } = options;
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [progressMap, setProgressMap] = useState<Map<string, TranscriptionProgress>>(
    new Map()
  );

  const subscribedIdsRef = useRef<Set<string>>(new Set());

  // Fetch conversations
  const fetchConversations = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!user) return;

      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const result = await listConversations(pageNum, pageSize);

        if (append) {
          setConversations((prev) => [...prev, ...result.conversations]);
        } else {
          setConversations(result.conversations);
        }

        setTotal(result.total);
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [user, pageSize]
  );

  // Initial fetch
  useEffect(() => {
    // Wait for auth to complete before deciding there's no user
    if (authLoading) {
      return;
    }

    if (user) {
      fetchConversations(1);
    } else {
      setConversations([]);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchConversations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      fetchConversations(1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, fetchConversations]);

  // WebSocket listeners for real-time progress (using shared websocketService)
  useEffect(() => {
    if (!user) return;

    // Listen for progress updates
    const unsubProgress = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS,
      (data: unknown) => {
        const progress = data as TranscriptionProgress;
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.set(progress.transcriptionId, progress);
          return next;
        });
      }
    );

    // Listen for completion
    const unsubCompleted = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      (data: unknown) => {
        const { transcriptionId } = data as { transcriptionId: string };
        // Remove from progress map
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(transcriptionId);
          return next;
        });
        // Refresh to get the completed conversation
        fetchConversations(1);
      }
    );

    // Listen for failures
    const unsubFailed = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED,
      (data: unknown) => {
        const { transcriptionId } = data as { transcriptionId: string };
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(transcriptionId);
          return next;
        });
        // Refresh to show the failed state
        fetchConversations(1);
      }
    );

    return () => {
      unsubProgress();
      unsubCompleted();
      unsubFailed();
    };
  }, [user, fetchConversations]);

  // Subscribe to in-progress conversations
  useEffect(() => {
    if (!user || !websocketService.isConnected()) return;

    conversations.forEach((conv) => {
      if (conv.status === 'pending' || conv.status === 'processing') {
        if (!subscribedIdsRef.current.has(conv.id)) {
          websocketService.subscribeToTranscription(conv.id);
          subscribedIdsRef.current.add(conv.id);
        }
      }
    });
  }, [user, conversations]);

  // Load more
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore) {
      await fetchConversations(page + 1, true);
    }
  }, [hasMore, isLoadingMore, page, fetchConversations]);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchConversations(1);
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    progressMap,
    loadMore,
    refresh,
  };
}
