// Paper Money: the money itself. Coins as engraved discs, stacks of them as the channel's bar
// chart, banknotes with guilloche line work that draws itself on, a note cut by scissors as the
// channel's pie chart. Everything is drawn here, in code: no images, no logos, no real currency.
import React, { useId, useMemo } from 'react';
import { staticFile } from 'remotion';
import { BRIGHT, SHADOW, TYPE, contrast, mix, rgba } from '../shared/paper.mjs';
import { Cut, clamp, disc, hash, jit, poly, useLook, type Pt } from './kit';

type Style = React.CSSProperties;
const NUM = { fontFamily: `"${TYPE.numeral.family}"`, fontWeight: 900, fontVariationSettings: `"opsz" 144, "SOFT" 100, "WONK" 1` } as const;
const MONO = { fontFamily: `"${TYPE.label.family}"`, fontWeight: 500 } as const;
const uid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');

/** A closed wavy ring: the lathe-work at the heart of banknote engraving. */
const rosette = (cx: number, cy: number, r0: number, amp: number, lobes: number, phase = 0, squash = 1): string => {
  const pts: string[] = [];
  const n = lobes * 14;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = r0 + amp * Math.cos(lobes * a + phase);
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r * squash).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};
/** A sine line between two x positions: woven in fours, it becomes a guilloche band. */
const wave = (x0: number, x1: number, y: number, amp: number, period: number, phase: number): string => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 3) pts.push(`${x.toFixed(1)} ${(y + amp * Math.sin(((x - x0) / period) * Math.PI * 2 + phase)).toFixed(1)}`);
  return `M${pts.join('L')}`;
};

