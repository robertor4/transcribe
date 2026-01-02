'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Lock, User, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { ExpirationBadge } from './ExpirationBadge';
import type { ImportedConversation, ImportedConversationStatus } from '@transcribe/shared';

interface ImportedConversationCardProps {
  import_: ImportedConversation;
  status?: ImportedConversationStatus;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Card component for displaying an imported conversation in the list view.
 * Layout matches DraggableConversationCard for consistency.
 */
export function ImportedConversationCard({
  import_,
  status = 'active',
  onRemove,
}: ImportedConversationCardProps) {
  const t = useTranslations('sharedWithMe');
  const locale = useLocale();
  const router = useRouter();

  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(import_.id);
    } finally {
      setIsRemoving(false);
      setShowConfirm(false);
    }
  };

  const isUnavailable = status !== 'active';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('[data-no-navigate]')) return;
    if (isUnavailable) return;

    router.push(`/${locale}/imported/${import_.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between py-3 px-4 transition-all duration-200 ${
        isUnavailable
          ? 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
          : 'bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer'
      }`}
    >
      {/* Left content - icon, title, metadata */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <Lock
            className={`w-5 h-5 ${
              isUnavailable
                ? 'text-gray-400'
                : 'text-gray-500 group-hover:text-[#8D6AFA] group-hover:scale-110 transition-all duration-200'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`font-semibold truncate transition-colors duration-200 ${
                isUnavailable
                  ? 'text-gray-500 dark:text-gray-500'
                  : 'text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA]'
              }`}
            >
              {import_.title}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            {import_.sharedByName && (
              <>
                <User className="w-3 h-3" />
                <span>{t('sharedBy', { name: import_.sharedByName })}</span>
                <span>·</span>
              </>
            )}
            <span>
              {t('importedOn', {
                date: new Date(import_.importedAt).toLocaleDateString(),
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Status badges - before delete and arrow */}
      {isUnavailable && (
        <div className="flex-shrink-0 mr-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <AlertCircle className="w-3 h-3" />
            {status === 'expired' && t('expired')}
            {status === 'revoked' && t('unavailable')}
            {status === 'unavailable' && t('unavailable')}
          </span>
        </div>
      )}
      {!isUnavailable && import_.expiresAt && (
        <div className="flex-shrink-0 mr-2">
          <ExpirationBadge expiresAt={import_.expiresAt} />
        </div>
      )}

      {/* Delete Button - appears on hover, inline like DraggableConversationCard */}
      <div
        className="flex-shrink-0 mr-2"
        data-no-navigate
        onClick={(e) => e.stopPropagation()}
      >
        {showConfirm ? (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <span className="text-xs text-red-700 dark:text-red-300">{t('removeConfirm')}</span>
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="px-2 py-0.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
            >
              {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : t('yes')}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isRemoving}
              className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {t('no')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Arrow - at the end */}
      {!isUnavailable && (
        <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#8D6AFA] group-hover:translate-x-1 transition-all duration-200">
          →
        </div>
      )}
    </div>
  );
}
