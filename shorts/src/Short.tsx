// One Short, start to finish: the desk, the drifting camera, the scenes and the physical changes
// between them (a page tears away, the camera whips, the page folds over), the mid-video pattern
// break, the captions, the channel's name in the corner, and the seamless loop back to frame 0.
import { Audio } from '@remotion/media';
import React, { useMemo } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Captions } from './paper/Captions';
import { Camera, Clip, Desk, Label, Layer, LookProvider, Materials, Scraps, Slip, Tape, clamp, drift, glide, jit, lerp, onTwos, ramp, settle, useLook } from './paper/kit';
import { Coin, Scissors } from './paper/money';
import { Probe } from './paper/Probe';
import { InkPad, Offcuts, Pencil } from './paper/things';
import { SCENE_COMPONENTS } from './scenes';
import { drop } from './scenes/common';
import { BRIGHT, MOTION, SHADOW, rgba, tokens } from './shared/paper.mjs';
import { FIRST_CUE_DELAY } from './shared/sound.mjs';
import { SCENES, TRANSITION_FRAMES } from './shared/spec.mjs';
import type { SceneData, ShortProps } from './types';

const num = (id: string): number => parseInt(String(id).replace(/\D/g, ''), 10) || 1;

/** The desk. Baked once per video into an image (it never changes), or drawn live when there is none. */
const Backdrop: React.FC<{ src: string | null; seed: number }> = ({ src, seed }) =>
  src ? (
    <Img src={staticFile(src)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: 'scale(1.05)' }} />
  ) : (
    <AbsoluteFill style={{ transform: 'scale(1.05)' }}>
      <Desk />
      <Scraps seed={seed} />
    </AbsoluteFill>
  );

/** What lies in the lower part of the desk, under the captions: different for neighbouring videos. */
const Deck: React.FC<{ kind: string; seed: number }> = ({ kind, seed }) => {
  if (kind === 'coins')
    return (
      <>
        <Coin r={78} seed={seed + 1} lift={0.3} style={{ left: 706, top: 1312, transform: 'rotate(15deg)' }} />
        <Coin r={60} seed={seed + 2} lift={0.2} style={{ left: 868, top: 1410, transform: 'rotate(-20deg)' }} />
        <Coin r={66} seed={seed + 3} lift={0.24} style={{ left: 596, top: 1470, transform: 'rotate(34deg)' }} />
      </>
    );
  if (kind === 'inkpad')
    return (
      <>
        <Offcuts seed={seed + 4} n={5} spread={[260, 120]} style={{ left: 380, top: 1500 }} />
        <InkPad w={320} seed={seed} style={{ left: 612, top: 1312, transform: 'rotate(7deg)' }} />
      </>
    );
  if (kind === 'scissors')
    return (
      <>
        <Offcuts seed={seed + 4} n={8} spread={[400, 180]} style={{ left: 520, top: 1320 }} />
        <Scissors size={250} open={12} style={{ left: 742, top: 1290, transform: 'rotate(62deg)', transformOrigin: '92px 158px' }} />
      </>
    );
  if (kind === 'clips')
    return (
      <>
        <Offcuts seed={seed + 4} n={6} spread={[360, 150]} style={{ left: 560, top: 1470 }} />
        <Tape w={170} h={46} seed={seed + 1} style={{ left: 790, top: 1326, transform: 'rotate(12deg)' }} />
        <Clip size={96} style={{ left: 662, top: 1330, transform: 'rotate(28deg)' }} />
        <Clip size={88} style={{ left: 880, top: 1420, transform: 'rotate(-40deg)' }} />
      </>
    );
  return (
    <>
      <Offcuts seed={seed + 4} n={7} spread={[400, 170]} style={{ left: 500, top: 1300 }} />
      <Pencil length={480} style={{ left: 506, top: 1414, transform: 'rotate(-16deg)' }} />
    </>
  );
};

/** Everything left of a ragged, slightly leaning line at x: the part of a page not yet torn away. */
const tornLeft = (x: number, seed: number, extra = 0): string => {
  const pts: string[] = ['-80 -80'];
  for (let y = -80; y <= 2000; y += 20) pts.push(`${(x + extra + (y - 960) * 0.11 + Math.sin(y / 95 + seed) * 20 + jit(seed, y, 11 + extra * 0.4)).toFixed(1)} ${y}`);
  pts.push('-80 2000');
  return `M${pts.join('L')}Z`;
};

