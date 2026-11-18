// Paper Money kit: the materials every scene is cut from. Paper with visible tooth, edges that are
// scissor-cut or torn, shadows that say how far a piece floats above the desk, the three type
// roles, and the two speeds of motion (paper on twos, type smooth). See identity/paper-money.md.
import { loadFont } from '@remotion/fonts';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import bricolage from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2';
import fraunces from '@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2';
import dmMono400 from '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2';
import dmMono500 from '@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2';
import { BRIGHT, CARD, CREAM, FRAME, INK_DESK, MANILA, MOTION, SHADOW, TYPE, mix, rgba, tokens } from '../shared/paper.mjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tokens = Record<string, any>;
export type Pt = [number, number];
type Style = React.CSSProperties;

// ------------------------------------------------------------- materials
const GRAIN = 'paper/grain.png';
const GRAIN_DARK = 'paper/grain-dark.png';
export const WEAR = 'paper/wear.png';

let ready: Promise<void> | null = null;
/** Fonts and textures, loaded once per browser tab. Nothing renders before they are in. */
export const loadMaterials = (): Promise<void> => {
  if (!ready) {
    const image = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`texture failed to load: ${src}`));
        img.src = staticFile(src);
      });
    ready = Promise.all([
      loadFont({ family: TYPE.headline.family, url: bricolage, weight: '200 800', stretch: '75% 100%', format: 'woff2' }),
      loadFont({ family: TYPE.numeral.family, url: fraunces, weight: '100 900', format: 'woff2' }),
      loadFont({ family: TYPE.label.family, url: dmMono400, weight: '400', format: 'woff2' }),
      loadFont({ family: TYPE.label.family, url: dmMono500, weight: '500', format: 'woff2' }),
      image(GRAIN),
      image(GRAIN_DARK),
      image(WEAR),
    ]).then(() => undefined);
  }
  return ready;
};

/** Holds the render until fonts and textures are loaded, so no frame is ever drawn without them. */
export const Materials: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender('paper materials'));
  useEffect(() => {
    loadMaterials().then(() => {
      setOk(true);
      continueRender(handle);
    });
  }, [handle]);
  return ok ? <>{children}</> : null;
};

const Look = createContext<Tokens>(tokens('green', false));
export const LookProvider = Look.Provider;
export const useLook = (): Tokens => useContext(Look);