// ------------------------------------------------------------------ coin
/** A coin lying face up: an engraved disc of accent paper. */
export const Coin: React.FC<{ r: number; symbol?: string; seed?: number; lift?: number; style?: Style }> = ({ r, symbol = '$', seed = 1, lift = 0.25, style }) => {
  const t = useLook();
  const d = useMemo(() => disc(r, seed), [r, seed]);
  const line = t.accentDeep;
  const ticks = useMemo(() => {
    let p = '';
    for (let k = 0; k < 84; k++) {
      const a = (k / 84) * Math.PI * 2;
      p += `M${(Math.cos(a) * r * 0.91).toFixed(1)} ${(Math.sin(a) * r * 0.91).toFixed(1)}L${(Math.cos(a) * r * 0.985).toFixed(1)} ${(Math.sin(a) * r * 0.985).toFixed(1)}`;
    }
    return p;
  }, [r]);
  return (
    <Cut w={r * 2} h={r * 2} d={d} color={t.accent} seed={seed} lift={lift} style={style}>
      <svg data-noprobe width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`} style={{ position: 'absolute', inset: 0 }}>
        <path d={ticks} stroke={line} strokeWidth={Math.max(1.2, r * 0.017)} />
        <circle r={r * 0.885} fill="none" stroke={line} strokeWidth={r * 0.03} />
        {Array.from({ length: 40 }, (_, k) => {
          const a = (k / 40) * Math.PI * 2;
          return <circle key={k} cx={Math.cos(a) * r * 0.8} cy={Math.sin(a) * r * 0.8} r={r * 0.017} fill={line} />;
        })}
        <circle r={r * 0.72} fill="none" stroke={line} strokeWidth={r * 0.018} />
        <path d={rosette(0, 0, r * 0.56, r * 0.1, 12)} fill="none" stroke={line} strokeWidth={Math.max(1, r * 0.011)} />
        <path d={rosette(0, 0, r * 0.56, r * 0.1, 12, Math.PI)} fill="none" stroke={line} strokeWidth={Math.max(1, r * 0.011)} />
        <path d={rosette(0, 0, r * 0.4, r * 0.035, 20)} fill="none" stroke={line} strokeWidth={Math.max(0.9, r * 0.009)} />
        <text x={0} y={r * 0.3} textAnchor="middle" fontSize={r * 0.86} fill={t.onAccent} style={NUM}>
          {symbol}
        </text>
      </svg>
    </Cut>
  );
};

// ------------------------------------------------------------ coin stack
export type Fall = { dy?: number; rot?: number; dx?: number; show?: boolean };
/**
 * A stack of coins seen from the side: the channel's bar. `count` whole coins, never stretched,
 * so the picture can be checked against the figure. `fall(i)` poses coin i while it is arriving.
 */
export const CoinStack: React.FC<{ count: number; w: number; th: number; seed?: number; symbol?: string; fall?: (i: number) => Fall; style?: Style }> = ({ count, w, th, seed = 1, symbol = '$', fall, style }) => {
  const t = useLook();
  const id = uid(useId());
  const e = w * 0.135; // how much of each coin's face the viewpoint shows
  const pad = 14;
  const air = 260; // room above for a coin still falling
  const W = w + pad * 2;
  const H = count * th + e * 2 + pad * 2 + air;
  const base = H - pad - e;
  const face = mix(BRIGHT, t.accent, 0.16);
  const line = t.accentDeep;
  const coins = Array.from({ length: count }, (_, i) => {
    const f = fall ? fall(i) : {};
    const x0 = pad + jit(seed, i, w * 0.018) + (f.dx || 0);
    const yb = base - i * th - (f.dy || 0);
    const yt = yb - th;
    const x1 = x0 + w;
    const band = `M${x0} ${yt}A${w / 2} ${e} 0 0 0 ${x1} ${yt}L${x1} ${yb}A${w / 2} ${e} 0 0 1 ${x0} ${yb}Z`;
    return { i, x0, x1, yt, yb, band, rot: f.rot || 0, moved: !!(f.dy || f.rot || f.dx), show: f.show !== false };
  }).filter((c) => c.show);
  const top = coins[coins.length - 1];
  // a coin shows its face when nothing sits squarely on it: the top one, and the one under a coin still landing
  const open = new Set(coins.filter((c, k) => c === top || c.moved || coins[k + 1]?.moved).map((c) => c.i));
  return (
    <div style={{ position: 'absolute', width: W, height: H, filter: `drop-shadow(2px 4px 2.5px ${rgba(SHADOW, 0.34)}) drop-shadow(8px 14px 14px ${rgba(SHADOW, 0.18)})`, ...style }}>
      <svg data-noprobe width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <pattern id={`reed${id}`} width={w / 27} height={10} patternUnits="userSpaceOnUse">
            <rect width={Math.max(1.6, w / 95)} height={10} fill={line} />
          </pattern>
          <pattern id={`grain${id}`} width={512} height={512} patternUnits="userSpaceOnUse">
            <image href={staticFile('paper/grain.png')} width={512} height={512} />
          </pattern>
        </defs>
        {coins.map((c) => {
          const cx = (c.x0 + c.x1) / 2;
          return (
            <g key={c.i} transform={c.rot ? `rotate(${c.rot} ${cx} ${(c.yt + c.yb) / 2})` : undefined}>
              <path d={c.band} fill={t.accent} />
              <path d={c.band} fill={`url(#reed${id})`} opacity={0.5} />
              <path d={c.band} fill="none" stroke={line} strokeWidth={2.4} strokeLinejoin="round" />
              {open.has(c.i) ? (
                <>
                  <ellipse cx={cx} cy={c.yt} rx={w / 2} ry={e} fill={face} stroke={line} strokeWidth={2.4} />
                  <ellipse cx={cx} cy={c.yt} rx={w * 0.41} ry={e * 0.8} fill="none" stroke={line} strokeWidth={1.5} />
                  <ellipse cx={cx} cy={c.yt} rx={w * 0.33} ry={e * 0.64} fill="none" stroke={line} strokeWidth={1} strokeDasharray="2 4" />
                  <text x={cx} y={c.yt} textAnchor="middle" fontSize={w * 0.3} fill={line} transform={`translate(0 ${e * 0.36}) translate(${cx} ${c.yt}) scale(1 ${((e * 2) / w).toFixed(3)}) translate(${-cx} ${-c.yt})`} style={NUM}>
                    {symbol}
                  </text>
                </>
              ) : null}
              <path d={c.band} fill={`url(#grain${id})`} style={{ mixBlendMode: 'multiply' }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
/** The box a stack is drawn in, and where its foot sits inside it (for placing it on a baseline). */
export const stackBox = (count: number, w: number, th: number): { W: number; H: number; foot: number } => {
  const H = count * th + w * 0.135 * 2 + 28 + 260;
  return { W: w + 28, H, foot: H - 14 };
};
/** Height in px of a stack of `count` coins (for placing labels above it). */
export const stackHeight = (count: number, w: number, th: number): number => count * th + w * 0.135 * 2;

// ------------------------------------------------------------------ note
type NoteArt = { w: number; h: number; draw?: number; title?: string; symbol?: string; serial?: string };
const Art: React.FC<NoteArt & { line: string; text: string }> = ({ w, h, draw = 1, title = 'PAPER MONEY', symbol = '$', serial = 'NO 001', line, text }) => {
  const k = h / 340;
  const sw = (v: number) => Math.max(0.9, v * k);
  // each stroke draws itself on, one after another
  let n = 0;
  const pen = (): { pathLength: number; strokeDasharray: number; strokeDashoffset: number } => {
    const start = (Math.min(n++, 30) / 30) * 0.58; // staggered, and all of them finished when draw reaches 1
    return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp((draw - start) / 0.42) };
  };
  const inkIn = clamp((draw - 0.7) / 0.3);
  const bandX0 = 40 * k;
  const bandX1 = w - 40 * k;
  const medal = (cx: number, lobesA: number, lobesB: number) => {
    const R = h * 0.265;
    return (
      <g>
        <circle cx={cx} cy={h / 2} r={R} fill="none" stroke={line} strokeWidth={sw(2.4)} {...pen()} />
        <circle cx={cx} cy={h / 2} r={R * 0.9} fill="none" stroke={line} strokeWidth={sw(0.9)} {...pen()} />
        <path d={rosette(cx, h / 2, R * 0.68, R * 0.17, lobesA)} fill="none" stroke={line} strokeWidth={sw(1)} {...pen()} />
        <path d={rosette(cx, h / 2, R * 0.68, R * 0.17, lobesA, Math.PI)} fill="none" stroke={line} strokeWidth={sw(1)} {...pen()} />
        <path d={rosette(cx, h / 2, R * 0.47, R * 0.07, lobesB)} fill="none" stroke={line} strokeWidth={sw(0.9)} {...pen()} />
        <path d={rosette(cx, h / 2, R * 0.47, R * 0.07, lobesB, Math.PI)} fill="none" stroke={line} strokeWidth={sw(0.9)} {...pen()} />
        <text x={cx} y={h / 2 + R * 0.3} textAnchor="middle" fontSize={R * 0.9} fill={text} opacity={inkIn} style={NUM}>
          {symbol}
        </text>
      </g>
    );
  };
  return (
    <svg data-noprobe width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: 0 }}>
      <rect x={15 * k} y={15 * k} width={w - 30 * k} height={h - 30 * k} fill="none" stroke={line} strokeWidth={sw(3.4)} {...pen()} />
      <rect x={23 * k} y={23 * k} width={w - 46 * k} height={h - 46 * k} fill="none" stroke={line} strokeWidth={sw(1)} {...pen()} />
      {[0, 1, 2, 3].map((j) => (
        <path key={`t${j}`} d={wave(bandX0, bandX1, 46 * k, 10 * k, 38 * k, (j * Math.PI) / 2)} fill="none" stroke={line} strokeWidth={sw(1)} {...pen()} />
      ))}
      {[0, 1, 2, 3].map((j) => (
        <path key={`b${j}`} d={wave(bandX0, bandX1, h - 46 * k, 10 * k, 38 * k, (j * Math.PI) / 2 + 0.6)} fill="none" stroke={line} strokeWidth={sw(1)} {...pen()} />
      ))}
      {medal(w * 0.185, 11, 17)}
      {medal(w * 0.815, 9, 15)}
      <text x={w / 2} y={h / 2 - 22 * k} textAnchor="middle" fontSize={25 * k} letterSpacing={`${0.2}em`} fill={text} opacity={inkIn} style={MONO}>
        {title.toUpperCase()}
      </text>
      <path d={`M${w * 0.34} ${h / 2 - 4 * k}H${w * 0.66}`} stroke={line} strokeWidth={sw(2.2)} {...pen()} />
      <path d={`M${w * 0.34} ${h / 2 + 3 * k}H${w * 0.66}`} stroke={line} strokeWidth={sw(0.9)} {...pen()} />
      <text x={w / 2} y={h / 2 + 34 * k} textAnchor="middle" fontSize={15 * k} letterSpacing="0.3em" fill={text} opacity={inkIn * 0.85} style={MONO}>
        {serial.toUpperCase()}
      </text>
      <text x={w / 2} y={h - 70 * k} textAnchor="middle" fontSize={8.5 * k} letterSpacing="0.22em" fill={text} opacity={inkIn * 0.7} style={MONO}>
        PAPER MONEY · NOT LEGAL TENDER · PAPER MONEY · NOT LEGAL TENDER
      </text>
    </svg>
  );
};

/**
 * A banknote. Whole by default; with `from`/`to` (0-1 across its width) it is one of the pieces
 * left after scissors went through it, with the cut side slightly ragged.
 */
export const Note: React.FC<NoteArt & { seed?: number; lift?: number; from?: number; to?: number; style?: Style }> = ({ w, h, seed = 1, lift = 0.25, from = 0, to = 1, style, ...art }) => {
  const t = useLook();
  const paper = mix(t.accent, BRIGHT, 0.1);
  const line = contrast(t.accent, paper) >= 3 ? t.accent : t.accentDeep;
  const x0 = Math.round(w * from);
  const x1 = Math.round(w * to);
  const pw = x1 - x0;
  const d = useMemo(() => {
    const m = 5;
    const cutEdge = (x: number, top: boolean): Pt[] => {
      // scissors do not cut a perfectly straight line: a few shallow facets
      const pts: Pt[] = [];
      const n = 6;
      for (let k = 0; k <= n; k++) {
        const y = top ? m + ((h - 2 * m) * k) / n : h - m - ((h - 2 * m) * k) / n;
        pts.push([x + jit(seed + 9, k, 3.2) + (k % 2 ? 2 : -2), y]);
      }
      return pts;
    };
    const left: Pt[] = from > 0 ? cutEdge(m + 3, false) : [[m, h - m], [m, m]];
    const right: Pt[] = to < 1 ? cutEdge(pw - m - 3, true) : [[pw - m, m], [pw - m, h - m]];
    return poly([...right, ...left], seed, from > 0 || to < 1 ? 0.4 : 1.4);
  }, [w, h, seed, from, to, pw]);
  return (
    <Cut w={pw} h={h} d={d} color={paper} seed={seed + Math.round(from * 10)} lift={lift} style={style}>
      <div style={{ position: 'absolute', left: -x0, top: 0, width: w, height: h }}>
        <Art w={w} h={h} line={line} text={t.accentDeep} {...art} />
      </div>
    </Cut>
  );
};

// -------------------------------------------------------------- scissors
/** A pair of scissors cut from paper. Points up; `open` is the angle between the blades. */
export const Scissors: React.FC<{ size?: number; open?: number; style?: Style }> = ({ size = 300, open = 26, style }) => {
  const t = useLook();
  const s = size / 300;
  const blade = (dir: 1 | -1) => (
    <g transform={`rotate(${(dir * open) / 2})`}>
      <path d={`M${-13 * dir} 6 L${-4 * dir} -168 Q0 -180 ${5 * dir} -166 L${17 * dir} 4 Z`} fill={BRIGHT} stroke={t.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${2 * dir} -150 L${11 * dir} -6`} stroke={mix(t.ink, BRIGHT, 0.28)} strokeWidth={2} />
      <path d={`M${2 * dir} 2 Q${-10 * dir} 46 ${-34 * dir} 70`} fill="none" stroke={t.accent} strokeWidth={17} strokeLinecap="round" />
      <ellipse cx={-52 * dir} cy={98} rx={33} ry={40} fill="none" stroke={t.accent} strokeWidth={17} transform={`rotate(${-24 * dir} ${-52 * dir} 98)`} />
      <ellipse cx={-52 * dir} cy={98} rx={33} ry={40} fill="none" stroke={t.accentDeep} strokeWidth={2} transform={`rotate(${-24 * dir} ${-52 * dir} 98)`} opacity={0.55} />
    </g>
  );
  return (
    <svg
      width={220 * s}
      height={340 * s}
      viewBox="-110 -190 220 340"
      style={{ position: 'absolute', overflow: 'visible', filter: `drop-shadow(2px 4px 2px ${rgba(SHADOW, 0.34)}) drop-shadow(9px 16px 14px ${rgba(SHADOW, 0.2)})`, ...style }}
    >
      {blade(-1)}
      {blade(1)}
      <circle r={8.5} fill={t.ink} />
      <circle r={3} fill={BRIGHT} />
    </svg>
  );
};

/** A few coins scattered as if dropped: decoration that says "money" without a number. */
export const Scatter: React.FC<{ n: number; r: number; seed?: number; spread?: [number, number]; style?: Style }> = ({ n, r, seed = 1, spread = [260, 200], style }) => (
  <div style={{ position: 'absolute', ...style }}>
    {Array.from({ length: n }, (_, i) => (
      <Coin key={i} r={r * (0.82 + hash(seed, i + 40) * 0.36)} seed={seed + i} lift={0.18 + hash(seed, i) * 0.2} style={{ left: jit(seed, i + 10, spread[0] / 2), top: jit(seed, i + 20, spread[1] / 2), transform: `rotate(${jit(seed, i + 30, 40)}deg)` }} />
    ))}
  </div>
);
