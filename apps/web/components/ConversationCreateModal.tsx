'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { UploadInterface } from './UploadInterface';
import { RealProcessingView } from './RealProcessingView';
import { RecordingRecoveryDialog } from './RecordingRecoveryDialog';
import {
  getRecordingStorage,
  type RecoverableRecording,
} from '@/utils/recordingStorage';
import { useAuth } from '@/contexts/AuthContext';
import type { RecordingSource } from '@/hooks/useMediaRecorder';

interface ConversationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (conversationId: string) => void;
  folderId?: string | null; // Optional folder context

  // Context-aware entry props
  initialStep?: CreateStep;
  uploadMethod?: 'file' | 'record' | 'record-microphone' | 'record-tab-audio' | null;
}

export type CreateStep = 'capture' | 'context' | 'processing' | 'complete';

// Data for continuing a recovered recording
export interface ContinueRecordingData {
  chunks: Blob[];
  duration: number;
  source: RecordingSource;
  recordingId: string;
}

/**
 * Simplified conversation creation modal
 * Step 1: Upload/record audio
 * Step 2: Add context (optional)
 * Step 3: Processing
 * Step 4: Navigate to conversation detail
 */
export function ConversationCreateModal({
  isOpen,
  onClose,
  onComplete,
  folderId,
  // initialStep is defined in interface but not yet implemented
  uploadMethod,
}: ConversationCreateModalProps) {
  const t = useTranslations('conversationCreate');
  const { user } = useAuth();

  // State for flow
  const [currentStep, setCurrentStep] = useState<CreateStep>('capture');
  const [overallContext, setOverallContext] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [, setProcessingMode] = useState<'individual' | 'merged'>('individual');
  const [isRecording, setIsRecording] = useState(false);
  // Store markAsUploaded callback to call after successful processing
  const [markAsUploadedCallback, setMarkAsUploadedCallback] = useState<(() => Promise<void>) | null>(null);
  // Store processing error for display
  const [, setProcessingError] = useState<string | null>(null);
  // Store recovered recording ID to delete after successful processing
  const [pendingRecoveryDeletionId, setPendingRecoveryDeletionId] = useState<string | null>(null);

  // Recovery state
  const [recoverableRecordings, setRecoverableRecordings] = useState<RecoverableRecording[]>([]);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [continueRecordingData, setContinueRecordingData] = useState<ContinueRecordingData | null>(null);
  // Track which upload method to use after recovery
  const [recoveryUploadMethod, setRecoveryUploadMethod] = useState<'record-microphone' | 'record-tab-audio' | null>(null);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    // Only show confirmation when there's actual progress to lose:
    // - Actively recording or paused
    // - Processing in progress
    // - Files selected for upload
    // - Recording completed but not yet processed
    const hasProgress =
      isRecording ||
      currentStep === 'processing' ||
      uploadedFiles.length > 0 ||
      recordedBlob !== null;

    if (hasProgress) {
      const confirmed = window.confirm(t('confirmCancel'));

      if (!confirmed) {
        return; // User cancelled, keep modal open
      }
    }

    // Reset all state
    setCurrentStep('capture');
    setOverallContext('');
    setUploadedFiles([]);
    setRecordedBlob(null);
    setProcessingMode('individual');
    setIsRecording(false);
    setMarkAsUploadedCallback(null);
    setProcessingError(null);
    setRecoverableRecordings([]);
    setShowRecoveryDialog(false);
    setContinueRecordingData(null);
    setRecoveryUploadMethod(null);
    setPendingRecoveryDeletionId(null);
    onClose();
  }, [isRecording, currentStep, uploadedFiles.length, recordedBlob, onClose, t]);

  // Check for recoverable recordings when modal opens
  // Only show recordings belonging to the current user (privacy/security)
  useEffect(() => {
    const checkForRecovery = async () => {
      if (!isOpen || !user?.uid) return;

      try {
        const storage = await getRecordingStorage();
        // Get only recordings belonging to this user
        const userRecordings = await storage.getRecordingsByUser(user.uid);

        // Filter out recent recordings (current session - less than 2 seconds old)
        const twoSecondsAgo = Date.now() - 2000;
        const recoverable = userRecordings.filter(
          (r) => r.lastSaved < twoSecondsAgo && r.duration > 0
        );

        if (recoverable.length > 0) {
          setRecoverableRecordings(recoverable);
          setShowRecoveryDialog(true);
        }
      } catch (err) {
        console.error('[ConversationCreateModal] Failed to check for recoverable recordings:', err);
      }
    };

    checkForRecovery();
  }, [isOpen, user?.uid]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('capture');
      setOverallContext('');
      setUploadedFiles([]);
      setRecordedBlob(null);
      setProcessingMode('individual');
      setIsRecording(false);
      setMarkAsUploadedCallback(null);
      setProcessingError(null);
      setContinueRecordingData(null);
      setRecoveryUploadMethod(null);
      setPendingRecoveryDeletionId(null);
      // Don't reset recoverableRecordings or showRecoveryDialog here - they're set by checkForRecovery
    }
  }, [isOpen, uploadMethod]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Don't handle Escape if recovery dialog is open (it has its own handler)
      if (e.key === 'Escape' && isOpen && !showRecoveryDialog) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose, showRecoveryDialog]);

  // Upload handlers
  const handleFileUpload = (files: File[], mode: 'individual' | 'merged') => {
    setUploadedFiles(files);
    setProcessingMode(mode);
    setCurrentStep('context'); // Go directly to context step
  };

  const handleRecordingComplete = (blob: Blob, markAsUploaded: () => Promise<void>) => {
    setRecordedBlob(blob);
    // Store the callback to call after successful upload/processing
    setMarkAsUploadedCallback(() => markAsUploaded);
    // Convert blob to file for compatibility
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
    setUploadedFiles([file]);
    setProcessingMode('individual'); // Single recording always individual
    setCurrentStep('context'); // Go directly to context step
  };

  // Context submission
  const handleContextSubmit = () => {
    setCurrentStep('processing');
  };

  // Processing complete handler - receives real transcription ID from backend
  const handleProcessingComplete = async (transcriptionId: string) => {
    // Clean up IndexedDB backup now that processing succeeded
    if (markAsUploadedCallback) {
      try {
        await markAsUploadedCallback();
      } catch (err) {
        console.error('[ConversationCreateModal] Failed to clean up IndexedDB backup:', err);
      }
    }

    // Clean up recovered recording from IndexedDB now that processing succeeded
    if (pendingRecoveryDeletionId) {
      try {
        const storage = await getRecordingStorage();
        await storage.deleteRecording(pendingRecoveryDeletionId);
      } catch (err) {
        console.error('[ConversationCreateModal] Failed to clean up recovered recording:', err);
      }
    }

    // Reset state without confirmation (successful completion, not cancellation)
    setCurrentStep('capture');
    setOverallContext('');
    setUploadedFiles([]);
    setRecordedBlob(null);
    setProcessingMode('individual');
    setIsRecording(false);
    setMarkAsUploadedCallback(null);
    setProcessingError(null);
    setRecoverableRecordings([]);
    setShowRecoveryDialog(false);
    setContinueRecordingData(null);
    setRecoveryUploadMethod(null);
    setPendingRecoveryDeletionId(null);
    onClose();

    // Navigate to conversation detail with real transcription ID
    onComplete(transcriptionId);
  };

  // Processing error handler
  const handleProcessingError = (error: string) => {
    setProcessingError(error);
    // Don't auto-close - let user see the error and retry or cancel
  };

  // Recovery handlers
  const handleProcessImmediately = async (recording: RecoverableRecording, blob: Blob) => {
    // Store the recording ID for deletion after successful processing
    // Don't delete now - only delete after processing completes successfully
    setPendingRecoveryDeletionId(recording.id);

    // Convert blob to file
    const file = new File([blob], 'recovered-recording.webm', {
      type: recording.mimeType,
    });

    // Set up for processing
    setUploadedFiles([file]);
    setProcessingMode('individual');
    setRecoverableRecordings([]);
    setShowRecoveryDialog(false);
    setCurrentStep('context'); // Go to context step
  };

  const handleContinueRecording = (recording: RecoverableRecording, chunks: Blob[]) => {
    // Store the recovery info for SimpleAudioRecorder
    setContinueRecordingData({
      chunks,
      duration: recording.duration,
      source: recording.source,
      recordingId: recording.id,
    });

    // Set upload method based on original source
    const method = recording.source === 'tab-audio'
      ? 'record-tab-audio'
      : 'record-microphone';
    setRecoveryUploadMethod(method);

    setShowRecoveryDialog(false);
    setRecoverableRecordings([]);
  };

  const handleDiscardRecording = async (id: string) => {
    try {
      const storage = await getRecordingStorage();
      await storage.deleteRecording(id);
    } catch (err) {
      console.error('[ConversationCreateModal] Failed to discard recording:', err);
    }

    // Update the list
    setRecoverableRecordings((prev) => prev.filter((r) => r.id !== id));

    // Close dialog if no more recordings
    if (recoverableRecordings.length <= 1) {
      setShowRecoveryDialog(false);
    }
  };

  const handleCloseRecoveryDialog = () => {
    setShowRecoveryDialog(false);
    // Keep recordings in state - user can still see them if they open modal again
    // But we won't show the dialog again in this session
  };

  if (!isOpen) return null;

  // Determine the effective upload method
  // Priority: recoveryUploadMethod (from continue recording) > uploadMethod (from props)
  const effectiveUploadMethod = recoveryUploadMethod || uploadMethod;

  return (
    <>
      {/* Recovery Dialog - shown before main content when recordings found */}
      {showRecoveryDialog && recoverableRecordings.length > 0 && (
        <RecordingRecoveryDialog
          recordings={recoverableRecordings}
          onProcessImmediately={handleProcessImmediately}
          onContinueRecording={handleContinueRecording}
          onDiscard={handleDiscardRecording}
          onClose={handleCloseRecoveryDialog}
        />
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide truncate">
                {currentStep === 'capture' && t('steps.capture.title')}
                {currentStep === 'context' && t('steps.context.title')}
                {currentStep === 'processing' && t('steps.processing.title')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentStep === 'capture' && t('steps.capture.description')}
                {currentStep === 'context' && t('steps.context.description')}
                {currentStep === 'processing' && t('steps.processing.description')}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={t('closeModal')}
            >
              <X className="w-5 h-5 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Step 1: Capture Audio */}
            {currentStep === 'capture' && (
              <div className="flex-1 overflow-y-auto p-8">
                <UploadInterface
                  onFileUpload={handleFileUpload}
                  onRecordingComplete={handleRecordingComplete}
                  onBack={() => {
                    // Close modal when back is clicked from method selection
                    handleClose();
                  }}
                  initialMethod={effectiveUploadMethod}
                  onRecordingStateChange={setIsRecording}
                  continueRecordingData={continueRecordingData}
                />
              </div>
            )}

            {/* Step 2: Context Input */}
            {currentStep === 'context' && (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('contextLabel')}
                    </label>
                    <textarea
                      value={overallContext}
                      onChange={(e) => setOverallContext(e.target.value)}
                      placeholder={t('contextPlaceholder')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 resize-none transition-colors"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-between gap-4 pt-6">
                    <Button variant="ghost" onClick={() => setCurrentStep('capture')}>
                      {t('back')}
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="brand-outline" onClick={() => setCurrentStep('processing')}>
                        {t('skip')}
                      </Button>
                      <Button variant="brand" onClick={handleContextSubmit}>
                        {t('continue')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {currentStep === 'processing' && uploadedFiles.length > 0 && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <RealProcessingView
                  file={uploadedFiles[0]}
                  context={overallContext || undefined}
                  folderId={folderId || undefined}
                  onComplete={handleProcessingComplete}
                  onError={handleProcessingError}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
