'use client';

import { Award, Crown, Zap } from 'lucide-react';

interface PlanBadgeProps {
  tier: 'free' | 'professional' | 'business' | 'enterprise' | 'payg';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PlanBadge({ tier, size = 'md', showIcon = true }: PlanBadgeProps) {
  const configs = {
    free: {
      label: 'Free',
      icon: Award,
      className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    },
    professional: {
      label: 'Professional',
      icon: Crown,
      className: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    },
    business: {
      label: 'Business',
      icon: Crown,
      className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    },
    enterprise: {
      label: 'Enterprise',
      icon: Crown,
      className: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    },
    payg: {
      label: 'Pay-As-You-Go',
      icon: Zap,
      className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    },
  };

  const config = configs[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${config.className} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={`${iconSizes[size]} mr-1.5`} />}
      {config.label}
    </span>
  );
}
