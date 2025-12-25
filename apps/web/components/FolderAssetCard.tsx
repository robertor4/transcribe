'use client';

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

interface FolderAssetCardProps {
  asset: RecentAnalysis;
  onClick: () => void;
  isActive?: boolean;
}

// Icon mapping for output types
function getOutputIcon(type: string): LucideIcon {
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
    .slice(0, 100)
    .trim() + (contentStr.length > 100 ? '...' : '');
}

export function FolderAssetCard({ asset, onClick, isActive = false }: FolderAssetCardProps) {
  const OutputIcon = getOutputIcon(asset.templateId);
  const preview = getContentPreview(asset);
  const relativeTime = formatRelativeTime(new Date(asset.generatedAt));

  return (
    <button
      onClick={onClick}
      className={`
        group w-full text-left p-3 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-purple-50 dark:bg-purple-900/30 border-2 border-[#8D6AFA]'
          : 'bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:shadow-md'
        }
      `}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`
          w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
          ${isActive
            ? 'bg-[#8D6AFA] text-white'
            : 'bg-purple-50 dark:bg-purple-900/30 group-hover:bg-[#8D6AFA]'
          }
        `}>
          <OutputIcon className={`
            w-4 h-4 transition-colors duration-200
            ${isActive
              ? 'text-white'
              : 'text-[#8D6AFA] group-hover:text-white'
            }
          `} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Conversation title */}
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5">
            {asset.conversationTitle}
          </p>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`
              text-sm font-semibold truncate transition-colors duration-200
              ${isActive
                ? 'text-[#8D6AFA]'
                : 'text-gray-900 dark:text-gray-100 group-hover:text-[#8D6AFA]'
              }
            `}>
              {asset.templateName}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {relativeTime}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}
