'use client';

import Link from 'next/link';
import {
  Mail,
  CheckSquare,
  Edit3,
  Share2,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StructuredOutput } from '@transcribe/shared';
import type { RecentAnalysis } from '@/lib/api';
import { getStructuredOutputPreview } from '@/components/outputTemplates';
import { formatRelativeTime } from '@/lib/formatters';

interface RecentAssetCardProps {
  asset: RecentAnalysis;
  locale: string;
}

// Icon mapping for output types
function getOutputIcon(type: string): LucideIcon {
  switch (type) {
    case 'email':
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

// Get content preview from asset
function getContentPreview(asset: RecentAnalysis): string {
  if (asset.contentType === 'structured' && typeof asset.content === 'object') {
    return getStructuredOutputPreview(asset.content as StructuredOutput);
  }

  const contentStr = typeof asset.content === 'string'
    ? asset.content
    : JSON.stringify(asset.content);

  return contentStr
    .replace(/^#+ /gm, '') // Remove markdown headers
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .slice(0, 150)
    .trim() + (contentStr.length > 150 ? '...' : '');
}

export function RecentAssetCard({ asset, locale }: RecentAssetCardProps) {
  const OutputIcon = getOutputIcon(asset.templateId);
  const preview = getContentPreview(asset);
  const relativeTime = formatRelativeTime(new Date(asset.generatedAt));

  return (
    <Link
      href={`/${locale}/conversation/${asset.transcriptionId}/outputs/${asset.id}`}
      className="group block p-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header: Icon + Title/Meta */}
      <div className="flex gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 group-hover:bg-[#8D6AFA] flex items-center justify-center flex-shrink-0 transition-colors duration-200">
          <OutputIcon className="w-4.5 h-4.5 text-[#8D6AFA] group-hover:text-white transition-colors duration-200" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {asset.conversationTitle}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {asset.templateName} · {relativeTime}
          </p>
        </div>
      </div>

      {/* Content Preview (2 lines) */}
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
        {preview}
      </p>
    </Link>
  );
}
