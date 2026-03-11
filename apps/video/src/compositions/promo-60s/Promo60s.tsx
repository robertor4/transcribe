import React from 'react';
import { Audio, Composition, Sequence, staticFile } from 'remotion';
import { video } from '@/lib/design-tokens';

import { BackToBack } from './BackToBack';
import { NoTime } from './NoTime';
import { ThePain } from './ThePain';
import { TheShift } from './TheShift';
import { ThePromise } from './ThePromise';
import { Transform } from './Transform';
import { Templates } from './Templates';
import { Ask } from './Ask';
import { TheOutcome } from './TheOutcome';
import { Trust } from './Trust';
import { CloseCTA } from './CloseCTA';

/**
 * Scene durations (frames at 30fps).
 * Editable via the Studio Props > JSON tab.
 *
 * Defaults derived from silence detection on voiceover-promo-60s-fast.mp3.
 *
 * Scene              Duration  Audio boundary
 * ─────────────────────────────────────────────
 * BackToBack         5.2s      gap @ 4.84–5.48s
 * NoTime             3.8s      gap @ 8.66–9.19s
 * ThePain            10.2s     gap @ 18.90–19.38s
 * TheShift           4.1s      gap @ 22.90–23.56s
 * ThePromise         5.6s      gap @ 28.52–29.09s
 * Transform (Power)  7.7s      gap @ 36.13–36.80s
 * Ask (Memory)       7.3s      gap @ 43.47–44.07s
 * TheOutcome         4.2s      gap @ 47.56–48.29s
 * Trust              5.7s      gap @ 53.33–53.85s
 * CloseCTA           6.4s
 */

interface Promo60sProps {
  backToBack: number;
  noTime: number;
  thePain: number;
  theShift: number;
  thePromise: number;
  thePower: number;
  theTemplates: number;
  theMemory: number;
  theOutcome: number;
  trust: number;
  closeCTA: number;
}

const defaultTimings: Promo60sProps = {
  backToBack: 100,
  noTime:     100,
  thePain:    240,
  theShift:   150,
  thePromise: 160,
  thePower:     180,
  theTemplates: 180,
  theMemory:    219,
  theOutcome: 125,
  trust:      170,
  closeCTA:   200,
};

/** Scene component registry — order matches the video sequence. */
const sceneComponents = [
  { id: 'back-to-back', component: BackToBack,  key: 'backToBack' as const },
  { id: 'no-time',      component: NoTime,      key: 'noTime' as const },
  { id: 'the-pain',     component: ThePain,     key: 'thePain' as const },
  { id: 'the-shift',    component: TheShift,    key: 'theShift' as const },
  { id: 'the-promise',  component: ThePromise,  key: 'thePromise' as const },
  { id: 'the-power',      component: Transform,   key: 'thePower' as const },
  { id: 'the-templates',  component: Templates,   key: 'theTemplates' as const },
  { id: 'the-memory',     component: Ask,         key: 'theMemory' as const },
  { id: 'the-outcome',  component: TheOutcome,  key: 'theOutcome' as const },
  { id: 'trust',        component: Trust,       key: 'trust' as const },
  { id: 'close-cta',    component: CloseCTA,    key: 'closeCTA' as const },
];

/**
 * Master composition — sequences all 10 scenes into a 60-second video.
 * Scene durations are editable via the Studio Props > JSON tab.
 */
export const Promo60s: React.FC<Promo60sProps> = (props) => {
  // Compute startFrames from cumulative durations
  let cursor = 0;
  const scenes = sceneComponents.map((scene) => {
    const duration = props[scene.key];
    const start = cursor;
    cursor += duration;
    return { ...scene, startFrame: start, durationFrames: duration };
  });

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

      {/* Voice-over audio track */}
      <Audio src={staticFile('audio/voiceover-promo-60s-fast.mp3')} />

      {/* Background music — lower volume so VO stays clear */}
      <Audio src={staticFile('audio/promo60-bg-music-trimmed.mp3')} volume={0.30} />
    </div>
  );
};

/**
 * Remotion composition registration for the 60s promo.
 * Edit scene durations via Props > JSON tab in the Studio.
 */
export const Promo60sComposition: React.FC = () => {
  return (
    <Composition
      id="Promo60s"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={Promo60s as any}
      durationInFrames={1800}
      fps={video.fps}
      width={video.width}
      height={video.height}
      defaultProps={defaultTimings}
    />
  );
};
