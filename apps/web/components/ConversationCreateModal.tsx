'use client';

import { useState, useEffect } from 'react';
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

export type CreateStep = 'capture' | 'template' | 'context' | 'processing' | 'complete';

/**
 * Multi-step conversation creation modal
 * Step 1: Upload/record audio
 * Step 2: Template selection (optional - can skip)
 * Step 3: Add context
 * Step 4: Processing simulation
 * Step 5: Navigate to conversation detail
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
  // State for new flow
  const [currentStep, setCurrentStep] = useState<CreateStep>('capture');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['transcribe-only']); // Always includes base
  const [overallContext, setOverallContext] = useState<string>('');
  const [templateInstructions, setTemplateInstructions] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [processingMode, setProcessingMode] = useState<'individual' | 'merged'>('individual');
  const [isRecording, setIsRecording] = useState(false);

  // CRITICAL FIX: Reset state when modal opens with new props
  // This ensures consistent behavior across multiple clicks
  useEffect(() => {
    if (isOpen) {
      // Always start at capture step now
      setCurrentStep('capture');

      // Set selected templates based on preselectedTemplateId
      if (preselectedTemplateId) {
        // Add the preselected template to the base transcription
        setSelectedTemplates(['transcribe-only', preselectedTemplateId]);
      } else {
        setSelectedTemplates(['transcribe-only']);
      }

      setOverallContext('');
      setTemplateInstructions({});
      setUploadedFiles([]);
      setRecordedBlob(null);
      setProcessingMode('individual');
      setIsRecording(false);
    }
  }, [isOpen, uploadMethod, preselectedTemplateId]);

  // Reset state when modal closes
  const handleClose = () => {
    // If currently recording, processing, or uploading (with files selected), show confirmation dialog
    if (isRecording || currentStep === 'processing' || (currentStep === 'capture' && uploadedFiles.length > 0)) {
      const confirmed = window.confirm(
        'Are you sure you want to cancel? Your progress will be lost.'
      );

      if (!confirmed) {
        return; // User cancelled, keep modal open
      }
    }

    // Reset all state
    setCurrentStep('capture');
    setSelectedTemplates(['transcribe-only']);
    setOverallContext('');
    setTemplateInstructions({});
    setUploadedFiles([]);
    setRecordedBlob(null);
    setProcessingMode('individual');
    setIsRecording(false);
    onClose();
  };

  // Upload handlers
  const handleFileUpload = (files: File[], mode: 'individual' | 'merged') => {
    setUploadedFiles(files);
    setProcessingMode(mode);

    // Skip template selection if already preselected
    if (preselectedTemplateId) {
      // Always show context step - users can provide context even for base transcription
      setCurrentStep('context');
    } else {
      setCurrentStep('template'); // Go to template selection after upload
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob);
    // Convert blob to file for compatibility
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
    setUploadedFiles([file]);
    setProcessingMode('individual'); // Single recording always individual

    // Skip template selection if already preselected
    if (preselectedTemplateId) {
      // Always show context step - users can provide context even for base transcription
      setCurrentStep('context');
    } else {
      setCurrentStep('template'); // Go to template selection after recording
    }
  };

  // Template selection handlers
  const handleTemplateToggle = (templateId: string) => {
    // Don't allow deselecting 'transcribe-only'
    if (templateId === 'transcribe-only') return;

    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleTemplateNext = () => {
    // Always show context step - even for just transcribe-only
    // Users can provide context to improve the transcription/summary
    setCurrentStep('context');
  };

  // Context submission
  const handleContextSubmit = () => {
    setCurrentStep('processing');
  };

  // Processing complete handler
  const handleProcessingComplete = () => {
    // Generate mock conversation ID
    const mockConversationId = `conv-${Date.now()}`;

    // Reset state without confirmation (successful completion, not cancellation)
    setCurrentStep('capture');
    setSelectedTemplates(['transcribe-only']);
    setOverallContext('');
    setTemplateInstructions({});
    setUploadedFiles([]);
    setRecordedBlob(null);
    setProcessingMode('individual');
    setIsRecording(false);
    onClose();

    // Navigate to conversation detail
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
              {currentStep === 'capture' && 'Create a conversation'}
              {currentStep === 'template' && 'Choose output formats'}
              {currentStep === 'context' && 'Add context'}
              {currentStep === 'processing' && 'Processing...'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentStep === 'capture' && 'Choose how to add your audio'}
              {currentStep === 'template' && 'Select additional outputs to generate from your conversation'}
              {currentStep === 'context' && 'Provide context to improve AI-generated outputs'}
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

          {/* Step 2: Template Selection */}
          {currentStep === 'template' && (
            <TemplateSelector
              templates={allTemplates}
              selectedTemplates={selectedTemplates}
              onToggle={handleTemplateToggle}
              onNext={handleTemplateNext}
              onBack={() => setCurrentStep('capture')}
            />
          )}

          {/* Step 3: Context Input */}
          {currentStep === 'context' && (
            <div className="flex-1 overflow-y-auto p-8">
              {/* Context component will be created next */}
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall context (optional)
                  </label>
                  <textarea
                    value={overallContext}
                    onChange={(e) => setOverallContext(e.target.value)}
                    placeholder="Provide context about the conversation to help improve transcription accuracy and summary quality. For example: meeting type, participants, topics discussed, or any specialized terminology..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20 resize-none transition-colors"
                    rows={4}
                  />
                </div>

                {/* Template-specific instructions */}
                {selectedTemplates.filter(id => id !== 'transcribe-only').map(templateId => {
                  const template = allTemplates.find(t => t.id === templateId);
                  if (!template) return null;
                  const Icon = template.icon;

                  return (
                    <div key={templateId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-[#cc3399]" />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Instructions for {template.name}
                        </label>
                      </div>
                      <textarea
                        value={templateInstructions[templateId] || ''}
                        onChange={(e) => setTemplateInstructions(prev => ({ ...prev, [templateId]: e.target.value }))}
                        placeholder={`Specific instructions for generating the ${template.name.toLowerCase()}...`}
                        className="w-full px-4 py-3 rounded-lg border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20 resize-none transition-colors"
                        rows={3}
                      />
                    </div>
                  );
                })}

                <div className="flex justify-between gap-4 pt-6">
                  <Button variant="ghost" onClick={() => setCurrentStep('template')}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setCurrentStep('processing')}>
                      Skip
                    </Button>
                    <Button variant="primary" onClick={handleContextSubmit}>
                      Generate outputs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {currentStep === 'processing' && (
            <div className="flex-1 overflow-y-auto p-8">
              <ProcessingSimulator
                files={uploadedFiles}
                processingMode={processingMode}
                templateNames={selectedTemplates
                  .map(id => allTemplates.find(t => t.id === id)?.name)
                  .filter(Boolean) as string[]}
                onComplete={handleProcessingComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
