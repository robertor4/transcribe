'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the viewport is mobile-sized
 * Uses matchMedia for better performance than resize listener
 *
 * @param breakpoint - The max-width in pixels to consider as mobile (default: 1024, matches lg: breakpoint)
 * @returns boolean - true if viewport width < breakpoint
 */
export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Use matchMedia for better performance
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to detect if the device has touch capability
 * Useful for enabling/disabling hover-dependent interactions
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(hasTouch);
  }, []);

  return isTouch;
}
