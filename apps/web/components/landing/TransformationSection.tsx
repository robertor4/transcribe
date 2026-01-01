'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion, useInView, type Variants } from 'framer-motion';

// Shared easing curve (easeOutQuad) - matches Hero components
const EASE_HERO = [0.25, 0.46, 0.45, 0.94] as const;

// Animation timing constants (aligned with hero tempo)
const QUOTE_STAGGER_S = 0.6;      // Time between quotes (600ms)
const DOCUMENT_DELAY_S = 0.8;     // Delay after last quote before document appears
const DOC_CONTENT_DELAY_S = 0.3;  // Delay after card appears before content staggers
const DOC_ITEM_STAGGER_S = 0.12;  // Stagger between document content items (120ms)
const HOLD_TIME_MS = 20000;       // Time document is shown before replay (20s)

export function TransformationSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });
  const [animationKey, setAnimationKey] = useState(0);

  const quotes = [
    { text: '"...so yeah, the demo went really well, they seemed excited about the analytics dashboard..."', opacityTarget: 0.9 },
    { text: '"...right, and Sarah mentioned they need it integrated with Salesforce, that\'s a must-have..."', opacityTarget: 0.75, indent: 'ml-1 sm:ml-3' },
    { text: '"...budget-wise she said they\'re looking at Q1, probably around 50 seats to start..."', opacityTarget: 0.6 },
    { text: '"...oh and they want a pilot program first, maybe two weeks..."', opacityTarget: 0.5, indent: 'ml-2 sm:ml-4' },
    { text: '"...I should probably send them the case study we did with Acme..."', opacityTarget: 0.45, indent: 'ml-1 sm:ml-2', hideOnMobile: true },
    { text: '"...wait, did she say they also need SSO? I think she mentioned that..."', opacityTarget: 0.35, hideOnMobile: true },
  ];

  const quotesCount = quotes.length;
  const totalQuotesDuration = QUOTE_STAGGER_S * quotesCount;
  const documentStartDelay = totalQuotesDuration + DOCUMENT_DELAY_S;

  // Reset animation for replay
  const resetAnimation = useCallback(() => {
    setAnimationKey(prev => prev + 1);
  }, []);

  // Auto-replay after hold time
  useEffect(() => {
    if (!isInView) return;

    const totalAnimationTime = (documentStartDelay + DOC_CONTENT_DELAY_S + DOC_ITEM_STAGGER_S * 5) * 1000;
    const replayTimer = setTimeout(() => {
      resetAnimation();
    }, totalAnimationTime + HOLD_TIME_MS);

    return () => clearTimeout(replayTimer);
  }, [isInView, animationKey, documentStartDelay, resetAnimation]);

  // Recording indicator variants
  const recordingVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: EASE_HERO },
    },
  };

  // Quote container variants (orchestrates stagger)
  const quotesContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: QUOTE_STAGGER_S,
        delayChildren: 0.2, // Small initial delay
      },
    },
  };

  // Individual quote variants
  const quoteVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 6,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: EASE_HERO },
    },
  };

  // Arrow color transition
  const arrowVariants: Variants = {
    hidden: { color: '#9ca3af' }, // text-gray-400
    visible: {
      color: '#8D6AFA',
      transition: { delay: documentStartDelay, duration: 0.4, ease: EASE_HERO },
    },
  };

  // Document card variants
  const documentCardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: documentStartDelay,
        duration: 0.6,
        ease: EASE_HERO,
      },
    },
  };

  // Document content container (orchestrates internal stagger)
  const docContentContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: DOC_ITEM_STAGGER_S,
        delayChildren: documentStartDelay + DOC_CONTENT_DELAY_S,
      },
    },
  };

  // Document content item variants
  const docItemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 4,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_HERO },
    },
  };

  return (
    <section
      ref={sectionRef}
      id="transformation-section"
      className="py-24 sm:py-32 px-6 sm:px-8 lg:px-12 bg-gray-50"
      aria-labelledby="transformation-heading"
    >
      <h2 id="transformation-heading" className="sr-only">Transformation</h2>
      <div className="max-w-5xl mx-auto">
        {/* Flexbox row layout - always horizontal */}
        <div className="flex flex-row items-center gap-6 sm:gap-8 lg:gap-12">

          {/* Conversation side — with recording indicator */}
          <div className="flex-1 min-w-0">
            {/* Recording indicator - always pulsing */}
            <motion.div
              key={`recording-${animationKey}`}
              className="flex items-center gap-2 mb-4"
              variants={recordingVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">Recording...</span>
            </motion.div>

            {/* Conversation quotes appearing one by one */}
            <motion.div
              key={`quotes-${animationKey}`}
              className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base leading-relaxed min-h-[180px] sm:min-h-[220px]"
              variants={quotesContainerVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              {quotes.map((quote, index) => (
                <motion.p
                  key={index}
                  className={`
                    ${quote.indent || ''}
                    ${quote.hideOnMobile ? 'hidden sm:block' : ''}
                  `}
                  variants={quoteVariants}
                  style={{ opacity: 0 }} // Initial state handled by variants
                  custom={index}
                >
                  <span style={{ opacity: quote.opacityTarget }}>{quote.text}</span>
                </motion.p>
              ))}
            </motion.div>
          </div>

          {/* Transformation indicator — minimal vertical line with arrow */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center py-4">
              <div className="w-px h-16 sm:h-24 bg-gray-300"></div>
              <motion.span
                key={`arrow-${animationKey}`}
                className="text-sm my-3"
                variants={arrowVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
              >
                →
              </motion.span>
              <div className="w-px h-16 sm:h-24 bg-gray-300"></div>
            </div>
          </div>

          {/* Document side — calm, authoritative, final */}
          <motion.div
            key={`document-${animationKey}`}
            className="flex-1 min-w-0"
            variants={documentCardVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-5 sm:p-6 lg:p-8">
              <motion.div
                variants={docContentContainerVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
              >
                {/* Document header with thin rule and icon */}
                <motion.div variants={docItemVariants} className="flex items-start justify-between mb-1">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Follow-up Email</h3>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </motion.div>
                <motion.div variants={docItemVariants} className="w-10 sm:w-12 h-px bg-gray-200 mb-4 sm:mb-6"></motion.div>

                {/* Email content */}
                <div className="space-y-3 sm:space-y-4 text-gray-700 text-xs sm:text-sm lg:text-[15px]">
                  <motion.p variants={docItemVariants} className="text-gray-600">Hi Sarah,</motion.p>
                  <motion.p variants={docItemVariants}>Great speaking with you today about the analytics dashboard. A few key points from our call:</motion.p>
                  <motion.ul variants={docItemVariants} className="space-y-1.5 sm:space-y-2 pl-4">
                    <li className="flex items-start">
                      <span className="text-[#8D6AFA] mr-2">•</span>
                      <span>Salesforce integration — confirmed as must-have</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#8D6AFA] mr-2">•</span>
                      <span>50 seats, targeting Q1 rollout</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#8D6AFA] mr-2">•</span>
                      <span>2-week pilot program to start</span>
                    </li>
                  </motion.ul>
                </div>

                {/* Next steps section */}
                <motion.div variants={docItemVariants} className="border-t border-gray-100 pt-3 sm:pt-4 mt-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">Next step:</span>{' '}
                    Sending case study by EOD Friday.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
