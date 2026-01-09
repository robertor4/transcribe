'use client';

import { useTranslations } from 'next-intl';
import { Users, Loader2 } from 'lucide-react';
import { useImportedConversations } from '@/contexts/ImportedConversationsContext';
import { ImportedConversationCard } from '@/components/ImportedConversationCard';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { EmptyState } from '@/components/EmptyState';

/**
 * Shared With Me page - displays all imported conversations
 * This is the view for the virtual "Shared with you" system folder.
 */
export default function SharedWithMePage() {
  const t = useTranslations('sharedWithMe');
  const { imports, isLoading, error, removeImport } = useImportedConversations();

  const handleRemove = async (id: string) => {
    await removeImport(id);
  };

  return (
    <ThreePaneLayout
      leftSidebar={<LeftNavigation />}
      mainContent={
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {t('title')}
                </h1>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('empty.description')}
              </p>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{error.message}</p>
              </div>
            ) : imports.length === 0 ? (
              <EmptyState
                icon={<Users className="w-12 h-12 text-gray-400" />}
                title={t('empty.title')}
                description={t('empty.description')}
              />
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700/50 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40">
                {imports.map((imp) => (
                  <ImportedConversationCard
                    key={imp.id}
                    import_={imp}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
