'use client';

import Link from 'next/link';
import { useState } from 'react';

interface CTAButtonProps {
  href?: string;
  locale?: string;
  variant?: 'primary' | 'secondary' | 'brand';
  children: React.ReactNode;
  'aria-label'?: string;
}

export function CTAButton({ href, locale, variant = 'primary', children, 'aria-label': ariaLabel }: CTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = "inline-flex items-center justify-center px-10 py-4 font-semibold text-lg rounded-full transform transition-all hover:scale-105 w-[240px]";

  // Primary variant - solid dark background
  const primaryClasses = `${baseClasses} text-white shadow-2xl border-2 border-transparent`;
  const primaryStyle = { backgroundColor: isHovered ? '#2D2360' : '#23194B' };

  // Secondary variant - outlined with white background, fills on hover
  const secondaryClasses = `${baseClasses} ${isHovered ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} border-2 border-gray-900`;

  // Brand variant - bold brand pink
  const brandClasses = `${baseClasses} text-white shadow-2xl border-2 border-transparent`;
  const brandStyle = { backgroundColor: isHovered ? '#7A5AE0' : '#8D6AFA' };

  if (!href) return null;

  // Determine classes and style based on variant
  const getVariantClasses = () => {
    if (variant === 'brand') return brandClasses;
    if (variant === 'secondary') return secondaryClasses;
    return primaryClasses;
  };

  const getVariantStyle = () => {
    if (variant === 'brand') return brandStyle;
    if (variant === 'primary') return primaryStyle;
    return undefined;
  };

  // Anchor link (starts with #) - use regular <a> tag for smooth scroll
  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        className={getVariantClasses()}
        style={getVariantStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      >
        {children}
      </a>
    );
  }

  // Regular route link - use Next.js Link
  if (locale) {
    return (
      <Link
        href={`/${locale}${href}`}
        className={getVariantClasses()}
        style={getVariantStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      >
        {children}
      </Link>
    );
  }

  return null;
}
