'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { type HighlightOptions } from './TextHighlighter';

interface SpeakerSegment {
  speakerTag: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
}

export interface TranscriptTimelineProps {
  segments: SpeakerSegment[];
  className?: string;
  highlightOptions?: HighlightOptions;
}

/** Speaker stats for the sidebar */
export interface SpeakerStat {
  speakerTag: string;
  initial: string;
  totalDuration: number;
  percentage: number;
  segmentCount: number;
  color: string;
}

/** Compute speaker breakdown from segments */
export function computeSpeakerStats(segments: SpeakerSegment[]): SpeakerStat[] {
  if (segments.length === 0) return [];

  const totalDuration = segments[segments.length - 1].endTime;
  const speakerMap = new Map<string, { duration: number; count: number }>();

  for (const seg of segments) {
    const prev = speakerMap.get(seg.speakerTag) || { duration: 0, count: 0 };
    prev.duration += seg.endTime - seg.startTime;
    prev.count += 1;
    speakerMap.set(seg.speakerTag, prev);
  }

  return Array.from(speakerMap.entries())
    .sort((a, b) => b[1].duration - a[1].duration)
    .map(([tag, data]) => ({
      speakerTag: tag,
      initial: getSpeakerInitialStatic(tag),
      totalDuration: data.duration,
      percentage: totalDuration > 0 ? Math.round((data.duration / totalDuration) * 100) : 0,
      segmentCount: data.count,
      color: getSpeakerColorHex(tag),
    }));
}

function getSpeakerInitialStatic(speakerTag: string): string {
  const letterMatch = speakerTag.match(/[A-Z](?![a-z])/g);
  if (letterMatch && letterMatch.length > 0) return letterMatch[letterMatch.length - 1];
  const numberMatch = speakerTag.match(/\d+/);
  if (numberMatch) return String.fromCharCode(64 + parseInt(numberMatch[0]));
  return speakerTag[0].toUpperCase();
}

const SPEAKER_COLORS = ['#8D6AFA', '#14D0DC', '#3F38A0', '#d97706', '#23194B', '#6366f1'];

function getSpeakerColorHex(speakerTag: string): string {
  const speakerId = parseInt(speakerTag.replace(/[^0-9]/g, '')) ||
    (speakerTag.charCodeAt(speakerTag.length - 1) - 64);
  return SPEAKER_COLORS[(speakerId - 1) % SPEAKER_COLORS.length];
}

