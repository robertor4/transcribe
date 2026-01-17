'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'filled';
}

/**
 * Shared section card component for output templates.
 * Provides consistent card styling with optional icon and title.
 */
export function SectionCard({
  title,
  icon: Icon,
  iconColor = 'text-[#8D6AFA]',
  children,
  className = '',
  variant = 'default',
}: SectionCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50',
    outlined: 'border border-gray-200 dark:border-gray-700/50',
    filled: 'bg-gray-50 dark:bg-gray-800',
  };

  return (
    <div className={`rounded-xl p-4 ${variantStyles[variant]} ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />}
          {title && (
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
