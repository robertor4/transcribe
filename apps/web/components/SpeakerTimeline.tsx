'use client';

import React, { useMemo } from 'react';
import { SpeakerSegment } from '@transcribe/shared';
import { Clock } from 'lucide-react';

interface SpeakerTimelineProps {
  segments?: SpeakerSegment[];
  className?: string;
}

export default function SpeakerTimeline({ segments, className = '' }: SpeakerTimelineProps) {
  const timelineData = useMemo(() => {
    if (!segments || !segments.length) return { duration: 0, speakerBlocks: [] };

    const duration = segments[segments.length - 1].endTime;
    
    // Group consecutive segments by speaker
    const speakerBlocks: Array<{
      speakerTag: string;
      startTime: number;
      endTime: number;
      percentage: number;
      position: number;
    }> = [];

    segments.forEach((segment) => {
      const lastBlock = speakerBlocks[speakerBlocks.length - 1];
      
      if (lastBlock && lastBlock.speakerTag === segment.speakerTag && 
          segment.startTime - lastBlock.endTime < 1) {
        // Extend the last block
        lastBlock.endTime = segment.endTime;
      } else {
        // Create a new block
        speakerBlocks.push({
          speakerTag: segment.speakerTag,
          startTime: segment.startTime,
          endTime: segment.endTime,
          percentage: 0,
          position: 0,
        });
      }
    });

    // Calculate percentages and positions
    speakerBlocks.forEach((block) => {
      block.percentage = ((block.endTime - block.startTime) / duration) * 100;
      block.position = (block.startTime / duration) * 100;
    });

    return { duration, speakerBlocks };
  }, [segments]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speakerTag: string): string => {
    const speakerId = parseInt(speakerTag.replace('Speaker ', ''));
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-teal-500',
    ];
    return colors[(speakerId - 1) % colors.length];
  };

  const { duration, speakerBlocks } = timelineData;

  // Early return if no segments
  if (!segments || segments.length === 0) {
    return null;
  }

  // Get unique speakers for the legend
  const uniqueSpeakers = Array.from(new Set(speakerBlocks.map(b => b.speakerTag))).sort();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Speaker Timeline
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Visual representation of speaker participation over time
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {uniqueSpeakers.map((speaker) => (
          <div key={speaker} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getSpeakerColor(speaker)}`} />
            <span className="text-sm text-gray-700">{speaker}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Time markers */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>0:00</span>
          <span>{formatTime(duration / 4)}</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime((duration * 3) / 4)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Timeline bar */}
        <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
          {speakerBlocks.map((block, index) => (
            <div
              key={index}
              className={`absolute h-full ${getSpeakerColor(block.speakerTag)} opacity-80 hover:opacity-100 transition-opacity`}
              style={{
                left: `${block.position}%`,
                width: `${block.percentage}%`,
              }}
              title={`${block.speakerTag}: ${formatTime(block.startTime)} - ${formatTime(block.endTime)}`}
            />
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-px h-full bg-gray-300 opacity-30" />
          ))}
        </div>
      </div>

      {/* Interactive timeline with hover details */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed View</h4>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {speakerBlocks.map((block, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${getSpeakerColor(block.speakerTag)}`} />
              <span className="text-sm font-medium text-gray-700 w-20">
                {block.speakerTag}
              </span>
              <span className="text-sm text-gray-500">
                {formatTime(block.startTime)} - {formatTime(block.endTime)}
              </span>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getSpeakerColor(block.speakerTag)} opacity-60`}
                    style={{ width: `${block.percentage * 2}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {formatTime(block.endTime - block.startTime)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}