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
    .slice(0, 80)
    .trim() + (contentStr.length > 80 ? '...' : '');
}

export function RecentAssetCard({ asset, locale }: RecentAssetCardProps) {
  const OutputIcon = getOutputIcon(asset.templateId);
  const preview = getContentPreview(asset);
  const relativeTime = formatRelativeTime(new Date(asset.generatedAt));

  return (
    <Link
      href={`/${locale}/conversation/${asset.transcriptionId}/outputs/${asset.id}`}
      className="group block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-md transition-all duration-200"
    >
      {/* Row 1: Icon + Template Name + Date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <OutputIcon className="w-4 h-4 text-[#8D6AFA]" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {asset.templateName}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
          {relativeTime}
        </span>
      </div>

      {/* Row 2: Conversation Title */}
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">
        {asset.conversationTitle}
      </p>

      {/* Row 3: Content Preview */}
      <p className="text-xs text-gray-600 dark:text-gray-500 line-clamp-1">
        {preview}
      </p>
    </Link>
  );
}
