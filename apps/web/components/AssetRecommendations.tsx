'use client';

import { Zap } from 'lucide-react';
import { getTemplateById } from '@/lib/outputTemplates';
import { useTranslations } from 'next-intl';
import type { AssetRecommendation } from '@/lib/assetRecommendations';

interface AssetRecommendationsProps {
  recommendations: AssetRecommendation[];
  onSelectTemplate: (templateId: string) => void;
  variant?: 'inline' | 'sidebar';
  className?: string;
}

/**
 * Displays recommended AI asset templates based on conversation category.
 * Supports two variants:
 * - 'inline': Gradient card shown below summary content
 * - 'sidebar': Compact list for the AssetSidebar
 */
export function AssetRecommendations({
  recommendations,
  onSelectTemplate,
  variant = 'inline',
  className = '',
}: AssetRecommendationsProps) {
  const tTemplates = useTranslations('aiAssets.templates');

  if (recommendations.length === 0) return null;

  const getTemplateName = (templateId: string) => {
    try {
      return tTemplates(`${templateId}.name` as Parameters<typeof tTemplates>[0]);
    } catch {
      const template = getTemplateById(templateId);
      return template?.name || templateId;
    }
  };

  const getTemplateDescription = (templateId: string) => {
    try {
      return tTemplates(`${templateId}.description` as Parameters<typeof tTemplates>[0]);
    } catch {
      const template = getTemplateById(templateId);
      return template?.description || '';
    }
  };

  if (variant === 'sidebar') {
    return (
      <div className={`px-4 py-3 ${className}`}>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#8D6AFA]" />
          Suggested
        </p>
        <div className="space-y-1.5">
          {recommendations.map(({ templateId }) => {
            const template = getTemplateById(templateId);
            if (!template) return null;
            const Icon = template.icon;

            return (
              <button
                key={templateId}
                onClick={() => onSelectTemplate(templateId)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-[#8D6AFA]/5 dark:hover:bg-[#8D6AFA]/10 transition-colors group"
              >
                <div className="w-7 h-7 rounded-md bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] group-hover:text-white transition-colors">
                  <Icon className="w-3.5 h-3.5 text-[#8D6AFA] group-hover:text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {getTemplateName(templateId)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Inline variant (below summary)
  return (
    <div className={`max-w-[680px] mx-auto mt-10 ${className}`}>
      <div className="rounded-xl bg-gradient-to-br from-[#8D6AFA]/5 via-white to-[#14D0DC]/5 dark:from-[#8D6AFA]/10 dark:via-gray-900 dark:to-[#14D0DC]/10 border border-[#8D6AFA]/20 dark:border-[#8D6AFA]/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#8D6AFA] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Recommended Next Steps
          </h3>
        </div>
        <div className="space-y-2">
          {recommendations.map(({ templateId }) => {
            const template = getTemplateById(templateId);
            if (!template) return null;
            const Icon = template.icon;

            return (
              <button
                key={templateId}
                onClick={() => onSelectTemplate(templateId)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8D6AFA] transition-colors">
                  <Icon className="w-4 h-4 text-[#8D6AFA] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {getTemplateName(templateId)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {getTemplateDescription(templateId)}
                  </p>
                </div>
                <Zap className="w-4 h-4 text-[#8D6AFA]/40 group-hover:text-[#8D6AFA] transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
