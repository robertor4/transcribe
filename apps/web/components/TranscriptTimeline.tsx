'use client';

import React, { useState, useRef, useEffect } from 'react';
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

export default function TranscriptTimeline({ segments, className = '', highlightOptions }: TranscriptTimelineProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Set<number>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);

  const totalDuration = segments.length > 0 ? segments[segments.length - 1].endTime : 0;

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
    if (duration < 60) {
      return `${Math.floor(duration)}s`;
    }
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}m ${seconds}s`;
  };

  const getSpeakerColor = (speakerTag: string): { bg: string; border: string; text: string; avatar: string } => {
    const speakerId = parseInt(speakerTag.replace(/[^0-9]/g, '')) ||
                     (speakerTag.charCodeAt(speakerTag.length - 1) - 64);

    // Brand-aligned color palette
    const colors = [
      { bg: 'bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/15', border: 'border-[#8D6AFA] dark:border-[#8D6AFA]/70', text: 'text-[#8D6AFA] dark:text-[#a98afb]', avatar: 'bg-[#8D6AFA]' },
      { bg: 'bg-[#14D0DC]/5 dark:bg-[#14D0DC]/15', border: 'border-[#14D0DC] dark:border-[#14D0DC]/70', text: 'text-[#0ea5b0] dark:text-[#14D0DC]', avatar: 'bg-[#14D0DC]' },
      { bg: 'bg-[#3F38A0]/5 dark:bg-[#3F38A0]/15', border: 'border-[#3F38A0] dark:border-[#3F38A0]/70', text: 'text-[#3F38A0] dark:text-[#7b74d4]', avatar: 'bg-[#3F38A0]' },
      { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-400 dark:border-amber-600', text: 'text-amber-700 dark:text-amber-400', avatar: 'bg-amber-500' },
      { bg: 'bg-[#23194B]/5 dark:bg-[#23194B]/20', border: 'border-[#23194B] dark:border-[#4a3f7a]', text: 'text-[#23194B] dark:text-[#a99dd4]', avatar: 'bg-[#23194B]' },
      { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-400 dark:border-indigo-600', text: 'text-indigo-700 dark:text-indigo-400', avatar: 'bg-indigo-500' },
    ];

    return colors[(speakerId - 1) % colors.length];
  };

  const getSpeakerInitial = (speakerTag: string): string => {
    const letterMatch = speakerTag.match(/[A-Z](?![a-z])/g);
    if (letterMatch && letterMatch.length > 0) {
      return letterMatch[letterMatch.length - 1];
    }
    const numberMatch = speakerTag.match(/\d+/);
    if (numberMatch) {
      const num = parseInt(numberMatch[0]);
      return String.fromCharCode(64 + num);
    }
    return speakerTag[0].toUpperCase();
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const clickedTime = percentage * totalDuration;
    
    setSelectedTime(clickedTime);
    
    // Find and scroll to the segment at this time
    const segmentIndex = segments.findIndex(
      segment => segment.startTime <= clickedTime && segment.endTime >= clickedTime
    );
    
    if (segmentIndex !== -1) {
      const element = document.getElementById(`segment-${segmentIndex}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
  // This ref is reset at the start of each render cycle
  const matchIndexRef = useRef(0);
  // Reset at the start of each render
  matchIndexRef.current = 0;

  const highlightText = (text: string, query: string) => {
    // Combine local search query with external highlightOptions
    const searchTerms: string[] = [];
    if (query) searchTerms.push(query);
    if (highlightOptions?.searchText && highlightOptions.searchText.length >= 2) {
      searchTerms.push(highlightOptions.searchText);
    }

    if (searchTerms.length === 0) return text;

    // Build regex pattern for all search terms
    const escapedTerms = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = escapedTerms.join('|');
    const flags = highlightOptions?.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${pattern})`, flags);
    const parts = text.split(regex);

    const currentMatchIndex = highlightOptions?.currentMatchIndex;

    return parts.map((part, index) => {
      const isMatch = searchTerms.some(term =>
        highlightOptions?.caseSensitive
          ? part === term
          : part.toLowerCase() === term.toLowerCase()
      );
      if (isMatch) {
        const globalIndex = matchIndexRef.current++;
        const isActive = currentMatchIndex === globalIndex;
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
  const groupedSegments = segments.reduce((groups, segment, index) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.speakerTag === segment.speakerTag &&
        segment.startTime - lastGroup.endTime < 2) {
      // Merge with previous group if same speaker and gap < 2 seconds
      lastGroup.segments.push({ segment, index });
      lastGroup.endTime = segment.endTime;
      lastGroup.text += ' ' + segment.text;
    } else {
      // Create new group
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
  }>);

  // Filter segments based on search query
  const filteredGroups = searchQuery
    ? groupedSegments.filter(group =>
        group.segments.some(s => searchResults.has(s.index))
      )
    : groupedSegments;

  // Generate time markers for the timeline
  const timeMarkers = [];
  const markerInterval = totalDuration > 3600 ? 600 : totalDuration > 600 ? 60 : 30;
  for (let time = 0; time <= totalDuration; time += markerInterval) {
    timeMarkers.push(time);
  }

  return (
    <div className={`bg-white dark:bg-transparent rounded-lg overflow-x-hidden ${className}`}>
      {/* Header with Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/20 focus:border-[#8D6AFA]"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {searchResults.size} results
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#8D6AFA]">{formatTime(totalDuration)}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#8D6AFA]">{segments.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Segments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#8D6AFA]">
              {new Set(segments.map(s => s.speakerTag)).size}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Speakers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#8D6AFA]">
              {Math.round(segments.reduce((sum, s) => sum + s.text.split(' ').length, 0) / segments.length)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Words/Segment</div>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Bar - hidden on mobile for space */}
      <div className="hidden sm:block mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Timeline Overview</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{formatTime(totalDuration)}</span>
        </div>
        <div
          ref={timelineRef}
          className="relative h-12 bg-gradient-to-r from-[#8D6AFA]/5 to-[#14D0DC]/5 dark:from-[#8D6AFA]/10 dark:to-[#14D0DC]/10 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Speaker blocks on timeline */}
          {groupedSegments.map((group, index) => {
            const leftPercent = (group.startTime / totalDuration) * 100;
            const widthPercent = ((group.endTime - group.startTime) / totalDuration) * 100;
            const colors = getSpeakerColor(group.speakerTag);

            return (
              <div
                key={index}
                className={`absolute h-full ${colors.avatar} opacity-70 hover:opacity-100 transition-opacity`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
                title={`${group.speakerTag}: ${formatTime(group.startTime)} - ${formatTime(group.endTime)}`}
              />
            );
          })}

          {/* Time markers */}
          {timeMarkers.map((time) => (
            <div
              key={time}
              className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-600"
              style={{ left: `${(time / totalDuration) * 100}%` }}
            >
              <span className="absolute -bottom-5 -left-4 text-xs text-gray-500 dark:text-gray-400">
                {formatTime(time)}
              </span>
            </div>
          ))}

          {/* Selected time indicator */}
          {selectedTime !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-[#8D6AFA]"
              style={{ left: `${(selectedTime / totalDuration) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-[#8D6AFA] rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Transcript Segments */}
      <div className="space-y-2">
        {filteredGroups.map((group, groupIndex) => {
          const colors = getSpeakerColor(group.speakerTag);
          const isExpanded = group.segments.some(s => expandedSegments.has(s.index));

          return (
            <div
              key={groupIndex}
              id={`segment-${group.segments[0].index}`}
              className="relative transition-all mb-6"
            >
              {/* Timeline connector - hidden on mobile for space */}
              <div className="hidden sm:block absolute left-16 top-0 bottom-0 w-0.5 bg-[#8D6AFA]/20 dark:bg-[#8D6AFA]/30" />

              {/* Time marker - simplified on mobile */}
              <div className="hidden sm:flex absolute left-0 top-4 items-center">
                <div className={`w-4 h-4 rounded-full ${colors.avatar} ring-4 ring-white dark:ring-gray-800`} />
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {formatTime(group.startTime)}
                </span>
              </div>

              {/* Content card - full width on mobile, indented on desktop */}
              <div className={`sm:ml-20 rounded-lg border-2 ${colors.border} ${colors.bg} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${colors.avatar} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                      {getSpeakerInitial(group.speakerTag)}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${colors.text}`}>
                        {group.speakerTag}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="sm:hidden">{formatTime(group.startTime)} · </span>
                        {formatDuration(group.startTime, group.endTime)}
                      </div>
                    </div>
                  </div>

                  {group.segments.length > 1 && (
                    <button
                      onClick={() => toggleSegment(group.segments[0].index)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-1"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {isExpanded ? (
                    <div className="space-y-2">
                      {group.segments.map(({ segment, index }) => (
                        <div
                          key={index}
                          className={`pl-4 border-l-2 ${colors.border}`}
                        >
                          <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                            [{formatTime(segment.startTime)}]
                          </span>
                          <span className="text-sm">{highlightText(segment.text, searchQuery)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap m-0">
                      {highlightText(group.text, searchQuery)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}