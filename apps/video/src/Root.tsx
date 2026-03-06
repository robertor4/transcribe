import React, { useEffect } from 'react';
import { Promo60sComposition } from './compositions/promo-60s';
import { SpeedGapComposition } from './compositions/blog-speed-gap';
import { DeliverableCascadeComposition } from './compositions/blog-deliverable-cascade';
import { ROICounterComposition } from './compositions/blog-roi-counter';
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

      {/* Blog post #1: "The Consultant's Secret" animations */}
      <SpeedGapComposition />
      <DeliverableCascadeComposition />
      <ROICounterComposition />
    </>
  );
};
