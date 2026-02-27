'use client';

/**
 * useConversations Hook - V2 UI
 *
 * @deprecated Use useConversationsContext() from ConversationsContext instead.
 * This hook is kept for backwards compatibility but is no longer used.
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

export interface UseConversationsResult {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  progressMap: Map<string, TranscriptionProgress>;
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsResult {
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, TranscriptionProgress>>(
    new Map()
  );

  const subscribedIdsRef = useRef<Set<string>>(new Set());

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

  // Initial fetch
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchConversations]);

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

  const refresh = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    progressMap,
    refresh,
  };
}
