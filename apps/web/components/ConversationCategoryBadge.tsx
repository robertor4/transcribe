'use client';

import { getCategoryConfig } from '@/lib/conversationCategory';

interface ConversationCategoryBadgeProps {
  category: string | undefined;
  className?: string;
}

/**
 * Displays a pill badge for the AI-detected conversation category.
 * Returns null if no category is available (e.g., legacy conversations).
 */
export function ConversationCategoryBadge({ category, className = '' }: ConversationCategoryBadgeProps) {
  const config = getCategoryConfig(category);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${config.bgColor} ${config.textColor} text-xs font-semibold px-3 py-1 rounded-full ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
