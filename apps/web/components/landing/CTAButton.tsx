'use client';

import Link from 'next/link';
import { useState } from 'react';

interface CTAButtonProps {
  href?: string;
  locale?: string;
  variant?: 'primary' | 'secondary' | 'brand' | 'light';
  children: React.ReactNode;
  'aria-label'?: string;
}

export function CTAButton({ href, locale, variant = 'primary', children, 'aria-label': ariaLabel }: CTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = "inline-flex items-center justify-center px-8 py-4 font-semibold text-base rounded-full transform transition-all hover:scale-105 whitespace-nowrap";

  // Primary variant - solid dark background (for light backgrounds)
  const primaryClasses = `${baseClasses} text-white shadow-2xl border-2 border-transparent`;
  const primaryStyle = { backgroundColor: isHovered ? '#2D2360' : '#23194B' };

  // Light variant - off-white background with dark text (for dark backgrounds)
  const lightClasses = `${baseClasses} text-[#23194B] shadow-xl border-2 border-transparent`;
  const lightStyle = { backgroundColor: isHovered ? '#e5e5e5' : '#f5f5f5' };

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
    if (variant === 'light') return lightClasses;
    return primaryClasses;
  };

  const getVariantStyle = () => {
    if (variant === 'brand') return brandStyle;
    if (variant === 'primary') return primaryStyle;
    if (variant === 'light') return lightStyle;
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
  return (
    <Link
      href={locale ? `/${locale}${href}` : href}
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
