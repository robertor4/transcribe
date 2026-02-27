'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base classes
  "group inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // Solid dark background - main actions
        primary: 'bg-[#23194B] text-white hover:bg-[#2D2360] border-2 border-transparent shadow-md hover:scale-105',
        // Outlined with hover fill - alternative actions
        secondary: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-gray-900 dark:border-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 hover:scale-105',
        // Brand purple - special CTAs
        brand: 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] border-2 border-transparent shadow-md hover:scale-105',
        // Brand purple outline - secondary brand actions
        'brand-outline': 'bg-transparent text-[#8D6AFA] border-2 border-[#8D6AFA] hover:bg-[#8D6AFA] hover:text-white hover:scale-105',
        // Transparent with hover - subtle actions
        ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700',
        // Danger red - destructive actions
        danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800',
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-10 py-4 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  children?: ReactNode;
  icon?: ReactNode;
}

/**
 * Reusable button component following Neural Summary design system
 * Uses CVA (class-variance-authority) for variant management
 *
 * Design principles:
 * - Primary: Solid dark background (#23194B) for main actions
 * - Secondary: Outlined with hover fill for alternative actions
 * - Brand: Bold purple (#8D6AFA) for special CTAs
 * - Ghost: Transparent with hover background for subtle actions
 * - Danger: Red for destructive actions
 */
export function Button({
  variant,
  size,
  href,
  children,
  fullWidth,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }));

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button className={classes} disabled={disabled} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export { buttonVariants };
