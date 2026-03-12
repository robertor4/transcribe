import React from 'react';
import { Audio, Composition, Sequence, staticFile } from 'remotion';
import { video } from '@/lib/design-tokens';
import { TheUpload } from './TheUpload';
import { TemplateSelector } from './TemplateSelector';
import { TheMontage } from './TheMontage';
import { TheCounter } from './TheCounter';
import { ShowcaseCloseCTA } from './CloseCTA';

/**
 * Scene timings at 30fps (total: ~68 seconds = 2040 frames)
 * Synced to voiceover: "working with templates 1.15x.mp3"
 *
 * Scene              Start   Duration  Frames     VO Section
 * ──────────────────────────────────────────────────────────────
 * TheUpload          0:00    9s        0–270      "Upload your audio..."
 * TemplateSelector   0:09    6s        270–450    "Now choose a template..."
 * TheMontage         0:15    40s       450–1650   4 beats (team/sales/brainstorm/1:1)
 * TheCounter         0:55    8s        1650–1890  "More than 50 templates..."
 * CloseCTA           1:03    5s        1890–2040  "Create with your voice..."
 */

const scenes = [
  { id: 'upload',            component: TheUpload,        startFrame: 0,    durationFrames: 270 },
  { id: 'template-selector', component: TemplateSelector, startFrame: 270,  durationFrames: 180 },
  { id: 'montage',           component: TheMontage,       startFrame: 450,  durationFrames: 1200 },
  { id: 'counter',           component: TheCounter,       startFrame: 1650, durationFrames: 240 },
  { id: 'close-cta',         component: ShowcaseCloseCTA, startFrame: 1890, durationFrames: 150 },
] as const;

const TOTAL_FRAMES = 2040;

/**
 * Master composition — "50+ Templates. One Conversation."
 *
 * Sequences 5 scenes into a ~68-second video showcasing all
 * AI Asset templates through faithful UI recreation and
 * branded interstitial cards, synced to voiceover audio.
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
      {/* Voiceover audio track */}
      <Audio src={staticFile('audio/working with templates 1.15x.mp3')} />

      {/* Background music — lower volume so VO stays clear */}
      <Audio src={staticFile('audio/template-showcase-bg-music.mp3')} volume={0.30} />

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
