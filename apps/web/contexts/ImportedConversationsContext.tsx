'use client';

/**
 * ImportedConversationsContext - Manages imported shared conversations
 *
 * Provides state and operations for the "Shared with you" virtual folder.
 * Imported conversations are linked references to shared content.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { importedConversationApi } from '@/lib/api';
import type { ImportedConversation } from '@transcribe/shared';

interface ImportedConversationsContextType {
  imports: ImportedConversation[];
  isLoading: boolean;
  error: Error | null;
  count: number;
  importConversation: (
    shareToken: string,
    password?: string
  ) => Promise<{ importedConversation: ImportedConversation; alreadyImported: boolean }>;
  removeImport: (importId: string) => Promise<void>;
  refresh: () => Promise<void>;
  checkIfImported: (shareToken: string) => Promise<{ imported: boolean; importedAt?: Date }>;
}

const ImportedConversationsContext = createContext<
  ImportedConversationsContextType | undefined
>(undefined);

interface ImportedConversationsProviderProps {
  children: ReactNode;
}

export function ImportedConversationsProvider({
  children,
}: ImportedConversationsProviderProps) {
  const { user } = useAuth();

  const [imports, setImports] = useState<ImportedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if we've fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Fetch imported conversations
  const fetchImports = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await importedConversationApi.list();
      if (response.success && response.data) {
        setImports(response.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch imports')
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch - only when user ID changes and email is verified
  useEffect(() => {
    const userId = user?.uid || null;

    // Reset fetch flag if user changed
    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      hasFetchedRef.current = false;
    }

    if (user && user.emailVerified && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchImports();
    } else if (!user) {
      setImports([]);
      setIsLoading(false);
    } else if (user && !user.emailVerified) {
      // User exists but email not verified - don't fetch
      setIsLoading(false);
    }
  }, [user, fetchImports]);

  // Import a shared conversation
  const importConversation = useCallback(
    async (
      shareToken: string,
      password?: string
    ): Promise<{ importedConversation: ImportedConversation; alreadyImported: boolean }> => {
      const response = await importedConversationApi.import(shareToken, password);

      if (!response.success || !response.data) {
        throw new Error('Failed to import conversation');
      }

      const { importedConversation, alreadyImported } = response.data;

      // Add to local state if not already there
      if (!alreadyImported) {
        setImports((prev) => [importedConversation, ...prev]);
      }

      return { importedConversation, alreadyImported };
    },
    []
  );

  // Remove an imported conversation
  const removeImport = useCallback(async (importId: string): Promise<void> => {
    await importedConversationApi.remove(importId);

    // Remove from local state
    setImports((prev) => prev.filter((imp) => imp.id !== importId));
  }, []);

  // Refresh the list
  const refresh = useCallback(async () => {
    await fetchImports();
  }, [fetchImports]);

  // Check if a share is already imported
  const checkIfImported = useCallback(
    async (
      shareToken: string
    ): Promise<{ imported: boolean; importedAt?: Date }> => {
      try {
        const response = await importedConversationApi.checkStatus(shareToken);
        if (response.success && response.data) {
          return response.data;
        }
        return { imported: false };
      } catch {
        return { imported: false };
      }
    },
    []
  );

  return (
    <ImportedConversationsContext.Provider
      value={{
        imports,
        isLoading,
        error,
        count: imports.length,
        importConversation,
        removeImport,
        refresh,
        checkIfImported,
      }}
    >
      {children}
    </ImportedConversationsContext.Provider>
  );
}

export function useImportedConversations() {
  const context = useContext(ImportedConversationsContext);
  if (!context) {
    throw new Error(
      'useImportedConversations must be used within ImportedConversationsProvider'
    );
  }
  return context;
}
