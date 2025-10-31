'use client';

import React, { useState } from 'react';
import { Transcription, formatFileSize, formatDuration } from '@transcribe/shared';
import { Clock, FileAudio, Globe, HardDrive, Users, MessageSquare, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { transcriptionApi } from '@/lib/api';

interface TranscriptionDetailsProps {
  transcription: Transcription;
  onRefresh?: () => void;
}

export const TranscriptionDetails: React.FC<TranscriptionDetailsProps> = ({ transcription, onRefresh }) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegenerateAnalyses = async () => {
    setIsRegenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await transcriptionApi.regenerateCoreAnalyses(transcription.id);

      if (response.success) {
        setSuccess(true);
        // Call parent refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError('Failed to regenerate analyses');
      }
    } catch (err: any) {
      console.error('Regenerate error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'An error occurred while regenerating analyses'
      );
    } finally {
      setIsRegenerating(false);
    }
  };
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
        ...(transcription.status ? [{ label: 'Status', value: transcription.status.charAt(0).toUpperCase() + transcription.status.slice(1) }] : []),
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
        {/* Re-run Core Analyses Section */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#cc3399]" />
                Re-run Core Analyses
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Regenerate your Summary, Action Items, and Communication analyses based on the current transcript.
                This is useful after making corrections to the transcript or if you want to update the analyses.
              </p>
              <button
                onClick={handleRegenerateAnalyses}
                disabled={isRegenerating}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Re-run Analyses Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mt-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 p-4">
              <p className="text-sm text-green-900 dark:text-green-300 font-medium">
                ✅ Core analyses regenerated successfully! Check the Summary, Action Items, and Communication tabs to see the updates.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

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
