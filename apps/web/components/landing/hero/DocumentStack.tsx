'use client';

import { motion, useReducedMotion, useMotionValue, useTransform, animate, useInView, type Variants } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * DocumentStack
 *
 * Animated document stack with:
 * 1. Micro-parallax breathing motion (±4-6px, 10s cycle)
 * 2. Progressive reveal on load (bullets stagger, checkmarks last)
 *
 * If the breathing motion is consciously noticeable, it's too much.
 */
export function DocumentStack() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  // Breathing animation using motion values
  const breathPhase = useMotionValue(0);

  // Back card: larger movement for depth (parallax effect) - more pronounced
  const backCardY = useTransform(breathPhase, [0, 0.5, 1], [0, -14, 0]);

  // Front card: smaller movement (foreground moves less) - creates depth
  const frontCardY = useTransform(breathPhase, [0, 0.5, 1], [0, -8, 0]);

  useEffect(() => {
    if (shouldReduceMotion || !isInView) return;

    // Infinite breathing loop: 6s duration for visible motion
    const controls = animate(breathPhase, [0, 1], {
      duration: 6,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop',
    });

    return () => controls.stop();
  }, [breathPhase, shouldReduceMotion, isInView]);

  // Card entrance variants - using easeOutQuad bezier curve
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  // Staggered content reveal for primary card
  const contentContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.4,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

  const checkmarkVariants: Variants = {
    hidden: { opacity: 0, y: 4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const },
    },
  };

  // Data for bullets and decisions
  const bulletItems = [
    { label: 'A', opacity: 100, text: 'Focus on enterprise onboarding flow redesign' },
    { label: 'B', opacity: 80, text: 'Defer mobile app to Q1 based on resource constraints' },
    { label: 'C', opacity: 60, text: 'API v2 launch targeting November release' },
    { label: 'D', opacity: 40, text: 'Hire two senior engineers for platform team' },
  ];

  const decisionItems = [
    'Proceed with Stripe integration over PayPal',
    'Delay internationalization until Q2',
  ];

  return (
    <div ref={containerRef} className="flex justify-center lg:justify-end">
      <div className="relative w-full max-w-md">
        {/* Back card - larger parallax offset, static content */}
        <motion.div
          className="absolute -top-3 -left-4 w-full bg-white/80 rounded-lg shadow-md border border-gray-200/60 p-8 text-left transform -rotate-2"
          style={{ y: shouldReduceMotion ? 0 : backCardY }}
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          aria-hidden="true"
        >
          {/* Document header with title and logotype */}
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-400">Client Follow-up Email</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logotype.svg"
              alt=""
              className="h-5 w-auto opacity-20"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-3 text-gray-300 text-sm mb-6">
            <p>Hi Sarah,</p>
            <p>Following up on our call regarding the Q4 timeline...</p>
            <p>Key points we discussed:</p>
            <ul className="space-y-2 ml-4 opacity-80">
              <li>• Enterprise onboarding priority confirmed</li>
              <li>• Mobile app postponed to Q1</li>
              <li>• API v2 on track for November</li>
            </ul>
          </div>
        </motion.div>

        {/* Front card - smaller parallax offset + content reveal */}
        <motion.div
          className="relative w-full bg-white rounded-lg shadow-xl border border-gray-200 p-8 text-left transform lg:rotate-1 hover:rotate-0 transition-[transform] duration-300"
          style={{ y: shouldReduceMotion ? 0 : frontCardY }}
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <motion.div
            variants={contentContainerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {/* Title - first to appear */}
            <motion.div variants={itemVariants} className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Q4 Product Strategy</h3>
            </motion.div>

            {/* Bullet points - staggered */}
            <ul className="space-y-3 text-gray-700 text-sm mb-8">
              {bulletItems.map((item, i) => (
                <motion.li key={i} variants={itemVariants} className="flex items-center">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center mr-3"
                    style={{ backgroundColor: `rgba(141, 106, 250, ${item.opacity / 100})` }}
                  >
                    {item.label}
                  </span>
                  <span>{item.text}</span>
                </motion.li>
              ))}
            </ul>

            {/* Decisions section - after bullets */}
            <motion.div variants={itemVariants} className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Decisions</h4>
              <ul className="space-y-3 text-gray-600 text-sm">
                {decisionItems.map((item, i) => (
                  <motion.li key={i} variants={checkmarkVariants} className="flex items-center">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[#14D0DC] bg-[#14D0DC]/10 flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-[#14D0DC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
