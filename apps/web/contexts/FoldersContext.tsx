'use client';

/**
 * FoldersContext - Shared folders data
 *
 * Provides a single source of truth for folders data,
 * preventing duplicate API calls when multiple components need the same data.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  listFolders,
  createFolder as createFolderService,
  updateFolder as updateFolderService,
  deleteFolder as deleteFolderService,
  moveToFolder as moveToFolderService,
  Folder,
} from '@/lib/services/folderService';

interface FoldersContextType {
  folders: Folder[];
  isLoading: boolean;
  error: Error | null;
  createFolder: (name: string, color?: string) => Promise<Folder>;
  updateFolder: (id: string, data: { name?: string; color?: string }) => Promise<Folder>;
  deleteFolder: (id: string, deleteContents?: boolean) => Promise<{ deletedConversations: number }>;
  moveToFolder: (conversationId: string, folderId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

interface FoldersProviderProps {
  children: ReactNode;
}

export function FoldersProvider({ children }: FoldersProviderProps) {
  const { user } = useAuth();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track if we've fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    console.log('[FoldersContext] Fetching folders...');
    const startTime = performance.now();

    try {
      setError(null);
      const result = await listFolders();
      console.log('[FoldersContext] Folders fetched', {
        count: result.length,
        elapsed: `${(performance.now() - startTime).toFixed(0)}ms`
      });
      setFolders(result);
    } catch (err) {
      console.error('[FoldersContext] Fetch failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch folders'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch - only when user ID changes
  useEffect(() => {
    const userId = user?.uid || null;

    // Reset fetch flag if user changed
    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      hasFetchedRef.current = false;
    }

    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchFolders();
    } else if (!user) {
      setFolders([]);
      setIsLoading(false);
    }
  }, [user, fetchFolders]);

  // Create folder
  const createFolder = useCallback(
    async (name: string, color?: string): Promise<Folder> => {
      const newFolder = await createFolderService(name, color);
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    },
    []
  );

  // Update folder
  const updateFolder = useCallback(
    async (id: string, data: { name?: string; color?: string }): Promise<Folder> => {
      const updatedFolder = await updateFolderService(id, data);
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? updatedFolder : f))
      );
      return updatedFolder;
    },
    []
  );

  // Delete folder
  const deleteFolder = useCallback(
    async (id: string, deleteContents: boolean = false): Promise<{ deletedConversations: number }> => {
      const result = await deleteFolderService(id, deleteContents);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      return result;
    },
    []
  );

  // Move conversation to folder
  const moveToFolder = useCallback(
    async (conversationId: string, folderId: string | null): Promise<void> => {
      await moveToFolderService(conversationId, folderId);
    },
    []
  );

  // Refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchFolders();
  }, [fetchFolders]);

  return (
    <FoldersContext.Provider
      value={{
        folders,
        isLoading,
        error,
        createFolder,
        updateFolder,
        deleteFolder,
        moveToFolder,
        refresh,
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
}

export function useFoldersContext() {
  const context = useContext(FoldersContext);
  if (!context) {
    throw new Error('useFoldersContext must be used within FoldersProvider');
  }
  return context;
}
