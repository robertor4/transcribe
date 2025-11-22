'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface MilestoneToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number; // Auto-dismiss duration in ms
}

/**
 * Toast notification for milestone celebrations
 * Shows bottom-left corner with slide-in animation
 * Auto-dismisses after 5 seconds (configurable)
 */
export function MilestoneToast({
  message,
  isVisible,
  onDismiss,
  duration = 5000,
}: MilestoneToastProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Auto-dismiss after duration
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onDismiss();
    }, 300); // Match animation duration
  };

  if (!isVisible && !isAnimatingOut) return null;

  return (
    <div
      className={`
        fixed bottom-6 left-6 z-50
        max-w-sm bg-white dark:bg-gray-800
        border-2 border-[#cc3399] rounded-xl shadow-2xl
        p-4 pr-12
        transition-all duration-300 ease-out
        ${isVisible && !isAnimatingOut ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}
    >
      {/* Magenta accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#cc3399] rounded-l-xl"></div>

      {/* Content */}
      <p className="text-gray-900 dark:text-gray-100 font-medium">
        {message}
      </p>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
