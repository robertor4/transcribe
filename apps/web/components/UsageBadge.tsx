'use client';

import { useUsage } from '@/contexts/UsageContext';
import { Loader2, TrendingUp } from 'lucide-react';

export function UsageBadge() {
  const { usageStats, loading, isAdmin } = useUsage();

  // Hide usage badge for admin users
  if (isAdmin) {
    return null;
  }

  if (loading || !usageStats) {
    return (
      <div className="hidden sm:flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
        <Loader2 className="h-3 w-3 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  const { tier, usage, limits, percentUsed, paygCredits } = usageStats;

  // Determine what to display based on tier
  let displayText = '';
  let tooltipText = '';

  if (tier === 'free') {
    displayText = `${usage.transcriptions}/${limits.transcriptions}`;
    tooltipText = `${usage.transcriptions} of ${limits.transcriptions} transcriptions used`;
  } else if (tier === 'professional' || tier === 'business') {
    displayText = `${usage.hours.toFixed(1)}/${limits.hours}h`;
    tooltipText = `${usage.hours.toFixed(1)} of ${limits.hours} hours used`;
  } else if (tier === 'payg') {
    displayText = `${paygCredits?.toFixed(1) || 0}h`;
    tooltipText = `${paygCredits?.toFixed(1) || 0} hours remaining`;
  }

  // Color based on percentage
  const getColor = () => {
    if (percentUsed >= 90)
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (percentUsed >= 70)
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  return (
    <>
      {/* Desktop: Full badge with icon and text */}
      <div
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${getColor()}`}
        title={tooltipText}
      >
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="hidden md:inline">{displayText}</span>
        <span className="md:hidden">{displayText.split('/')[0]}</span>
      </div>

      {/* Mobile: Compact badge */}
      <div
        className={`sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${getColor()}`}
        title={tooltipText}
      >
        <span>{displayText.split('/')[0]}</span>
        {limits.transcriptions && (
          <span className="text-[10px] opacity-70">/{limits.transcriptions}</span>
        )}
        {limits.hours && (
          <span className="text-[10px] opacity-70">/{limits.hours}h</span>
        )}
      </div>
    </>
  );
}
