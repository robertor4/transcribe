'use client';

import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  suffix: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix, duration = 2 }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  const count = useMotionValue(0);
  const formatted = useTransform(count, (latest) => Math.round(latest) + suffix);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      const controls = animate(count, value, {
        duration,
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [isInView, hasAnimated, count, value, duration]);

  return (
    <motion.span ref={ref}>
      {formatted}
    </motion.span>
  );
}
