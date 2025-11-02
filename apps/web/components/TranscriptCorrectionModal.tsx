'use client';

import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import { CorrectionPreview, CorrectionApplyResponse } from '@transcribe/shared';
import DiffViewer from './DiffViewer';
import { useTranslations } from 'next-intl';

interface TranscriptCorrectionModalProps {
  transcriptionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TranscriptCorrectionModal({
  transcriptionId,
  isOpen,
  onClose,
  onSuccess,
}: TranscriptCorrectionModalProps) {
  const t = useTranslations();
  const [instructions, setInstructions] = useState('');
  const [preview, setPreview] = useState<CorrectionPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [applyResult, setApplyResult] = useState<CorrectionApplyResponse | null>(null);

  // Generate preview with corrections
  const handlePreview = async () => {
    if (!instructions.trim()) {
      setError('Please enter correction instructions');
      return;
    }

    if (instructions.length > 2000) {
      setError('Instructions must be less than 2000 characters');
      return;
    }

    setError(null);
    setIsLoadingPreview(true);

    try {
      const response = await transcriptionApi.correctTranscript(
        transcriptionId,
        instructions.trim(),
        true, // preview only
      );

      if (response.success && response.data) {
        setPreview(response.data as CorrectionPreview);
      } else {
        setError('Failed to generate preview');
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'An error occurred while generating preview'
      );
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    if (!instructions.trim()) {
      setError('Please enter correction instructions');
      return;
    }

    setError(null);
    setIsApplying(true);

    try {
      const response = await transcriptionApi.correctTranscript(
        transcriptionId,
        instructions.trim(),
        false, // apply mode
      );

      if (response.success) {
        const applyResponse = response.data as CorrectionApplyResponse;

        // Hide confirmation and show success screen
        setShowConfirmation(false);
        setApplyResult(applyResponse);
        setShowSuccess(true);
        setPreview(null);
        setInstructions('');
      } else {
        setError('Failed to apply corrections');
      }
    } catch (err: any) {
      console.error('Apply error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'An error occurred while applying corrections'
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleRegenerateAnalyses = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await transcriptionApi.regenerateCoreAnalyses(transcriptionId);

      if (response.success) {
        // Notify parent to refresh
        onSuccess();

        // Close modal with success
        alert('✅ Core analyses regenerated successfully!\n\nSummary, Action Items, and Communication have been updated.');
        handleClose();
      } else {
        setError('Failed to regenerate analyses');
      }
    } catch (err: any) {
      console.error('Regenerate error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'An error occurred while regenerating analyses'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSkipRegenerate = () => {
    onSuccess(); // Refresh the parent component
    handleClose();
  };

  const handleClose = () => {
    setInstructions('');
    setPreview(null);
    setError(null);
    setShowConfirmation(false);
    setShowSuccess(false);
    setApplyResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#cc3399]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Fix Transcript Issues
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Screen */}
          {showSuccess && applyResult ? (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="text-center py-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  ✅ Transcript Corrected Successfully!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {applyResult.deletedAnalysisIds.length} custom analyses deleted •{' '}
                  {applyResult.clearedTranslations.length} translations cleared
                </p>
              </div>

              {/* Re-run Analyses Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  🔄 Next Step: Re-run Core Analyses
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Update your Summary, Action Items, and Communication analyses based on the corrected transcript.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRegenerateAnalyses}
                    disabled={isRegenerating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors disabled:opacity-50 font-medium"
                  >
                    {isRegenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isRegenerating ? 'Regenerating...' : 'Re-run Analyses Now'}
                  </button>
                  <button
                    onClick={handleSkipRegenerate}
                    disabled={isRegenerating}
                    className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Skip for Now
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                  You can manually regenerate translations and custom analyses later if needed.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="border-l-4 border-red-500 bg-red-50/30 dark:bg-red-900/10 pl-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-900 dark:text-gray-100">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Instructions Input */}
              <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              Describe what needs to be corrected:
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Example: Change all instances of 'John' to 'Jon' and fix 'Acme' to 'ACME Corporation'"
              className="w-full rounded-lg border border-gray-400 dark:border-gray-600 px-4 py-3 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              rows={4}
              disabled={isLoadingPreview || isApplying || !!preview}
            />
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {instructions.length}/2000 characters
            </p>
          </div>

          {/* Example Prompts */}
          {!preview && (
            <div className="border-l-4 border-blue-400 bg-blue-50/30 dark:bg-blue-900/10 pl-4 py-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                EXAMPLE CORRECTIONS
              </p>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• "Change all instances of 'John' to 'Jon'"</li>
                <li>• "Fix 'Acme Corp' to 'ACME Corporation'"</li>
                <li>• "Correct speaker names and company names based on context"</li>
              </ul>
            </div>
          )}

          {/* Loading State for Processing */}
          {isLoadingPreview && !preview && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#cc3399] mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Processing Corrections...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Applying your corrections to the transcript. This may take a few moments.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="border-l-4 border-red-500 bg-red-50/30 dark:bg-red-900/10 pl-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-900 dark:text-gray-100">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && !isLoadingPreview && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Preview Changes
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {preview.summary.affectedSegments} {preview.summary.affectedSegments === 1 ? 'segment' : 'segments'}
                  </span>{' '}
                  will be modified with {preview.summary.totalChanges} {preview.summary.totalChanges === 1 ? 'change' : 'changes'}
                </p>
              </div>
              <DiffViewer diff={preview.diff} summary={preview.summary} />
            </div>
          )}

            </>
          )}
        </div>

        {/* Footer */}
        {!showSuccess && (
          <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
            <button
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/20"
              disabled={isLoadingPreview || isApplying}
            >
              Cancel
            </button>

          <div className="flex items-center gap-3">
            {preview && !showConfirmation && (
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/20"
                disabled={isLoadingPreview || isApplying}
              >
                Back to Instructions
              </button>
            )}

            {!preview && (
              <button
                onClick={handlePreview}
                className="rounded-lg bg-[#cc3399] px-6 py-2 text-sm font-medium text-white hover:bg-[#b82d89] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isLoadingPreview || !instructions.trim()}
              >
                {isLoadingPreview && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoadingPreview ? 'Generating Preview...' : 'Preview Changes'}
              </button>
            )}

            {preview && !showConfirmation && (
              <button
                onClick={() => setShowConfirmation(true)}
                className="rounded-lg bg-[#cc3399] px-6 py-2 text-sm font-medium text-white hover:bg-[#b82d89] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20"
              >
                Apply Changes
              </button>
            )}
          </div>
          </div>
        )}

        {/* Confirmation Modal Overlay */}
        {showConfirmation && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-2xl">
              {/* Warning Icon */}
              <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100 mb-4">
                Confirm Transcript Correction
              </h3>

              {/* Warning Message */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  This action will permanently:
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li>• Delete all existing translations</li>
                  <li>• Delete all custom (on-demand) analyses</li>
                  <li>• Update the transcript with corrected text</li>
                </ul>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  You can manually regenerate these after applying corrections.
                </p>
              </div>

              {/* Loading State */}
              {isApplying && (
                <div className="mb-4 flex items-center justify-center gap-3 text-[#cc3399]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Applying corrections...
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isApplying}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm & Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
