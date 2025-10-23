'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Sparkles } from 'lucide-react';
import { AnalysisTemplate, GeneratedAnalysis, Transcription } from '@transcribe/shared';
import { transcriptionApi } from '@/lib/api';
import { AnalysisContentRenderer } from './AnalysisContentRenderer';

interface MoreAnalysesTabProps {
  transcriptionId: string;
  transcription: Transcription;
}

export const MoreAnalysesTab: React.FC<MoreAnalysesTabProps> = ({
  transcriptionId,
  transcription,
}) => {
  const [templates, setTemplates] = useState<AnalysisTemplate[]>([]);
  const [generatedAnalyses, setGeneratedAnalyses] = useState<GeneratedAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      }
    } catch (err) {
      console.error('Failed to generate analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate analysis. Please try again.';
      setError(errorMessage);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Sidebar: Template Catalog + Generated List */}
      <div className="lg:col-span-1 space-y-6">
        {/* Generated Analyses List */}
        {generatedAnalyses.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Analyses</h3>
            <div className="space-y-2">
              {generatedAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnalysisId === analysis.id
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-[#cc3399] hover:bg-gray-50 dark:hover:bg-gray-800'
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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            <Sparkles className="w-4 h-4 inline mr-1 text-[#cc3399]" />
            Generate More Analyses
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Featured Templates */}
            {categorizedTemplates.featured.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">Featured</h4>
                <div className="space-y-2">
                  {categorizedTemplates.featured.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isGenerating={isGenerating === template.id}
                      onGenerate={handleGenerate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Professional Templates */}
            {categorizedTemplates.professional.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">Professional</h4>
                <div className="space-y-2">
                  {categorizedTemplates.professional.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isGenerating={isGenerating === template.id}
                      onGenerate={handleGenerate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Content Creation Templates */}
            {categorizedTemplates.content.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  Content Creation
                </h4>
                <div className="space-y-2">
                  {categorizedTemplates.content.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isGenerating={isGenerating === template.id}
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
      <div className="lg:col-span-2">
        {selectedAnalysis ? (
          <div>
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedAnalysis.templateName}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Generated {new Date(selectedAnalysis.generatedAt).toLocaleString()} •{' '}
                {selectedAnalysis.model} • {selectedAnalysis.generationTimeMs}ms
              </p>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <AnalysisContentRenderer content={selectedAnalysis.content} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No analyses generated yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Select a template from the left to generate your first analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: AnalysisTemplate;
  isGenerating: boolean;
  onGenerate: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isGenerating, onGenerate }) => {
  const colorClasses: Record<string, string> = {
    pink: 'bg-pink-100 text-pink-800 border-pink-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    teal: 'bg-teal-100 text-teal-800 border-teal-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    slate: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  return (
    <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#cc3399] transition-colors bg-white dark:bg-gray-800">
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
          disabled={isGenerating}
          className="flex-shrink-0 px-3 py-1.5 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1"
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
