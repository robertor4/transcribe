'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'brand' | 'brand-outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  children?: ReactNode;
  fullWidth?: boolean;
  icon?: ReactNode;
}

/**
 * Reusable button component following Neural Summary design system
 * Based on landing page CTAButton patterns with additional variants for dashboard UI
 *
 * Design principles:
 * - Primary: Solid dark background (#23194B) for main actions
 * - Secondary: Outlined with hover fill for alternative actions
 * - Brand: Bold purple (#8D6AFA) for special CTAs
 * - Ghost: Transparent with hover background for subtle actions
 * - Danger: Red for destructive actions
 *
 * @see /apps/web/components/landing/CTAButton.tsx for landing page reference
 */
export function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  fullWidth = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  // Base classes (group enables group-hover for child elements like animated icons)
  const baseClasses = "group inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  // Size variants
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-10 py-4 text-lg',
  };

  // Variant classes
  const variantClasses = {
    // Solid dark background - main actions (landing page primary)
    primary: 'bg-[#23194B] text-white hover:bg-[#2D2360] border-2 border-transparent shadow-md hover:scale-105',

    // Outlined with hover fill - alternative actions (landing page secondary)
    secondary: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-gray-900 dark:border-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 hover:scale-105',

    // Brand purple - special CTAs (landing page brand)
    brand: 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] border-2 border-transparent shadow-md hover:scale-105',

    // Brand purple outline - secondary brand actions
    'brand-outline': 'bg-transparent text-[#8D6AFA] border-2 border-[#8D6AFA] hover:bg-[#8D6AFA] hover:text-white hover:scale-105',

    // Transparent with hover - subtle actions (new for dashboard)
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent',

    // Danger red - destructive actions (new for dashboard)
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-transparent',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const allClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass}`;

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={allClasses}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button className={allClasses} disabled={disabled} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
