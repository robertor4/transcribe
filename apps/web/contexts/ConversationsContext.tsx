'use client';

/**
 * ConversationsContext - Shared conversations data
 *
 * Provides a single source of truth for conversations data,
 * preventing duplicate API calls when multiple components need the same data.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { listConversations, Conversation } from '@/lib/services/conversationService';
import websocketService from '@/lib/websocket';
import { WEBSOCKET_EVENTS } from '@transcribe/shared';
import type { TranscriptionProgress } from '@transcribe/shared';

interface ConversationsContextType {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  progressMap: Map<string, TranscriptionProgress>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
  pageSize?: number;
}

export function ConversationsProvider({ children, pageSize = 20 }: ConversationsProviderProps) {
  const { user } = useAuth();

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
  const hasFetchedRef = useRef(false);

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

  // Initial fetch - only once when user is available
  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchConversations(1);
    } else if (!user) {
      hasFetchedRef.current = false;
      setConversations([]);
      setIsLoading(false);
    }
  }, [user, fetchConversations]);

  // WebSocket listeners for real-time progress
  useEffect(() => {
    if (!user) return;

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

    const unsubCompleted = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      (data: unknown) => {
        const { transcriptionId } = data as { transcriptionId: string };
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(transcriptionId);
          return next;
        });
        fetchConversations(1);
      }
    );

    const unsubFailed = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED,
      (data: unknown) => {
        const { transcriptionId } = data as { transcriptionId: string };
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(transcriptionId);
          return next;
        });
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

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore) {
      await fetchConversations(page + 1, true);
    }
  }, [hasMore, isLoadingMore, page, fetchConversations]);

  const refresh = useCallback(async () => {
    await fetchConversations(1);
  }, [fetchConversations]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    conversations,
    isLoading,
    error,
    hasMore,
    total,
    progressMap,
    loadMore,
    refresh,
  }), [conversations, isLoading, error, hasMore, total, progressMap, loadMore, refresh]);

  return (
    <ConversationsContext.Provider value={contextValue}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversationsContext() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversationsContext must be used within ConversationsProvider');
  }
  return context;
}
