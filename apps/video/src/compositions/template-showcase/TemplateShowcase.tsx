import React from 'react';
import { Composition, Sequence } from 'remotion';
import { video } from '@/lib/design-tokens';
import { TheHook } from './TheHook';
import { TheUpload } from './TheUpload';
import { TemplateSelector } from './TemplateSelector';
import { TheMontage } from './TheMontage';
import { TheCounter } from './TheCounter';
import { ShowcaseCloseCTA } from './CloseCTA';

/**
 * Scene timings at 30fps (total: ~68 seconds = 2040 frames)
 *
 * Scene              Start   Duration  Frames
 * ─────────────────────────────────────────────
 * TheHook            0:00    5s        0–150
 * TheUpload          0:05    9s        150–420
 * TemplateSelector   0:14    8s        420–660
 * TheMontage         0:22    26s       660–1440
 * TheCounter         0:48    7s        1440–1650
 * CloseCTA           0:55    13s       1650–2040
 */

const scenes = [
  { id: 'hook',              component: TheHook,          startFrame: 0,    durationFrames: 150 },
  { id: 'upload',            component: TheUpload,        startFrame: 150,  durationFrames: 270 },
  { id: 'template-selector', component: TemplateSelector, startFrame: 420,  durationFrames: 240 },
  { id: 'montage',           component: TheMontage,       startFrame: 660,  durationFrames: 780 },
  { id: 'counter',           component: TheCounter,       startFrame: 1440, durationFrames: 210 },
  { id: 'close-cta',         component: ShowcaseCloseCTA, startFrame: 1650, durationFrames: 390 },
] as const;

const TOTAL_FRAMES = 2040;

/**
 * Master composition — "40 Templates. One Conversation."
 *
 * Sequences 6 scenes into a ~68-second video showcasing all
 * AI Asset templates through faithful UI recreation and
 * branded interstitial cards.
 */
export const TemplateShowcase: React.FC = () => {
  return (
    <div
      style={{
        width: video.width,
        height: video.height,
        backgroundColor: '#22184C',
        position: 'relative',
      }}
    >
      {scenes.map(({ id, component: Component, startFrame, durationFrames }) => (
        <Sequence
          key={id}
          name={id}
          from={startFrame}
          durationInFrames={durationFrames}
        >
          <Component />
        </Sequence>
      ))}
    </div>
  );
};

/**
 * Remotion composition registration.
 */
export const TemplateShowcaseComposition: React.FC = () => {
  return (
    <Composition
      id="TemplateShowcase"
      component={TemplateShowcase}
      durationInFrames={TOTAL_FRAMES}
      fps={video.fps}
      width={video.width}
      height={video.height}
    />
  );
};
