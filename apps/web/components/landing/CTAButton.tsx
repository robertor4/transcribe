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

  const baseClasses = "inline-flex items-center justify-center px-8 py-4 font-semibold text-lg rounded-full transform transition-all hover:scale-105";

  // Primary variant - solid dark background
  const primaryClasses = `${baseClasses} text-white shadow-2xl`;
  const primaryStyle = { backgroundColor: isHovered ? '#3a3a3a' : '#2c2c2c' };

  // Secondary variant - outlined
  const secondaryClasses = `${baseClasses} border-2 border-gray-900 text-gray-900 ${isHovered ? 'bg-gray-900 text-white' : ''}`;

  // Brand variant - bold brand pink
  const brandClasses = `${baseClasses} text-white shadow-2xl`;
  const brandStyle = { backgroundColor: isHovered ? '#b82d89' : '#cc3399' };

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
