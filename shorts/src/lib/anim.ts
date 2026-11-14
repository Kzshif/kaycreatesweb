import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CSSProperties } from 'react';
import { useLook, type Look } from '../look';
import type { SceneData } from '../types';

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 -> 1 over `dur` frames starting at `from`, eased. */
export const tween = (frame: number, from: number, dur: number, easing: (t: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(frame, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

export const linear = (frame: number, from: number, dur: number) => tween(frame, from, dur, (t) => t);

type Enter = Look['enter'] | 'fade' | 'slide';

/** CSS for something entering with progress p (0 hidden -> 1 settled), in the look's motion style. */
export const enterStyle = (p: number, kind: Enter, travel: number, visible: boolean): CSSProperties => {
  if (!visible) return { visibility: 'hidden' };
  switch (kind) {
    case 'pop':
      return { transform: `scale(${lerp(0.7, 1, p)})`, opacity: clamp(p * 2.5) };
    case 'rise':
      return { transform: `translateY(${(1 - p) * travel}px)`, opacity: clamp(p * 1.6) };
    case 'drop':
      return { transform: `translateY(${-(1 - p) * travel}px)`, opacity: clamp(p * 2.2) };
    case 'wipe':
      return { clipPath: `inset(-12% ${clamp(1 - p) * 100}% -12% -4%)` };
    case 'slide':
      return { transform: `translateX(${-(1 - p) * Math.max(40, travel)}px)`, opacity: clamp(p * 2) };
    default:
      return { opacity: clamp(p) };
  }
};

/** Everything a scene needs: its frame, its cues and the look's motion. */
export const useScene = (scene: SceneData) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = useLook();
  const cues = scene.cues;
  /** frame at which step i happens (the last cue is reused if i is out of range) */
  const at = (i: number) => (cues.length ? cues[Math.min(i, cues.length - 1)] + (i >= cues.length ? (i - cues.length + 1) * 8 : 0) : 0);
  /** has step i started? */
  const on = (i: number, delay = 0) => frame >= at(i) + delay;
  /** spring progress since step i (0 before it, settling at 1) */
  const sp = (i: number, delay = 0, cfg = look.spring) => spring({ frame: frame - at(i) - delay, fps, config: cfg });
  /** eased 0 -> 1 over `dur` frames since step i */
  const tw = (i: number, dur: number, delay = 0) => tween(frame, at(i) + delay, dur);
  /** entrance CSS for something appearing at step i, in the look's motion style */
  const enter = (i: number, delay = 0, kind: Enter = look.enter): CSSProperties => {
    const p = kind === 'wipe' ? tween(frame, at(i) + delay, 9, Easing.out(Easing.quad)) : sp(i, delay);
    return enterStyle(p, kind, look.travel, on(i, delay));
  };
  return { frame, fps, look, cues, at, on, sp, tw, enter, duration: scene.duration };
};

/** Plain spring helper for things not tied to a cue. */
export const useSpring = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = useLook();
  return (from: number, cfg = look.spring) => spring({ frame: frame - from, fps, config: cfg });
};
