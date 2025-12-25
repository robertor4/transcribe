'use client';

import { useState, useCallback, useEffect } from 'react';

interface UseSlidePanelReturn<T> {
  selectedItem: T | null;
  isOpen: boolean;
  isClosing: boolean;
  open: (item: T) => void;
  close: () => void;
}

/**
 * Hook for managing slide panel state with proper animation handling
 * @param onCloseDelay - Delay in ms before clearing selected item (should match exit animation duration)
 */
export function useSlidePanel<T>(onCloseDelay = 200): UseSlidePanelReturn<T> {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const open = useCallback((item: T) => {
    setSelectedItem(item);
    setIsClosing(false);
    setIsOpen(true);
    // Lock body scroll when panel opens
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setIsClosing(true);
    setIsOpen(false);
    // Restore body scroll
    document.body.style.overflow = '';
    // Delay clearing selected item to allow exit animation
    setTimeout(() => {
      setSelectedItem(null);
      setIsClosing(false);
    }, onCloseDelay);
  }, [onCloseDelay]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return { selectedItem, isOpen, isClosing, open, close };
}
