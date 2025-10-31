'use client';

import React, { useState } from 'react';
import { SpeakerSegment } from '@transcribe/shared';
import { User, Clock, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import TranscriptCorrectionModal from './TranscriptCorrectionModal';

interface TranscriptWithSpeakersProps {
  transcriptionId: string;
  segments?: SpeakerSegment[];
  transcriptWithSpeakers?: string;
  className?: string;
  onRefresh?: () => void; // Callback to refresh transcription after correction
}

export default function TranscriptWithSpeakers({
  transcriptionId,
  segments,
  transcriptWithSpeakers,
  className = '',
  onRefresh,
}: TranscriptWithSpeakersProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  if (!segments || segments.length === 0) {
    // Fall back to formatted transcript if no segments
    if (transcriptWithSpeakers) {
      return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Transcript with Speakers</h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
              {transcriptWithSpeakers}
            </pre>
          </div>
        </div>
      );
    }
    return null;
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speakerTag: string): string => {
    const speakerId = parseInt(speakerTag.replace('Speaker ', ''));
    const colors = [
      'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30',
      'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30',
      'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30',
      'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
      'border-pink-400 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/30',
      'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30',
      'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30',
      'border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/30',
    ];
    return colors[(speakerId - 1) % colors.length];
  };

  const getSpeakerTextColor = (speakerTag: string): string => {
    const speakerId = parseInt(speakerTag.replace('Speaker ', ''));
    const colors = [
      'text-blue-700 dark:text-blue-400',
      'text-green-700 dark:text-green-400',
      'text-purple-700 dark:text-purple-400',
      'text-yellow-700 dark:text-yellow-400',
      'text-pink-700 dark:text-pink-400',
      'text-indigo-700 dark:text-indigo-400',
      'text-orange-700 dark:text-orange-400',
      'text-teal-700 dark:text-teal-400',
    ];
    return colors[(speakerId - 1) % colors.length];
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

  // Group consecutive segments by the same speaker
  const groupedSegments: Array<{
    speakerTag: string;
    segments: Array<{ segment: SpeakerSegment; index: number }>;
    startTime: number;
    endTime: number;
    combinedText: string;
  }> = [];

  segments.forEach((segment, index) => {
    const lastGroup = groupedSegments[groupedSegments.length - 1];
    
    if (lastGroup && lastGroup.speakerTag === segment.speakerTag) {
      // Add to existing group
      lastGroup.segments.push({ segment, index });
      lastGroup.endTime = segment.endTime;
      lastGroup.combinedText += ' ' + segment.text;
    } else {
      // Create new group
      groupedSegments.push({
        speakerTag: segment.speakerTag,
        segments: [{ segment, index }],
        startTime: segment.startTime,
        endTime: segment.endTime,
        combinedText: segment.text,
      });
    }
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transcript with Speakers</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCorrectionModalOpen(true)}
            className="text-sm text-[#cc3399] hover:text-[#b82d89] font-medium flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20 rounded px-2 py-1"
          >
            <Pencil className="w-4 h-4" />
            Fix
          </button>
          <button
            onClick={() => setShowTimestamps(!showTimestamps)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 rounded px-2 py-1"
          >
            <Clock className="w-4 h-4" />
            {showTimestamps ? 'Hide' : 'Show'} Timestamps
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {groupedSegments.map((group, groupIndex) => {
          const isExpanded = group.segments.length > 1 && 
            group.segments.some(s => expandedSegments.has(s.index));
          
          return (
            <div
              key={groupIndex}
              className={`rounded-lg border-l-4 p-4 ${getSpeakerColor(group.speakerTag)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${getSpeakerTextColor(group.speakerTag)}`} />
                  <span className={`font-medium ${getSpeakerTextColor(group.speakerTag)}`}>
                    {group.speakerTag}
                  </span>
                  {showTimestamps && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(group.startTime)} - {formatTime(group.endTime)}
                    </span>
                  )}
                </div>

                {group.segments.length > 1 && (
                  <button
                    onClick={() => toggleSegment(group.segments[0].index)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <div className="text-gray-700 dark:text-gray-300">
                {isExpanded ? (
                  // Show individual segments
                  <div className="space-y-2">
                    {group.segments.map(({ segment, index }) => (
                      <div key={index} className="pl-6 border-l-2 border-gray-300 dark:border-gray-600">
                        {showTimestamps && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                            [{formatTime(segment.startTime)}]
                          </span>
                        )}
                        <span>{segment.text}</span>
                        {segment.confidence && (
                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                            ({(segment.confidence * 100).toFixed(0)}% confident)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show combined text
                  <p className="whitespace-pre-wrap">{group.combinedText}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {segments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          {segments.length} segments • {formatTime(segments[segments.length - 1].endTime)} total duration
        </div>
      )}

      {/* Transcript Correction Modal */}
      <TranscriptCorrectionModal
        transcriptionId={transcriptionId}
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </div>
  );
}