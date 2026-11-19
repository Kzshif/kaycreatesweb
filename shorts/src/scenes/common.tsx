// What every Paper Money scene shares: when its reveal steps happen, how paper arrives (on twos,
// with weight) and how type arrives (smoothly, at full frame rate).
import React from 'react';
import { CAPTION } from '../shared/paper.mjs';
import { FIRST_CUE_DELAY } from '../shared/sound.mjs';
import { Slip, airborne, fit, glide, headStyle, lerp, onTwos, ramp, settle, thump, useLook, wobble } from '../paper/kit';
import { Specks, Stamp, StampTool, stampHeight } from '../paper/things';
import type { SceneData } from '../types';

/** Frame (from the scene's start) of reveal step i. A step the scene does not have never arrives. */
export const cue = (scene: SceneData, i: number): number => (i < scene.cues.length ? scene.cues[i] + (i === 0 && scene.enter ? FIRST_CUE_DELAY : 0) : Infinity);

export type Drop = { x: number; y: number; r: number; lift: number; on: boolean };
/**
 * A piece of paper arriving, on twos: it drops in from `from` (x, y, degrees), overshoots,
 * settles, and afterwards keeps the slight nudge a hand gives it between exposures.
 */
export const drop = (frame: number, at: number, seed: number, from: [number, number, number] = [0, -230, -12], still = false): Drop => {
  const f = onTwos(frame);
  if (!(f >= at)) return { x: 0, y: 0, r: 0, lift: 1, on: false };
  const p = thump(f, at, 9, 0.1);
  const wb = !still && f > at + 12 ? wobble(seed, frame, 0.6) : { x: 0, y: 0, r: 0 };
  return { x: from[0] * (1 - p) + wb.x, y: from[1] * (1 - p) + wb.y, r: from[2] * (1 - p) + wb.r, lift: airborne(f, at, 6), on: true };
};
/** Type gliding into place at full frame rate. */
export const rise = (frame: number, at: number, dist = 40, dur = 8): { opacity: number; y: number; on: boolean } => {
  const p = settle(ramp(frame, at, dur));
  return { opacity: p, y: dist * (1 - p), on: frame >= at };
};
export type Amount = { prefix: string; number: number; decimals: number; suffix: string; tail?: string };
/** A figure counting up to its value, smooth, landing exactly on it. */
export const counting = (frame: number, at: number, dur: number, c: Amount): string => {
  const v = c.number * glide(ramp(frame, at, dur));
  // thousands are grouped as written: "1,000", "13,706"; smaller figures keep their decimals
  const text = c.number >= 1000 ? Number(v.toFixed(c.decimals)).toLocaleString('en-US', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals }) : v.toFixed(c.decimals);
  return `${c.prefix}${text}${c.suffix}`;
};

const LEAD = 0.94;
/** Height taken by headline lines set as large as `width` and `max` allow. */
export const linesHeight = (lines: string[], width: number, max: number): number => (lines.length ? lines.length * fit(lines, 'headline', width, max) * LEAD : 0);
/** Headline lines, one size for all, each gliding up into place (`stagger` frames apart). */
export const Lines: React.FC<{ lines: string[]; frame: number; at: number; x: number; y: number; width: number; max: number; stagger?: number; color?: string; align?: 'left' | 'center' }> = ({ lines, frame, at, x, y, width, max, stagger = 0, color, align = 'left' }) => {
  const t = useLook();
  const size = fit(lines, 'headline', width, max);
  return (
    <>
      {lines.map((l, i) => {
        const r = rise(frame, at + i * stagger, 36, 8);
        return r.on ? (
          <div key={i} style={{ ...headStyle(size, color || t.type), position: 'absolute', left: x, width: align === 'center' ? width : undefined, textAlign: align, top: y + i * size * LEAD + r.y, opacity: r.opacity }}>
            {l}
          </div>
        ) : null;
      })}
    </>
  );
};

