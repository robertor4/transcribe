'use client';

import Link from 'next/link';
import {
  Mail,
  CheckSquare,
  Edit3,
  Share2,
  MessageSquareQuote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AiIcon } from '@/components/icons/AiIcon';
import type { RecentAnalysis } from '@/lib/api';
import { formatRelativeTime } from '@/lib/formatters';

interface RecentAssetCardProps {
  asset: RecentAnalysis;
  locale: string;
}

// Icon mapping for output types - returns LucideIcon or null for default (AiIcon)
function getOutputIcon(type: string): LucideIcon | null {
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
      return null; // Use AiIcon for default
  }
}

export function RecentAssetCard({ asset, locale }: RecentAssetCardProps) {
  const OutputIcon = getOutputIcon(asset.templateId);
  const relativeTime = formatRelativeTime(new Date(asset.generatedAt));

  return (
    <Link
      href={`/${locale}/conversation/${asset.transcriptionId}/outputs/${asset.id}`}
      className="group block p-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl hover:border-[#8D6AFA] dark:hover:border-[#8D6AFA] hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header: Icon + Title/Meta */}
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 group-hover:bg-[#8D6AFA] flex items-center justify-center flex-shrink-0 transition-colors duration-200">
          {OutputIcon ? (
            <OutputIcon className="w-5 h-5 text-[#8D6AFA] group-hover:text-white transition-colors duration-200" />
          ) : (
            <AiIcon size={20} className="text-[#8D6AFA] group-hover:text-white transition-colors duration-200" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
            {asset.conversationTitle}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {asset.templateName} · {relativeTime}
          </p>
        </div>
      </div>

    </Link>
  );
}
