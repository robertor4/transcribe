'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Zap,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  Users as UsersIcon,
  Loader2,
  MessageSquareText,
} from 'lucide-react';
import type { GeneratedAnalysis } from '@transcribe/shared';
import { Button } from '@/components/Button';
import { AssetSidebarCard } from '@/components/AssetSidebarCard';
import { QASidebarEntry } from '@/components/QASidebarEntry';
import { QASlidePanel } from '@/components/QASlidePanel';
import { formatDuration } from '@/lib/formatters';
import { useTranslations } from 'next-intl';

interface ConversationMetadata {
  duration: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  speakers?: number;
  context?: string;
}

interface AssetSidebarProps {
  assets: GeneratedAnalysis[];
  isLoading: boolean;
  conversationId: string;
  locale: string;
  onGenerateNew: () => void;
  onAssetClick: (asset: GeneratedAnalysis) => void;
  selectedAssetId?: string | null;
  metadata: ConversationMetadata;
  conversationTitle?: string;
}

export function AssetSidebar({
  assets,
  isLoading,
  conversationId,
  onGenerateNew,
  onAssetClick,
  selectedAssetId,
  metadata,
  conversationTitle,
}: AssetSidebarProps) {
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [isQAPanelOpen, setIsQAPanelOpen] = useState(false);
  const t = useTranslations('aiAssets');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 ${assets.length > 0 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
        <div className={`flex items-center gap-2 ${assets.length > 0 ? 'mb-3' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8D6AFA] to-[#7A5AE0] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide leading-tight">
              {t('sidebar.title')}
            </h2>
            {assets.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {assets.length} asset{assets.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {assets.length > 0 && (
          <Button
            variant="brand"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={onGenerateNew}
            fullWidth
          >
            {t('sidebar.generateNew')}
          </Button>
        )}
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-subtle">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#8D6AFA]" />
          </div>
        ) : assets.length > 0 ? (
          assets.map((asset) => (
            <AssetSidebarCard
              key={asset.id}
              asset={asset}
              onClick={() => onAssetClick(asset)}
              isActive={selectedAssetId === asset.id}
            />
          ))
        ) : (
          <div className="text-center py-6 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <Image
              src="/assets/symbols/ai-icon-brand-color.svg"
              alt="AI"
              width={36}
              height={36}
              className="mx-auto mb-3 opacity-40"
            />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('sidebar.emptyTitle')}
            </h3>
            <Button
              variant="brand"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={onGenerateNew}
            >
              {t('sidebar.generateNew')}
            </Button>
          </div>
        )}

        {/* Q&A Section - right under assets */}
        <div className="pt-2">
          <QASidebarEntry
            onClick={() => setIsQAPanelOpen(true)}
            scope="conversation"
          />
        </div>
      </div>

      {/* Q&A Slide Panel */}
      <QASlidePanel
        isOpen={isQAPanelOpen}
        onClose={() => setIsQAPanelOpen(false)}
        scope="conversation"
        transcriptionId={conversationId}
        title={conversationTitle}
      />

      {/* Collapsible Recording Context Section */}
      {metadata.context && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsContextExpanded(!isContextExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquareText className="w-3.5 h-3.5" />
              {t('sidebar.recordingContext')}
            </span>
            {isContextExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isContextExpanded && (
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {metadata.context}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Collapsible Metadata Section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {t('sidebar.metadata')}
          </span>
          {isMetadataExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {isMetadataExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Duration */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Duration
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {formatDuration(metadata.duration)}
              </span>
            </div>

            {/* Created */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {metadata.createdAt.toLocaleDateString()}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Status
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                metadata.status === 'ready'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : metadata.status === 'processing'
                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {metadata.status === 'ready' ? '✓ Ready' :
                 metadata.status === 'processing' ? '⏳ Processing' :
                 'Pending'}
              </span>
            </div>

            {/* Speakers */}
            {metadata.speakers && metadata.speakers > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <UsersIcon className="w-3.5 h-3.5" />
                  Speakers
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {metadata.speakers}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
