'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Sparkles, Copy, Check, Clock, Cpu, Zap } from 'lucide-react';
import { AnalysisTemplate, GeneratedAnalysis, Transcription } from '@transcribe/shared';
import { transcriptionApi } from '@/lib/api';
import { AnalysisContentRenderer } from './AnalysisContentRenderer';
import { useUsage } from '@/contexts/UsageContext';
import { QuotaExceededModal } from '@/components/paywall/QuotaExceededModal';
import axios from 'axios';

interface MoreAnalysesTabProps {
  transcriptionId: string;
  transcription: Partial<Transcription> & { id: string };
  selectedLanguage?: string; // Language code (e.g., 'en', 'es', 'original')
}

export const MoreAnalysesTab: React.FC<MoreAnalysesTabProps> = ({
  transcriptionId,
  // transcription prop is available for future use (e.g., showing original transcript info)
  selectedLanguage = 'original',
}) => {
  const { refreshUsage, usageStats } = useUsage();
  const [templates, setTemplates] = useState<AnalysisTemplate[]>([]);
  const [generatedAnalyses, setGeneratedAnalyses] = useState<GeneratedAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'templates' | 'analyses'>('templates');
  const [quotaModal, setQuotaModal] = useState<{
    isOpen: boolean;
    quotaType: 'on_demand_analyses' | 'transcriptions' | 'duration' | 'filesize' | 'payg_credits';
    details?: { current?: number; limit?: number; required?: number };
  }>({ isOpen: false, quotaType: 'on_demand_analyses' });

  // Load templates and user's generated analyses
  useEffect(() => {
    loadTemplates();
    loadGeneratedAnalyses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptionId]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const response = await transcriptionApi.getAnalysisTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load analysis templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadGeneratedAnalyses = async () => {
    try {
      setIsLoadingAnalyses(true);
      const response = await transcriptionApi.getUserAnalyses(transcriptionId);
      if (response.success && response.data) {
        setGeneratedAnalyses(response.data);
        // Auto-select first analysis if available
        if (response.data.length > 0 && !selectedAnalysisId) {
          setSelectedAnalysisId(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  const handleGenerate = async (templateId: string) => {
    try {
      setIsGenerating(templateId);
      setError(null);
      const response = await transcriptionApi.generateAnalysis(transcriptionId, templateId);
      if (response.success && response.data) {
        setGeneratedAnalyses([response.data, ...generatedAnalyses]);
        setSelectedAnalysisId(response.data.id);

        // Refresh usage stats to update the UI
        await refreshUsage();
      }
    } catch (err) {
      console.error('Failed to generate analysis:', err);

      // Check if this is a quota exceeded error (HTTP 402)
      if (axios.isAxiosError(err) && err.response?.status === 402) {
        const errorCode = err.response?.data?.errorCode;
        const errorDetails = err.response?.data?.details;

        // Map error code to quota type
        let quotaType: 'on_demand_analyses' | 'transcriptions' | 'duration' | 'filesize' | 'payg_credits' = 'on_demand_analyses';

        if (errorCode === 'QUOTA_EXCEEDED_ON_DEMAND_ANALYSES') {
          quotaType = 'on_demand_analyses';
        } else if (errorCode === 'QUOTA_EXCEEDED_TRANSCRIPTIONS') {
          quotaType = 'transcriptions';
        } else if (errorCode === 'QUOTA_EXCEEDED_DURATION') {
          quotaType = 'duration';
        } else if (errorCode === 'QUOTA_EXCEEDED_FILESIZE') {
          quotaType = 'filesize';
        } else if (errorCode === 'QUOTA_EXCEEDED_PAYG_CREDITS') {
          quotaType = 'payg_credits';
        }

        // Show quota exceeded modal
        setQuotaModal({
          isOpen: true,
          quotaType,
          details: errorDetails,
        });
      } else {
        // Show generic error for other errors
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate analysis. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDelete = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await transcriptionApi.deleteAnalysis(transcriptionId, analysisId);
      setGeneratedAnalyses(generatedAnalyses.filter((a) => a.id !== analysisId));
      if (selectedAnalysisId === analysisId) {
        setSelectedAnalysisId(generatedAnalyses[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      setError('Failed to delete analysis');
    }
  };

  const handleCopy = async (content: string | object, analysisId: string) => {
    try {
      const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(textContent);
      setCopiedId(analysisId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Format timestamp to compact format
  const formatTimestamp = (date: Date): string => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${month} ${day} at ${hour12}:${minutes} ${ampm}`;
  };

  // Get already generated template IDs
  const generatedTemplateIds = new Set(generatedAnalyses.map((a) => a.templateId));

  // Categorize templates
  const categorizedTemplates = {
    featured: templates.filter((t) => t.featured && !generatedTemplateIds.has(t.id)),
    professional: templates.filter(
      (t) => t.category === 'professional' && !t.featured && !generatedTemplateIds.has(t.id)
    ),
    content: templates.filter(
      (t) => t.category === 'content' && !generatedTemplateIds.has(t.id)
    ),
    specialized: templates.filter(
      (t) => t.category === 'specialized' && !generatedTemplateIds.has(t.id)
    ),
  };

  const selectedAnalysis = generatedAnalyses.find((a) => a.id === selectedAnalysisId);

  if (isLoadingTemplates || isLoadingAnalyses) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-700 dark:text-gray-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading analysis options...
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Tab Switcher - visible only on mobile */}
      {generatedAnalyses.length > 0 && (
        <div className="lg:hidden mb-4 flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setMobileView('templates')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mobileView === 'templates'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1.5" />
            Templates
          </button>
          <button
            onClick={() => setMobileView('analyses')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mobileView === 'analyses'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Your Analyses ({generatedAnalyses.length})
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Template Catalog + Generated List */}
        <div className={`lg:col-span-1 space-y-6 ${generatedAnalyses.length > 0 && mobileView === 'analyses' ? 'hidden lg:block' : ''}`}>
        {/* Generated Analyses List */}
        {generatedAnalyses.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">Your Analyses</h3>
            <div className="space-y-2">
              {generatedAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAnalysisId === analysis.id
                      ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/40 shadow-sm dark:shadow-pink-500/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedAnalysisId(analysis.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{analysis.templateName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(analysis.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(analysis.id);
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete analysis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Catalog */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 inline mr-1 text-[#8D6AFA]" />
            Generate More Analyses
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Featured Templates */}
            {categorizedTemplates.featured.length > 0 && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">Featured</h4>
                <div className="space-y-2">
                  {categorizedTemplates.featured.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isGenerating={isGenerating === template.id}
                      isAnyGenerating={isGenerating !== null}
                      onGenerate={handleGenerate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Professional Templates */}
            {categorizedTemplates.professional.length > 0 && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">Professional</h4>
                <div className="space-y-2">
                  {categorizedTemplates.professional.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isGenerating={isGenerating === template.id}
                      isAnyGenerating={isGenerating !== null}
                      onGenerate={handleGenerate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Content Creation Templates */}
            {categorizedTemplates.content.length > 0 && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  Content Creation
                </h4>
                <div className="space-y-2">
                  {categorizedTemplates.content.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isGenerating={isGenerating === template.id}
                      isAnyGenerating={isGenerating !== null}
                      onGenerate={handleGenerate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Specialized Templates */}
            {categorizedTemplates.specialized.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">Specialized</h4>
                <div className="space-y-2">
                  {categorizedTemplates.specialized.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isGenerating={isGenerating === template.id}
                      isAnyGenerating={isGenerating !== null}
                      onGenerate={handleGenerate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Content: Selected Analysis */}
      <div className={`lg:col-span-2 ${generatedAnalyses.length > 0 && mobileView === 'templates' ? 'hidden lg:block' : ''}`}>
        {selectedAnalysis ? (
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{selectedAnalysis.templateName}</h2>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1" title={new Date(selectedAnalysis.generatedAt).toLocaleString()}>
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimestamp(selectedAnalysis.generatedAt)}
                    </span>
                    <span className="flex items-center gap-1" title={`Model: ${selectedAnalysis.model}`}>
                      <Cpu className="w-3.5 h-3.5" />
                      {selectedAnalysis.model}
                    </span>
                    {selectedAnalysis.generationTimeMs && (
                      <span className="flex items-center gap-1" title={`Generation time: ${selectedAnalysis.generationTimeMs}ms`}>
                        <Zap className="w-3.5 h-3.5" />
                        {(selectedAnalysis.generationTimeMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(selectedAnalysis.content, selectedAnalysis.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedId === selectedAnalysis.id ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <AnalysisContentRenderer
                content={
                  // Use translated content if available and not in original language
                  selectedLanguage !== 'original' &&
                  selectedAnalysis.translations?.[selectedLanguage]
                    ? selectedAnalysis.translations[selectedLanguage]
                    : selectedAnalysis.content
                }
                contentType={
                  // Translations are always markdown strings; only original can be structured
                  selectedLanguage !== 'original' &&
                  selectedAnalysis.translations?.[selectedLanguage]
                    ? 'markdown'
                    : selectedAnalysis.contentType
                }
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-gradient-to-br from-gray-50 to-purple-50/20 dark:from-gray-900/50 dark:to-purple-900/5 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#8D6AFA] animate-pulse" />
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No analyses generated yet
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Transform this conversation into professional insights using our AI-powered templates
            </p>
            {categorizedTemplates.featured.length > 0 && (
              <div className="inline-flex flex-col items-center gap-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Get started with
                </p>
                <button
                  onClick={() => handleGenerate(categorizedTemplates.featured[0].id)}
                  disabled={isGenerating !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#8D6AFA] text-white rounded-lg hover:bg-[#7A5AE0] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{categorizedTemplates.featured[0]?.name || 'Featured Template'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Quota Exceeded Modal */}
      <QuotaExceededModal
        isOpen={quotaModal.isOpen}
        onClose={() => setQuotaModal({ ...quotaModal, isOpen: false })}
        quotaType={quotaModal.quotaType}
        currentTier={(usageStats?.tier as 'free' | 'professional' | 'payg') || 'free'}
        details={quotaModal.details}
      />
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: AnalysisTemplate;
  isGenerating: boolean;
  isAnyGenerating: boolean;
  onGenerate: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isGenerating, isAnyGenerating, onGenerate }) => {
  const colorClasses: Record<string, string> = {
    pink: 'bg-purple-100 text-purple-800 border-pink-300 dark:bg-purple-900/30 dark:text-pink-300 dark:border-pink-700',
    orange: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    teal: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
    purple: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    green: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
    red: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    gray: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700',
    slate: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div className={`p-3 border rounded-lg transition-all duration-200 bg-white dark:bg-gray-800 ${
      isGenerating
        ? 'border-[#8D6AFA] shadow-md animate-pulse'
        : 'border-gray-300 dark:border-gray-600 hover:border-[#8D6AFA] hover:shadow-lg dark:hover:shadow-pink-500/10 hover:-translate-y-0.5'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{template.name}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{template.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded border ${
                colorClasses[template.color] || colorClasses.gray
              }`}
            >
              {template.category}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">~{template.estimatedSeconds}s</span>
          </div>
        </div>
        <button
          onClick={() => onGenerate(template.id)}
          disabled={isAnyGenerating}
          className="flex-shrink-0 px-3 py-1.5 bg-[#8D6AFA] text-white rounded-lg hover:bg-[#7A5AE0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Generate</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
