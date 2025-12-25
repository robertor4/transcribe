'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to save and restore scroll position when navigating between pages.
 * Uses sessionStorage to persist scroll positions across navigation.
 *
 * @param key - Unique key to identify this scrollable area (defaults to pathname)
 * @param scrollContainerRef - Optional ref to a scrollable container (defaults to window)
 */
export function useScrollRestoration(
  key?: string,
  scrollContainerRef?: React.RefObject<HTMLElement>
) {
  const pathname = usePathname();
  const storageKey = `scroll-position-${key || pathname}`;
  const hasRestored = useRef(false);

  // Save scroll position before navigating away
  const saveScrollPosition = useCallback(() => {
    const scrollY = scrollContainerRef?.current
      ? scrollContainerRef.current.scrollTop
      : window.scrollY;

    if (scrollY > 0) {
      sessionStorage.setItem(storageKey, String(scrollY));
    }
  }, [storageKey, scrollContainerRef]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    const savedPosition = sessionStorage.getItem(storageKey);

    if (savedPosition && !hasRestored.current) {
      const scrollY = parseInt(savedPosition, 10);

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTop = scrollY;
        } else {
          window.scrollTo(0, scrollY);
        }
        hasRestored.current = true;
      });
    }
  }, [storageKey, scrollContainerRef]);

  // Clear saved position (call when you want to reset)
  const clearScrollPosition = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    hasRestored.current = false;
  }, [storageKey]);

  // Save position when user is about to leave the page
  useEffect(() => {
    // Save on beforeunload (browser navigation/refresh)
    const handleBeforeUnload = () => saveScrollPosition();
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Save on visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveScrollPosition]);

  // Restore position on mount
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timeoutId = setTimeout(() => {
      restoreScrollPosition();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [restoreScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
}

/**
 * Hook specifically for conversation pages that saves scroll position
 * when clicking on AI asset links and restores when returning.
 *
 * Works with ThreePaneLayout which has its own scrollable main container.
 *
 * @param conversationId - Unique ID for this conversation
 * @param isReady - Set to true when content is loaded and ready for scroll restoration
 */
export function useConversationScrollRestoration(
  conversationId: string,
  isReady: boolean = false
) {
  const storageKey = `conversation-scroll-${conversationId}`;
  const hasRestored = useRef(false);

  // Get the scrollable container (ThreePaneLayout main element)
  const getScrollContainer = useCallback(() => {
    // ThreePaneLayout uses main.overflow-auto as the scroll container
    return document.querySelector('main.overflow-auto') as HTMLElement | null;
  }, []);

  // Save current scroll position
  const saveScrollPosition = useCallback(() => {
    const container = getScrollContainer();
    const scrollY = container ? container.scrollTop : window.scrollY;
    if (scrollY > 0) {
      sessionStorage.setItem(storageKey, String(scrollY));
    }
  }, [storageKey, getScrollContainer]);

  // Restore scroll position when content is ready
  useEffect(() => {
    // Only restore when content is ready and we haven't already restored
    if (!isReady || hasRestored.current) return;

    const savedPosition = sessionStorage.getItem(storageKey);
    if (!savedPosition) return;

    const scrollY = parseInt(savedPosition, 10);

    // Use multiple attempts to ensure content is rendered
    const attemptRestore = (attempts: number) => {
      if (attempts <= 0) return;

      requestAnimationFrame(() => {
        const container = getScrollContainer();
        if (container) {
          container.scrollTop = scrollY;
          // Verify scroll happened, retry if not
          if (Math.abs(container.scrollTop - scrollY) > 50 && attempts > 1) {
            setTimeout(() => attemptRestore(attempts - 1), 50);
          } else {
            hasRestored.current = true;
          }
        } else {
          // Container not found yet, retry
          if (attempts > 1) {
            setTimeout(() => attemptRestore(attempts - 1), 50);
          }
        }
      });
    };

    // Start restoration after a short delay for layout to settle
    setTimeout(() => attemptRestore(10), 50);
  }, [storageKey, getScrollContainer, isReady]);

  // Reset the restored flag when conversation changes
  useEffect(() => {
    return () => {
      hasRestored.current = false;
    };
  }, [conversationId]);

  return { saveScrollPosition };
}
