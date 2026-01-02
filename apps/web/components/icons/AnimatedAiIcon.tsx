'use client';

import { useState, useEffect } from 'react';
import { AiIcon } from '@/components/icons/AiIcon';

interface AnimatedAiIconProps {
  className?: string;
  size?: number;
  intervalMs?: number;
}

/**
 * Animated version of AiIcon that periodically pulses with brand color,
 * scale, and rotation to subtly draw attention.
 */
export function AnimatedAiIcon({
  className,
  size = 16,
  intervalMs = 8000,
}: AnimatedAiIconProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Initial delay before first animation (randomized slightly)
    const initialDelay = setTimeout(() => {
      setIsAnimating(true);
    }, intervalMs + Math.random() * 3000);

    // Set up repeating interval
    const interval = setInterval(() => {
      setIsAnimating(true);
    }, intervalMs);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [intervalMs]);

  // Reset animation state after animation completes
  useEffect(() => {
    if (isAnimating) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 900);
      return () => clearTimeout(timeout);
    }
  }, [isAnimating]);

  return (
    <AiIcon
      size={size}
      className={`group-hover-sparkle-pulse ${isAnimating ? 'animate-sparkle-pulse' : ''} ${className || ''}`}
    />
  );
}
