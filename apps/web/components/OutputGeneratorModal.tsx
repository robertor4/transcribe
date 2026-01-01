'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, Sparkles, AlertCircle, Mail, FileText, BarChart3 } from 'lucide-react';
import { Button } from './Button';
import { GeneratingLoader } from './GeneratingLoader';
import { allTemplates, TemplateId, OutputTemplate } from '@/lib/outputTemplates';
import { transcriptionApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import type { GeneratedAnalysis } from '@transcribe/shared';

// Filter out transcribe-only since we're already in a conversation with transcription
const outputTemplates = allTemplates.filter(t => t.id !== 'transcribe-only');

// Categorize templates
const EMAIL_IDS = ['followUpEmail', 'salesEmail', 'internalUpdate', 'clientProposal'];
const CONTENT_IDS = ['blogPost', 'linkedin'];
const ANALYSIS_IDS = ['actionItems', 'communicationAnalysis', 'agileBacklog'];

const emailTemplates = outputTemplates.filter(t => EMAIL_IDS.includes(t.id));
const contentTemplates = outputTemplates.filter(t => CONTENT_IDS.includes(t.id));
const analysisTemplates = outputTemplates.filter(t => ANALYSIS_IDS.includes(t.id));

// Template list item component - compact row-based layout
function TemplateListItem({
  template,
  isSelected,
  onSelect,
  name,
  description,
}: {
  template: OutputTemplate;
  isSelected: boolean;
  onSelect: () => void;
  name: string;
  description: string;
}) {
  const Icon = template.icon;
  return (
    <button
      onClick={onSelect}
      className={`group w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-150 ${
        isSelected
          ? 'bg-purple-50 dark:bg-[#8D6AFA]/10'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      {/* Radio indicator */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isSelected
            ? 'border-[#8D6AFA] bg-[#8D6AFA]'
            : 'border-gray-300 dark:border-gray-600 group-hover:border-[#8D6AFA]/50'
        }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          isSelected
            ? 'bg-[#8D6AFA] text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-base font-semibold truncate ${
          isSelected ? 'text-[#8D6AFA]' : 'text-gray-900 dark:text-gray-100'
        }`}>
          {name}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {description}
        </p>
      </div>
    </button>
  );
}

interface OutputGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationTitle: string;
  conversationId: string;
  onOutputGenerated?: (asset: GeneratedAnalysis) => void;
}

export function OutputGeneratorModal({ isOpen, onClose, conversationTitle, conversationId, onOutputGenerated }: OutputGeneratorModalProps) {
  const t = useTranslations('aiAssets.modal');
  const tTemplates = useTranslations('aiAssets.templates');
  const tCommon = useTranslations('common');

  // Helper to get translated template name and description
  const getTemplateName = (templateId: string) => tTemplates(`${templateId}.name` as Parameters<typeof tTemplates>[0]);
  const getTemplateDescription = (templateId: string) => tTemplates(`${templateId}.description` as Parameters<typeof tTemplates>[0]);
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

      if (response.success && response.data) {
        setIsGenerating(false);
        // Notify parent with the generated asset
        onOutputGenerated?.(response.data);
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
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-700">
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
        <div className="flex-shrink-0 px-8 py-4 bg-gray-50 dark:bg-gray-800/50">
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
        <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0">
          {/* Step 1: Select Output Type */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 uppercase tracking-wide">
                  {t('whatToCreate')}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('chooseOutputType')}
                </p>
              </div>

              {/* Analysis Templates */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('categoryAnalysis')}
                  </h4>
                </div>
                <div className="space-y-1">
                  {analysisTemplates.map((template) => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      isSelected={selectedType === template.id}
                      onSelect={() => setSelectedType(template.id)}
                      name={getTemplateName(template.id)}
                      description={getTemplateDescription(template.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Content Templates */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('categoryContent')}
                  </h4>
                </div>
                <div className="space-y-1">
                  {contentTemplates.map((template) => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      isSelected={selectedType === template.id}
                      onSelect={() => setSelectedType(template.id)}
                      name={getTemplateName(template.id)}
                      description={getTemplateDescription(template.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Email Templates */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('categoryEmails')}
                  </h4>
                </div>
                <div className="space-y-1">
                  {emailTemplates.map((template) => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      isSelected={selectedType === template.id}
                      onSelect={() => setSelectedType(template.id)}
                      name={getTemplateName(template.id)}
                      description={getTemplateDescription(template.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Custom Instructions */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
                  {t('customInstructionsTitle')}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('customInstructionsDescription')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('customInstructionsLabel')}
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={t('customInstructionsPlaceholder')}
                  className="w-full h-40 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 outline-none transition-colors resize-none text-sm font-medium"
                />
                <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t('leaveBlankDefault', { name: selectedType ? getTemplateName(selectedType) : '' })}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wide">
                  {t('reviewTitle')}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('reviewDescription')}
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
                            {t('outputType')}
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {getTemplateName(selectedOption.id)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedOption ? getTemplateDescription(selectedOption.id) : ''}
                  </p>
                </div>

                {/* Custom Instructions */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {t('customInstructionsLabel')}
                  </p>
                  {customInstructions ? (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {customInstructions}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-500 italic">
                      {t('noCustomInstructions')}
                    </p>
                  )}
                </div>

                {/* Conversation */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {t('sourceConversation')}
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
                  <GeneratingLoader className="mb-8" size="lg" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {t('generatingOutput', { name: selectedType ? getTemplateName(selectedType) : '' })}
                  </h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('generatingWait')}
                  </p>
                </>
              ) : error ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
                    {t('generationFailed')}
                  </h3>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-6">
                    {error}
                  </p>
                  <Button variant="brand" size="md" onClick={() => { setStep(3); setError(null); }}>
                    {t('tryAgain')}
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-[#14D0DC] flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-white">✓</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {t('generationSuccess')}
                  </h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('outputCreated', { name: selectedType ? getTemplateName(selectedType) : '' })}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="flex-shrink-0 px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button
                  variant="ghost"
                  size="md"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                >
                  {tCommon('back')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="md" onClick={handleClose}>
                {tCommon('cancel')}
              </Button>
              {step < 3 && (
                <Button
                  variant="brand"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}
                  disabled={step === 1 && !canProceedFromStep1}
                >
                  {tCommon('next')}
                </Button>
              )}
              {step === 3 && (
                <Button
                  variant="brand"
                  size="md"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={handleGenerate}
                >
                  {t('generateOutput')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
