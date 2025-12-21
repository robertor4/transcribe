'use client';

import React from 'react';
import { Speaker } from '@transcribe/shared';
import { Clock, User, MessageSquare } from 'lucide-react';

interface SpeakerSummaryProps {
  speakers?: Speaker[];
  className?: string;
}

export default function SpeakerSummary({ speakers, className = '' }: SpeakerSummaryProps) {
  if (!speakers || speakers.length === 0) {
    return null;
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speakerId: number): string => {
    const colors = [
      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-pink-300 border-pink-300 dark:border-pink-700',
      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
      'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700',
    ];
    return colors[(speakerId - 1) % colors.length];
  };

  const totalWords = speakers.reduce((sum, speaker) => sum + speaker.wordCount, 0);
  const totalTime = speakers.reduce((sum, speaker) => sum + speaker.totalSpeakingTime, 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="w-5 h-5" />
          Speaker Analysis
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {speakers.length} speaker{speakers.length > 1 ? 's' : ''} identified
        </p>
      </div>

      <div className="space-y-3">
        {speakers.map((speaker) => {
          const wordPercentage = totalWords > 0 ? (speaker.wordCount / totalWords) * 100 : 0;
          const timePercentage = totalTime > 0 ? (speaker.totalSpeakingTime / totalTime) * 100 : 0;
          
          return (
            <div
              key={speaker.speakerId}
              className={`rounded-lg border-2 p-4 ${getSpeakerColor(speaker.speakerId)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-lg">{speaker.speakerTag}</span>
                <span className="text-sm opacity-75">
                  First at {formatDuration(speaker.firstAppearance)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{speaker.wordCount.toLocaleString()}</span>
                    <span className="text-xs opacity-75">({wordPercentage.toFixed(1)}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Speaking Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatDuration(speaker.totalSpeakingTime)}</span>
                    <span className="text-xs opacity-75">({timePercentage.toFixed(1)}%)</span>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="mt-3 space-y-2">
                  <div className="w-full bg-white/50 dark:bg-gray-700/50 rounded-full h-2">
                    <div
                      className="bg-current rounded-full h-2 transition-all duration-300 opacity-60"
                      style={{ width: `${wordPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total Words:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{totalWords.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total Time:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{formatDuration(totalTime)}</span>
        </div>
      </div>
    </div>
  );
}