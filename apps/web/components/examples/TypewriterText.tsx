'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterTextProps {
  /** The text to display with typewriter effect */
  text: string;
  /** Speed in milliseconds per character (default: 25) */
  speed?: number;
  /** Delay before starting in milliseconds (default: 0) */
  delay?: number;
  /** Callback when typing is complete */
  onComplete?: () => void;
  /** Whether the animation should start (default: true) */
  isActive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show blinking cursor at end (default: true) */
  showCursor?: boolean;
  /** Render as specific element type */
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3';
}

export function TypewriterText({
  text,
  speed = 25,
  delay = 0,
  onComplete,
  isActive = true,
  className = '',
  showCursor = true,
  as: Component = 'span',
}: TypewriterTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const [visibleLength, setVisibleLength] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const targetLength = Math.min(
      Math.floor(elapsed / speed),
      text.length
    );

    setVisibleLength(targetLength);

    if (targetLength < text.length) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (!completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [speed, text.length]);

  useEffect(() => {
    // Handle reduced motion
    if (shouldReduceMotion) {
      if (isActive && !completedRef.current) {
        setVisibleLength(text.length);
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    // Don't start if not active
    if (!isActive) {
      return;
    }

    // Start animation after delay
    const delayTimer = setTimeout(() => {
      startTimeRef.current = null;
      completedRef.current = false;
      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, delay, shouldReduceMotion, animate, text.length]);

  // Reset when text changes
  useEffect(() => {
    setVisibleLength(0);
    completedRef.current = false;
    startTimeRef.current = null;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [text]);

  const displayedText = shouldReduceMotion ? text : text.slice(0, visibleLength);
  const isTyping = visibleLength > 0 && visibleLength < text.length;
  const showBlinkingCursor = showCursor && isTyping && !shouldReduceMotion;

  return (
    <Component
      className={className}
      aria-label={text}
    >
      {displayedText}
      {showBlinkingCursor && (
        <span
          className="inline-block w-0.5 h-[1em] bg-current ml-0.5 animate-pulse"
          aria-hidden="true"
        />
      )}
    </Component>
  );
}

export default TypewriterText;