export default function TranscriptTimeline({ segments, className = '', highlightOptions }: TranscriptTimelineProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Set<number>>(new Set());

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime;
    if (duration < 60) return `${Math.floor(duration)}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}m ${seconds}s`;
  };

  const getSpeakerColor = (speakerTag: string): { accent: string; text: string; dot: string } => {
    const speakerId = parseInt(speakerTag.replace(/[^0-9]/g, '')) ||
      (speakerTag.charCodeAt(speakerTag.length - 1) - 64);
    const idx = (speakerId - 1) % SPEAKER_COLORS.length;

    // Tailwind classes per color — accent for left border, text for name, dot for avatar
    const palette = [
      { accent: 'border-l-[#8D6AFA]', text: 'text-[#8D6AFA] dark:text-[#a98afb]', dot: 'bg-[#8D6AFA]' },
      { accent: 'border-l-[#14D0DC]', text: 'text-[#0ea5b0] dark:text-[#14D0DC]', dot: 'bg-[#14D0DC]' },
      { accent: 'border-l-[#3F38A0]', text: 'text-[#3F38A0] dark:text-[#7b74d4]', dot: 'bg-[#3F38A0]' },
      { accent: 'border-l-amber-500', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
      { accent: 'border-l-[#23194B]', text: 'text-[#23194B] dark:text-[#a99dd4]', dot: 'bg-[#23194B]' },
      { accent: 'border-l-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
    ];
    return palette[idx];
  };

  const getSpeakerInitial = getSpeakerInitialStatic;

  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  // Track global match index for scroll-to-match navigation
  const matchIndexRef = useRef(0);
  matchIndexRef.current = 0;

  const highlightText = (text: string, query: string) => {
    const searchTerms: string[] = [];
    if (query) searchTerms.push(query);
    if (highlightOptions?.searchText && highlightOptions.searchText.length >= 2) {
      searchTerms.push(highlightOptions.searchText);
    }
    if (searchTerms.length === 0) return text;

    const escapedTerms = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = escapedTerms.join('|');
    const flags = highlightOptions?.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${pattern})`, flags);
    const parts = text.split(regex);
    const currentMatch = highlightOptions?.currentMatchIndex;

    return parts.map((part, index) => {
      const isMatch = searchTerms.some(term =>
        highlightOptions?.caseSensitive
          ? part === term
          : part.toLowerCase() === term.toLowerCase()
      );
      if (isMatch) {
        const globalIndex = matchIndexRef.current++;
        const isActive = currentMatch === globalIndex;
        return (
          <mark
            key={index}
            data-match-index={globalIndex}
            className={`bg-yellow-200 dark:bg-yellow-500/40 text-gray-900 dark:text-gray-100 px-0.5 rounded ${isActive ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
          >
            {part}
          </mark>
        );
      }
      return <span key={index} className="text-gray-700 dark:text-gray-300">{part}</span>;
    });
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(new Set());
      return;
    }
    const results = new Set<number>();
    const query = searchQuery.toLowerCase();
    segments.forEach((segment, index) => {
      if (segment.text.toLowerCase().includes(query) ||
        segment.speakerTag.toLowerCase().includes(query)) {
        results.add(index);
      }
    });
    setSearchResults(results);
  }, [searchQuery, segments]);

  // Group consecutive segments by speaker for cleaner display
  const groupedSegments = useMemo(() => segments.reduce((groups, segment, index) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.speakerTag === segment.speakerTag &&
      segment.startTime - lastGroup.endTime < 2) {
      lastGroup.segments.push({ segment, index });
      lastGroup.endTime = segment.endTime;
      lastGroup.text += ' ' + segment.text;
    } else {
      groups.push({
        speakerTag: segment.speakerTag,
        segments: [{ segment, index }],
        startTime: segment.startTime,
        endTime: segment.endTime,
        text: segment.text,
      });
    }
    return groups;
  }, [] as Array<{
    speakerTag: string;
    segments: Array<{ segment: SpeakerSegment; index: number }>;
    startTime: number;
    endTime: number;
    text: string;
  }>), [segments]);

  const filteredGroups = searchQuery
    ? groupedSegments.filter(group =>
      group.segments.some(s => searchResults.has(s.index))
    )
    : groupedSegments;

  return (
    <div className={`space-y-8 lg:space-y-10 ${className}`}>
      {/* Ghost search — no border, subtle background */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-24 py-2.5 rounded-lg text-[15px] text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/60 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/20 focus:bg-white dark:focus:bg-gray-800 border border-transparent focus:border-[#8D6AFA]/30 transition-colors"
        />
        {searchQuery && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {searchResults.size} result{searchResults.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Transcript segments — editorial style with dividers */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700/60 border-y border-gray-200 dark:border-gray-700/60">
        {filteredGroups.map((group, groupIndex) => {
          const colors = getSpeakerColor(group.speakerTag);
          const isExpanded = group.segments.some(s => expandedSegments.has(s.index));

          return (
            <div
              key={groupIndex}
              id={`segment-${group.segments[0].index}`}
              className={`py-5 border-l-2 ${colors.accent} pl-5 -ml-px transition-colors`}
            >
              {/* Speaker header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full ${colors.dot} flex items-center justify-center text-white text-[11px] font-semibold`}>
                    {getSpeakerInitial(group.speakerTag)}
                  </div>
                  <span className={`text-sm font-semibold ${colors.text}`}>
                    {group.speakerTag}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatTime(group.startTime)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    &middot; {formatDuration(group.startTime, group.endTime)}
                  </span>
                </div>

                {group.segments.length > 1 && (
                  <button
                    onClick={() => toggleSegment(group.segments[0].index)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 p-0.5 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Text content */}
              {isExpanded ? (
                <div className="space-y-3 ml-8">
                  {group.segments.map(({ segment, index }) => (
                    <div key={index} className="border-l border-gray-200 dark:border-gray-700 pl-4">
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-2 font-mono">
                        {formatTime(segment.startTime)}
                      </span>
                      <span className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
                        {highlightText(segment.text, searchQuery)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7] ml-8 whitespace-pre-wrap m-0 mb-0">
                  {highlightText(group.text, searchQuery)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
