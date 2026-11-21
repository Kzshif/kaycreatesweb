import React from 'react';
import { Composition } from 'remotion';
import { Board } from './board/Board';
import { Motion, type MotionProps } from './board/Motion';
import { Short } from './Short';
import { Gameplay, GameplayThumb, type GameplayProps, type ThumbProps } from './gameplay/Gameplay';
import { FRAME } from './shared/spec.mjs';
import type { ShortProps } from './types';

// Shown in Remotion Studio when no storyboard is loaded.
const demo: ShortProps = {
  id: '000',
  durationInFrames: 90,
  fps: FRAME.fps,
  look: { accent: 'green', inverted: false },
  deck: 'pencil',
  scenes: [{ type: 'slam', variant: 'number', from: 0, duration: 90, cues: [0, 30], enter: null, source: null, props: { figure: '$5.3', unit: 'billion', kicker: 'Demo' } }],
  captions: [],
  audio: null,
  loopFrames: 9,
  patternBreak: null,
  handle: null,
  cta: null,
  backdrop: null,
  backdropAlt: null,
  probe: false,
};

export const Root: React.FC = () => (
  <>
  <Composition
    id="Motion"
    component={Motion}
    width={FRAME.width}
    height={FRAME.height}
    fps={FRAME.fps}
    durationInFrames={300}
    defaultProps={{ durationInFrames: 300, captions: [], cues: { billion: 30, just: 50, walk: 62, s2: 95, earned: 110, earnedEnd: 150, s3: 205, half: 250 }, audio: null, probe: false } as MotionProps}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
  />
  <Composition
    id="Gameplay"
    component={Gameplay}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={150}
    defaultProps={{ id: '000', durationInFrames: 150, fps: 30, footage: null, clips: [{ start: 0, end: 2 }, { start: 5, end: 7, zoom: 1.3 }, { start: 9, end: 11 }], layout: 'band', title: ['GTA 6 is', 'overrated'], hl: 'overrated', captions: [], stamp: { frame: 60, text: 'Overrated' }, audio: null, gameVolume: 0.12, sfx: [], handle: '@handle', accent: '#E8202A' } as GameplayProps}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames, fps: props.fps || 30 })}
  />
  <Composition
    id="GameplayThumb"
    component={GameplayThumb}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={1}
    defaultProps={{ image: null, lines: ['13 years', 'for this?'], hl: 'this', stamp: 'Overrated', watermark: 'GTA6ISOVERRATED' } as ThumbProps}
  />
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
