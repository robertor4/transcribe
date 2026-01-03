'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Lock, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Speaker } from '@transcribe/shared';
import { Button } from './Button';
import { Link } from '@/i18n/navigation';
import { transcriptionApi } from '@/lib/api';

interface SpeakerLabelingSectionProps {
  speakers?: Speaker[];
  transcriptionId: string;
  userTier?: string;
  isAdmin?: boolean;
  onLabelsUpdated: (speakers: Speaker[]) => void;
  onRegenerateSummary: () => void;
}

export function SpeakerLabelingSection({
  speakers,
  transcriptionId,
  userTier = 'free',
  isAdmin = false,
  onLabelsUpdated,
  onRegenerateSummary,
}: SpeakerLabelingSectionProps) {
  const t = useTranslations('conversation.speakerLabeling');

  // Speaker labeling requires Pro or higher (admins bypass tier restrictions)
  const canLabelSpeakers = isAdmin || userTier !== 'free';

  // Local state for editing
  const [editedNames, setEditedNames] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setError] = useState<string | null>(null);
  const [showRegeneratePrompt, setShowRegeneratePrompt] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Initialize edited names from speakers
  useEffect(() => {
    if (speakers) {
      const names: Record<number, string> = {};
      speakers.forEach((s) => {
        names[s.speakerId] = s.customName || '';
      });
      setEditedNames(names);
    }
  }, [speakers]);

  // Check if there are unsaved changes
  const hasChanges = useCallback(() => {
    if (!speakers) return false;
    return speakers.some((s) => {
      const currentName = s.customName || '';
      const editedName = editedNames[s.speakerId] || '';
      return currentName !== editedName;
    });
  }, [speakers, editedNames]);

  // Handle save
  const handleSave = async () => {
    if (!speakers || !hasChanges()) return;

    setIsSaving(true);
    setError(null);

    try {
      const speakerUpdates = speakers.map((s) => ({
        speakerId: s.speakerId,
        customName: editedNames[s.speakerId]?.trim() || undefined,
      }));

      const response = await transcriptionApi.updateSpeakerLabels(
        transcriptionId,
        speakerUpdates
      );

      if (response.success && response.data?.speakers) {
        onLabelsUpdated(response.data.speakers);
        // Show regenerate prompt if any names were set
        const hasCustomNames = response.data.speakers.some((s) => s.customName);
        if (hasCustomNames) {
          setShowRegeneratePrompt(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateSummary();
      setShowRegeneratePrompt(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle input change
  const handleNameChange = (speakerId: number, name: string) => {
    setEditedNames((prev) => ({
      ...prev,
      [speakerId]: name,
    }));
    // Clear regenerate prompt when making new changes
    setShowRegeneratePrompt(false);
  };

  // Don't render if no speakers
  if (!speakers || speakers.length === 0) {
    return null;
  }

  // Get speaker color based on ID
  const getSpeakerColor = (speakerId: number): string => {
    const colors = [
      'border-blue-300 dark:border-blue-600',
      'border-green-300 dark:border-green-600',
      'border-purple-300 dark:border-purple-600',
      'border-orange-300 dark:border-orange-600',
      'border-pink-300 dark:border-pink-600',
      'border-teal-300 dark:border-teal-600',
    ];
    return colors[(speakerId - 1) % colors.length];
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {t('title')}
        </span>
        {canLabelSpeakers && (
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {speakers.length} speaker{speakers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        {canLabelSpeakers ? (
          <>
            {/* Speaker list with editable names */}
            <div className="space-y-2 mb-3">
              {speakers.map((speaker) => (
                <div
                  key={speaker.speakerId}
                  className={`flex items-center gap-2 p-2 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800/50 ${getSpeakerColor(speaker.speakerId)}`}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">
                    {speaker.speakerTag}
                  </span>
                  <input
                    type="text"
                    value={editedNames[speaker.speakerId] || ''}
                    onChange={(e) => handleNameChange(speaker.speakerId, e.target.value)}
                    placeholder={t('placeholder')}
                    maxLength={50}
                    className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#8D6AFA]/50 focus:border-[#8D6AFA]"
                  />
                </div>
              ))}
            </div>

            {/* Error message */}
            {saveError && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                {saveError}
              </p>
            )}

            {/* Save button */}
            {hasChanges() && (
              <Button
                variant="brand"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                fullWidth
                icon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              >
                {isSaving ? t('saving') : t('save')}
              </Button>
            )}

            {/* Regenerate prompt banner */}
            {showRegeneratePrompt && !hasChanges() && (
              <div className="mt-3 p-3 bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  {t('regeneratePrompt')}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    icon={isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  >
                    {t('regenerate')}
                  </Button>
                  <button
                    onClick={() => setShowRegeneratePrompt(false)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Pro upgrade prompt */
          <div className="py-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {t('proFeature')}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {t('upgradePrompt')}
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white text-xs font-medium rounded-lg transition-colors"
            >
              {t('upgradeToPro')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
