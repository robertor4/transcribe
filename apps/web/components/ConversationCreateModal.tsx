'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { UploadInterface } from './UploadInterface';
import { RealProcessingView } from './RealProcessingView';

interface ConversationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (conversationId: string) => void;
  folderId?: string | null; // Optional folder context

  // Context-aware entry props
  initialStep?: CreateStep;
  uploadMethod?: 'file' | 'record' | null;
}

export type CreateStep = 'capture' | 'context' | 'processing' | 'complete';

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
  initialStep: _initialStep,
  uploadMethod,
}: ConversationCreateModalProps) {
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
    }
  }, [isOpen, uploadMethod]);

  // Reset state when modal closes
  const handleClose = () => {
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
      const confirmed = window.confirm(
        'Are you sure you want to cancel? Your progress will be lost.'
      );

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
    onClose();
  };

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

    // Reset state without confirmation (successful completion, not cancellation)
    setCurrentStep('capture');
    setOverallContext('');
    setUploadedFiles([]);
    setRecordedBlob(null);
    setProcessingMode('individual');
    setIsRecording(false);
    setMarkAsUploadedCallback(null);
    setProcessingError(null);
    onClose();

    // Navigate to conversation detail with real transcription ID
    onComplete(transcriptionId);
  };

  // Processing error handler
  const handleProcessingError = (error: string) => {
    setProcessingError(error);
    // Don't auto-close - let user see the error and retry or cancel
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentStep === 'capture' && 'Create a conversation'}
              {currentStep === 'context' && 'Add context'}
              {currentStep === 'processing' && 'Processing...'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentStep === 'capture' && 'Choose how to add your audio'}
              {currentStep === 'context' && 'Provide context to improve transcription accuracy (optional)'}
              {currentStep === 'processing' && 'Transcribing and analyzing your conversation'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
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
                initialMethod={uploadMethod === 'record' ? 'record' : uploadMethod === 'file' ? 'file' : null}
                onRecordingStateChange={setIsRecording}
              />
            </div>
          )}

          {/* Step 2: Context Input */}
          {currentStep === 'context' && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Context (optional)
                  </label>
                  <textarea
                    value={overallContext}
                    onChange={(e) => setOverallContext(e.target.value)}
                    placeholder="Provide context about the conversation to help improve transcription accuracy and summary quality. For example: meeting type, participants, topics discussed, or any specialized terminology..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20 resize-none transition-colors"
                    rows={4}
                  />
                </div>

                <div className="flex justify-between gap-4 pt-6">
                  <Button variant="ghost" onClick={() => setCurrentStep('capture')}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setCurrentStep('processing')}>
                      Skip
                    </Button>
                    <Button variant="primary" onClick={handleContextSubmit}>
                      Start processing
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && uploadedFiles.length > 0 && (
            <div className="flex-1 overflow-y-auto p-8">
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
  );
}
