'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  isQuickAction?: boolean;
}

interface TemplateSelectorProps {
  templates: readonly Template[];
  selectedTemplates?: string[];  // For multi-select mode
  selectedTemplateId?: string | null;  // For single-select mode (backwards compat)
  onToggle?: (templateId: string) => void;  // For multi-select mode
  onSelect?: (templateId: string | null) => void;  // For single-select mode
  onNext: () => void;
  onBack?: () => void;
}

/**
 * Template selection step
 * Displays all available output templates as cards
 * Supports both single-select (legacy) and multi-select modes
 */
export function TemplateSelector({
  templates,
  selectedTemplates,
  selectedTemplateId,
  onToggle,
  onSelect,
  onNext,
  onBack,
}: TemplateSelectorProps) {
  // Determine mode based on provided props
  const isMultiSelect = selectedTemplates !== undefined && onToggle !== undefined;
  const baseTemplate = templates.find((t) => t.id === 'transcribe-only');
  const outputTemplates = templates.filter((t) => !t.isQuickAction);

  const renderTemplateCard = (template: Template) => {
    const Icon = template.icon;
    const isBase = template.id === 'transcribe-only';
    const isSelected = isMultiSelect
      ? selectedTemplates?.includes(template.id) || false
      : selectedTemplateId === template.id;

    return (
      <button
        key={template.id}
        onClick={() => {
          if (isMultiSelect) {
            if (!isBase) onToggle!(template.id);
          } else {
            onSelect!(isSelected ? null : template.id);
          }
        }}
        disabled={isMultiSelect && isBase}
        className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
          isBase && isMultiSelect
            ? 'border-[#cc3399] bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/10 dark:to-gray-800 shadow-lg cursor-default'
            : isSelected
            ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/10 shadow-lg scale-105'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
        }`}
        aria-pressed={isSelected}
      >
        {/* Base indicator badge */}
        {isBase && isMultiSelect && (
          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 text-xs font-semibold bg-[#cc3399] text-white rounded-full">
              BASE
            </span>
          </div>
        )}

        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-200 ${
            isSelected || (isBase && isMultiSelect)
              ? 'bg-[#cc3399] text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <h3
          className={`font-semibold text-lg mb-2 ${
            isSelected || (isBase && isMultiSelect)
              ? 'text-[#cc3399]'
              : 'text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399]'
          }`}
        >
          {template.name}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
          {template.description}
        </p>

        {/* Selected indicator or checkbox */}
        {(isSelected || (isBase && isMultiSelect)) && (
          <div className="absolute top-4 right-4">
            {isBase && isMultiSelect ? (
              // Locked checkmark for base template
              <div className="w-6 h-6 rounded-full bg-[#cc3399] flex items-center justify-center opacity-60">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            ) : (
              // Regular checkmark for selected templates
              <div className="w-6 h-6 rounded-full bg-[#cc3399] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Unselected checkbox indicator for multi-select mode */}
        {isMultiSelect && !isBase && !isSelected && (
          <div className="absolute top-4 right-4">
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-[#cc3399] transition-colors" />
          </div>
        )}
      </button>
    );
  };

  // Calculate selected count for button text
  const additionalSelectedCount = isMultiSelect
    ? selectedTemplates!.filter(id => id !== 'transcribe-only').length
    : 0;

  return (
    <>
      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-8">
          {/* Base Template Section (Multi-select mode) */}
          {isMultiSelect && baseTemplate && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                Base Output (Always Included)
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {renderTemplateCard(baseTemplate)}
              </div>
            </div>
          )}

          {/* Quick Actions Section (Single-select mode) */}
          {!isMultiSelect && templates.filter(t => t.isQuickAction).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {templates.filter(t => t.isQuickAction).map(renderTemplateCard)}
              </div>
            </div>
          )}

          {/* Output Templates Section */}
          {outputTemplates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                {isMultiSelect ? 'Additional Outputs (Optional)' : 'Output Templates'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outputTemplates.map(renderTemplateCard)}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-gray-700 dark:text-gray-400">
              {isMultiSelect
                ? additionalSelectedCount > 0
                  ? `You've selected ${additionalSelectedCount} additional output${additionalSelectedCount !== 1 ? 's' : ''} to generate`
                  : 'Select additional outputs to generate, or continue with just the transcript'
                : selectedTemplateId
                ? 'Selected template will guide the AI output generation'
                : 'You can skip this step and generate outputs later'}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between gap-4">
          {isMultiSelect ? (
            <>
              <Button variant="ghost" onClick={onBack}>
                Back
              </Button>
              <Button variant="primary" onClick={onNext}>
                {additionalSelectedCount > 0
                  ? `Continue with transcription + ${additionalSelectedCount} output${additionalSelectedCount !== 1 ? 's' : ''}`
                  : 'Continue with transcription only'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onSelect!(null)}>
                {selectedTemplateId ? 'Clear selection' : 'Skip this step'}
              </Button>
              <Button variant="primary" onClick={onNext}>
                {selectedTemplateId ? 'Continue with template' : 'Continue without template'}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
