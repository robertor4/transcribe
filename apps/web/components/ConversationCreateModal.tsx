'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { UploadInterface, type InputMethod } from './UploadInterface';
import { RealProcessingView } from './RealProcessingView';
import type { PreviewActions } from './SimpleAudioRecorder';
import { RecordingRecoveryDialog } from './RecordingRecoveryDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
  folderId?: string | null;
  initialStep?: CreateStep;
  uploadMethod?: 'file' | 'record' | 'record-microphone' | 'record-tab-audio' | null;
}

export type CreateStep = 'capture' | 'context' | 'processing' | 'complete';

export interface ContinueRecordingData {
  chunks: Blob[];
  duration: number;
  source: RecordingSource;
  recordingId: string;
}

const STEPS = ['capture', 'context', 'processing'] as const;
type StepName = (typeof STEPS)[number];

// Desktop sidebar step item
function StepNavItem({
  stepNum,
  label,
  currentStep,
  isCompleted,
  onClick,
}: {
  stepNum: number;
  label: string;
  currentStep: StepName;
  isCompleted: boolean;
  onClick?: () => void;
}) {
  const stepName = STEPS[stepNum - 1];
  const isActive = stepName === currentStep;
  const isClickable = onClick && isCompleted;

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-all ${
        isActive
          ? 'bg-purple-50 dark:bg-[#8D6AFA]/10'
          : isClickable
          ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
          : 'opacity-50 cursor-default'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
          isActive
            ? 'bg-[#8D6AFA] text-white'
            : isCompleted
            ? 'bg-[#14D0DC] text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
      >
        {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive
            ? 'text-[#8D6AFA]'
            : isCompleted
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// Mobile step indicator (horizontal dots)
function MobileStepIndicator({ currentStep }: { currentStep: StepName }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 md:hidden">
      {STEPS.map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all ${
            s === currentStep
              ? 'w-6 bg-[#8D6AFA]'
              : STEPS.indexOf(s) < STEPS.indexOf(currentStep)
              ? 'w-1.5 bg-[#14D0DC]'
              : 'w-1.5 bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export function ConversationCreateModal({
  isOpen,
  onClose,
  onComplete,
  folderId,
  uploadMethod,
}: ConversationCreateModalProps) {
  const t = useTranslations('conversationCreate');
  const tCommon = useTranslations('common');
  const tRecording = useTranslations('recording');
  const { user } = useAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState<CreateStep>('capture');
  const [overallContext, setOverallContext] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  // Lifted state from UploadInterface
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<InputMethod | null>(null);
  const [processingMode, setProcessingMode] = useState<'individual' | 'merged'>('individual');

  // Preview state (when recording is stopped and user can preview)
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewActions, setPreviewActions] = useState<PreviewActions | null>(null);

  // Upload/recording state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [markAsUploadedCallback, setMarkAsUploadedCallback] = useState<(() => Promise<void>) | null>(null);
  const [, setProcessingError] = useState<string | null>(null);
  const [pendingRecoveryDeletionId, setPendingRecoveryDeletionId] = useState<string | null>(null);

  // Recovery state
  const [recoverableRecordings, setRecoverableRecordings] = useState<RecoverableRecording[]>([]);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryCheckDone, setRecoveryCheckDone] = useState(false);
  const [continueRecordingData, setContinueRecordingData] = useState<ContinueRecordingData | null>(null);
  const [recoveryUploadMethod, setRecoveryUploadMethod] = useState<'record-microphone' | 'record-tab-audio' | null>(null);

  const isInCriticalStage = currentStep === 'processing';

  const effectiveUploadMethod = recoveryUploadMethod || uploadMethod;

  // Map uploadMethod prop to InputMethod type
  const mapUploadMethodToInputMethod = useCallback((method: string | null | undefined): InputMethod | null => {
    if (!method) return null;
    if (method === 'record-microphone') return 'record-microphone';
    if (method === 'record-tab-audio') return 'record-tab-audio';
    if (method === 'record') return 'record-microphone';
    if (method === 'file') return 'upload';
    return null;
  }, []);

  // Derive sub-state for footer rendering
  const captureSubState = useMemo((): 'method-selection' | 'recording' | 'preview' | 'dropzone' | 'file-list' => {
    if (!selectedMethod) return 'method-selection';
    if (selectedMethod === 'record-microphone' || selectedMethod === 'record-tab-audio') {
      return isPreviewing ? 'preview' : 'recording';
    }
    if (selectedMethod === 'upload' && selectedFiles.length === 0) return 'dropzone';
    return 'file-list';
  }, [selectedMethod, selectedFiles.length, isPreviewing]);

  // Step labels for sidebar
  const stepLabels = [
    t('steps.capture.sidebarLabel'),
    t('steps.context.sidebarLabel'),
    t('steps.processing.sidebarLabel'),
  ];

  // Header title and description
  const stepTitle = useMemo(() => {
    if (currentStep === 'capture') return t('steps.capture.title');
    if (currentStep === 'context') return t('steps.context.title');
    return t('steps.processing.title');
  }, [currentStep, t]);

  const stepDescription = useMemo(() => {
    if (currentStep === 'capture') {
      if (selectedMethod === 'record-microphone') return t('steps.capture.descriptionMic');
      if (selectedMethod === 'record-tab-audio') return t('steps.capture.descriptionTab');
      if (selectedMethod === 'upload') return t('steps.capture.descriptionUpload');
      return t('steps.capture.description');
    }
    if (currentStep === 'context') return t('steps.context.description');
    return t('steps.processing.description');
  }, [currentStep, selectedMethod, t]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    const hasProgress =
      isRecording ||
      currentStep === 'processing' ||
      currentStep === 'context' ||
      uploadedFiles.length > 0 ||
      selectedFiles.length > 0 ||
      recordedBlob !== null;

    if (hasProgress) {
      const message = isInCriticalStage
        ? t('confirmCancelCritical', { defaultValue: t('confirmCancel') })
        : t('confirmCancel');

      if (!window.confirm(message)) return;
    }

    setCurrentStep('capture');
    setOverallContext('');
    setSelectedFiles([]);
    setSelectedMethod(null);
    setProcessingMode('individual');
    setUploadedFiles([]);
    setRecordedBlob(null);
    setIsRecording(false);
    setIsPreviewing(false);
    setPreviewActions(null);
    setMarkAsUploadedCallback(null);
    setProcessingError(null);
    setRecoverableRecordings([]);
    setShowRecoveryDialog(false);
    setRecoveryCheckDone(false);
    setContinueRecordingData(null);
    setRecoveryUploadMethod(null);
    setPendingRecoveryDeletionId(null);
    onClose();
  }, [isRecording, currentStep, uploadedFiles.length, selectedFiles.length, recordedBlob, onClose, t, isInCriticalStage]);

  // Check for recoverable recordings
  useEffect(() => {
    const checkForRecovery = async () => {
      if (!isOpen || !user?.uid) {
        setRecoveryCheckDone(false);
        return;
      }
      try {
        const storage = await getRecordingStorage();
        const userRecordings = await storage.getRecordingsByUser(user.uid);
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

  // Reset state when modal opens — set selectedMethod from uploadMethod prop
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('capture');
      setOverallContext('');
      setSelectedFiles([]);
      setSelectedMethod(mapUploadMethodToInputMethod(uploadMethod));
      setProcessingMode('individual');
      setUploadedFiles([]);
      setRecordedBlob(null);
      setIsRecording(false);
      setIsPreviewing(false);
      setPreviewActions(null);
      setMarkAsUploadedCallback(null);
      setProcessingError(null);
      setContinueRecordingData(null);
      setRecoveryUploadMethod(null);
      setPendingRecoveryDeletionId(null);
    }
  }, [isOpen, uploadMethod, mapUploadMethodToInputMethod]);

  // Prevent browser close during critical stages
  useEffect(() => {
    if (!isOpen || !isInCriticalStage) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, isInCriticalStage]);

  // --- Action handlers ---

  const handlePreviewStateChange = useCallback((previewing: boolean, actions?: PreviewActions) => {
    setIsPreviewing(previewing);
    setPreviewActions(previewing && actions ? actions : null);
  }, []);

  const handleConfirmUpload = () => {
    setUploadedFiles(selectedFiles);
    setCurrentStep('context');
  };

  const handleRecordingComplete = useCallback((blob: Blob, markAsUploaded: () => Promise<void>) => {
    setRecordedBlob(blob);
    setMarkAsUploadedCallback(() => markAsUploaded);
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
    setUploadedFiles([file]);
    setProcessingMode('individual');
    setIsPreviewing(false);
    setPreviewActions(null);
    setCurrentStep('context');
  }, []);

  const handleContextSubmit = () => {
    setCurrentStep('processing');
  };

  const handleProcessingComplete = async (transcriptionId: string) => {
    if (markAsUploadedCallback) {
      try { await markAsUploadedCallback(); } catch (err) {
        console.error('[ConversationCreateModal] Failed to clean up IndexedDB backup:', err);
      }
    }
    if (pendingRecoveryDeletionId) {
      try {
        const storage = await getRecordingStorage();
        await storage.deleteRecording(pendingRecoveryDeletionId);
      } catch (err) {
        console.error('[ConversationCreateModal] Failed to clean up recovered recording:', err);
      }
    }

    setCurrentStep('capture');
    setOverallContext('');
    setSelectedFiles([]);
    setSelectedMethod(null);
    setProcessingMode('individual');
    setUploadedFiles([]);
    setRecordedBlob(null);
    setIsRecording(false);
    setIsPreviewing(false);
    setPreviewActions(null);
    setMarkAsUploadedCallback(null);
    setProcessingError(null);
    setRecoverableRecordings([]);
    setShowRecoveryDialog(false);
    setContinueRecordingData(null);
    setRecoveryUploadMethod(null);
    setPendingRecoveryDeletionId(null);
    onClose();
    onComplete(transcriptionId);
  };

  const handleProcessingError = (error: string) => {
    setProcessingError(error);
  };

  // Recovery handlers
  const handleProcessImmediately = async (recording: RecoverableRecording, blob: Blob) => {
    setPendingRecoveryDeletionId(recording.id);
    const file = new File([blob], 'recovered-recording.webm', { type: recording.mimeType });
    setUploadedFiles([file]);
    setProcessingMode('individual');
    setRecoverableRecordings([]);
    setShowRecoveryDialog(false);
    setCurrentStep('context');
  };

  const handleContinueRecording = (recording: RecoverableRecording, chunks: Blob[]) => {
    setContinueRecordingData({ chunks, duration: recording.duration, source: recording.source, recordingId: recording.id });
    const method = recording.source === 'tab-audio' ? 'record-tab-audio' : 'record-microphone';
    setRecoveryUploadMethod(method);
    setSelectedMethod(method);
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
    setRecoverableRecordings((prev) => prev.filter((r) => r.id !== id));
    if (recoverableRecordings.length <= 1) setShowRecoveryDialog(false);
  };

  const handleCloseRecoveryDialog = () => {
    setShowRecoveryDialog(false);
  };

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) handleClose();
  }, [handleClose]);

  // Navigate to a completed step
  const navigateToStep = (stepName: StepName) => {
    const targetIndex = STEPS.indexOf(stepName);
    const currentIndex = STEPS.indexOf(currentStep as StepName);
    if (targetIndex < currentIndex) {
      setCurrentStep(stepName);
    }
  };

  // Should footer be visible?
  // Hide during processing and active recording (SimpleAudioRecorder has its own controls)
  // Show during preview (footer renders Proceed/Re-record/Cancel)
  const showFooter = currentStep !== 'processing' && !(currentStep === 'capture' && captureSubState === 'recording');

  return (
    <>
      {isOpen && showRecoveryDialog && recoverableRecordings.length > 0 && (
        <RecordingRecoveryDialog
          recordings={recoverableRecordings}
          onProcessImmediately={handleProcessImmediately}
          onContinueRecording={handleContinueRecording}
          onDiscard={handleDiscardRecording}
          onClose={handleCloseRecoveryDialog}
        />
      )}

      <Dialog open={isOpen && recoveryCheckDone && !showRecoveryDialog} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="bg-white dark:bg-gray-900 rounded-2xl sm:max-w-2xl max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col border-gray-200 dark:border-gray-700/50"
          onInteractOutside={(e) => {
            if (isRecording || isInCriticalStage || showRecoveryDialog) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (showRecoveryDialog) e.preventDefault();
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                {stepTitle}
              </DialogTitle>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                {stepDescription}
              </p>
            </div>
            {!isInCriticalStage && !isRecording && (
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors flex-shrink-0 ml-4"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Mobile step indicator */}
          <MobileStepIndicator currentStep={currentStep as StepName} />

          {/* Body: sidebar + content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden md:flex flex-col w-40 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-800/30">
              <nav className="space-y-1">
                {STEPS.map((s, idx) => (
                  <StepNavItem
                    key={s}
                    stepNum={idx + 1}
                    label={stepLabels[idx]}
                    currentStep={currentStep as StepName}
                    isCompleted={STEPS.indexOf(s) < STEPS.indexOf(currentStep as StepName)}
                    onClick={() => navigateToStep(s)}
                  />
                ))}
              </nav>
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-5 md:px-6 py-5">
                  {/* Step 1: Capture */}
                  {currentStep === 'capture' && (
                    <UploadInterface
                      selectedFiles={selectedFiles}
                      onSelectedFilesChange={setSelectedFiles}
                      processingMode={processingMode}
                      onProcessingModeChange={setProcessingMode}
                      selectedMethod={selectedMethod}
                      onMethodChange={setSelectedMethod}
                      onRecordingComplete={handleRecordingComplete}
                      onRecordingStateChange={setIsRecording}
                      onPreviewStateChange={handlePreviewStateChange}
                      continueRecordingData={continueRecordingData}
                    />
                  )}

                  {/* Step 2: Context */}
                  {currentStep === 'context' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('contextLabel')}
                      </label>
                      <textarea
                        value={overallContext}
                        onChange={(e) => setOverallContext(e.target.value)}
                        placeholder={t('contextPlaceholder')}
                        className="w-full h-28 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 outline-none transition-colors resize-none text-sm"
                      />
                    </div>
                  )}

                  {/* Step 3: Processing */}
                  {currentStep === 'processing' && uploadedFiles.length > 0 && (
                    <RealProcessingView
                      file={uploadedFiles[0]}
                      context={overallContext || undefined}
                      folderId={folderId || undefined}
                      onComplete={handleProcessingComplete}
                      onError={handleProcessingError}
                    />
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              {showFooter && (
                <div className="flex-shrink-0 px-5 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
                  {/* Left side */}
                  <div>
                    {currentStep === 'capture' && captureSubState === 'dropzone' && !effectiveUploadMethod && (
                      <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => setSelectedMethod(null)}>
                        {t('back')}
                      </Button>
                    )}
                    {currentStep === 'capture' && captureSubState === 'file-list' && (
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedFiles([]); setProcessingMode('individual'); }}>
                        {t('clearAll')}
                      </Button>
                    )}
                    {currentStep === 'capture' && captureSubState === 'preview' && previewActions && (
                      <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={previewActions.onReRecord}>
                        {tRecording('preview.reRecord')}
                      </Button>
                    )}
                    {currentStep === 'context' && (
                      <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => setCurrentStep('capture')}>
                        {t('back')}
                      </Button>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2">
                    {currentStep === 'capture' && captureSubState === 'preview' && previewActions ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={previewActions.onCancel}>
                          {tCommon('cancel')}
                        </Button>
                        <Button variant="brand" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={previewActions.onConfirm}>
                          {tRecording('preview.proceed')}
                        </Button>
                      </>
                    ) : currentStep === 'capture' ? (
                      <Button variant="ghost" size="sm" onClick={handleClose}>
                        {tCommon('cancel')}
                      </Button>
                    ) : null}

                    {currentStep === 'capture' && captureSubState === 'file-list' && (
                      <Button
                        variant="brand"
                        size="sm"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={handleConfirmUpload}
                      >
                        {t('uploadAndProcess', { count: selectedFiles.length })}
                      </Button>
                    )}

                    {currentStep === 'context' && (
                      <Button variant="brand" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={handleContextSubmit}>
                        {t('continue')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
