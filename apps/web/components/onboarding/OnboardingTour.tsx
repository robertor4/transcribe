'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { useOnboarding } from './OnboardingProvider';

interface TourStep {
  targetSelector: string;
  titleKey: string;
  descriptionKey: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  type?: 'spotlight' | 'modal';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour-step="dashboard-create"]',
    titleKey: 'step1Title',
    descriptionKey: 'step1Description',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour-step="nav-folders"]',
    titleKey: 'step2Title',
    descriptionKey: 'step2Description',
    position: 'right',
  },
  {
    targetSelector: '[data-tour-step="nav-search"]',
    titleKey: 'step3Title',
    descriptionKey: 'step3Description',
    position: 'right',
  },
  {
    targetSelector: '[data-tour-step="example-conversation"]',
    titleKey: 'step4Title',
    descriptionKey: 'step4Description',
    position: 'bottom',
  },
  {
    targetSelector: '',
    titleKey: 'completionTitle',
    descriptionKey: 'completionDescription',
    position: 'bottom',
    type: 'modal',
  },
];

const SPOTLIGHT_PADDING = 8;
const POPOVER_GAP = 12;

function getPopoverPosition(
  rect: DOMRect,
  position: TourStep['position'],
  popoverEl: HTMLElement | null,
) {
  const popoverRect = popoverEl?.getBoundingClientRect();
  const pw = popoverRect?.width || 320;
  const ph = popoverRect?.height || 160;

  switch (position) {
    case 'bottom':
      return {
        top: rect.bottom + SPOTLIGHT_PADDING + POPOVER_GAP,
        left: Math.max(16, rect.left + rect.width / 2 - pw / 2),
      };
    case 'top':
      return {
        top: rect.top - SPOTLIGHT_PADDING - POPOVER_GAP - ph,
        left: Math.max(16, rect.left + rect.width / 2 - pw / 2),
      };
    case 'right':
      return {
        top: rect.top + rect.height / 2 - ph / 2,
        left: rect.right + SPOTLIGHT_PADDING + POPOVER_GAP,
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2 - ph / 2,
        left: rect.left - SPOTLIGHT_PADDING - POPOVER_GAP - pw,
      };
  }
}

export function OnboardingTour() {
  const t = useTranslations('onboarding.tour');
  const { showTour, completeTour, skipTour } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Reset step index when tour restarts
  const prevShowTourRef = useRef(false);
  useEffect(() => {
    if (showTour && !prevShowTourRef.current) {
      setCurrentStep(0);
      setIsVisible(false);
    }
    prevShowTourRef.current = showTour;
  }, [showTour]);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isModalStep = step?.type === 'modal';
  // Total spotlight steps (exclude the modal completion step from count)
  const spotlightStepCount = TOUR_STEPS.filter((s) => s.type !== 'modal').length;

  // Find and track target element
  const updateTargetRect = useCallback(() => {
    if (!step || isModalStep) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      setIsVisible(true);

      // Scroll into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      setIsVisible(false);
    }
  }, [step, isModalStep]);

  useEffect(() => {
    if (!showTour) return;

    // Modal steps are always visible
    if (isModalStep) {
      setIsVisible(true);
      return;
    }

    // Small delay to let the DOM settle
    const timeout = setTimeout(updateTargetRect, 300);

    // Update on scroll/resize
    window.addEventListener('scroll', updateTargetRect, true);
    window.addEventListener('resize', updateTargetRect);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', updateTargetRect, true);
      window.removeEventListener('resize', updateTargetRect);
    };
  }, [showTour, currentStep, updateTargetRect, isModalStep]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      completeTour();
    } else {
      setCurrentStep((s) => s + 1);
      setIsVisible(false);
    }
  }, [isLastStep, completeTour]);

  if (!showTour || !step) return null;

  // Render modal completion step
  if (isModalStep) {
    return createPortal(
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 p-8 text-center"
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#8D6AFA]/10 border border-[#8D6AFA]/20 mb-5">
                <CheckCircle className="h-8 w-8 text-[#8D6AFA]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {t(step.descriptionKey)}
              </p>
              <Button variant="brand" fullWidth onClick={completeTour}>
                {t('startExploring')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  }

  // Render spotlight step
  const clipPath = targetRect
    ? `polygon(
        0% 0%, 0% 100%,
        ${targetRect.left - SPOTLIGHT_PADDING}px 100%,
        ${targetRect.left - SPOTLIGHT_PADDING}px ${targetRect.top - SPOTLIGHT_PADDING}px,
        ${targetRect.right + SPOTLIGHT_PADDING}px ${targetRect.top - SPOTLIGHT_PADDING}px,
        ${targetRect.right + SPOTLIGHT_PADDING}px ${targetRect.bottom + SPOTLIGHT_PADDING}px,
        ${targetRect.left - SPOTLIGHT_PADDING}px ${targetRect.bottom + SPOTLIGHT_PADDING}px,
        ${targetRect.left - SPOTLIGHT_PADDING}px 100%,
        100% 100%, 100% 0%
      )`
    : undefined;

  const popoverPos =
    targetRect && isVisible
      ? getPopoverPosition(targetRect, step.position, popoverRef.current)
      : null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/50"
            style={{ clipPath }}
            onClick={skipTour}
          />

          {/* Spotlight border glow */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[9998] rounded-lg ring-2 ring-purple-400/60 pointer-events-none"
              style={{
                top: targetRect.top - SPOTLIGHT_PADDING,
                left: targetRect.left - SPOTLIGHT_PADDING,
                width: targetRect.width + SPOTLIGHT_PADDING * 2,
                height: targetRect.height + SPOTLIGHT_PADDING * 2,
              }}
            />
          )}

          {/* Popover */}
          {popoverPos && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.1 }}
              className="fixed z-[9999] w-80 rounded-xl bg-white shadow-xl border border-gray-200 p-5"
              style={{ top: popoverPos.top, left: popoverPos.left }}
            >
              <h4 className="text-base font-semibold text-gray-900 mb-2">
                {t(step.titleKey)}
              </h4>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {t(step.descriptionKey)}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {t('stepOf', {
                    current: currentStep + 1,
                    total: spotlightStepCount,
                  })}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={skipTour}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {t('skipTour')}
                  </button>
                  <Button variant="brand" size="sm" onClick={handleNext}>
                    {t('next')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
