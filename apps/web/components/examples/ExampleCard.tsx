'use client';

import { type ReactNode } from 'react';
import { motion, type Variants, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// Shared easing curve (easeOutQuad) - matches landing page
const EASE_HERO = [0.25, 0.46, 0.45, 0.94] as const;

interface ExampleCardProps {
  /** Card title (template type name) */
  title: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Accent color for the icon badge */
  accentColor: string;
  /** Card content (the example output) */
  children: ReactNode;
  /** Animation delay in milliseconds */
  delay?: number;
  /** Whether the card is in view (triggers animation) */
  isInView: boolean;
}

export function ExampleCard({
  title,
  icon: Icon,
  accentColor,
  children,
  delay = 0,
  isInView,
}: ExampleCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: delay / 1000, // Convert ms to seconds
        duration: 0.5,
        ease: EASE_HERO,
      },
    },
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: accentColor }}
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Content area */}
      <div className="p-5">
        {children}
      </div>
    </motion.div>
  );
}

export default ExampleCard;
