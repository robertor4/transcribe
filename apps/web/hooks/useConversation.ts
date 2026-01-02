'use client';

/**
 * useConversation Hook - V2 UI
 *
 * Fetches and manages a single conversation by ID.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getConversation, Conversation } from '@/lib/services/conversationService';

export interface UseConversationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseConversationResult {
  conversation: Conversation | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateConversationLocally: (updates: Partial<Conversation>) => void;
}

export function useConversation(
  id: string | null | undefined,
  options: UseConversationOptions = {}
): UseConversationResult {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  const { user, loading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch conversation
  const fetchConversation = useCallback(async () => {
    // Wait for auth to complete before deciding there's no user
    if (authLoading) {
      return;
    }

    if (!user || !id) {
      setConversation(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await getConversation(id);
      setConversation(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversation'));
      setConversation(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, id, authLoading]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchConversation();
  }, [fetchConversation]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user || !id) return;

    const interval = setInterval(fetchConversation, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, id, fetchConversation]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchConversation();
  }, [fetchConversation]);

  // Update conversation state locally without refetching
  const updateConversationLocally = useCallback((updates: Partial<Conversation>) => {
    setConversation((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    conversation,
    isLoading,
    error,
    refresh,
    updateConversationLocally,
  };
}
