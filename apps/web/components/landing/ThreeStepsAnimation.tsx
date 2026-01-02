'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Mic, Settings, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ThreeStepsAnimation() {
  const t = useTranslations('landing.what.steps');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], // easeOutQuad
      },
    },
  };

  const arrowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-8 items-center max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* Step 1: Speak */}
      <motion.div variants={itemVariants} className="text-center">
        <motion.div
          className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm"
          animate={isInView ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            animate={isInView ? {
              scale: [1, 1.1, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Mic className="w-10 h-10 text-[#8D6AFA]" />
          </motion.div>
        </motion.div>
        <div className="text-6xl font-bold text-gray-300 mb-4">1</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('speak.title')}</h3>
        <p className="text-gray-700 text-sm">{t('speak.description')}</p>
      </motion.div>

      {/* Arrow 1 */}
      <motion.div variants={arrowVariants} className="hidden md:block">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </motion.div>

      {/* Step 2: Extract */}
      <motion.div variants={itemVariants} className="text-center">
        <motion.div
          className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm"
          animate={isInView ? {
            rotate: [0, 360],
          } : {}}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Settings className="w-10 h-10 text-gray-600" />
        </motion.div>
        <div className="text-6xl font-bold text-gray-300 mb-4">2</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('extract.title')}</h3>
        <p className="text-gray-700 text-sm">{t('extract.description')}</p>
      </motion.div>

      {/* Arrow 2 */}
      <motion.div variants={arrowVariants} className="hidden md:block">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </motion.div>

      {/* Step 3: Create */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? {
              opacity: [0, 1, 1, 1],
            } : { opacity: 0 }}
            transition={{
              duration: 2,
              times: [0, 0.3, 0.9, 1],
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            <FileText className="w-10 h-10 text-[#8D6AFA]" />
          </motion.div>
        </div>
        <div className="text-6xl font-bold text-gray-300 mb-4">3</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('create.title')}</h3>
        <p className="text-gray-700 text-sm">{t('create.description')}</p>
      </motion.div>
    </motion.div>
  );
}
