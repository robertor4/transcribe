'use client';

import Link from 'next/link';
import { useState } from 'react';

interface CTAButtonProps {
  href?: string;
  locale?: string;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function CTAButton({ href, locale, variant = 'primary', children }: CTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = "inline-flex items-center justify-center px-8 py-4 font-semibold text-lg rounded-full transform transition-all hover:scale-105";

  // Primary variant - solid background
  const primaryClasses = `${baseClasses} text-white shadow-2xl`;
  const primaryStyle = { backgroundColor: isHovered ? '#3a3a3a' : '#2c2c2c' };

  // Secondary variant - outlined
  const secondaryClasses = `${baseClasses} border-2 border-gray-900 text-gray-900 ${isHovered ? 'bg-gray-900 text-white' : ''}`;

  if (!href) return null;

  // Anchor link (starts with #) - use regular <a> tag for smooth scroll
  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        className={variant === 'primary' ? primaryClasses : secondaryClasses}
        style={variant === 'primary' ? primaryStyle : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={typeof children === 'string' ? children : undefined}
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
        className={variant === 'primary' ? primaryClasses : secondaryClasses}
        style={variant === 'primary' ? primaryStyle : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={typeof children === 'string' ? children : undefined}
      >
        {children}
      </Link>
    );
  }

  return null;
}
