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
  ConversationListResult,
  Conversation,
} from '@/lib/services/conversationService';
import { transcriptionToConversation } from '@/lib/types/conversation';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '@/lib/config';
import type { Transcription, TranscriptionProgress } from '@transcribe/shared';

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

  const socketRef = useRef<Socket | null>(null);
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
    if (user) {
      fetchConversations(1);
    } else {
      setConversations([]);
      setIsLoading(false);
    }
  }, [user, fetchConversations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      fetchConversations(1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, fetchConversations]);

  // WebSocket connection for real-time progress
  useEffect(() => {
    if (!user) return;

    const API_URL = getApiUrl();
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', async () => {
      console.log('[useConversations] WebSocket connected');

      // Get auth token and authenticate
      try {
        const token = await user.getIdToken();
        socket.emit('authenticate', { token });
      } catch (err) {
        console.error('[useConversations] Failed to authenticate socket:', err);
      }
    });

    socket.on('authenticated', () => {
      console.log('[useConversations] WebSocket authenticated');

      // Subscribe to any in-progress conversations
      conversations.forEach((conv) => {
        if (conv.status === 'pending' || conv.status === 'processing') {
          if (!subscribedIdsRef.current.has(conv.id)) {
            socket.emit('subscribe_transcription', { jobId: conv.id });
            subscribedIdsRef.current.add(conv.id);
          }
        }
      });
    });

    socket.on('transcription_progress', (data: TranscriptionProgress) => {
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.set(data.transcriptionId, data);
        return next;
      });
    });

    socket.on('transcription_completed', (data: { transcriptionId: string }) => {
      // Remove from progress map
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.delete(data.transcriptionId);
        return next;
      });

      // Refresh to get the completed conversation
      fetchConversations(1);
    });

    socket.on('transcription_failed', (data: { transcriptionId: string; error: string }) => {
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.delete(data.transcriptionId);
        return next;
      });

      // Refresh to show the failed state
      fetchConversations(1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      subscribedIdsRef.current.clear();
    };
  }, [user]);

  // Subscribe to new in-progress conversations
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    conversations.forEach((conv) => {
      if (conv.status === 'pending' || conv.status === 'processing') {
        if (!subscribedIdsRef.current.has(conv.id)) {
          socket.emit('subscribe_transcription', { jobId: conv.id });
          subscribedIdsRef.current.add(conv.id);
        }
      }
    });
  }, [conversations]);

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
