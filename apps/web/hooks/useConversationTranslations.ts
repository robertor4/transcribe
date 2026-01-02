'use client';

/**
 * useConversationTranslations Hook - V2 Translation System
 *
 * Manages translation state for a conversation:
 * - Fetches available translations and their status
 * - Handles translation requests
 * - Manages locale preference switching
 */

import { useState, useEffect, useCallback } from 'react';
import { translationApi } from '@/lib/api';
import type {
  Translation,
  ConversationTranslations,
} from '@transcribe/shared';

export interface UseConversationTranslationsOptions {
  /** Set to true for shared view (uses public endpoints, no auth) */
  isShared?: boolean;
  /** Share token for shared view */
  shareToken?: string;
}

export interface UseConversationTranslationsResult {
  /** Translation status with available locales */
  status: ConversationTranslations | null;
  /** Currently active translations for the selected locale */
  activeTranslations: Translation[];
  /** Whether status is loading */
  isLoading: boolean;
  /** Whether a translation is in progress */
  isTranslating: boolean;
  /** Error if any */
  error: Error | null;
  /** Currently selected locale ('original' or locale code like 'es-ES') */
  currentLocale: string;
  /** Translate to a new locale */
  translate: (targetLocale: string) => Promise<void>;
  /** Switch to an existing translated locale */
  setLocale: (localeCode: string) => Promise<void>;
  /** Refresh status from server */
  refresh: () => Promise<void>;
  /** Get translated content for a specific source (summary or analysis) */
  getTranslatedContent: (sourceType: 'summary' | 'analysis', sourceId: string) => Translation | undefined;
}

export function useConversationTranslations(
  conversationId: string | null | undefined,
  options: UseConversationTranslationsOptions = {}
): UseConversationTranslationsResult {
  const { isShared = false, shareToken } = options;

  const [status, setStatus] = useState<ConversationTranslations | null>(null);
  const [activeTranslations, setActiveTranslations] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentLocale, setCurrentLocale] = useState<string>('original');

  // Fetch translation status
  const fetchStatus = useCallback(async () => {
    if (!conversationId) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      let response;
      if (isShared && shareToken) {
        response = await translationApi.getSharedStatus(shareToken, conversationId);
      } else {
        response = await translationApi.getStatus(conversationId);
      }

      if (response.success && response.data) {
        setStatus(response.data);
        setCurrentLocale(response.data.preferredLocale || 'original');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch translation status'));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isShared, shareToken]);

  // Fetch translations for a specific locale
  const fetchTranslations = useCallback(async (localeCode: string) => {
    if (!conversationId || localeCode === 'original') {
      setActiveTranslations([]);
      return;
    }

    try {
      let response;
      if (isShared && shareToken) {
        response = await translationApi.getSharedForLocale(shareToken, localeCode, conversationId);
      } else {
        response = await translationApi.getForLocale(conversationId, localeCode);
      }

      if (response.success && response.data) {
        setActiveTranslations(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch translations:', err);
    }
  }, [conversationId, isShared, shareToken]);

  // Translate to a new locale
  const translate = useCallback(async (targetLocale: string) => {
    if (!conversationId || isShared) {
      // Can't translate in shared view
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      await translationApi.translate(conversationId, targetLocale);

      // Refresh status and fetch new translations
      await fetchStatus();
      await fetchTranslations(targetLocale);
      setCurrentLocale(targetLocale);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Translation failed'));
      throw err;
    } finally {
      setIsTranslating(false);
    }
  }, [conversationId, isShared, fetchStatus, fetchTranslations]);

  // Switch to an existing locale
  const setLocale = useCallback(async (localeCode: string) => {
    if (!conversationId) return;

    setCurrentLocale(localeCode);

    // Update preference on server (only for authenticated users)
    if (!isShared) {
      try {
        await translationApi.updatePreference(conversationId, localeCode);
      } catch (err) {
        console.error('Failed to update locale preference:', err);
      }
    }

    // Fetch translations for the new locale
    if (localeCode !== 'original') {
      await fetchTranslations(localeCode);
    } else {
      setActiveTranslations([]);
    }
  }, [conversationId, isShared, fetchTranslations]);

  // Get translated content for a specific source
  const getTranslatedContent = useCallback((sourceType: 'summary' | 'analysis', sourceId: string): Translation | undefined => {
    return activeTranslations.find(
      t => t.sourceType === sourceType && t.sourceId === sourceId
    );
  }, [activeTranslations]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch translations when locale preference changes
  useEffect(() => {
    if (status && currentLocale !== 'original') {
      fetchTranslations(currentLocale);
    }
  }, [status, currentLocale, fetchTranslations]);

  return {
    status,
    activeTranslations,
    isLoading,
    isTranslating,
    error,
    currentLocale,
    translate,
    setLocale,
    refresh: fetchStatus,
    getTranslatedContent,
  };
}
