/**
 * RecordingSourceSelector component
 * Allows user to choose between microphone or tab audio recording
 */

'use client';

import React from 'react';
import { Mic, Monitor, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RecordingSource } from '@/hooks/useMediaRecorder';

interface RecordingSourceSelectorProps {
  selectedSource: RecordingSource;
  onSourceChange: (source: RecordingSource) => void;
  canUseTabAudio: boolean;
  disabled?: boolean;
}

export function RecordingSourceSelector({
  selectedSource,
  onSourceChange,
  canUseTabAudio,
  disabled = false,
}: RecordingSourceSelectorProps) {
  const t = useTranslations('recording');

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
        {t('source.label')}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Microphone Option */}
        <button
          type="button"
          onClick={() => onSourceChange('microphone')}
          disabled={disabled}
          className={`
            relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
            ${
              selectedSource === 'microphone'
                ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-950/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20
          `}
        >
          <div
            className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${selectedSource === 'microphone' ? 'bg-[#cc3399]' : 'bg-gray-100 dark:bg-gray-700'}
          `}
          >
            <Mic
              className={`w-5 h-5 ${selectedSource === 'microphone' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
            />
          </div>

          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {t('source.microphone')}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {t('source.microphoneDescription')}
            </div>
          </div>

          {selectedSource === 'microphone' && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#cc3399]" />
          )}
        </button>

        {/* Tab Audio Option */}
        <button
          type="button"
          onClick={() => canUseTabAudio && onSourceChange('tab-audio')}
          disabled={disabled || !canUseTabAudio}
          className={`
            relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
            ${
              selectedSource === 'tab-audio'
                ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-950/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled || !canUseTabAudio ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20
          `}
        >
          <div
            className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${selectedSource === 'tab-audio' ? 'bg-[#cc3399]' : 'bg-gray-100 dark:bg-gray-700'}
          `}
          >
            <Monitor
              className={`w-5 h-5 ${selectedSource === 'tab-audio' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
            />
          </div>

          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {t('source.tabAudio')}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {t('source.tabAudioDescription')}
            </div>
          </div>

          {selectedSource === 'tab-audio' && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#cc3399]" />
          )}
        </button>
      </div>

      {/* Browser Compatibility Notice */}
      {!canUseTabAudio && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 dark:text-gray-300">
            {t('source.tabAudioNotSupported')}
          </div>
        </div>
      )}

      {/* Tab Audio Instructions */}
      {selectedSource === 'tab-audio' && canUseTabAudio && (
        <div className="flex items-start gap-2 p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg">
          <Info className="w-4 h-4 text-[#cc3399] dark:text-pink-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 dark:text-gray-300">
            {t('source.tabAudioInstructions')}
          </div>
        </div>
      )}
    </div>
  );
}
