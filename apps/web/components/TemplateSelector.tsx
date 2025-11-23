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
  selectedTemplateId: string | null;
  onSelect: (templateId: string | null) => void;
  onNext: () => void;
}

/**
 * Template selection step
 * Displays all available output templates as cards
 * Allows user to select one or skip to upload directly
 */
export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  onNext,
}: TemplateSelectorProps) {
  const quickActions = templates.filter((t) => t.isQuickAction);
  const outputTemplates = templates.filter((t) => !t.isQuickAction);

  const renderTemplateCard = (template: Template) => {
    const Icon = template.icon;
    const isSelected = selectedTemplateId === template.id;

    return (
      <button
        key={template.id}
        onClick={() => onSelect(isSelected ? null : template.id)}
        className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
          isSelected
            ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/10 shadow-lg scale-105'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
        }`}
        aria-pressed={isSelected}
      >
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-200 ${
            isSelected
              ? 'bg-[#cc3399] text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <h3
          className={`font-semibold text-lg mb-2 ${
            isSelected
              ? 'text-[#cc3399]'
              : 'text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399]'
          }`}
        >
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {template.description}
        </p>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4">
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
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-8 pb-6">
        {/* Quick Actions Section */}
        {quickActions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map(renderTemplateCard)}
            </div>
          </div>
        )}

        {/* Output Templates Section */}
        {outputTemplates.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Output Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outputTemplates.map(renderTemplateCard)}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTemplateId
              ? 'Selected template will guide the AI output generation'
              : 'You can skip this step and generate outputs later'}
          </p>
        </div>
      </div>

      {/* Sticky Actions Footer */}
      <div className="flex-shrink-0 pt-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => onSelect(null)}>
            {selectedTemplateId ? 'Clear selection' : 'Skip this step'}
          </Button>

          <Button variant="primary" onClick={onNext} size="lg">
            {selectedTemplateId ? 'Continue with template' : 'Continue without template'}
          </Button>
        </div>
      </div>
    </div>
  );
}
