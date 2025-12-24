/**
 * RecordingRecoveryDialog component
 * Shows dialog when unsaved recordings are found in IndexedDB
 * Allows users to recover or discard recordings from previous sessions
 */

'use client';

import React, { useEffect } from 'react';
import { AlertCircle, Clock, HardDrive, Mic, Monitor, X } from 'lucide-react';
import type { RecoverableRecording } from '@/utils/recordingStorage';

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

  return `${value} ${sizes[i]}`;
}

interface RecordingRecoveryDialogProps {
  recordings: RecoverableRecording[];
  onRecover: (recording: RecoverableRecording) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}

export function RecordingRecoveryDialog({
  recordings,
  onRecover,
  onDiscard,
  onClose,
}: RecordingRecoveryDialogProps) {
  // Handle Escape key to close dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && recordings.length > 0) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [recordings.length, onClose]);

  if (recordings.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Recover Unsaved Recordings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  We found {recordings.length} recording{recordings.length > 1 ? 's' : ''} that{' '}
                  {recordings.length > 1 ? 'were' : 'was'} not uploaded. Would you like to recover{' '}
                  {recordings.length > 1 ? 'them' : 'it'}?
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recordings List */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              {recordings.map((recording) => {
                // Calculate total file size
                const totalSize = recording.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
                const recordingDate = new Date(recording.startTime);

                return (
                  <div
                    key={recording.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    {/* Source Icon */}
                    <div className="flex-shrink-0">
                      {recording.source === 'microphone' ? (
                        <div className="w-10 h-10 rounded-full bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 flex items-center justify-center">
                          <Mic className="w-5 h-5 text-[#8D6AFA]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* Recording Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {recording.source === 'microphone' ? 'Microphone' : 'Tab Audio'} Recording
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(recording.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          <span>{formatFileSize(totalSize)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {recordingDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onRecover(recording)}
                        className="
                          px-4 py-2 rounded-lg
                          bg-[#8D6AFA] hover:bg-[#7A5AE0]
                          text-white text-sm font-medium
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/30
                        "
                      >
                        Recover
                      </button>
                      <button
                        type="button"
                        onClick={() => onDiscard(recording.id)}
                        className="
                          px-4 py-2 rounded-lg
                          bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                          text-gray-700 dark:text-gray-200 text-sm font-medium
                          border border-gray-300 dark:border-gray-600
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-gray-300/30
                        "
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Recordings are auto-saved to your device and deleted after 7 days.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2 rounded-lg
                text-gray-700 dark:text-gray-200 text-sm font-medium
                hover:bg-gray-200 dark:hover:bg-gray-700
                transition-colors duration-200
              "
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
