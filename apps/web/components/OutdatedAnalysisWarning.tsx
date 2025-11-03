'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { transcriptionApi } from '@/lib/api';

interface OutdatedAnalysisWarningProps {
  analysisType: 'Summary' | 'Action Items' | 'Communication Styles';
  transcriptionId: string;
  onRegenerate: () => void;
}

export default function OutdatedAnalysisWarning({
  analysisType,
  transcriptionId,
  onRegenerate,
}: OutdatedAnalysisWarningProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await transcriptionApi.regenerateCoreAnalyses(transcriptionId);

      if (response.success) {
        // Notify parent to refresh
        onRegenerate();
      } else {
        setError('Failed to regenerate analyses. Please try again.');
      }
    } catch (err) {
      console.error('Regeneration error:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        error.response?.data?.message ||
          error.message ||
          'An error occurred while regenerating analyses'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="border-l-4 border-orange-500 bg-orange-50/30 dark:bg-orange-900/10 pl-4 py-3 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Analysis Outdated
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This {analysisType} is based on the old transcript. Regenerate to see updated insights.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {error}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#cc3399] text-white text-sm font-medium rounded-lg hover:bg-[#b82d89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isRegenerating && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>
    </div>
  );
}