/** A label slip that drops in on twos. */
export const Kicker: React.FC<{ text?: string; frame: number; at: number; seed: number; x?: number; y?: number; size?: number; rot?: number }> = ({ text, frame, at, seed, x = 86, y = 314, size = 25, rot = -2 }) => {
  if (!text) return null;
  const d = drop(frame, at, seed, [-26, -150, -14]);
  return d.on ? <Slip text={text} size={size} seed={seed} tape rot={rot + d.r} lift={0.16 + d.lift * 0.5} style={{ left: x + d.x, top: y + d.y }} /> : null;
};

/**
 * A rubber stamp coming down at frame `at`: the tool waits at `rest`, drops in three steps, sits
 * for a beat, and is lifted clear, leaving worn ink and a few thrown specks behind.
 */
export const StampSlam: React.FC<{ frame: number; at: number; x: number; y: number; width: number; lines: string[]; max?: number; sub?: string; seed: number; rest?: [number, number] }> = ({ frame, at, x, y, width, lines, max = 150, sub, seed, rest = [880, 205] }) => {
  const f2 = onTwos(frame);
  const down = glide(ramp(f2, at - 7.5, 7.5));
  const up = glide(ramp(f2, at + 5, 12));
  const k = frame < at + 5 ? down : 1 - up;
  const h = stampHeight(lines, width, max, sub);
  const tool = { x: lerp(rest[0], x + width / 2 - 117, k), y: lerp(rest[1], y + h / 2 - 236, k), rot: lerp(15, -9, k), lift: lerp(1.15, 0.05, k) };
  const squeeze = 1 + 0.07 * (1 - settle(ramp(frame, at, 4)));
  return (
    <>
      {frame >= at ? (
        <>
          <Specks seed={seed + 1} n={15} spread={[width + 40, h + 80]} style={{ left: x - 20, top: y - 30 }} />
          <div style={{ position: 'absolute', left: x, top: y, width, transform: `scale(${squeeze.toFixed(3)})`, transformOrigin: '50% 50%' }}>
            <Stamp lines={lines} sub={sub} width={width} max={max} rot={-9} seed={seed} style={{ left: 0, top: 0 }} />
          </div>
        </>
      ) : null}
      <StampTool size={270} lift={tool.lift} style={{ left: tool.x, top: tool.y, transform: `rotate(${tool.rot.toFixed(1)}deg)` }} />
    </>
  );
};

/** How far the lowest corner of a stamp `width` wide, tilted -9deg, drops below its untilted box. */
export const stampTilt = (width: number): number => Math.ceil((width / 2) * Math.sin((9 * Math.PI) / 180));

export type Stack = { bottom: number };
/**
 * A stamp scene stacks a hero (a big figure, or the headline itself), lines and a stamp, and all
 * of it has to rest above the subtitle strip. `layout(hero, stamp, smax)` places everything for
 * one hero size and returns the stack's lowest point. This finds the biggest hero that keeps the
 * stack above the strip: the stamp as written if that costs the hero no more than 15%, else the
 * stamp's words on one line, else a smaller stamp. If nothing fits, the smallest layout is
 * returned and QA reports the text it leaves under the subtitles.
 */
export function fitStack<T extends Stack>(o: { natural: number; min: number; stamp: string[]; layout: (hero: number, stamp: string[], smax: number) => T; floor?: number }): T & { hero: number; stamp: string[]; smax: number } {
  const floor = o.floor ?? CAPTION.top;
  const options = o.stamp.length > 1 ? [o.stamp, [o.stamp.join(' ')]] : [o.stamp];
  const biggest = (stamp: string[], smax: number) => {
    for (let hero = o.natural; hero >= o.min; hero -= 4) {
      const r = o.layout(hero, stamp, smax);
      if (r.bottom <= floor) return { ...r, hero, stamp, smax };
    }
    return null;
  };
  for (const smax of [150, 120, 96]) {
    const found = options.map((s) => biggest(s, smax)).filter((r): r is T & { hero: number; stamp: string[]; smax: number } => r !== null);
    if (!found.length) continue;
    const kept = found.find((r) => r.stamp === o.stamp);
    if (kept && kept.hero >= 0.85 * o.natural) return kept;
    return found.reduce((a, b) => (b.hero > a.hero ? b : a));
  }
  const last = options[options.length - 1];
  return { ...o.layout(o.min, last, 96), hero: o.min, stamp: last, smax: 96 };
}
