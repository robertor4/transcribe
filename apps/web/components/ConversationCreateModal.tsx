'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { UploadInterface } from './UploadInterface';
import { RealProcessingView } from './RealProcessingView';
import { RecordingRecoveryDialog } from './RecordingRecoveryDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  const [recoveryCheckDone, setRecoveryCheckDone] = useState(false);
  const [continueRecordingData, setContinueRecordingData] = useState<ContinueRecordingData | null>(null);
  // Track which upload method to use after recovery
  const [recoveryUploadMethod, setRecoveryUploadMethod] = useState<'record-microphone' | 'record-tab-audio' | null>(null);

  // Check if we're in a critical stage that should be protected from accidental close
  // Preview (context) and processing stages are critical - user has recorded content at risk
  const isInCriticalStage = currentStep === 'context' || currentStep === 'processing';

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    // Only show confirmation when there's actual progress to lose:
    // - Actively recording or paused
    // - In preview stage (context) - recording completed, ready for processing
    // - Processing in progress
    // - Files selected for upload
    // - Recording completed but not yet processed
    const hasProgress =
      isRecording ||
      currentStep === 'processing' ||
      currentStep === 'context' || // Added: protect preview stage too
      uploadedFiles.length > 0 ||
      recordedBlob !== null;

    if (hasProgress) {
      // Use a more explicit confirmation message for critical stages
      const message = isInCriticalStage
        ? t('confirmCancelCritical', { defaultValue: t('confirmCancel') })
        : t('confirmCancel');

      const confirmed = window.confirm(message);

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
    setRecoveryCheckDone(false);
    setContinueRecordingData(null);
    setRecoveryUploadMethod(null);
    setPendingRecoveryDeletionId(null);
    onClose();
  }, [isRecording, currentStep, uploadedFiles.length, recordedBlob, onClose, t, isInCriticalStage]);

  // Check for recoverable recordings when modal opens
  // Only show recordings belonging to the current user (privacy/security)
  useEffect(() => {
    const checkForRecovery = async () => {
      if (!isOpen || !user?.uid) {
        setRecoveryCheckDone(false);
        return;
      }

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

      setRecoveryCheckDone(true);
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

  // Prevent browser navigation/close during critical stages (preview, processing)
  // This protects against accidental tab close, back button, or page refresh
  useEffect(() => {
    if (!isOpen || !isInCriticalStage) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show browser's native "Leave site?" confirmation
      e.preventDefault();
      // Note: returnValue is deprecated but Chrome still requires it for beforeunload to work
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, isInCriticalStage]);

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

  // Determine the effective upload method
  // Priority: recoveryUploadMethod (from continue recording) > uploadMethod (from props)
  const effectiveUploadMethod = recoveryUploadMethod || uploadMethod;

  // Handle Dialog open/close — runs our confirmation logic on any close attempt
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleClose();
    }
  }, [handleClose]);

  return (
    <>
      {/* Recovery Dialog - shown before main content when recordings found */}
      {isOpen && showRecoveryDialog && recoverableRecordings.length > 0 && (
        <RecordingRecoveryDialog
          recordings={recoverableRecordings}
          onProcessImmediately={handleProcessImmediately}
          onContinueRecording={handleContinueRecording}
          onDiscard={handleDiscardRecording}
          onClose={handleCloseRecoveryDialog}
        />
      )}

      {/* Main Modal — shadcn Dialog
          Only render after recovery check completes and recovery dialog is dismissed.
          This avoids Radix Dialog's modal behavior (pointer-events: none on body,
          focus trap) from blocking interaction with the recovery dialog. */}
      <Dialog open={isOpen && recoveryCheckDone && !showRecoveryDialog} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50"
          showCloseButton={!isInCriticalStage}
          onInteractOutside={(e) => {
            // Prevent overlay click from closing during recording, critical stages,
            // or when recovery dialog is open (its clicks are outside DialogContent)
            if (isRecording || isInCriticalStage || showRecoveryDialog) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent escape during recovery dialog (it has its own handler)
            if (showRecoveryDialog) {
              e.preventDefault();
            }
          }}
        >
          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-0 gap-0.5">
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              {currentStep === 'capture' && t('steps.capture.title')}
              {currentStep === 'context' && t('steps.context.title')}
              {currentStep === 'processing' && t('steps.processing.title')}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              {currentStep === 'capture' && t('steps.capture.description')}
              {currentStep === 'context' && t('steps.context.description')}
              {currentStep === 'processing' && t('steps.processing.description')}
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Step 1: Capture Audio */}
            {currentStep === 'capture' && (
              <div className="px-6 py-5">
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
              <div className="px-6 py-5">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('contextLabel')}
                    </label>
                    <textarea
                      value={overallContext}
                      onChange={(e) => setOverallContext(e.target.value)}
                      placeholder={t('contextPlaceholder')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 resize-none transition-colors"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between gap-4 pt-4 mt-1 -mx-6 px-6 pb-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
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
              <div className="px-6 py-5">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
