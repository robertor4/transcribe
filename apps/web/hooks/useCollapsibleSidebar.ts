'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCollapsibleSidebarProps {
  storageKey: string;
  defaultCollapsed?: boolean;
  /** If true, always use defaultCollapsed on mount instead of reading localStorage.
   *  The forced state is NOT persisted — only user-initiated toggles are saved. */
  forceInitial?: boolean;
}

/**
 * Hook for managing collapsible sidebar state with localStorage persistence
 */
export function useCollapsibleSidebar({
  storageKey,
  defaultCollapsed = false,
  forceInitial = false,
}: UseCollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const [isHydrated, setIsHydrated] = useState(false);
  // Track whether the user has manually toggled (vs the forced initial state)
  const userHasToggled = useRef(false);

  // Load state from localStorage on mount (skip if forceInitial)
  useEffect(() => {
    if (!forceInitial) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    }
    setIsHydrated(true);
  }, [storageKey, forceInitial]);

  // Save state to localStorage whenever it changes
  // When forceInitial is active, only save after user-initiated toggles
  useEffect(() => {
    if (isHydrated && (!forceInitial || userHasToggled.current)) {
      localStorage.setItem(storageKey, String(isCollapsed));
    }
  }, [isCollapsed, storageKey, isHydrated, forceInitial]);

  const toggle = useCallback(() => {
    userHasToggled.current = true;
    setIsCollapsed(prev => !prev);
  }, []);

  const collapse = useCallback(() => {
    userHasToggled.current = true;
    setIsCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    userHasToggled.current = true;
    setIsCollapsed(false);
  }, []);

  return {
    isCollapsed,
    toggle,
    collapse,
    expand,
    isHydrated, // Useful for preventing hydration mismatch
  };
}
