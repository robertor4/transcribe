'use client';

/**
 * useConversationTranslations Hook - V2 Translation System
 *
 * Manages translation state for a conversation:
 * - Fetches available translations and their status
 * - Handles per-item translation requests (summary or individual AI asset)
 * - Manages locale preference switching
 */

import { useState, useEffect, useCallback } from 'react';
import { translationApi } from '@/lib/api';
import type {
  Translation,
  ConversationTranslations,
} from '@transcribe/shared';

export type TranslatingScope =
  | { type: 'summary' }
  | { type: 'asset'; assetId: string }
  | null;

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
  /** What is currently being translated (summary or specific asset) */
  translatingScope: TranslatingScope;
  /** Error if any */
  error: Error | null;
  /** Currently selected locale ('original' or locale code like 'es-ES') */
  currentLocale: string;
  /** Translate a specific item (summary or single asset) to a locale */
  translateItem: (
    targetLocale: string,
    scope: { type: 'summary' } | { type: 'asset'; assetId: string },
    options?: { forceRetranslate?: boolean }
  ) => Promise<void>;
  /** Switch to an existing translated locale */
  setLocale: (localeCode: string) => Promise<void>;
  /** Refresh status from server */
  refresh: () => Promise<void>;
  /** Get translated content for a specific source (summary or analysis) */
  getTranslatedContent: (sourceType: 'summary' | 'analysis', sourceId: string) => Translation | undefined;
}

/**
 * Estimate translation time in seconds based on content character length.
 * Based on observed GPT-5 structured JSON translation speeds (~65-80 chars/sec)
 * plus fixed overhead for API calls and Firestore operations.
 */
export function estimateTranslationSeconds(contentLength: number): number {
  const processingTime = contentLength / 75;
  const overhead = 10;
  return Math.max(15, Math.ceil(processingTime + overhead));
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
  const [translatingScope, setTranslatingScope] = useState<TranslatingScope>(null);
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

  // Translate a specific item (summary or single AI asset)
  const translateItem = useCallback(async (
    targetLocale: string,
    scope: { type: 'summary' } | { type: 'asset'; assetId: string },
    options?: { forceRetranslate?: boolean }
  ) => {
    if (!conversationId || isShared) return;

    setIsTranslating(true);
    setTranslatingScope(scope);
    setError(null);

    try {
      const apiOptions = {
        ...options,
        translateSummary: scope.type === 'summary',
        translateAssets: scope.type === 'asset',
        ...(scope.type === 'asset' ? { assetIds: [scope.assetId] } : {}),
      };
      await translationApi.translate(conversationId, targetLocale, apiOptions);

      // Refresh status and fetch new translations
      await fetchStatus();
      await fetchTranslations(targetLocale);
      setCurrentLocale(targetLocale);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Translation failed'));
      throw err;
    } finally {
      setIsTranslating(false);
      setTranslatingScope(null);
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
    translatingScope,
    error,
    currentLocale,
    translateItem,
    setLocale,
    refresh: fetchStatus,
    getTranslatedContent,
  };
}
