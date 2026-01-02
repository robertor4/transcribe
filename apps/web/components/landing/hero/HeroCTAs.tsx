'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface HeroCTAsProps {
  children: ReactNode;
  delay?: number;
}

/**
 * HeroCTAs
 *
 * Wrapper for CTA buttons with delayed entrance animation.
 * Coordinates timing with headline and subtitle for cascading reveal.
 */
export function HeroCTAs({ children, delay = 0 }: HeroCTAsProps) {
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
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6"
    >
      {children}
    </motion.div>
  );
}
