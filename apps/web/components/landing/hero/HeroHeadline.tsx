'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface HeroHeadlineProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * HeroHeadline
 *
 * Confident entrance animation for hero text.
 * Fades in with 5px upward movement over 600ms.
 * No letter-by-letter, no scaling - professional, not playful.
 */
export function HeroHeadline({ children, delay = 0, className = '' }: HeroHeadlineProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 5,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.25, 0.46, 0.45, 0.94] as const, // easeOutQuad
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}
