'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { Download, Check, Loader2 } from 'lucide-react';
import { useImportedConversations } from '@/contexts/ImportedConversationsContext';
import { useAuth } from '@/contexts/AuthContext';
import type { ImportedConversation } from '@transcribe/shared';

interface ImportButtonProps {
  shareToken: string;
  alreadyImported?: boolean;
  importedAt?: Date;
  onImportSuccess?: (importedConversation: ImportedConversation) => void;
  onRequiresAuth?: () => void;
  password?: string;
  className?: string;
}

/**
 * Button for importing a shared conversation.
 * Shows different states: import, loading, already imported.
 */
export function ImportButton({
  shareToken,
  alreadyImported: initialAlreadyImported = false,
  importedAt: initialImportedAt,
  onImportSuccess,
  onRequiresAuth,
  password,
  className = '',
}: ImportButtonProps) {
  const t = useTranslations('sharedWithMe');
  const { user } = useAuth();
  const { importConversation } = useImportedConversations();

  const [isLoading, setIsLoading] = useState(false);
  const [isImported, setIsImported] = useState(initialAlreadyImported);
  const [importedAt, setImportedAt] = useState<Date | undefined>(initialImportedAt);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    // If not authenticated, trigger auth flow
    if (!user) {
      onRequiresAuth?.();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await importConversation(shareToken, password);
      setIsImported(true);
      setImportedAt(result.importedConversation.importedAt);
      onImportSuccess?.(result.importedConversation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setIsLoading(false);
    }
  };

  // Already imported state
  if (isImported) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
          <Check className="w-4 h-4" />
          {t('imported')}
        </span>
        {importedAt && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(importedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <Button
          variant="secondary"
          size="sm"
          disabled
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t('importing')}
        </Button>
      </div>
    );
  }

  // Default import button
  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <Button
        variant="primary"
        size="sm"
        onClick={handleImport}
      >
        <Download className="w-4 h-4 mr-2" />
        {t('importButton')}
      </Button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