// ---------------------------------------------------------- randomness
/** A repeatable number in 0..1 from any list of numbers. Never Math.random: every frame must redraw the same. */
export const hash = (...n: number[]): number => {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.round(v * 977) | 0;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
export const jit = (seed: number, i: number, amount = 1): number => (hash(seed, i) * 2 - 1) * amount;

// --------------------------------------------------------------- motion
const STEP = FRAME.fps / MOTION.stepsPerSecond; // 2.5 frames
/** Paper moves on twos: time, held for 2 or 3 frames at a go. */
export const onTwos = (frame: number): number => Math.floor(frame / STEP) * STEP;
export const stepOf = (frame: number): number => Math.floor(frame / STEP);
export const clamp = (v: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** 0 before `at`, 1 after `at + dur`. */
export const ramp = (frame: number, at: number, dur: number): number => clamp((frame - at) / Math.max(0.0001, dur));

// No stock easings: these are the channel's own curves.
/** Fast out, long soft landing. */
export const settle = (t: number): number => 1 - (1 - clamp(t)) ** 3.4;
/** Slow in, slow out, weighted towards the end: for camera moves and counters. */
export const glide = (t: number): number => {
  const x = clamp(t);
  return x < 0.5 ? 0.5 * (2 * x) ** 2.6 : 1 - 0.5 * (2 - 2 * x) ** 2.6;
};
/** Something with weight arriving: goes past its mark, comes back, settles. 0 -> 1 over about `dur` frames. */
export const thump = (frame: number, at: number, dur = 14, over = 0.11): number => {
  const t = (frame - at) / dur;
  if (t <= 0) return 0;
  if (t >= 1.6) return 1;
  // a damped spring, solved: first touch at ~0.36, one overshoot, settled by 1
  const w = 8.7;
  const z = 0.5 - over;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
};
/** How far a piece is above the desk during an arrival: 1 in the air, 0 once it has landed (drives the shadow). */
export const airborne = (frame: number, at: number, dur = MOTION.impact): number => 1 - settle(ramp(frame, at, dur));
/** The little nudge a hand gives each exposure: changes once per step, never between. */
export const wobble = (seed: number, frame: number, amount = 1): { x: number; y: number; r: number } => {
  const s = stepOf(frame);
  return { x: jit(seed, s * 3 + 1, 1.1 * amount), y: jit(seed, s * 3 + 2, 1.1 * amount), r: jit(seed, s * 3 + 3, 0.32 * amount) };
};
/** A number counting up, smooth at full frame rate. */
export const countTo = (frame: number, at: number, dur: number, value: number, decimals = 0): string => (value * glide(ramp(frame, at, dur))).toFixed(decimals);

// --------------------------------------------------------------- camera
type Cam = { x: number; y: number; rot: number; zoom: number };
const CameraCtx = createContext<Cam>({ x: 0, y: 0, rot: 0, zoom: 1 });
/** The camera never quite stops: a slow drift over the desk, different for every video. */
export const drift = (frame: number, seed = 1, amount = 1): Cam => {
  const p = (k: number) => hash(seed, k) * Math.PI * 2;
  return {
    x: (11 * Math.sin(frame / 97 + p(1)) + 5 * Math.sin(frame / 41 + p(2))) * amount,
    y: (13 * Math.sin(frame / 123 + p(3)) + 4 * Math.sin(frame / 53 + p(4))) * amount,
    rot: 0.16 * Math.sin(frame / 151 + p(5)) * amount,
    zoom: 1.02 + 0.008 * Math.sin(frame / 173 + p(6)) * amount,
  };
};
export const Camera: React.FC<{ seed?: number; amount?: number; cam?: Partial<Cam>; children: React.ReactNode }> = ({ seed = 1, amount = 1, cam, children }) => {
  const frame = useCurrentFrame();
  const c = { ...drift(frame, seed, amount), ...cam };
  return (
    <CameraCtx.Provider value={c}>
      <AbsoluteFill style={{ transform: `scale(${c.zoom}) rotate(${c.rot}deg)`, transformOrigin: '50% 45%' }}>{children}</AbsoluteFill>
    </CameraCtx.Provider>
  );
};
/** A layer of the desk. Higher `depth` slides further as the camera drifts, which reads as height. */
export const Layer: React.FC<{ depth?: number; style?: Style; children?: React.ReactNode }> = ({ depth = 1, style, children }) => {
  const c = useContext(CameraCtx);
  return <AbsoluteFill style={{ transform: `translate(${(c.x * depth).toFixed(2)}px, ${(c.y * depth).toFixed(2)}px)`, ...style }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- edges
const D = (pts: Pt[]): string => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;
const along = (a: Pt, b: Pt, t: number, off = 0): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [a[0] + dx * t - (dy / len) * off, a[1] + dy * t + (dx / len) * off];
};
/** A side cut with scissors: straight runs with the odd slight change of direction. */
const cutSide = (a: Pt, b: Pt, seed: number, w = 1.5): Pt[] => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const kinks = Math.max(1, Math.min(4, Math.round(len / 190)));
  const out: Pt[] = [a];
  for (let k = 1; k <= kinks; k++) out.push(along(a, b, (k - 0.5 + jit(seed, k, 0.22)) / kinks, jit(seed, k + 20, w)));
  return out;
};
/** A torn side: ragged, with the big swerves a real tear has. `out` pushes the whole edge outwards. */
const tornSide = (a: Pt, b: Pt, seed: number, rough = 4, out = 0): Pt[] => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(6, Math.round(len / 7));
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const t = k / n;
    const ends = Math.min(1, Math.min(t, 1 - t) * 8); // meet the corners cleanly
    const big = Math.sin(t * 9 + hash(seed, 1) * 6) * 0.55 + Math.sin(t * 23 + hash(seed, 2) * 6) * 0.3;
    pts.push(along(a, b, t + jit(seed, k + 50, 0.25 / n), (big * rough + jit(seed, k, rough * 0.55)) * ends - out));
  }
  return pts;
};
/** A side cut with pinking shears: the top and bottom of a receipt. */
const zigSide = (a: Pt, b: Pt, tooth = 15, depth = 8): Pt[] => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.round(len / tooth));
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    pts.push(along(a, b, k / n, 0));
    pts.push(along(a, b, (k + 0.5) / n, depth));
  }
  return pts;
};
export type Edges = string; // four letters, top right bottom left: c = cut, t = torn, z = zigzag
/**
 * A sheet of paper w x h. `edges` says how each side was made. Returns the outline and, for torn
 * sides, the slightly larger outline of the white core that shows around a tear.
 */
