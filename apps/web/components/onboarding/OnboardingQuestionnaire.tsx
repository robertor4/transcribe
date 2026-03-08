'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/Button';
import { useOnboarding } from './OnboardingProvider';
import { WelcomeStep } from './steps/WelcomeStep';
import { UseCaseRoleStep } from './steps/UseCaseRoleStep';
import { TeamOutputStep } from './steps/TeamOutputStep';
import { DiscoveryStep } from './steps/DiscoveryStep';
import type { OnboardingResponses } from '@transcribe/shared';

const TOTAL_STEPS = 4;

export function OnboardingQuestionnaire() {
  const t = useTranslations('onboarding');
  const { showQuestionnaire, completeQuestionnaire, skipQuestionnaire, seedExample } =
    useOnboarding();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState<OnboardingResponses>({});

  const handleSkip = useCallback(async () => {
    setIsSubmitting(true);
    // Still seed the example conversation even when skipping
    await seedExample();
    await skipQuestionnaire();
    setIsSubmitting(false);
  }, [skipQuestionnaire, seedExample]);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    await seedExample();
    await completeQuestionnaire(responses);
    setIsSubmitting(false);
  }, [responses, completeQuestionnaire, seedExample]);

  const canContinue = (): boolean => {
    switch (step) {
      case 2:
        return !!responses.primaryUseCase || !!responses.role;
      case 3:
        return !!responses.teamSize || (responses.topOutputTypes?.length ?? 0) > 0;
      case 4:
        return true; // Discovery is optional
      default:
        return true;
    }
  };

  if (!showQuestionnaire) return null;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Onboarding</DialogTitle>
        </VisuallyHidden>
        {/* Progress dots */}
        {step > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i + 1 <= step
                    ? 'bg-purple-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <WelcomeStep
                onContinue={() => setStep(2)}
                onSkip={handleSkip}
              />
            )}

            {step === 2 && (
              <UseCaseRoleStep
                values={responses}
                onChange={(vals) =>
                  setResponses((prev) => ({ ...prev, ...vals }))
                }
              />
            )}

            {step === 3 && (
              <TeamOutputStep
                values={responses}
                onChange={(vals) =>
                  setResponses((prev) => ({ ...prev, ...vals }))
                }
              />
            )}

            {step === 4 && (
              <DiscoveryStep
                value={responses.discoverySource}
                onChange={(val) =>
                  setResponses((prev) => ({ ...prev, discoverySource: val }))
                }
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons (steps 2-4) */}
        {step > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t('back')}
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t('welcome.skip')}
              </button>

              {step < TOTAL_STEPS ? (
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canContinue()}
                >
                  {t('continue')}
                </Button>
              ) : (
                <Button
                  variant="brand"
                  size="sm"
                  onClick={handleComplete}
                  disabled={isSubmitting}
                >
                  {t('discovery.complete')}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
