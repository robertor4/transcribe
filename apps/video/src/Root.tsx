import React, { useEffect } from 'react';
import { Promo60sComposition } from './compositions/promo-60s';
import { loadFonts } from './lib/fonts';

/**
 * Root component — registers all video compositions.
 *
 * To add a new video:
 * 1. Create a folder in src/compositions/<video-name>/
 * 2. Build the composition with a <Composition> wrapper
 * 3. Import and render it here
 */
export const Root: React.FC = () => {
  useEffect(() => {
    loadFonts();
  }, []);

  return (
    <>
      {/* 60-second promotional video */}
      <Promo60sComposition />

      {/* Future videos go here:
       * <FeatureDemo30sComposition />
       * <OnboardingWalkthroughComposition />
       * <SocialClipComposition />
       */}
    </>
  );
};
