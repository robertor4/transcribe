'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'brand' | 'ghost' | 'danger';
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
 * - Primary: Solid dark background (#2c2c2c) for main actions
 * - Secondary: Outlined with hover fill for alternative actions
 * - Brand: Bold pink (#cc3399) for special CTAs
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
  // Base classes
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  // Size variants
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-10 py-4 text-lg',
  };

  // Variant classes
  const variantClasses = {
    // Solid dark background - main actions (landing page primary)
    primary: 'bg-[#2c2c2c] text-white hover:bg-[#3a3a3a] border-2 border-transparent shadow-md hover:scale-105',

    // Outlined with hover fill - alternative actions (landing page secondary)
    secondary: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-gray-900 dark:border-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 hover:scale-105',

    // Brand pink - special CTAs (landing page brand)
    brand: 'bg-[#cc3399] text-white hover:bg-[#b82d89] border-2 border-transparent shadow-md hover:scale-105',

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
