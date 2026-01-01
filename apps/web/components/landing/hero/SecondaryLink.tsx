'use client';

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
 */
export function SecondaryLink({ href, children }: SecondaryLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <a
      href={href}
      className="relative text-gray-300/80 hover:text-white font-normal transition-colors py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {/* Underline that animates from left to right */}
      <span
        className="absolute bottom-3 left-0 h-px bg-white/50 transition-all duration-300 ease-out"
        style={{
          width: shouldReduceMotion ? (isHovered ? '100%' : '0%') : (isHovered ? '100%' : '0%'),
          transitionDuration: shouldReduceMotion ? '0ms' : '300ms',
        }}
      />
    </a>
  );
}
