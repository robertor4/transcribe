'use client';

/**
 * useFolderConversations Hook - V2 UI
 *
 * Fetches conversations in a specific folder.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFolder,
  getFolderConversations,
  Folder,
} from '@/lib/services/folderService';
import type { Conversation } from '@/lib/services/conversationService';

export interface UseFolderConversationsResult {
  folder: Folder | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateFolderLocally: (updates: Partial<Folder>) => void;
}

export function useFolderConversations(
  folderId: string | null | undefined
): UseFolderConversationsResult {
  const { user } = useAuth();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch folder and conversations
  const fetchFolderData = useCallback(async () => {
    if (!user || !folderId) {
      setFolder(null);
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch folder and conversations in parallel
      const [folderData, conversationsData] = await Promise.all([
        getFolder(folderId),
        getFolderConversations(folderId),
      ]);

      setFolder(folderData);
      setConversations(conversationsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch folder'));
      setFolder(null);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, folderId]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchFolderData();
  }, [fetchFolderData]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchFolderData();
  }, [fetchFolderData]);

  // Update folder state locally without refetching
  const updateFolderLocally = useCallback((updates: Partial<Folder>) => {
    setFolder((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    folder,
    conversations,
    isLoading,
    error,
    refresh,
    updateFolderLocally,
  };
}
