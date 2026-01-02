'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface SecondaryLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * SecondaryLink
 *
 * Secondary CTA with underline that animates left→right on hover.
 * Subtle, professional interaction - keeps focus on content, not the button.
 * Uses Next.js Link for routes, regular anchor for hash links.
 */
export function SecondaryLink({ href, children }: SecondaryLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const className = "relative text-white/80 hover:text-white font-medium transition-colors py-4";
  const sharedProps = {
    className,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  const underline = (
    <span
      className="absolute bottom-3 left-0 h-px bg-white/50 transition-all duration-300 ease-out"
      style={{
        width: isHovered ? '100%' : '0%',
        transitionDuration: shouldReduceMotion ? '0ms' : '300ms',
      }}
    />
  );

  // Anchor link (starts with #) - use regular <a> tag for smooth scroll
  if (href.startsWith('#')) {
    return (
      <a href={href} {...sharedProps}>
        {children}
        {underline}
      </a>
    );
  }

  // Route link - use Next.js Link for client-side navigation
  return (
    <Link href={href} {...sharedProps}>
      {children}
      {underline}
    </Link>
  );
}