export const sheet = (w: number, h: number, { seed = 1, edges = 'cccc', m = 7, rough = 4, tooth = 15 }: { seed?: number; edges?: Edges; m?: number; rough?: number; tooth?: number } = {}): { d: string; core?: string } => {
  const c: Pt[] = [[m, m], [w - m, m], [w - m, h - m], [m, h - m]];
  const side = (i: number, core: boolean): Pt[] => {
    const a = c[i];
    const b = c[(i + 1) % 4];
    const kind = edges[i] || 'c';
    if (kind === 't') return tornSide(a, b, seed * 7 + i + (core ? 100 : 0), core ? rough * 1.25 : rough, core ? 3.2 : 0);
    if (kind === 'z') return zigSide(a, b, tooth, -m * 0.95);
    return cutSide(a, b, seed * 7 + i);
  };
  const outline = (core: boolean) => D([0, 1, 2, 3].flatMap((i) => side(i, core)));
  return { d: outline(false), core: edges.includes('t') ? outline(true) : undefined };
};
/** A shape with rounded corners, cut by hand: cards, phones, tags. */
export const rounded = (w: number, h: number, r: number, seed = 1, m = 4): string => {
  const pts: Pt[] = [];
  const corners: [number, number, number][] = [[w - m - r, m + r, -90], [w - m - r, h - m - r, 0], [m + r, h - m - r, 90], [m + r, m + r, 180]];
  corners.forEach(([cx, cy, start], ci) => {
    for (let k = 0; k <= 7; k++) {
      const a = ((start + (k / 7) * 90) * Math.PI) / 180;
      const rr = r + jit(seed, ci * 10 + k, Math.min(1.2, r * 0.04));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
  });
  return D(pts);
};
/** A disc cut with scissors: not quite round. */
export const disc = (r: number, seed = 1, m = 3): string => {
  const pts: Pt[] = [];
  const n = 44;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rr = r - m + jit(seed, k, Math.min(1.1, r * 0.012));
    pts.push([r + Math.cos(a) * rr, r + Math.sin(a) * rr]);
  }
  return D(pts);
};
/** Any straight-sided shape, each side cut by hand. */
export const poly = (points: Pt[], seed = 1, w = 1.4): string => D(points.flatMap((p, i) => cutSide(p, points[(i + 1) % points.length], seed * 5 + i, w)));

// ----------------------------------------------------------------- paper
type CutProps = {
  w: number;
  h: number;
  /** outline, from sheet() / rounded() / disc() / poly() or any SVG path */
  d: string;
  core?: string;
  color: string;
  /** 0 lying on the desk, 1 held well above it: sets how far the shadow falls */
  lift?: number;
  /** a dark paper (the phone, the ink chip): its tooth is screened on instead of multiplied */
  dark?: boolean;
  /** false for a piece inside a group that casts one shadow together */
  shadow?: boolean;
  seed?: number;
  style?: Style;
  children?: React.ReactNode;
};
/** The warm shadow under a piece of paper: tight when it lies flat, longer and softer as it lifts. */
export const shadowOf = (lift: number): string => {
  const L = clamp(lift, 0, 1.4);
  return `drop-shadow(${(1 + L * 10).toFixed(1)}px ${(1.8 + L * 19).toFixed(1)}px ${(1.3 + L * 12).toFixed(1)}px ${rgba(SHADOW, 0.36 - L * 0.11)})`;
};
/**
 * One piece of cut paper: colour, tooth, an edge and a warm shadow underneath.
 * (One shadow and a blended background rather than two shadows and an overlay: measured, the
 * richer version doubled render time for a difference nobody sees at video speed.)
 */
