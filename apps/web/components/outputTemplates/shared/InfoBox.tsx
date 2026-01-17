'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface InfoBoxProps {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  variant?: 'purple' | 'cyan' | 'green' | 'amber' | 'red' | 'gray';
  className?: string;
}

const VARIANT_STYLES = {
  purple: {
    container: 'bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10 border-[#8D6AFA]/20',
    icon: 'text-[#8D6AFA]',
  },
  cyan: {
    container: 'bg-[#14D0DC]/5 dark:bg-[#14D0DC]/10 border-[#14D0DC]/20',
    icon: 'text-[#14D0DC]',
  },
  green: {
    container: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  amber: {
    container: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    container: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30',
    icon: 'text-red-600 dark:text-red-400',
  },
  gray: {
    container: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50',
    icon: 'text-gray-500 dark:text-gray-400',
  },
};

/**
 * Shared info box component for callouts and highlights.
 */
export function InfoBox({
  title,
  icon: Icon,
  children,
  variant = 'purple',
  className = '',
}: InfoBoxProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={`border rounded-xl p-4 ${styles.container} ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h4>
          )}
          <div className="text-gray-700 dark:text-gray-300 break-words">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface AccentBorderBoxProps {
  children: ReactNode;
  color?: 'purple' | 'cyan' | 'green' | 'amber' | 'red' | 'gray';
  className?: string;
}

const ACCENT_COLORS = {
  purple: 'border-[#8D6AFA] bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10',
  cyan: 'border-[#14D0DC] bg-[#14D0DC]/5 dark:bg-[#14D0DC]/10',
  green: 'border-green-500 bg-green-50 dark:bg-green-900/10',
  amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/10',
  red: 'border-red-500 bg-red-50 dark:bg-red-900/10',
  gray: 'border-gray-400 bg-gray-50 dark:bg-gray-800/50',
};

/**
 * Accent border box for highlighting content sections.
 */
export function AccentBorderBox({
  children,
  color = 'purple',
  className = '',
}: AccentBorderBoxProps) {
  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${ACCENT_COLORS[color]} ${className}`}>
      {children}
    </div>
  );
}
