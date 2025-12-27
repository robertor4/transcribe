'use client';

import React, { useMemo } from 'react';

export interface HighlightOptions {
  searchText: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  /** Current active match index for scroll-to-match feature */
  currentMatchIndex?: number;
  /** Global offset for this component's matches (used when multiple TextHighlighters exist) */
  matchOffset?: number;
}

interface TextHighlighterProps {
  text: string;
  highlight?: HighlightOptions;
  className?: string;
  highlightClassName?: string;
}

/**
 * Component that highlights matching text within a string.
 * Used for Find & Replace feature to show matches in real-time.
 */
export function TextHighlighter({
  text,
  highlight,
  className = '',
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-500/40 rounded px-0.5',
}: TextHighlighterProps) {
  const parts = useMemo(() => {
    if (!highlight?.searchText || highlight.searchText.length < 2) {
      return [{ text, isMatch: false }];
    }

    const { searchText, caseSensitive = false, wholeWord = false } = highlight;

    // Escape special regex characters
    const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build regex pattern
    let pattern = escapedSearch;
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${pattern})`, flags);

    // Split text by matches
    const splitParts = text.split(regex);

    return splitParts.map((part) => {
      // Check if this part matches the search pattern
      const testRegex = new RegExp(`^${pattern}$`, caseSensitive ? '' : 'i');
      const isMatch = testRegex.test(part);

      return {
        text: part,
        isMatch,
      };
    }).filter(part => part.text.length > 0);
  }, [text, highlight]);

  if (parts.length === 1 && !parts[0].isMatch) {
    // No matches, render plain text
    return <span className={className}>{text}</span>;
  }

  // Calculate global match indices
  const matchOffset = highlight?.matchOffset ?? 0;
  const currentMatchIndex = highlight?.currentMatchIndex;
  let localMatchIndex = 0;

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.isMatch) {
          const globalIndex = matchOffset + localMatchIndex;
          const isActive = currentMatchIndex === globalIndex;
          localMatchIndex++;

          return (
            <mark
              key={index}
              data-match-index={globalIndex}
              className={`${highlightClassName} ${isActive ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
            >
              {part.text}
            </mark>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </span>
  );
}

/**
 * Hook to create highlight options from search state.
 * Returns undefined if no search text (so highlighting is disabled).
 */
export function useHighlightOptions(
  searchText: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  currentMatchIndex?: number
): HighlightOptions | undefined {
  return useMemo(() => {
    if (!searchText || searchText.length < 2) {
      return undefined;
    }
    return { searchText, caseSensitive, wholeWord, currentMatchIndex };
  }, [searchText, caseSensitive, wholeWord, currentMatchIndex]);
}