/** A short, dying shake of the camera when something heavy lands. */
const shake = (frame: number, at: number, amp = 13, dur = 9): { x: number; y: number } => {
  const k = frame - at;
  if (k < 0 || k >= dur) return { x: 0, y: 0 };
  const fall = (1 - k / dur) ** 2;
  return { x: jit(at, k, amp) * fall, y: jit(at, k + 40, amp) * fall };
};
/** The frames at which something heavy lands: the same moments the mixer gives a slam or a stamp. */
const impacts = (scenes: SceneData[]): number[] =>
  scenes.flatMap((sc, i) => {
    const families: string[] = SCENES[sc.type]?.sounds(sc.props || {}, sc.variant) || [];
    return sc.cues.flatMap((c, k) => (families[k] === 'slam' ? [sc.from + c + MOTION.impact - 1] : families[k] === 'stamp' ? [sc.from + c + (i > 0 && k === 0 ? FIRST_CUE_DELAY : 0)] : []));
  });

const SceneLayer: React.FC<{ scene: SceneData; frame: number; index: number; vid: number }> = ({ scene, frame, index, vid }) => {
  const C = SCENE_COMPONENTS[scene.type];
  const local = frame - scene.from;
  const seed = vid * 100 + index * 7 + 3;
  const src = scene.source ? drop(local, 8, seed + 90, [-24, 150, 5], true) : null;
  return (
    <>
      {C ? <C scene={scene} frame={local} seed={seed} /> : null}
      {scene.source && src?.on ? (
        <Layer depth={1}>
          <Slip text={`Source: ${scene.source}`} size={21} seed={vid + 91} tape rot={-1.4 + src.r} style={{ left: 86 + src.x, top: 1410 + src.y }} />
        </Layer>
      ) : null}
    </>
  );
};

const Series: React.FC<{ handle: string | null; id: string }> = ({ handle, id }) => {
  const t = useLook();
  return (
    <div style={{ position: 'absolute', left: 78, top: 244, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 17, height: 17, background: t.accent, transform: 'rotate(-4deg)' }} />
      <Label size={25} color={t.type}>
        {handle ? `${handle} · No. ${id}` : `No. ${id}`}
      </Label>
    </div>
  );
};

