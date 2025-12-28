'use client';

import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Lightbulb, Zap, FileCheck } from 'lucide-react';

export function BeforeAfterAnimation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Counter animation
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    const minutes = Math.floor(latest / 60);
    const seconds = Math.floor(latest % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      const controls = animate(count, 180, { // 3 minutes = 180 seconds
        duration: 2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, count, hasAnimated]);

  return (
    <div ref={ref} className="grid md:grid-cols-[1fr_auto_1fr] gap-12 items-center max-w-4xl mx-auto">
      {/* BEFORE: Thought Bubble */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, x: -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="relative inline-block">
          <motion.div
            className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center shadow-lg"
            animate={isInView ? {
              y: [0, -10, 0],
            } : {}}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Lightbulb className="w-16 h-16 text-gray-600" />
          </motion.div>

          {/* Thought bubble tail */}
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? {
              opacity: [0, 1],
              scale: [0, 1],
            } : { opacity: 0, scale: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
              <div className="w-2 h-2 rounded-full bg-gray-200"></div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <p className="text-2xl font-bold text-gray-900 mb-2">Idea</p>
          <p className="text-gray-600 text-sm">Unstructured thoughts</p>
        </motion.div>
      </motion.div>

      {/* TRANSFORMATION: Lightning + Counter */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <motion.div
          animate={isInView ? {
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.2, 1],
          } : {}}
          transition={{
            duration: 0.6,
            delay: 1.2,
            times: [0, 0.2, 0.4, 0.6, 1],
          }}
        >
          <Zap className="w-12 h-12 text-[#8D6AFA] fill-[#8D6AFA]" />
        </motion.div>

        <motion.div
          className="text-center px-4 py-2 bg-[#8D6AFA]/10 rounded-full"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.4 }}
        >
          <motion.p className="text-xl font-bold text-[#8D6AFA] font-mono">
            {rounded}
          </motion.p>
        </motion.div>

        <motion.div
          className="hidden md:block"
          animate={isInView ? {
            x: [-20, 20],
            opacity: [0.5, 1, 0.5],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg className="w-12 h-8 text-[#8D6AFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.div>
      </motion.div>

      {/* AFTER: Document */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, x: 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
        transition={{ duration: 0.8, delay: 1.6 }}
      >
        <motion.div
          className="w-32 h-32 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center shadow-xl relative overflow-hidden"
          initial={{ scale: 0.8 }}
          animate={isInView ? { scale: 1 } : { scale: 0.8 }}
          transition={{ delay: 1.8, duration: 0.5, type: "spring" }}
        >
          {/* Document lines animation */}
          <div className="absolute inset-0 p-6 flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 bg-[#8D6AFA]/30 rounded"
                initial={{ width: 0 }}
                animate={isInView ? { width: "100%" } : { width: 0 }}
                transition={{ delay: 2 + i * 0.1, duration: 0.3 }}
              />
            ))}
          </div>

          <FileCheck className="w-16 h-16 text-[#8D6AFA] relative z-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 2.2 }}
          className="mt-8"
        >
          <p className="text-2xl font-bold text-gray-900 mb-2">Product Spec</p>
          <p className="text-gray-600 text-sm">Ready for dev team</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
