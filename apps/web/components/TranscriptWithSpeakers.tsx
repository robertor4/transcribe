'use client';

import React, { useState } from 'react';
import { SpeakerSegment } from '@transcribe/shared';
import { User, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptWithSpeakersProps {
  segments?: SpeakerSegment[];
  transcriptWithSpeakers?: string;
  className?: string;
}

export default function TranscriptWithSpeakers({ 
  segments, 
  transcriptWithSpeakers,
  className = '' 
}: TranscriptWithSpeakersProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [showTimestamps, setShowTimestamps] = useState(false);

  if (!segments || segments.length === 0) {
    // Fall back to formatted transcript if no segments
    if (transcriptWithSpeakers) {
      return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript with Speakers</h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700">
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
      'border-blue-400 bg-blue-50',
      'border-green-400 bg-green-50',
      'border-purple-400 bg-purple-50',
      'border-yellow-400 bg-yellow-50',
      'border-pink-400 bg-pink-50',
      'border-indigo-400 bg-indigo-50',
      'border-orange-400 bg-orange-50',
      'border-teal-400 bg-teal-50',
    ];
    return colors[(speakerId - 1) % colors.length];
  };

  const getSpeakerTextColor = (speakerTag: string): string => {
    const speakerId = parseInt(speakerTag.replace('Speaker ', ''));
    const colors = [
      'text-blue-700',
      'text-green-700',
      'text-purple-700',
      'text-yellow-700',
      'text-pink-700',
      'text-indigo-700',
      'text-orange-700',
      'text-teal-700',
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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transcript with Speakers</h3>
        <button
          onClick={() => setShowTimestamps(!showTimestamps)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Clock className="w-4 h-4" />
          {showTimestamps ? 'Hide' : 'Show'} Timestamps
        </button>
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
                    <span className="text-xs text-gray-500">
                      {formatTime(group.startTime)} - {formatTime(group.endTime)}
                    </span>
                  )}
                </div>
                
                {group.segments.length > 1 && (
                  <button
                    onClick={() => toggleSegment(group.segments[0].index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <div className="text-gray-700">
                {isExpanded ? (
                  // Show individual segments
                  <div className="space-y-2">
                    {group.segments.map(({ segment, index }) => (
                      <div key={index} className="pl-6 border-l-2 border-gray-300">
                        {showTimestamps && (
                          <span className="text-xs text-gray-400 mr-2">
                            [{formatTime(segment.startTime)}]
                          </span>
                        )}
                        <span>{segment.text}</span>
                        {segment.confidence && (
                          <span className="ml-2 text-xs text-gray-400">
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
        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
          {segments.length} segments • {formatTime(segments[segments.length - 1].endTime)} total duration
        </div>
      )}
    </div>
  );
}