'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import type { Citation } from '@transcribe/shared';

interface InlineCitationProps {
  citation: Citation;
}

interface PopoverPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

export function InlineCitation({ citation }: InlineCitationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate optimal position when opening
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 288; // w-72 = 18rem = 288px
    const estimatedPopoverHeight = 100; // Estimated height for placement decision
    const padding = 8;

    // Determine vertical placement based on available space
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const placement: 'top' | 'bottom' = spaceBelow >= estimatedPopoverHeight + padding ? 'bottom' :
      spaceAbove >= estimatedPopoverHeight + padding ? 'top' : 'bottom';

    // Calculate top position - position directly relative to trigger
    let top: number;
    if (placement === 'top') {
      // Position above: popover bottom edge aligns just above trigger top
      // We'll use a transform to handle the actual height
      top = triggerRect.top - padding;
    } else {
      // Position below: popover top edge aligns just below trigger bottom
      top = triggerRect.bottom + padding;
    }

    // Calculate left position, centered on trigger
    let left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;

    // Ensure popover stays within horizontal bounds
    const minLeft = padding;
    const maxLeft = window.innerWidth - popoverWidth - padding;
    left = Math.max(minLeft, Math.min(maxLeft, left));

    setPopoverPosition({ top, left, placement });
  }, []);

  // Recalculate position when opening or on scroll/resize
  useEffect(() => {
    if (!isOpen) {
      setPopoverPosition(null);
      return;
    }

    calculatePosition();

    // Recalculate on scroll or resize
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, calculatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const popoverContent = isOpen && mounted && popoverPosition && (
    <div
      ref={popoverRef}
      role="dialog"
      style={{
        position: 'fixed',
        top: popoverPosition.top,
        left: popoverPosition.left,
        zIndex: 9999,
        // For 'top' placement, translate up by 100% so bottom edge aligns with the top value
        transform: popoverPosition.placement === 'top' ? 'translateY(-100%)' : undefined,
      }}
      className="w-72 p-3 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <Clock className="w-3.5 h-3.5 text-[#8D6AFA]" />
        <span className="font-medium text-[#8D6AFA]">{citation.timestamp}</span>
        <span className="text-gray-400 dark:text-gray-500">•</span>
        <span className="text-gray-700 dark:text-gray-300">{citation.speaker}</span>
      </div>

      {/* Quote */}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        &ldquo;{citation.text}&rdquo;
      </p>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-medium
          bg-[#8D6AFA]/10 text-[#8D6AFA] hover:bg-[#8D6AFA]/20
          dark:bg-[#8D6AFA]/20 dark:text-[#A78BFA] dark:hover:bg-[#8D6AFA]/30
          transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Clock className="w-3 h-3 mr-1" />
        {citation.timestamp}, {citation.speaker}
      </button>

      {mounted && popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
}
