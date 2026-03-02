'use client';

import { BookOpen } from 'lucide-react';

interface ReadingTimeIndicatorProps {
  /** Word count of the content to estimate reading time for */
  wordCount: number;
  className?: string;
}

/**
 * Displays estimated reading time as a pill badge.
 * Uses 238 wpm (average adult reading speed for non-fiction).
 */
export function ReadingTimeIndicator({ wordCount, className = '' }: ReadingTimeIndicatorProps) {
  const minutes = Math.max(1, Math.ceil(wordCount / 238));

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-[#8D6AFA]/10 text-[#8D6AFA] text-xs font-semibold px-3 py-1 rounded-full ${className}`}
    >
      <BookOpen className="w-3.5 h-3.5" />
      {minutes} min read
    </span>
  );
}

/**
 * Count words in a string.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
