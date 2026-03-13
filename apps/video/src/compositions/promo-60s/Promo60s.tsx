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
 * Defaults derived from Whisper word-level timestamps on
 * voiceover-promo-60s-fast.mp3. Scene transitions placed at the
 * midpoint of each silence gap so visuals change during pauses.
 *
 * Scene              Frames  Duration  Audio (start–end)         Gap before next
 * ─────────────────────────────────────────────────────────────────────────────────
 * BackToBack          152    5.07s     0.00–4.78s                4.78–5.36 (0.58s)
 * NoTime              114    3.80s     5.36–8.60s                8.60–9.14 (0.54s)
 * ThePain             144    4.80s     9.14–13.20s               13.20–14.12 (0.92s)
 * TheShift            163    5.43s     14.12–18.62s              18.62–19.56 (0.94s)
 * ThePromise          121    4.03s     19.56–22.84s              22.84–23.40 (0.56s)
 * Transform (Power)   169    5.63s     23.40–28.32s              28.32–29.18 (0.86s)
 * Templates           230    7.67s     29.18–36.08s              36.08–36.76 (0.68s)
 * Ask (Memory)        217    7.23s     36.76–43.26s              43.26–44.04 (0.78s)
 * TheOutcome          125    4.17s     44.04–47.44s              47.44–48.22 (0.78s)
 * Trust               174    5.80s     48.22–53.14s              53.14–54.10 (0.96s)
 * CloseCTA            191    6.37s     54.10–58.76s              (end)
 *                   ─────
 *                    1800 = 60.00s
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
  backToBack: 152,
  noTime:     114,
  thePain:    144,
  theShift:   163,
  thePromise: 121,
  thePower:     169,
  theTemplates: 230,
  theMemory:    217,
  theOutcome: 125,
  trust:      174,
  closeCTA:   191,
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
