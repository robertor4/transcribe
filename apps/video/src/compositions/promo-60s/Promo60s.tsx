import React from 'react';
import { Composition, Sequence } from 'remotion';
import { video } from '@/lib/design-tokens';
import { Subtitle } from '@/components';
import { ColdOpen } from './ColdOpen';
import { TheCost } from './TheCost';
import { ThePromise } from './ThePromise';
import { Capture } from './Capture';
import { Transform } from './Transform';
import { Ask } from './Ask';
import { Proof } from './Proof';
import { Trust } from './Trust';
import { CloseCTA } from './CloseCTA';

/**
 * Scene timings at 30fps (total: 60 seconds = 1800 frames)
 *
 * Scene              Start   Duration  Frames
 * ─────────────────────────────────────────────
 * ColdOpen           0:00    3s        0–90
 * TheCost            0:03    4s        90–210
 * ThePromise         0:07    4s        210–330
 * Capture            0:11    8s        330–570
 * Transform          0:19    11s       570–900
 * Ask                0:30    9s        900–1170
 * Proof              0:39    8s        1170–1410
 * Trust              0:47    6s        1410–1590
 * CloseCTA           0:53    7s        1590–1800
 */

const scenes = [
  { id: 'cold-open',   component: ColdOpen,    startFrame: 0,    durationFrames: 90 },
  { id: 'the-cost',    component: TheCost,     startFrame: 90,   durationFrames: 120 },
  { id: 'the-promise', component: ThePromise,  startFrame: 210,  durationFrames: 120 },
  { id: 'capture',     component: Capture,     startFrame: 330,  durationFrames: 240 },
  { id: 'transform',   component: Transform,   startFrame: 570,  durationFrames: 330 },
  { id: 'ask',         component: Ask,         startFrame: 900,  durationFrames: 270 },
  { id: 'proof',       component: Proof,       startFrame: 1170, durationFrames: 240 },
  { id: 'trust',       component: Trust,       startFrame: 1410, durationFrames: 180 },
  { id: 'close-cta',   component: CloseCTA,    startFrame: 1590, durationFrames: 210 },
] as const;

/**
 * Voice-over subtitle lines — timed to the script (V3).
 *
 * Each line maps to a VO sentence from the script.
 * Frames are at 30fps. Adjust timing as needed during editing.
 */
const subtitleLines = [
  // Scene 1: Cold Open (0:00–0:03) — 7 words / 3s
  {
    startFrame: 0,
    endFrame: 85,
    text: 'The call ends. The context disappears.',
  },

  // Scene 2: The Cost (0:03–0:07) — 10 words / 4s
  {
    startFrame: 90,
    endFrame: 205,
    text: 'Hours lost rewriting what was already said. Every week.',
  },

  // Scene 3: The Promise (0:07–0:11) — 6 words / 4s
  {
    startFrame: 215,
    endFrame: 325,
    text: 'Neural Summary. The meeting intelligence platform.',
  },

  // Scene 4: Capture (0:11–0:19) — 18 words / 8s
  {
    startFrame: 335,
    endFrame: 460,
    text: 'Upload a client call, a strategy session, a discovery interview.',
  },
  {
    startFrame: 465,
    endFrame: 565,
    text: 'No meeting bot. No installs.',
  },

  // Scene 5: Transform (0:19–0:30) — 27 words / 11s
  {
    startFrame: 575,
    endFrame: 700,
    text: 'One recording becomes a follow-up email for your sales lead.',
  },
  {
    startFrame: 705,
    endFrame: 800,
    text: 'A PRD for product. A blog post for marketing.',
  },
  {
    startFrame: 805,
    endFrame: 895,
    text: 'A debrief for your next stakeholder meeting.',
  },

  // Scene 6: Ask (0:30–0:39) — 22 words / 9s
  {
    startFrame: 905,
    endFrame: 1030,
    text: 'Three weeks later, someone asks what the investors said about CAC.',
  },
  {
    startFrame: 1035,
    endFrame: 1165,
    text: 'You ask Neural Summary — and get the exact moment, cited.',
  },

  // Scene 7: Proof (0:39–0:47) — 19 words / 8s
  {
    startFrame: 1175,
    endFrame: 1290,
    text: 'Consultants use it to eliminate post-call writeups.',
  },
  {
    startFrame: 1295,
    endFrame: 1405,
    text: 'Product teams turn discovery calls into specs. Founders build searchable company memory.',
  },

  // Scene 8: Trust (0:47–0:53) — 13 words / 6s
  {
    startFrame: 1415,
    endFrame: 1500,
    text: 'Enterprise-grade security. 96% accuracy.',
  },
  {
    startFrame: 1505,
    endFrame: 1585,
    text: 'A one-hour meeting — done in under fifteen minutes.',
  },

  // Scene 9: Close CTA (0:53–0:60) — 14 words / 7s
  {
    startFrame: 1595,
    endFrame: 1795,
    text: 'Stop rewriting what was already said. Start turning conversations into assets.',
  },
];

/**
 * Master composition — sequences all 9 scenes into a 60-second video.
 */
export const Promo60s: React.FC = () => {
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

      {/* VO subtitle overlay — sits on top of all scenes */}
      <Subtitle lines={subtitleLines} />
    </div>
  );
};

/**
 * Remotion composition registration for the 60s promo.
 * Import this in the root index.ts.
 */
export const Promo60sComposition: React.FC = () => {
  return (
    <Composition
      id="Promo60s"
      component={Promo60s}
      durationInFrames={1800}
      fps={video.fps}
      width={video.width}
      height={video.height}
    />
  );
};
