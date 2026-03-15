'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ScrollStaggerProps {
  children: ReactNode;
  className?: string;
}

export function ScrollStagger({ children, className = '' }: ScrollStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return (
    <div ref={ref} className={`scroll-stagger ${className}`}>
      {children}
    </div>
  );
}