export const Short: React.FC<ShortProps> = (props) => {
  const real = useCurrentFrame();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perf: Record<string, boolean> = (props as any).perf || {};
  const vid = num(props.id);
  const seed = vid * 13 + 5;
  const hits = useMemo(() => impacts(props.scenes || []), [props.scenes]);

  if (props.only === 'backdrop') {
    return (
      <Materials>
        <LookProvider value={tokens(props.look.accent, props.look.inverted)}>
          <AbsoluteFill>
            <Desk />
            <Scraps seed={seed} />
          </AbsoluteFill>
        </LookProvider>
      </Materials>
    );
  }

  const total = props.durationInFrames;
  const pb = props.patternBreak;
  const inBreak = !!pb && real >= pb.frame && real < pb.frame + pb.frames;
  // freeze: the picture holds on the break, then catches up with the sound
  const frame = inBreak && pb.kind === 'freeze' ? pb.frame : real;
  const flipped = inBreak && pb.kind === 'invert';
  const look = tokens(props.look.accent, props.look.inverted !== flipped);
  const backdrop = flipped ? props.backdropAlt : props.backdrop;

  const d = drift(frame, seed);
  const s = [...hits.map((h) => shake(frame, h, 14, 9)), pb ? shake(real, pb.frame, 7, 8) : { x: 0, y: 0 }].reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
  const punch = pb && real >= pb.frame ? (pb.kind === 'zoom' ? 0.1 : pb.kind === 'invert' ? 0.045 : 0.02) * (1 - settle(ramp(real, pb.frame, pb.frames + 6))) : 0;
  const cam = perf.noCamera ? { x: 0, y: 0, rot: 0, zoom: 1 } : perf.noRotate ? { x: d.x + s.x, y: d.y + s.y, rot: 0, zoom: d.zoom + punch } : { x: d.x + s.x, y: d.y + s.y, rot: d.rot, zoom: d.zoom + punch };

  const scenes = props.scenes;
  let i = 0;
  scenes.forEach((sc, k) => {
    if (frame >= sc.from) i = k;
  });
  const cur = scenes[i];
  const prev = i > 0 ? scenes[i - 1] : null;
  const T = cur.enter ? TRANSITION_FRAMES[cur.enter as keyof typeof TRANSITION_FRAMES] : 0;
  const moving = !!prev && !!cur.enter && frame - cur.from < T;

  const furniture = (
    <>
      <Layer depth={0.3}>
        <Backdrop src={backdrop} seed={seed} />
      </Layer>
      {perf.noDeck ? null : (
        <Layer depth={1.2}>
          <Deck kind={props.deck} seed={seed} />
        </Layer>
      )}
    </>
  );
  const incoming = <SceneLayer scene={cur} frame={frame} index={i} vid={vid} />;
  const outgoing = prev ? <SceneLayer scene={prev} frame={frame} index={i - 1} vid={vid} /> : null;

  let stage: React.ReactNode = incoming;
  if (moving && cur.enter === 'tear') {
    const x = lerp(1240, -220, ramp(onTwos(frame), cur.from, T) ** 1.15);
    stage = (
      <>
        {incoming}
        {/* the page being torn off: its white core shows along the tear, and it casts a shadow on what is underneath */}
        <AbsoluteFill style={{ filter: `drop-shadow(16px 4px 14px ${rgba(SHADOW, 0.4)})` }}>
          <AbsoluteFill style={{ clipPath: `path('${tornLeft(x, seed + i, 16)}')`, background: BRIGHT }} />
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: `path('${tornLeft(x, seed + i)}')` }}>
          {furniture}
          {outgoing}
        </AbsoluteFill>
      </>
    );
  } else if (moving && cur.enter === 'whip') {
    const g = glide(ramp(frame, cur.from, T));
    stage = (
      <>
        <AbsoluteFill style={{ transform: `translateX(${(1300 * (1 - g)).toFixed(1)}px)`, filter: 'url(#whip)' }}>{incoming}</AbsoluteFill>
        <AbsoluteFill style={{ transform: `translateX(${(-1300 * g).toFixed(1)}px)`, filter: 'url(#whip)' }}>{outgoing}</AbsoluteFill>
      </>
    );
  } else if (moving && cur.enter === 'fold') {
    const p = glide(ramp(onTwos(frame), cur.from, T));
    stage = (
      <>
        {incoming}
        <AbsoluteFill style={{ perspective: 2000 }}>
          <AbsoluteFill style={{ transformOrigin: '50% 0%', transform: `rotateX(${(96 * p).toFixed(1)}deg)`, filter: `brightness(${(1 - 0.3 * p).toFixed(3)}) drop-shadow(0 30px 30px ${rgba(SHADOW, 0.35)})`, backfaceVisibility: 'hidden' }}>
            {furniture}
            {outgoing}
          </AbsoluteFill>
        </AbsoluteFill>
      </>
    );
  }

  const loopIn = props.loopFrames > 0 ? clamp((real - (total - props.loopFrames) + 1) / props.loopFrames) : 0;
  const last = scenes[scenes.length - 1];
  const ctaDrop = props.cta && last.type !== 'stacks' ? drop(real, total - 84, seed + 70, [-30, 140, 5], true) : null;

  return (
    <Materials>
      <LookProvider value={look}>
        <AbsoluteFill id="short-root" style={{ overflow: 'hidden', background: look.ground }}>
          {perf.noFilter || perf.noBlend || perf.noClip ? (
            <style>{`${perf.noFilter ? '#short-root * { filter: none !important; }' : ''} ${perf.noBlend ? '#short-root * { mix-blend-mode: normal !important; background-blend-mode: normal !important; }' : ''} ${perf.noClip ? '#short-root * { clip-path: none !important; }' : ''}`}</style>
          ) : null}
          <svg width={0} height={0} style={{ position: 'absolute' }}>
            <filter id="whip" x="-20%" y="0" width="140%" height="100%">
              <feGaussianBlur stdDeviation="38 0" />
            </filter>
          </svg>
          <Camera seed={seed} cam={cam}>
            {furniture}
            {stage}
            {ctaDrop?.on ? (
              <Layer depth={1}>
                <Slip text={props.cta || ''} size={22} seed={seed + 71} rot={1.2 + ctaDrop.r} style={{ left: 86 + ctaDrop.x, top: 1316 + ctaDrop.y }} lift={0.3} />
              </Layer>
            ) : null}
          </Camera>
          {loopIn > 0 ? (
            <AbsoluteFill style={{ opacity: loopIn }}>
              <Camera seed={seed} cam={drift(0, seed)}>
                <Layer depth={0.3}>
                  <Backdrop src={props.backdrop} seed={seed} />
                </Layer>
                <Layer depth={1.2}>
                  <Deck kind={props.deck} seed={seed} />
                </Layer>
                <SceneLayer scene={scenes[0]} frame={0} index={0} vid={vid} />
              </Camera>
            </AbsoluteFill>
          ) : null}
          {inBreak && pb.kind === 'freeze' ? <AbsoluteFill style={{ border: `16px solid ${look.type}`, pointerEvents: 'none' }} /> : null}
          {inBreak && pb.kind !== 'invert' && real - pb.frame < 3 ? <AbsoluteFill style={{ background: BRIGHT, opacity: 0.5 * (1 - (real - pb.frame) / 3), pointerEvents: 'none' }} /> : null}
          <Series handle={props.handle} id={props.id} />
          {perf.noCaptions ? null : <Captions pages={props.captions} />}
          {props.audio ? <Audio src={staticFile(props.audio)} /> : null}
          {props.probe ? <Probe /> : null}
        </AbsoluteFill>
      </LookProvider>
    </Materials>
  );
};
