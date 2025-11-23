'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { TemplateSelector } from './TemplateSelector';
import { UploadInterface } from './UploadInterface';
import { ProcessingSimulator } from './ProcessingSimulator';
import { allTemplates } from '@/lib/outputTemplates';

interface ConversationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (conversationId: string) => void;
  folderId?: string | null; // Optional folder context

  // Context-aware entry props
  initialStep?: CreateStep;
  preselectedTemplateId?: string | null;
  uploadMethod?: 'file' | 'record' | null;
  skipTemplate?: boolean;
}

type CreateStep = 'template' | 'upload' | 'processing' | 'complete';

/**
 * Multi-step conversation creation modal
 * Step 1: Template selection (optional - can skip)
 * Step 2: Upload/record audio
 * Step 3: Processing simulation
 * Step 4: Navigate to conversation detail
 */
export function ConversationCreateModal({
  isOpen,
  onClose,
  onComplete,
  folderId,
  initialStep,
  preselectedTemplateId,
  uploadMethod,
  skipTemplate,
}: ConversationCreateModalProps) {
  // Initialize state based on context props
  const [currentStep, setCurrentStep] = useState<CreateStep>(
    skipTemplate ? 'upload' : (initialStep || 'template')
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    preselectedTemplateId || null
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingMode, setProcessingMode] = useState<'individual' | 'merged'>('individual');

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentStep(skipTemplate ? 'upload' : (initialStep || 'template'));
    setSelectedTemplateId(preselectedTemplateId || null);
    setUploadedFiles([]);
    setProcessingMode('individual');
    onClose();
  };

  // Template selection handlers
  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
  };

  const handleTemplateNext = () => {
    setCurrentStep('upload');
  };

  // Upload handlers
  const handleFileUpload = (files: File[], mode: 'individual' | 'merged') => {
    setUploadedFiles(files);
    setProcessingMode(mode);
    setCurrentStep('processing');
  };

  const handleRecordingComplete = (blob: Blob) => {
    // Convert blob to file
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
    setUploadedFiles([file]);
    setProcessingMode('individual'); // Single recording always individual
    setCurrentStep('processing');
  };

  // Processing complete handler
  const handleProcessingComplete = () => {
    // Generate mock conversation ID
    const mockConversationId = `conv-${Date.now()}`;

    // Close modal and navigate
    handleClose();
    onComplete(mockConversationId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentStep === 'template' && 'Choose a template'}
              {currentStep === 'upload' && 'Add your conversation'}
              {currentStep === 'processing' && 'Processing...'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentStep === 'template' && 'Select an output type or skip to upload directly'}
              {currentStep === 'upload' && 'Upload a file or record audio'}
              {currentStep === 'processing' && 'Transcribing and analyzing your conversation'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStep === 'template' && (
            <TemplateSelector
              templates={allTemplates}
              selectedTemplateId={selectedTemplateId}
              onSelect={handleTemplateSelect}
              onNext={handleTemplateNext}
            />
          )}

          {currentStep === 'upload' && (
            <UploadInterface
              onFileUpload={handleFileUpload}
              onRecordingComplete={handleRecordingComplete}
              onBack={() => setCurrentStep('template')}
              initialMethod={uploadMethod}
            />
          )}

          {currentStep === 'processing' && (
            <ProcessingSimulator
              files={uploadedFiles}
              processingMode={processingMode}
              templateName={
                selectedTemplateId
                  ? allTemplates.find((t) => t.id === selectedTemplateId)?.name
                  : undefined
              }
              onComplete={handleProcessingComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
