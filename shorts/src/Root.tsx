import React from 'react';
import { Composition } from 'remotion';
import { Board } from './board/Board';
import { Short } from './Short';
import { FRAME } from './shared/spec.mjs';
import type { ShortProps } from './types';

// Shown in Remotion Studio when no storyboard is loaded.
const demo: ShortProps = {
  id: 'demo',
  durationInFrames: 90,
  fps: FRAME.fps,
  look: { accent: 'lime', ground: 'ink', type: 'grotesk', motion: 'snap', captions: 'pop', shape: 'sharp' },
  scenes: [{ type: 'hook', variant: 'slam', from: 0, duration: 90, cues: [0], props: { kicker: 'Demo', lines: ['Load a', 'storyboard'], emphasis: 'storyboard' } }],
  captions: [],
  audio: null,
  loopFrames: 9,
  handle: null,
  cta: null,
  probe: false,
};

export const Root: React.FC = () => (
  <>
  <Composition id="Board" component={Board} width={FRAME.width} height={FRAME.height} fps={FRAME.fps} durationInFrames={90} defaultProps={{ page: 1, probe: false }} />
  <Composition
    id="Short"
    component={Short}
    width={FRAME.width}
    height={FRAME.height}
    fps={FRAME.fps}
    durationInFrames={demo.durationInFrames}
    defaultProps={demo}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames, fps: FRAME.fps, width: FRAME.width, height: FRAME.height })}
  />
  </>
);