export const Cut: React.FC<CutProps> = ({ w, h, d, core, color, lift = 0.22, dark = false, shadow = true, seed = 1, style, children }) => {
  const ox = Math.round(hash(seed, 71) * 512);
  const oy = Math.round(hash(seed, 72) * 512);
  return (
    <div style={{ position: 'absolute', width: w, height: h, filter: shadow ? shadowOf(lift) : undefined, ...style }}>
      {core ? <div style={{ position: 'absolute', inset: 0, clipPath: `path('${core}')`, background: BRIGHT }} /> : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `path('${d}')`,
          backgroundColor: color,
          backgroundImage: `url(${staticFile(dark ? GRAIN_DARK : GRAIN)})`,
          backgroundSize: '512px 512px',
          backgroundPosition: `${ox}px ${oy}px`,
          backgroundBlendMode: dark ? 'screen' : 'multiply',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** The desk: paper with tooth, lit unevenly from the upper left. */
export const Desk: React.FC = () => {
  const t = useLook();
  const dark = t.inverted;
  return (
    <AbsoluteFill style={{ background: t.ground }}>
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile(dark ? GRAIN_DARK : GRAIN)})`, backgroundSize: '512px 512px', mixBlendMode: dark ? 'screen' : 'multiply', opacity: dark ? 0.9 : 1 }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 95% 62% at 22% 13%, ${dark ? 'rgba(255, 236, 200, 0.13)' : 'rgba(255, 252, 240, 0.62)'} 0%, rgba(255, 252, 240, 0) 72%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 118% 96% at 34% 30%, rgba(0, 0, 0, 0) 48%, ${dark ? 'rgba(0, 0, 0, 0.5)' : rgba(SHADOW, 0.2)} 100%)`, mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  );
};
/** The same light falling on whatever lies on the desk. Goes above the objects, below the captions. */
export const Light: React.FC = () => {
  const t = useLook();
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse 120% 100% at 32% 28%, rgba(0, 0, 0, 0) 55%, ${t.inverted ? 'rgba(0, 0, 0, 0.28)' : rgba(SHADOW, 0.1)} 100%)`, mixBlendMode: 'multiply', pointerEvents: 'none' }} />;
};

/**
 * Loose sheets lying round the edges of the desk, different for every video (by `seed`). They
 * keep clear of the stage, so nothing is ever written across an edge, and on the ink desk they
 * are dark papers so cream type stays readable.
 */
export const Scraps: React.FC<{ seed?: number }> = ({ seed = 1 }) => {
  const t = useLook();
  const papers = t.inverted ? [mix(CREAM, INK_DESK, 0.1), mix(CREAM, INK_DESK, 0.17), mix(t.accent, INK_DESK, 0.3)] : [CARD, MANILA, t.accentWash];
  const flip = hash(seed, 1) > 0.5;
  const X = (x: number, w: number) => (flip ? FRAME.width - x - w : x);
  const R = (r: number) => (flip ? -r : r);
  const items = [
    // a big sheet under the lower half of the frame
    { w: 760, h: 700, x: -150 + jit(seed, 2, 50), y: 1330 + jit(seed, 3, 40), r: -7 + jit(seed, 4, 3), c: papers[0], e: 'tctc', lift: 0.1 },
    // a second one crossing it from the other side
    { w: 620, h: 560, x: 590 + jit(seed, 5, 50), y: 1500 + jit(seed, 6, 50), r: 9 + jit(seed, 7, 4), c: papers[1], e: 'tttt', lift: 0.16 },
    // a strip of the video's own colour, mostly off the bottom
    { w: 520, h: 150, x: 250 + jit(seed, 8, 120), y: 1760 + jit(seed, 9, 30), r: -3 + jit(seed, 10, 5), c: papers[2], e: 'ctct', lift: 0.22 },
    // something peeking in at the top
    { w: 560, h: 330, x: 620 + jit(seed, 11, 80), y: -190 + jit(seed, 12, 30), r: 6 + jit(seed, 13, 5), c: papers[hash(seed, 14) > 0.5 ? 0 : 1], e: 'tttt', lift: 0.12 },
  ];
  return (
    <>
      {items.map((it, i) => {
        const shape = sheet(it.w, it.h, { seed: seed * 13 + i, edges: it.e, rough: 5, m: 13 });
        return <Cut key={i} w={it.w} h={it.h} d={shape.d} core={t.inverted ? undefined : shape.core} color={it.c} dark={t.inverted} seed={seed + i} lift={it.lift} style={{ left: X(it.x, it.w), top: it.y, transform: `rotate(${R(it.r)}deg)` }} />;
      })}
    </>
  );
};

// ------------------------------------------------------------------ type
const widths = new Map<string, number>();
const spans: Partial<Record<'headline' | 'numeral' | 'label', HTMLSpanElement>> = {};
/**
 * Width in px of text in one of the three roles, measured the way the page draws it: a hidden span
 * with the role's own style. Canvas text cannot be trusted here: it ignores Fraunces' SOFT and WONK
 * axes, Bricolage's width axis and the labels' capitals, and came out about 5% narrower than the page.
 * Fonts are loaded before anything is measured.
 */
export const measure = (text: string, role: 'headline' | 'numeral' | 'label', size: number, track?: number): number => {
  const key = `${role}|${track ?? ''}|${text}`;
  let em = widths.get(key);
  if (em === undefined) {
    if (typeof document === 'undefined') return text.length * size * 0.56;
    let span = spans[role];
    if (!span) {
      span = document.createElement('span');
      const style = role === 'headline' ? headStyle(200, '#000') : role === 'numeral' ? numStyle(200) : labelStyle(200, '#000');
      for (const [k, v] of Object.entries(style)) (span.style as unknown as Record<string, string>)[k] = k === 'fontSize' ? `${v}px` : String(v);
      Object.assign(span.style, { position: 'absolute', left: '-99999px', top: '0', visibility: 'hidden', whiteSpace: 'nowrap', lineHeight: '1' });
      document.body.appendChild(span);
      spans[role] = span;
    }
    span.style.letterSpacing = `${track ?? TYPE[role].tracking}em`;
    span.textContent = text;
    // a numeral's hatched shade sits 4.5% of the size to the right of the figure
    em = span.getBoundingClientRect().width / 200 + (role === 'numeral' ? 0.045 : 0);
    widths.set(key, em);
  }
  return em * size;
};
/** The largest size (up to `max`) at which every line fits `width`. */
export const fit = (lines: string[], role: 'headline' | 'numeral' | 'label', width: number, max: number, min = 20, track?: number): number =>
  Math.max(min, Math.min(max, ...lines.map((l) => Math.floor((width / Math.max(1, measure(l, role, 100, track))) * 100))));

export const headStyle = (size: number, color: string): Style => ({
  fontFamily: `"${TYPE.headline.family}"`,
  fontWeight: TYPE.headline.weight,
  fontStretch: `${TYPE.headline.width + 0.5}%`,
  // optical size pinned to the display cut: with it left on auto, small headlines draw a wider
  // design than the one they were measured in, and run about 5% past their planned edge
  fontVariationSettings: `"opsz" ${TYPE.headline.opsz}`,
  fontSize: size,
  letterSpacing: `${TYPE.headline.tracking}em`,
  lineHeight: TYPE.headline.leading,
  color,
  whiteSpace: 'nowrap',
});
export const numStyle = (size: number): Style => ({
  fontFamily: `"${TYPE.numeral.family}"`,
  fontWeight: TYPE.numeral.weight,
  fontVariationSettings: `"opsz" ${TYPE.numeral.opsz}, "SOFT" ${TYPE.numeral.soft}, "WONK" ${TYPE.numeral.wonk}`,
  fontSize: size,
  letterSpacing: `${TYPE.numeral.tracking}em`,
  lineHeight: 0.86,
  whiteSpace: 'nowrap',
});
export const labelStyle = (size: number, color: string): Style => ({
  fontFamily: `"${TYPE.label.family}"`,
  fontWeight: TYPE.label.weight,
  fontSize: size,
  letterSpacing: `${TYPE.label.tracking}em`,
  textTransform: 'uppercase',
  lineHeight: 1.25,
  color,
  whiteSpace: 'nowrap',
});

/** Headline: Bricolage Grotesque, extra bold, tight, as large as the width allows. */
export const Headline: React.FC<{ lines: string[]; width: number; max?: number; color?: string; align?: 'left' | 'center'; style?: Style }> = ({ lines, width, max = 150, color, align = 'left', style }) => {
  const t = useLook();
  const size = fit(lines, 'headline', width, max);
  return (
    <div style={{ ...headStyle(size, color || t.type), textAlign: align, ...style }}>
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

/** A banknote numeral: Fraunces at its blackest, with an engraver's hatched shade behind it. */
export const Numeral: React.FC<{ text: string; size: number; color?: string; shade?: string; gap?: string; style?: Style }> = ({ text, size, color, shade, gap, style }) => {
  const t = useLook();
  const off = Math.max(5, size * 0.04);
  const line = Math.max(2.1, size * 0.0085);
  return (
    <span style={{ position: 'relative', display: 'inline-block', ...numStyle(size), ...style }}>
      <span
        aria-hidden
        data-noprobe
        style={{
          position: 'absolute',
          left: off,
          top: off,
          color: 'transparent',
          backgroundImage: `repeating-linear-gradient(-45deg, ${shade || t.accent} 0 ${line}px, transparent ${line}px ${line * 2.35}px)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }}
      >
        {text}
      </span>
      <span style={{ position: 'relative', color: color || t.type, WebkitTextStroke: `${Math.max(2, size * 0.022)}px ${gap || t.ground}`, paintOrder: 'stroke fill' }}>{text}</span>
    </span>
  );
};

