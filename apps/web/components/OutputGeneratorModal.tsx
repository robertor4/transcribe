'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { allTemplates, TemplateId } from '@/lib/outputTemplates';
import { transcriptionApi } from '@/lib/api';
import { useTranslations } from 'next-intl';

// Filter out transcribe-only since we're already in a conversation with transcription
const outputTemplates = allTemplates.filter(t => t.id !== 'transcribe-only');

interface OutputGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationTitle: string;
  conversationId: string;
  onOutputGenerated?: () => void;
}

export function OutputGeneratorModal({ isOpen, onClose, conversationTitle, conversationId, onOutputGenerated }: OutputGeneratorModalProps) {
  const t = useTranslations('aiAssets.modal');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<TemplateId | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setStep(1);
      setSelectedType(null);
      setCustomInstructions('');
      setIsGenerating(false);
      setError(null);
    }, 300);
  }, [onClose]);

  // Handle Escape key to close modal (blocked during generation)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isGenerating) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isGenerating, handleClose]);

  if (!isOpen) return null;

  const selectedOption = allTemplates.find(t => t.id === selectedType);

  const handleGenerate = async () => {
    if (!selectedType) return;

    setStep(4);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await transcriptionApi.generateAnalysis(
        conversationId,
        selectedType,
        customInstructions || undefined
      );

      if (response.success) {
        setIsGenerating(false);
        // Notify parent to refresh outputs
        onOutputGenerated?.();
        // Close modal after showing success
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to generate output');
      }
    } catch (err) {
      console.error('Error generating output:', err);
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Failed to generate output. Please try again.');
    }
  };

  const canProceedFromStep1 = selectedType !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              {t('title')}
            </h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
              {conversationTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-start">
            {[
              { num: 1, label: t('steps.selectType') },
              { num: 2, label: t('steps.instructions') },
              { num: 3, label: t('steps.review') },
              { num: 4, label: t('steps.generate') }
            ].map((item, idx) => (
              <div key={item.num} className="flex flex-col items-center flex-1 relative">
                {/* Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 relative z-10 ${
                    item.num === step
                      ? 'bg-[#8D6AFA] text-white scale-110'
                      : item.num < step
                      ? 'bg-[#14D0DC] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.num < step ? '✓' : item.num}
                </div>

                {/* Connector Line */}
                {idx < 3 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-1 transition-all duration-300 ${
                      item.num < step ? 'bg-[#14D0DC]' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                  />
                )}

                {/* Label */}
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2 text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {/* Step 1: Select Output Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
                  What would you like to create?
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Choose the type of output to generate from this conversation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outputTemplates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedType === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedType(template.id)}
                      className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#8D6AFA] bg-purple-50 dark:bg-[#8D6AFA]/10 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#8D6AFA]/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#8D6AFA] text-white'
                              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {template.name}
                          </h4>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            {template.description}
                          </p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-500 italic">
                            {template.example}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#8D6AFA] flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Custom Instructions */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
                  Add custom instructions (optional)
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Provide specific guidance for the AI to tailor the output to your needs
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={`Example: Focus on the technical aspects, keep it under 500 words, and include specific metrics discussed.`}
                  className="w-full h-40 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 outline-none transition-colors resize-none text-sm font-medium"
                />
                <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Leave blank to use default settings for {selectedOption?.name}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
                  Review and confirm
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Check your selections before generating the output
                </p>
              </div>

              <div className="space-y-4">
                {/* Output Type */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    {selectedOption && (
                      <>
                        <div className="w-12 h-12 rounded-lg bg-[#8D6AFA] flex items-center justify-center">
                          <selectedOption.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Output Type
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {selectedOption.name}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedOption?.description}
                  </p>
                </div>

                {/* Custom Instructions */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Custom Instructions
                  </p>
                  {customInstructions ? (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {customInstructions}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-500 italic">
                      No custom instructions provided
                    </p>
                  )}
                </div>

                {/* Conversation */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Source Conversation
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {conversationTitle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Generating */}
          {step === 4 && (
            <div className="py-12 text-center">
              {isGenerating ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8D6AFA] to-[#7A5AE0] flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
                    Generating your {selectedOption?.name}...
                  </h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    This may take a few moments
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#8D6AFA] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 rounded-full bg-[#8D6AFA] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 rounded-full bg-[#8D6AFA] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
                    Generation failed
                  </h3>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-6">
                    {error}
                  </p>
                  <Button variant="brand" size="md" onClick={() => { setStep(3); setError(null); }}>
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-[#14D0DC] flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-white">✓</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
                    Output generated successfully!
                  </h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Your {selectedOption?.name} has been created
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button
                  variant="ghost"
                  size="md"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="md" onClick={handleClose}>
                Cancel
              </Button>
              {step < 3 && (
                <Button
                  variant="brand"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}
                  disabled={step === 1 && !canProceedFromStep1}
                >
                  Next
                </Button>
              )}
              {step === 3 && (
                <Button
                  variant="brand"
                  size="md"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={handleGenerate}
                >
                  Generate Output
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
