'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  X,
  Mail,
  CheckSquare,
  Edit3,
  Share2,
  MessageSquareQuote,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { GeneratedAnalysis, StructuredOutput, Translation } from '@transcribe/shared';
import { OutputRenderer } from '@/components/outputTemplates';
import { Button } from '@/components/Button';
import { formatRelativeTime } from '@/lib/formatters';
import { structuredOutputToMarkdown, structuredOutputToHtml } from '@/lib/outputToMarkdown';
import { useTranslations } from 'next-intl';

interface AIAssetSlidePanelProps {
  asset: GeneratedAnalysis | null;
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  onDelete: (assetId: string) => Promise<void>;
  conversationId: string;
  locale: string;
  /** Current translation locale ('original' or locale code like 'nl-NL') */
  currentTranslationLocale?: string;
  /** Function to get translated content for an asset */
  getTranslatedContent?: (sourceType: 'summary' | 'analysis', sourceId: string) => Translation | undefined;
}

// Icon mapping for output types
function getOutputIcon(type: string) {
  switch (type) {
    case 'email':
    case 'followUpEmail':
    case 'salesEmail':
    case 'internalUpdate':
    case 'clientProposal':
      return Mail;
    case 'actionItems':
      return CheckSquare;
    case 'blogPost':
      return Edit3;
    case 'linkedin':
      return Share2;
    case 'communicationAnalysis':
      return MessageSquareQuote;
    default:
      return Sparkles;
  }
}

export function AIAssetSlidePanel({
  asset,
  isOpen,
  isClosing,
  onClose,
  onDelete,
  conversationId,
  locale,
  currentTranslationLocale = 'original',
  getTranslatedContent,
}: AIAssetSlidePanelProps) {
  const t = useTranslations('aiAssets');
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get translated content if viewing a translation
  const assetTranslation = asset && currentTranslationLocale !== 'original' && getTranslatedContent
    ? getTranslatedContent('analysis', asset.id)
    : null;

  // Determine content to display (translated or original)
  const displayContent = assetTranslation?.content.type === 'analysis'
    ? assetTranslation.content.content
    : asset?.content;

  const displayContentType = assetTranslation?.content.type === 'analysis'
    ? assetTranslation.content.contentType
    : asset?.contentType;

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when panel opens with new asset
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, asset?.id]);

  // Focus trap - focus panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  // Copy content to clipboard as rich text (HTML) with plain text fallback
  const handleCopy = async () => {
    if (!asset || !displayContent) return;

    try {
      if (typeof displayContent === 'string') {
        await navigator.clipboard.writeText(displayContent);
      } else {
        const html = structuredOutputToHtml(displayContent as StructuredOutput);
        const plainText = structuredOutputToMarkdown(displayContent as StructuredOutput);

        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          }),
        ]);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Delete asset
  const handleDelete = async () => {
    if (!asset) return;
    setIsDeleting(true);
    try {
      await onDelete(asset.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Don't render on server or when no asset
  if (!mounted || !asset) return null;

  const OutputIcon = getOutputIcon(asset.templateId);
  const shouldShow = isOpen || isClosing;

  if (!shouldShow) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 ${isClosing ? 'animate-backdropFadeOut' : 'animate-backdropFadeIn'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="slide-panel-title"
    >
      {/* Backdrop - clickable to close */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`
          absolute top-0 right-0 h-full w-full sm:w-[560px] lg:w-[640px] bg-white dark:bg-gray-900
          shadow-2xl flex flex-col outline-none
          ${isClosing ? 'animate-slideOutToRight' : 'animate-slideInFromRight'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#8D6AFA] flex items-center justify-center flex-shrink-0">
              <OutputIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                id="slide-panel-title"
                className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate"
              >
                {asset.templateName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatRelativeTime(new Date(asset.generatedAt))}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('panel.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-subtle">
          <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5">
            {displayContent && (
              <OutputRenderer
                content={displayContent}
                contentType={displayContentType || 'markdown'}
                templateId={asset.templateId}
                analysisId={asset.id}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between gap-3">
            {/* Left actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy className="w-4 h-4" />}
                onClick={handleCopy}
              >
                {copied ? t('panel.copied') : t('panel.copy')}
              </Button>

              {!showDeleteConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t('panel.delete')}
                </Button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="text-xs text-red-700 dark:text-red-300">
                    {t('panel.confirmDelete')}
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '...' : 'Yes'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    No
                  </Button>
                </div>
              )}
            </div>

            {/* Right action - View Full */}
            <Link
              href={`/${locale}/conversation/${conversationId}/outputs/${asset.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#8D6AFA] hover:text-[#7A5AE0] transition-colors"
            >
              {t('panel.viewFull')}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
