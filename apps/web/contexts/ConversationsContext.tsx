'use client';

/**
 * ConversationsContext - Shared conversations data
 *
 * Provides a single source of truth for conversations data,
 * preventing duplicate API calls when multiple components need the same data.
 * All conversations are fetched in a single call; pagination is handled client-side.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { listConversations, Conversation } from '@/lib/services/conversationService';
import { transcriptionApi } from '@/lib/api';
import { transcriptionsToConversations } from '@/lib/types/conversation';
import websocketService from '@/lib/websocket';
import { WEBSOCKET_EVENTS, Transcription } from '@transcribe/shared';
import type { TranscriptionProgress } from '@transcribe/shared';

interface ConversationsContextType {
  conversations: Conversation[];
  recentlyOpened: Conversation[];
  recentlyOpenedCleared: boolean;
  isLoading: boolean;
  error: Error | null;
  progressMap: Map<string, TranscriptionProgress>;
  refresh: () => Promise<void>;
  refreshRecentlyOpened: () => Promise<void>;
  clearRecentlyOpened: () => Promise<void>;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export function ConversationsProvider({ children }: ConversationsProviderProps) {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, TranscriptionProgress>>(
    new Map()
  );
  const [recentlyOpened, setRecentlyOpened] = useState<Conversation[]>([]);
  const [recentlyOpenedCleared, setRecentlyOpenedCleared] = useState(false);

  const subscribedIdsRef = useRef<Set<string>>(new Set());
  const hasFetchedRef = useRef(false);
  const hasFetchedRecentlyOpenedRef = useRef(false);

  // Fetch all conversations in a single call
  const fetchConversations = useCallback(
    async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);
        const result = await listConversations();
        setConversations(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Fetch recently opened conversations
  const fetchRecentlyOpened = useCallback(async () => {
    if (!user) return;

    try {
      const response = await transcriptionApi.getRecentlyOpened(5);
      if (response.success && response.data) {
        const transcriptions = response.data as Transcription[];
        setRecentlyOpened(transcriptionsToConversations(transcriptions));
      }
    } catch {
      // Silently ignore errors - recently opened is non-critical
      // Fall back to using conversations list in the component
    }
  }, [user]);

  // Initial fetch - only once when user is available and email is verified
  useEffect(() => {
    if (user && user.emailVerified && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchConversations();
    } else if (!user) {
      hasFetchedRef.current = false;
      setConversations([]);
      setIsLoading(false);
    } else if (user && !user.emailVerified) {
      // User exists but email not verified - don't fetch, just stop loading
      setIsLoading(false);
    }
  }, [user, fetchConversations]);

  // Initial fetch of recently opened - only once when user is available and verified
  useEffect(() => {
    if (user && user.emailVerified && !hasFetchedRecentlyOpenedRef.current) {
      hasFetchedRecentlyOpenedRef.current = true;
      fetchRecentlyOpened();
    } else if (!user) {
      hasFetchedRecentlyOpenedRef.current = false;
      setRecentlyOpened([]);
    }
  }, [user, fetchRecentlyOpened]);

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
        fetchConversations();
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
        fetchConversations();
      }
    );

    return () => {
      unsubProgress();
      unsubCompleted();
      unsubFailed();
    };
  }, [user, fetchConversations, fetchRecentlyOpened]);

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

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const result = await listConversations();
      setConversations(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    }
  }, [user]);

  const refreshRecentlyOpened = useCallback(async () => {
    await fetchRecentlyOpened();
  }, [fetchRecentlyOpened]);

  const clearRecentlyOpened = useCallback(async () => {
    if (!user) return;

    try {
      await transcriptionApi.clearRecentlyOpened();
      setRecentlyOpened([]);
      setRecentlyOpenedCleared(true);
    } catch {
      // Silently ignore errors - user can retry
    }
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    conversations,
    recentlyOpened,
    recentlyOpenedCleared,
    isLoading,
    error,
    progressMap,
    refresh,
    refreshRecentlyOpened,
    clearRecentlyOpened,
  }), [conversations, recentlyOpened, recentlyOpenedCleared, isLoading, error, progressMap, refresh, refreshRecentlyOpened, clearRecentlyOpened]);

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
