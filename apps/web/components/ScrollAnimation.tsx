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

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animationClasses[animation] : 'scroll-hidden'}`}
      style={{
        animationDelay: isVisible ? `${delay}ms` : undefined
      }}
    >
      {children}
    </div>
  );
}