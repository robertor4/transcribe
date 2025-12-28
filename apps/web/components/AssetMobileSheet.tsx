'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Plus, Loader2 } from 'lucide-react';
import type { GeneratedAnalysis } from '@transcribe/shared';
import { Button } from '@/components/Button';
import { AssetSidebarCard } from '@/components/AssetSidebarCard';
import { QASidebarEntry } from '@/components/QASidebarEntry';
import { QASlidePanel } from '@/components/QASlidePanel';
import { useTranslations } from 'next-intl';

interface AssetMobileSheetProps {
  assets: GeneratedAnalysis[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onGenerateNew: () => void;
  onAssetClick: (asset: GeneratedAnalysis) => void;
  selectedAssetId?: string | null;
  conversationId: string;
  conversationTitle?: string;
}

export function AssetMobileSheet({
  assets,
  isLoading,
  isOpen,
  onClose,
  onGenerateNew,
  onAssetClick,
  conversationId,
  conversationTitle,
}: AssetMobileSheetProps) {
  const t = useTranslations('aiAssets');
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isQAPanelOpen, setIsQAPanelOpen] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Handle asset click - close sheet and trigger callback
  const handleAssetClick = (asset: GeneratedAnalysis) => {
    handleClose();
    // Small delay to let sheet close animation start
    setTimeout(() => {
      onAssetClick(asset);
    }, 100);
  };

  // Handle generate new
  const handleGenerateNew = () => {
    handleClose();
    setTimeout(() => {
      onGenerateNew();
    }, 100);
  };

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Don't render on server
  if (!mounted) return null;

  const shouldShow = isOpen || isClosing;
  if (!shouldShow) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 lg:hidden ${isClosing ? 'animate-backdropFadeOut' : 'animate-backdropFadeIn'}`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="mobile-sheet-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900
          rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col
          ${isClosing ? 'animate-slideOutToBottom' : 'animate-slideInFromBottom'}
        `}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8D6AFA] to-[#7A5AE0] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2
                  id="mobile-sheet-title"
                  className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide"
                >
                  {t('sidebar.title')}
                </h2>
                {assets.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {assets.length} asset{assets.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="brand"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleGenerateNew}
            fullWidth
          >
            {t('sidebar.generateNew')}
          </Button>
        </div>

        {/* Q&A Section */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <QASidebarEntry
            onClick={() => {
              handleClose();
              setTimeout(() => setIsQAPanelOpen(true), 100);
            }}
            scope="conversation"
          />
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto p-4 safe-area-bottom space-y-2 scrollbar-subtle">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#8D6AFA]" />
            </div>
          ) : assets.length > 0 ? (
            assets.map((asset) => (
              <AssetSidebarCard
                key={asset.id}
                asset={asset}
                onClick={() => handleAssetClick(asset)}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                {t('sidebar.emptyTitle')}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('sidebar.emptyDescription')}
              </p>
            </div>
          )}
        </div>

        {/* Q&A Slide Panel */}
        <QASlidePanel
          isOpen={isQAPanelOpen}
          onClose={() => setIsQAPanelOpen(false)}
          scope="conversation"
          transcriptionId={conversationId}
          title={conversationTitle}
        />
      </div>
    </div>,
    document.body
  );
}
