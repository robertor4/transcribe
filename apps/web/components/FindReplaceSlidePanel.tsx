'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  X,
  Search,
  Replace,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Sparkles,
  CaseSensitive,
  WholeWord,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { findReplaceApi } from '@/lib/api';
import type {
  FindReplaceResults,
  FindReplaceMatch,
} from '@transcribe/shared';

/**
 * Filter context for scoped Find & Replace
 * - 'summary': Only show/replace matches in the summary
 * - 'transcript': Only show/replace matches in the transcript
 * - { type: 'aiAsset', analysisId: string }: Only show/replace matches in a specific AI asset
 * - undefined: Show all matches (no filtering)
 */
export type FindReplaceFilterContext =
  | 'summary'
  | 'transcript'
  | { type: 'aiAsset'; analysisId: string; templateName?: string }
  | undefined;

interface FindReplaceSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle?: string;
  onReplaceComplete: () => void;
  onSearchTextChange?: (searchText: string, caseSensitive: boolean, wholeWord: boolean, currentMatchIndex?: number) => void;
  /** Optional filter to scope Find & Replace to a specific content type */
  filterContext?: FindReplaceFilterContext;
}

export function FindReplaceSlidePanel({
  isOpen,
  onClose,
  conversationId,
  conversationTitle,
  onReplaceComplete,
  onSearchTextChange,
  filterContext,
}: FindReplaceSlidePanelProps) {
  const t = useTranslations('findReplace');

  // Client-side mounting for portal
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Search inputs
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  // Results state
  const [results, setResults] = useState<FindReplaceResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Selection state
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['summary', 'transcript', 'aiAssets'])
  );

  // Replace state
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceSuccess, setReplaceSuccess] = useState<string | null>(null);

  // Match navigation state
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Helper to filter results based on filterContext
  const getFilteredResults = useCallback((rawResults: FindReplaceResults | null): FindReplaceResults | null => {
    if (!rawResults || !filterContext) return rawResults;

    if (filterContext === 'summary') {
      return {
        ...rawResults,
        transcript: [],
        aiAssets: [],
        totalMatches: rawResults.summary.length,
      };
    }

    if (filterContext === 'transcript') {
      return {
        ...rawResults,
        summary: [],
        aiAssets: [],
        totalMatches: rawResults.transcript.length,
      };
    }

    if (filterContext.type === 'aiAsset') {
      const filteredAssets = rawResults.aiAssets.filter(
        (a) => a.analysisId === filterContext.analysisId
      );
      const assetMatchCount = filteredAssets.reduce((sum, a) => sum + a.matches.length, 0);
      return {
        ...rawResults,
        summary: [],
        transcript: [],
        aiAssets: filteredAssets,
        totalMatches: assetMatchCount,
      };
    }

    return rawResults;
  }, [filterContext]);

  // Filtered results for display
  const filteredResults = getFilteredResults(results);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setFindText('');
      setReplaceText('');
      setCaseSensitive(false);
      setWholeWord(false);
      setResults(null);
      setSelectedMatchIds(new Set());
      setSearchError(null);
      setReplaceSuccess(null);
      setCurrentMatchIndex(0);
      // Focus input after animation
      setTimeout(() => findInputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [isClosing, onClose]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Emit search text changes for real-time highlighting in content
  useEffect(() => {
    if (onSearchTextChange) {
      onSearchTextChange(findText, caseSensitive, wholeWord, currentMatchIndex);
    }
  }, [findText, caseSensitive, wholeWord, currentMatchIndex, onSearchTextChange]);

  // Clear highlights when panel closes
  useEffect(() => {
    if (!isOpen && onSearchTextChange) {
      onSearchTextChange('', false, false, undefined);
    }
  }, [isOpen, onSearchTextChange]);

  // Search for matches
  const handleSearch = useCallback(async () => {
    if (!findText.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setReplaceSuccess(null);

    try {
      const response = await findReplaceApi.findMatches(conversationId, findText, {
        caseSensitive,
        wholeWord,
      });

      if (response.success && response.data) {
        setResults(response.data);
        // Select all matches within scope by default
        const filtered = getFilteredResults(response.data);
        const allMatchIds = new Set<string>();
        if (filtered) {
          filtered.summary.forEach((m) => allMatchIds.add(m.id));
          filtered.transcript.forEach((m) => allMatchIds.add(m.id));
          filtered.aiAssets.forEach((a) => a.matches.forEach((m) => allMatchIds.add(m.id)));
        }
        setSelectedMatchIds(allMatchIds);
      } else {
        setSearchError(response.error || t('error'));
      }
    } catch {
      setSearchError(t('error'));
    } finally {
      setIsSearching(false);
    }
  }, [conversationId, findText, caseSensitive, wholeWord, getFilteredResults, t]);

  // Replace selected matches
  const handleReplace = useCallback(async (replaceAll: boolean = false) => {
    if (!results || (!replaceAll && selectedMatchIds.size === 0)) return;

    setIsReplacing(true);
    setSearchError(null);

    try {
      const response = await findReplaceApi.replaceMatches(conversationId, {
        findText,
        replaceText,
        caseSensitive,
        wholeWord,
        replaceAll,
        matchIds: replaceAll ? undefined : Array.from(selectedMatchIds),
      });

      if (response.success && response.data) {
        const successMessage = t('replacedCount', { count: response.data.replacedCount });
        setReplaceSuccess(successMessage);
        setResults(null);
        setSelectedMatchIds(new Set());

        // Delay the refresh so user sees the success message
        setTimeout(() => {
          onReplaceComplete();
        }, 1500);
      } else {
        setSearchError(response.error || t('error'));
      }
    } catch {
      setSearchError(t('error'));
    } finally {
      setIsReplacing(false);
    }
  }, [
    conversationId,
    findText,
    replaceText,
    caseSensitive,
    wholeWord,
    results,
    selectedMatchIds,
    onReplaceComplete,
    t,
  ]);

  // Toggle match selection
  const toggleMatch = useCallback((matchId: string) => {
    setSelectedMatchIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  }, []);

  // Toggle all matches in a category
  const toggleCategory = useCallback(
    (category: 'summary' | 'transcript' | 'aiAssets') => {
      if (!filteredResults) return;

      let categoryMatches: FindReplaceMatch[] = [];
      if (category === 'summary') {
        categoryMatches = filteredResults.summary;
      } else if (category === 'transcript') {
        categoryMatches = filteredResults.transcript;
      } else {
        categoryMatches = filteredResults.aiAssets.flatMap((a) => a.matches);
      }

      const allSelected = categoryMatches.every((m) => selectedMatchIds.has(m.id));

      setSelectedMatchIds((prev) => {
        const newSet = new Set(prev);
        categoryMatches.forEach((m) => {
          if (allSelected) {
            newSet.delete(m.id);
          } else {
            newSet.add(m.id);
          }
        });
        return newSet;
      });
    },
    [filteredResults, selectedMatchIds]
  );

  // Toggle category expansion
  const toggleCategoryExpansion = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Count visible matches in the DOM for real-time navigation
  const [visibleMatchCount, setVisibleMatchCount] = useState(0);

  // Update visible match count when search text changes
  // Respects filterContext to only count matches in the scoped area
  useEffect(() => {
    if (!findText || findText.length < 2) {
      setVisibleMatchCount(0);
      return;
    }

    // Small delay to let DOM update with highlighted matches
    const timer = setTimeout(() => {
      let matches: NodeListOf<Element>;

      // Scope the match counting based on filterContext
      if (filterContext === 'summary') {
        // Count matches within the summary section AND the conversation title
        const summarySection = document.getElementById('summary');
        const titleElement = document.getElementById('conversation-title');
        const summaryMatches = summarySection?.querySelectorAll('[data-match-index]') || [];
        const titleMatches = titleElement?.querySelectorAll('[data-match-index]') || [];
        setVisibleMatchCount(summaryMatches.length + titleMatches.length);
        return;
      } else if (filterContext === 'transcript') {
        // Only count matches within the transcript section (which is outside #summary)
        // The transcript is rendered in a sibling div to #summary
        const allMatches = document.querySelectorAll('[data-match-index]');
        const summarySection = document.getElementById('summary');
        // Filter to only matches NOT within summary
        const transcriptMatches = Array.from(allMatches).filter(match => !summarySection?.contains(match));
        setVisibleMatchCount(transcriptMatches.length);
        return;
      } else if (filterContext && typeof filterContext === 'object' && filterContext.type === 'aiAsset') {
        // For AI assets, we'd need a specific container ID - for now count all
        matches = document.querySelectorAll('[data-match-index]');
      } else {
        // No filter - count all matches
        matches = document.querySelectorAll('[data-match-index]');
      }

      setVisibleMatchCount(matches.length);
    }, 150);

    return () => clearTimeout(timer);
  }, [findText, caseSensitive, wholeWord, filterContext]);

  // Navigation handlers - use filtered results count for scoped navigation
  const navigationCount = filteredResults?.totalMatches || visibleMatchCount;

  const goToNextMatch = useCallback(() => {
    if (navigationCount > 0) {
      const nextIndex = (currentMatchIndex + 1) % navigationCount;
      setCurrentMatchIndex(nextIndex);
    }
  }, [currentMatchIndex, navigationCount]);

  const goToPreviousMatch = useCallback(() => {
    if (navigationCount > 0) {
      const prevIndex = currentMatchIndex === 0 ? navigationCount - 1 : currentMatchIndex - 1;
      setCurrentMatchIndex(prevIndex);
    }
  }, [currentMatchIndex, navigationCount]);

  // Reset match index when search text changes or results change
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [findText, caseSensitive, wholeWord]);

  // Don't render on server
  if (!mounted) return null;

  // Only show when open or during close animation
  if (!isOpen && !isClosing) return null;

  const totalMatches = filteredResults?.totalMatches || 0;
  const selectedCount = selectedMatchIds.size;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 ${isClosing ? 'animate-backdropFadeOut pointer-events-none' : 'animate-backdropFadeIn'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="find-replace-panel-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`
          absolute top-0 right-0 h-full w-full sm:w-[480px] lg:w-[520px] bg-white dark:bg-gray-900
          shadow-2xl flex flex-col outline-none
          ${isClosing ? 'animate-slideOutToRight' : 'animate-slideInFromRight'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8D6AFA] to-[#7A5AE0] flex items-center justify-center flex-shrink-0">
              <Replace className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                id="find-replace-panel-title"
                className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate"
              >
                {t('title')}
              </h2>
              {conversationTitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {conversationTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Section */}
        <div className="px-4 py-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
          {/* Find input with inline toggles */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={findInputRef}
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('findPlaceholder')}
              className="w-full pl-10 pr-20 py-2.5 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-[#8D6AFA] focus:border-transparent"
            />
            {/* Inline toggle buttons with tooltips */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <div className="group relative">
                <button
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  className={`p-1.5 rounded transition-colors ${
                    caseSensitive
                      ? 'bg-[#8D6AFA] text-white'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label={t('caseSensitive')}
                >
                  <CaseSensitive className="w-4 h-4" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                  {t('caseSensitive')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={() => setWholeWord(!wholeWord)}
                  className={`p-1.5 rounded transition-colors ${
                    wholeWord
                      ? 'bg-[#8D6AFA] text-white'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label={t('wholeWord')}
                >
                  <WholeWord className="w-4 h-4" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                  {t('wholeWord')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Replace input */}
          <div className="relative">
            <Replace className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder={t('replacePlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-[#8D6AFA] focus:border-transparent"
            />
          </div>

          {/* Find button and navigation row */}
          <div className="flex items-center justify-end gap-2">
            {/* Navigation - only show when matches exist */}
            {navigationCount > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousMatch}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t('previousMatch')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-center tabular-nums">
                  {currentMatchIndex + 1} / {navigationCount}
                </span>
                <button
                  onClick={goToNextMatch}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t('nextMatch')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Find button */}
            <Button
              variant="brand"
              size="sm"
              onClick={handleSearch}
              disabled={isSearching || !findText.trim()}
              icon={isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            >
              {t('find')}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-subtle">
          {searchError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {searchError}
            </div>
          )}

          {replaceSuccess && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-base font-medium text-green-700 dark:text-green-400">
                {replaceSuccess}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('refreshing')}
              </p>
            </div>
          )}

          {!filteredResults && !searchError && !replaceSuccess && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('emptyState')}
              </p>
            </div>
          )}

          {filteredResults && totalMatches === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('noMatches')}
            </div>
          )}

          {filteredResults && totalMatches > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {totalMatches === 1 ? t('matchCountSingular') : t('matchCount', { count: totalMatches })}
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Summary matches */}
                {filteredResults.summary.length > 0 && (
                  <MatchCategory
                    title={t('categories.summary')}
                    icon={<MessageSquare className="w-4 h-4" />}
                    matches={filteredResults.summary}
                    selectedIds={selectedMatchIds}
                    expanded={expandedCategories.has('summary')}
                    onToggleExpand={() => toggleCategoryExpansion('summary')}
                    onToggleMatch={toggleMatch}
                    onToggleAll={() => toggleCategory('summary')}
                  />
                )}

                {/* Transcript matches */}
                {filteredResults.transcript.length > 0 && (
                  <MatchCategory
                    title={t('categories.transcript')}
                    icon={<FileText className="w-4 h-4" />}
                    matches={filteredResults.transcript}
                    selectedIds={selectedMatchIds}
                    expanded={expandedCategories.has('transcript')}
                    onToggleExpand={() => toggleCategoryExpansion('transcript')}
                    onToggleMatch={toggleMatch}
                    onToggleAll={() => toggleCategory('transcript')}
                  />
                )}

                {/* AI Asset matches */}
                {filteredResults.aiAssets.map((asset) => (
                  <MatchCategory
                    key={asset.analysisId}
                    title={`${t('categories.aiAssets')}: ${asset.templateName}`}
                    icon={<Sparkles className="w-4 h-4" />}
                    matches={asset.matches}
                    selectedIds={selectedMatchIds}
                    expanded={expandedCategories.has(asset.analysisId)}
                    onToggleExpand={() => toggleCategoryExpansion(asset.analysisId)}
                    onToggleMatch={toggleMatch}
                    onToggleAll={() => {
                      const allSelected = asset.matches.every((m) =>
                        selectedMatchIds.has(m.id)
                      );
                      setSelectedMatchIds((prev) => {
                        const newSet = new Set(prev);
                        asset.matches.forEach((m) => {
                          if (allSelected) {
                            newSet.delete(m.id);
                          } else {
                            newSet.add(m.id);
                          }
                        });
                        return newSet;
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {filteredResults && totalMatches > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setSelectedMatchIds(new Set())}
                  disabled={selectedCount === 0}
                >
                  {t('clearSelection')}
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  variant="brand"
                  size="sm"
                  fullWidth
                  onClick={() => handleReplace(false)}
                  disabled={isReplacing || selectedCount === 0 || !replaceText.trim()}
                  icon={
                    isReplacing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : undefined
                  }
                >
                  {t('replace')} ({selectedCount})
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" size="sm" fullWidth onClick={handleClose}>
              {t('close')}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================================
// MatchCategory Component
// ============================================================

interface MatchCategoryProps {
  title: string;
  icon: React.ReactNode;
  matches: FindReplaceMatch[];
  selectedIds: Set<string>;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleMatch: (id: string) => void;
  onToggleAll: () => void;
}

function MatchCategory({
  title,
  icon,
  matches,
  selectedIds,
  expanded,
  onToggleExpand,
  onToggleMatch,
  onToggleAll,
}: MatchCategoryProps) {
  const t = useTranslations('findReplace');
  const allSelected = matches.every((m) => selectedIds.has(m.id));
  const someSelected = matches.some((m) => selectedIds.has(m.id));

  return (
    <div>
      {/* Category Header */}
      <div
        className="flex items-center justify-between py-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <div className="text-[#8D6AFA]">{icon}</div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({matches.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAll();
            }}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              allSelected
                ? 'bg-[#8D6AFA] text-white'
                : someSelected
                ? 'bg-purple-100 dark:bg-purple-900/30 text-[#8D6AFA]'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </button>

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Match List */}
      {expanded && (
        <div className="ml-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex items-start gap-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer -mx-2 px-2"
              onClick={() => onToggleMatch(match.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(match.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleMatch(match.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 w-4 h-4 text-[#8D6AFA] border-gray-300 dark:border-gray-600 rounded focus:ring-[#8D6AFA]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                  <HighlightedContext
                    context={match.context}
                    matchedText={match.matchedText}
                  />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HighlightedContext Component
// ============================================================

interface HighlightedContextProps {
  context: string;
  matchedText: string;
}

function HighlightedContext({ context, matchedText }: HighlightedContextProps) {
  // Find the match in the context and highlight it
  const regex = new RegExp(`(${matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = context.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === matchedText.toLowerCase();
        return isMatch ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