/** Small labels and sources: DM Mono, capitals, widely spaced. */
export const Label: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: Style }> = ({ children, size = 26, color, style }) => {
  const t = useLook();
  return <div style={{ ...labelStyle(size, color || t.typeSoft), ...style }}>{children}</div>;
};

// --------------------------------------------------------- small fixings
/** A strip of masking tape, torn at both ends. */
export const Tape: React.FC<{ w?: number; h?: number; seed?: number; style?: Style }> = ({ w = 118, h = 40, seed = 1, style }) => {
  const d = useMemo(() => sheet(w, h, { seed, edges: 'ctct', m: 3, rough: 2.2 }).d, [w, h, seed]);
  return (
    <div style={{ position: 'absolute', width: w, height: h, filter: `drop-shadow(0.5px 1px 0.8px ${rgba(SHADOW, 0.3)})`, ...style }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: `path('${d}')`, background: rgba(MANILA, 0.86), backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 45%, ${rgba(SHADOW, 0.08)})` }} />
    </div>
  );
};

/** A paper clip, drawn in ink line. */
export const Clip: React.FC<{ size?: number; style?: Style }> = ({ size = 92, style }) => {
  const t = useLook();
  const metal = t.inverted ? '#CFC6B4' : '#3A352C';
  return (
    <svg width={size * 0.46} height={size} viewBox="0 0 46 100" style={{ position: 'absolute', overflow: 'visible', filter: `drop-shadow(1px 2px 1px ${rgba(SHADOW, 0.35)})`, ...style }}>
      <path d="M33 30 V78 a10 10 0 0 1 -20 0 V20 a15 15 0 0 1 30 0 V84 a20 20 0 0 1 -40 0 V34" fill="none" stroke={metal} strokeWidth={4.6} strokeLinecap="round" />
      <path d="M33 30 V78 a10 10 0 0 1 -20 0 V20 a15 15 0 0 1 30 0 V84 a20 20 0 0 1 -40 0 V34" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.3} strokeLinecap="round" transform="translate(-0.9 -0.9)" />
    </svg>
  );
};

/** A small paper slip carrying a label, optionally taped down: sources, tags, names. */
export const Slip: React.FC<{ text: string; size?: number; seed?: number; paper?: string; ink?: string; tape?: boolean; rot?: number; style?: Style; lift?: number }> = ({ text, size = 26, seed = 1, paper, ink, tape = false, rot = 0, style, lift = 0.16 }) => {
  const t = useLook();
  const w = Math.ceil(measure(text.toUpperCase(), 'label', size)) + 46;
  const h = Math.round(size * 1.25) + 30;
  const d = useMemo(() => sheet(w, h, { seed, edges: 'cccc', m: 5 }).d, [w, h, seed]);
  return (
    <div style={{ position: 'absolute', width: w, height: h, transform: `rotate(${rot}deg)`, ...style }}>
      <Cut w={w} h={h} d={d} color={paper || BRIGHT} seed={seed} lift={lift}>
        <div style={{ ...labelStyle(size, ink || t.ink), position: 'absolute', left: 23, top: 15 }}>{text}</div>
      </Cut>
      {tape ? <Tape w={78} h={30} seed={seed + 3} style={{ left: -30, top: -9, transform: 'rotate(-28deg)' }} /> : null}
    </div>
  );
};
