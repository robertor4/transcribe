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
      'bg-blue-100 text-blue-800 border-blue-300',
      'bg-green-100 text-green-800 border-green-300',
      'bg-purple-100 text-purple-800 border-purple-300',
      'bg-yellow-100 text-yellow-800 border-yellow-300',
      'bg-pink-100 text-pink-800 border-pink-300',
      'bg-indigo-100 text-indigo-800 border-indigo-300',
      'bg-orange-100 text-orange-800 border-orange-300',
      'bg-teal-100 text-teal-800 border-teal-300',
    ];
    return colors[(speakerId - 1) % colors.length];
  };

  const totalWords = speakers.reduce((sum, speaker) => sum + speaker.wordCount, 0);
  const totalTime = speakers.reduce((sum, speaker) => sum + speaker.totalSpeakingTime, 0);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5" />
          Speaker Analysis
        </h3>
        <p className="text-sm text-gray-500 mt-1">
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
                  <div className="w-full bg-white/50 rounded-full h-2">
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
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Total Words:</span>
          <span className="ml-2 font-medium text-gray-900">{totalWords.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Total Time:</span>
          <span className="ml-2 font-medium text-gray-900">{formatDuration(totalTime)}</span>
        </div>
      </div>
    </div>
  );
}