'use client';

interface StatusBadgeProps {
  status: string;
  variant?: 'priority' | 'rag' | 'qualification' | 'sentiment' | 'custom';
  className?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  low: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
  'must-have': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'should-have': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'could-have': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'wont-have': 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
};

const RAG_STYLES: Record<string, string> = {
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  yellow: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'on-track': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'at-risk': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  blocked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const QUALIFICATION_STYLES: Record<string, string> = {
  'highly-qualified': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  qualified: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'partially-qualified': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'needs-work': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'not-qualified': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  disqualified: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  unknown: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  negative: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  neutral: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
};

/**
 * Shared status badge component for output templates.
 * Supports priority levels, RAG status, qualification status, and sentiment.
 */
export function StatusBadge({ status, variant = 'priority', className = '' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  let styles: string;
  switch (variant) {
    case 'rag':
      styles = RAG_STYLES[normalizedStatus] || RAG_STYLES['unknown'] || '';
      break;
    case 'qualification':
      styles = QUALIFICATION_STYLES[normalizedStatus] || QUALIFICATION_STYLES['unknown'] || '';
      break;
    case 'sentiment':
      styles = SENTIMENT_STYLES[normalizedStatus] || SENTIMENT_STYLES['neutral'] || '';
      break;
    case 'custom':
      styles = '';
      break;
    default:
      styles = PRIORITY_STYLES[normalizedStatus] || PRIORITY_STYLES['low'] || '';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles} ${className}`}
    >
      {status.replace(/-/g, ' ')}
    </span>
  );
}
