'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale';
}

export default function ScrollAnimation({
  children,
  className = '',
  delay = 0,
  threshold = 0.1,
  animation = 'fadeUp'
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state immediately to prevent FOUC
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing to prevent re-triggering
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully in view
      }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  const animationClasses = {
    fadeUp: 'scroll-fade-up',
    fadeIn: 'scroll-fade-in',
    slideLeft: 'scroll-slide-left',
    slideRight: 'scroll-slide-right',
    scale: 'scroll-scale'
  };

  // Always start hidden to prevent FOUC, only show animation class when visible
  const stateClass = isVisible ? animationClasses[animation] : 'scroll-hidden';

  return (
    <div
      ref={ref}
      className={`${className} scroll-hidden ${isMounted ? stateClass : ''}`}
      style={{
        animationDelay: isVisible ? `${delay}ms` : undefined
      }}
    >
      {children}
    </div>
  );
}