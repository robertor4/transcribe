'use client';

import { useState, useEffect } from 'react';

interface UseCollapsibleSidebarProps {
  storageKey: string;
  defaultCollapsed?: boolean;
}

/**
 * Hook for managing collapsible sidebar state with localStorage persistence
 */
export function useCollapsibleSidebar({
  storageKey,
  defaultCollapsed = false,
}: UseCollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(storageKey, String(isCollapsed));
    }
  }, [isCollapsed, storageKey, isHydrated]);

  const toggle = () => setIsCollapsed(!isCollapsed);
  const collapse = () => setIsCollapsed(true);
  const expand = () => setIsCollapsed(false);

  return {
    isCollapsed,
    toggle,
    collapse,
    expand,
    isHydrated, // Useful for preventing hydration mismatch
  };
}
