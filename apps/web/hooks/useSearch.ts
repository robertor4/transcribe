'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  searchConversations,
  SearchResults,
} from '@/lib/services/conversationService';

interface UseSearchOptions {
  debounceMs?: number;
  minChars?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResults | null;
  isSearching: boolean;
  error: Error | null;
  clearSearch: () => void;
  isActive: boolean;
}

/**
 * Hook for searching conversations with debouncing and error handling
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, minChars = 2 } = options;

  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minChars) {
        setResults(null);
        setIsSearching(false);
        setIsActive(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchConversations(searchQuery);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setResults(searchResults);
          setIsActive(true);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Search failed'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsSearching(false);
        }
      }
    },
    [minChars]
  );

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      // Clear pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (newQuery.length === 0) {
        setResults(null);
        setIsActive(false);
        setError(null);
        return;
      }

      if (newQuery.length < minChars) {
        setResults(null);
        setIsActive(false);
        return;
      }

      // Debounce the search
      debounceRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, debounceMs);
    },
    [debounceMs, minChars, performSearch]
  );

  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults(null);
    setError(null);
    setIsActive(false);
    setIsSearching(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
    isActive,
  };
}
