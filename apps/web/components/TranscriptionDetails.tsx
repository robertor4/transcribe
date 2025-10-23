'use client';

import React from 'react';
import { Transcription, formatFileSize, formatDuration } from '@transcribe/shared';
import { Clock, FileAudio, Globe, HardDrive, Users, MessageSquare } from 'lucide-react';

interface TranscriptionDetailsProps {
  transcription: Transcription;
}

export const TranscriptionDetails: React.FC<TranscriptionDetailsProps> = ({ transcription }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const detailSections = [
    {
      title: 'File Information',
      icon: FileAudio,
      items: [
        { label: 'File Name', value: transcription.fileName },
        { label: 'File Size', value: formatFileSize(transcription.fileSize) },
        { label: 'MIME Type', value: transcription.mimeType },
        ...(transcription.duration ? [{ label: 'Duration', value: formatDuration(transcription.duration) }] : []),
      ]
    },
    {
      title: 'Processing Information',
      icon: Clock,
      items: [
        { label: 'Created', value: formatDate(transcription.createdAt) },
        { label: 'Last Updated', value: formatDate(transcription.updatedAt) },
        ...(transcription.completedAt ? [{ label: 'Completed', value: formatDate(transcription.completedAt) }] : []),
        { label: 'Status', value: transcription.status.charAt(0).toUpperCase() + transcription.status.slice(1) },
      ]
    },
    {
      title: 'Language & Content',
      icon: Globe,
      items: [
        ...(transcription.detectedLanguage ? [{ label: 'Detected Language', value: transcription.detectedLanguage.charAt(0).toUpperCase() + transcription.detectedLanguage.slice(1) }] : []),
        ...(transcription.summaryLanguage ? [{ label: 'Summary Language', value: transcription.summaryLanguage.charAt(0).toUpperCase() + transcription.summaryLanguage.slice(1) }] : []),
        ...(transcription.translations && Object.keys(transcription.translations).length > 0
          ? [{ label: 'Available Translations', value: Object.keys(transcription.translations).length.toString() }]
          : []
        ),
      ]
    },
  ];

  // Add speaker information if available
  if (transcription.speakerCount || transcription.speakers) {
    detailSections.push({
      title: 'Speaker Information',
      icon: Users,
      items: [
        ...(transcription.speakerCount ? [{ label: 'Number of Speakers', value: transcription.speakerCount.toString() }] : []),
        ...(transcription.diarizationConfidence ? [{ label: 'Diarization Confidence', value: `${(transcription.diarizationConfidence * 100).toFixed(1)}%` }] : []),
        ...(transcription.speakers
          ? transcription.speakers.map((speaker) => ({
              label: speaker.speakerTag,
              value: `${formatDuration(speaker.totalSpeakingTime)} (${speaker.wordCount} words)`
            }))
          : []
        ),
      ]
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 mb-16">
      <div className="space-y-8">
        {/* Context Information Section */}
        {transcription.context && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Context Information
              </h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {transcription.context}
              </p>
            </div>
          </div>
        )}

        {detailSections.map((section) => {
          const Icon = section.icon;

          // Skip section if no items
          if (section.items.length === 0) return null;

          return (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {section.title}
                </h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
                    >
                      <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:col-span-2 sm:mt-0">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          );
        })}

        {/* Additional metadata if available */}
        {transcription.metadata && Object.keys(transcription.metadata).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Additional Metadata
              </h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(transcription.metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:col-span-2 sm:mt-0 font-mono">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
