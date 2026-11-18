// Scenes built around a relationship: money flowing between two names, two cards side by side,
// headline lines with a marker pen, and so-many-out-of-so-many as a tray of coins.
import React from 'react';
import { BRIGHT, MANILA, TEXT_RIGHT } from '../shared/paper.mjs';
import { Cut, Headline, Label, Layer, Numeral, clamp, fit, glide, headStyle, jit, measure, onTwos, ramp, rounded, sheet, useLook } from '../paper/kit';
import { Coin } from '../paper/money';
import { Product } from '../paper/products';
import type { SceneProps } from '../types';
import { Kicker, Lines, counting, cue, drop, rise } from './common';

/** Break a line into as few lines as fit `width` at `size`. */
const wrap = (text: string, width: number, size: number): string[] => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && measure(next, 'headline', size) > width) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
};

// ------------------------------------------------------------------ flow
const NameCard: React.FC<{ name: string; product?: string; w: number; seed: number; lift: number; style: React.CSSProperties }> = ({ name, product, w, seed, lift, style }) => {
  const t = useLook();
  const h = 156;
  return (
    <div style={{ position: 'absolute', width: w, height: h, ...style }}>
      <Cut w={w} h={h} d={sheet(w, h, { seed, m: 6 }).d} color={BRIGHT} seed={seed} lift={lift}>
        <div data-box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: product ? 136 : 30 }}>
          <div style={headStyle(fit([name], 'headline', w - (product ? 166 : 64), 88), t.ink)}>{name}</div>
        </div>
      </Cut>
      {product ? (
        <div style={{ position: 'absolute', left: product === 'phone' ? 40 : 18, top: product === 'phone' ? 14 : 22, transform: 'rotate(-6deg)' }}>
          <Product name={product} w={product === 'phone' ? 62 : 104} seed={seed + 3} />
        </div>
      ) : null}
    </div>
  );
};

/** Coins travel from one name to another along a drawn line: who pays whom. */
export const Flow: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const t = useLook();
  const c0 = cue(scene, 0);
  const c1 = cue(scene, 1);
  const c2 = p.note ? cue(scene, 2) : Infinity;
  const f2 = onTwos(frame);
  const a = drop(frame, c0, seed + 1, [-40, -220, -10]);
  const b = drop(frame, c0 + 4, seed + 2, [40, -220, 10]);
  const P0: [number, number] = [330, 500];
  const P1: [number, number] = [760, 470];
  const P2: [number, number] = [690, 800];
  const at = (u: number): [number, number] => [(1 - u) ** 2 * P0[0] + 2 * u * (1 - u) * P1[0] + u * u * P2[0], (1 - u) ** 2 * P0[1] + 2 * u * (1 - u) * P1[1] + u * u * P2[1]];
  const drawn = glide(ramp(frame, c0 + 8, 12));
  const rest: [number, number][] = [[786, 742], [842, 784], [748, 700], [866, 716], [808, 672], [770, 776]];
  const amount = p.amountShort || '';
  const fig = rise(frame, c1 + 2, 40, 8);
  const size = amount ? fit([amount], 'numeral', 440, 170) : 0;
  return (
    <>
      <Layer depth={1}>
        <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
          <path d={`M${P0[0]} ${P0[1]} Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke={t.type} strokeWidth={6} strokeLinecap="round" strokeDasharray="0.022 0.02" pathLength={1} strokeDashoffset={0} opacity={drawn * 0.85} />
          {drawn > 0.95 ? <path d={`M${P2[0]} ${P2[1]} l-34 -14 M${P2[0]} ${P2[1]} l10 -36`} fill="none" stroke={t.type} strokeWidth={6} strokeLinecap="round" /> : null}
        </svg>
        {a.on ? <NameCard name={p.from.name} product={p.from.product} w={400} seed={seed + 1} lift={0.3 + a.lift * 0.5} style={{ left: 84 + a.x, top: 346 + a.y, transform: `rotate(${-3 + a.r}deg)` }} /> : null}
        {b.on ? <NameCard name={p.to.name} product={p.to.product} w={400} seed={seed + 2} lift={0.3 + b.lift * 0.5} style={{ left: 480 + b.x, top: 816 + b.y, transform: `rotate(${3 + b.r}deg)` }} /> : null}
        {amount && fig.on ? (
          <div style={{ position: 'absolute', left: 78, top: 600 + fig.y, opacity: fig.opacity }}>
            <Numeral text={amount} size={size} />
          </div>
        ) : null}
        {p.note ? <Kicker text={p.note} frame={frame} at={c2} seed={seed + 6} x={86} y={600 + size * 0.86 + 26} size={23} rot={-1.5} /> : null}
      </Layer>
      <Layer depth={1.5}>
        {rest.map((r, j) => {
          const start = c1 + j * 4;
          const u = glide(ramp(f2, start, 12));
          if (!(f2 >= start)) return null;
          const pos = u < 1 ? at(u) : r;
          const settleIn = u < 1 ? 0 : glide(ramp(f2, start + 12, 5));
          const x = u < 1 ? pos[0] : at(1)[0] + (r[0] - at(1)[0]) * settleIn;
          const y = u < 1 ? pos[1] : at(1)[1] + (r[1] - at(1)[1]) * settleIn;
          return <Coin key={j} r={44} seed={seed + 20 + j} lift={u < 1 ? 0.9 : 0.25} style={{ left: x - 44, top: y - 44, transform: `rotate(${jit(seed + 21, j, 40) + u * 90}deg)` }} />;
        })}
      </Layer>
    </>
  );
};

// ----------------------------------------------------------------- split
/** Two cards side by side: before and after, this against that. */
export const Split: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const t = useLook();
  const c0 = cue(scene, 0);
  const c1 = cue(scene, 1);
  const c2 = p.verdict ? cue(scene, 2) : Infinity;
  const tilt = scene.variant === 'tilt';
  const w = 396;
  const h = 520;
  const cards = [
    { side: p.a, x: 78, y: 330, rot: tilt ? -4 : -2.4, at: c0, paper: BRIGHT, ink: t.ink, shade: t.accent, gap: BRIGHT },
    { side: p.b, x: 484, y: tilt ? 392 : 366, rot: tilt ? 3.4 : 2, at: c1, paper: tilt ? t.accent : t.accentWash, ink: tilt ? t.onAccent : t.ink, shade: tilt ? t.accentDeep : t.accent, gap: tilt ? t.accent : t.accentWash },
  ];
  const v = rise(frame, c2 - 2, 34, 8);
  const under = glide(ramp(frame, c2 + 4, 9));
  const vSize = p.verdict ? fit([p.verdict], 'headline', 800, 78) : 0;
  return (
    <Layer depth={1}>
      {cards.map((c, i) => {
        const d = drop(frame, c.at, seed + i, [i ? 50 : -50, -260, i ? 10 : -10]);
        if (!d.on || !c.side) return null;
        const fs = fit([c.side.figure || ''], 'numeral', w - 64, 150);
        const body = wrap(c.side.line || '', w - 60, 54).slice(0, 3);
        return (
          <Cut key={i} w={w} h={h} d={sheet(w, h, { seed: seed + 10 + i, m: 7 }).d} color={c.paper} seed={seed + 10 + i} lift={0.3 + d.lift * 0.7} style={{ left: c.x + d.x, top: c.y + d.y, transform: `rotate(${c.rot + d.r}deg)` }}>
            <div data-box style={{ position: 'absolute', inset: 0 }}>
              <Label size={23} color={c.ink} style={{ position: 'absolute', left: 32, top: 34 }}>
                {c.side.tag}
              </Label>
              <div style={{ position: 'absolute', left: 28, top: 96 }}>
                <Numeral text={c.side.figure || ''} size={fs} color={c.ink} shade={c.shade} gap={c.gap} />
              </div>
              <div style={{ position: 'absolute', left: 32, top: 110 + fs * 0.86 + 26 }}>
                <Headline lines={body} width={w - 60} max={54} color={c.ink} />
              </div>
            </div>
          </Cut>
        );
      })}
      {p.verdict && v.on ? (
        <div style={{ position: 'absolute', left: 84, top: 914 + v.y, opacity: v.opacity }}>
          <Headline lines={[p.verdict]} width={800} max={78} />
          <svg width={840} height={26} style={{ position: 'absolute', left: -4, top: vSize * 0.94, overflow: 'visible' }}>
            <path d={`M0 12 C ${measure(p.verdict, 'headline', vSize) * 0.3} 2, ${measure(p.verdict, 'headline', vSize) * 0.6} 20, ${measure(p.verdict, 'headline', vSize) + 6} 9`} fill="none" stroke={t.accent} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - under} />
          </svg>
        </div>
      ) : null}
    </Layer>
  );
};

// ----------------------------------------------------------------- words
/** Headline lines, one at a time, as large as the frame allows, with a marker over the words that matter. */
export const Words: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const t = useLook();
  const lines: string[] = p.lines || [];
  const marks: string[] = Array.isArray(p.mark) ? p.mark : p.mark ? [p.mark] : [];
  const ladder = scene.variant === 'ladder';
  // the last line's right edge stays on TEXT_RIGHT, ladder or not
  const width = TEXT_RIGHT - 82 - (ladder ? (lines.length - 1) * 30 : 0);
  const size = Math.min(fit(lines, 'headline', width, 176), 640 / Math.max(1, lines.length * 0.95));
  const back = drop(frame, cue(scene, 0) - 2, seed + 2, [-60, -100, -5], true);
  return (
    <>
      <Layer depth={0.55}>{back.on ? <Cut w={700} h={560} d={sheet(700, 560, { seed: seed + 2, edges: 'tttt', rough: 5, m: 13 }).d} core={sheet(700, 560, { seed: seed + 2, edges: 'tttt', rough: 5, m: 13 }).core} color={MANILA} seed={seed + 2} lift={0.1} style={{ left: 300 + back.x, top: 420 + back.y, transform: `rotate(${-6 + back.r}deg)` }} /> : null}</Layer>
      <Layer depth={1}>
        {lines.map((l, i) => {
          const at = cue(scene, i);
          const r = rise(frame, at - 1, 0, 7);
          if (!r.on) return null;
          const slide = 70 * (1 - r.opacity);
          const mark = marks.find((m) => l.includes(m));
          const mx = mark ? measure(l.slice(0, l.indexOf(mark)), 'headline', size) : 0;
          const mw = mark ? measure(mark, 'headline', size) : 0;
          const swipe = glide(ramp(frame, at + 5, 8));
          return (
            <div key={i} style={{ position: 'absolute', left: 82 + (ladder ? i * 30 : 0) - slide, top: 344 + i * size * 0.95, opacity: r.opacity, transform: ladder ? `rotate(${i % 2 ? 1 : -1}deg)` : undefined }}>
              {mark && swipe > 0.01 ? (
                <svg width={mw + 30} height={size * 1.1} style={{ position: 'absolute', left: mx - 14, top: 0, overflow: 'visible' }}>
                  <path d={`M0 ${size * 0.2 + jit(seed, i, 4)} L${(mw + 28) * swipe} ${size * 0.15 + jit(seed, i + 9, 4)} L${(mw + 28) * swipe + 6} ${size * 0.96} L4 ${size * 1.0} Z`} fill={t.inverted ? t.accent : t.hl} opacity={t.inverted ? 0.55 : 1} />
                </svg>
              ) : null}
              <div style={{ ...headStyle(size, t.type), position: 'relative' }}>{l}</div>
            </div>
          );
        })}
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------ grid
/** So many out of so many: the figure and what it means on top, a tray of discs under it whose coins light up. */
export const Grid: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const t = useLook();
  const c0 = cue(scene, 0);
  const c1 = cue(scene, 1);
  const c2 = p.label ? cue(scene, 2) : Infinity;
  const of: number = p.of || 100;
  const rows = of / 10;
  const figSize = Math.min(250, fit([p.figure || ''], 'numeral', 470, 250));
  const figW = measure(p.figure || '', 'numeral', figSize);
  const top = 318;
  const trayTop = top + figSize * 0.86 + 34;
  const pitch = Math.min(78, (996 - trayTop - 44) / rows, (826 - 44) / 10);
  const r = pitch * 0.4;
  const trayW = 10 * pitch + 44;
  const trayH = rows * pitch + 44;
  const X = 80 + (826 - trayW) / 2;
  const f2 = onTwos(frame);
  const tray = drop(frame, c0, seed, [0, -260, -6], true);
  const next = scene.cues.length > 2 ? cue(scene, 2) : scene.duration;
  const span = clamp(next - c1 - 8, 12, 36);
  const fillTo = clamp(Math.floor(((f2 - c1) / span) * p.filled) + (f2 >= c1 ? 1 : 0), 0, p.filled);
  const fig = rise(frame, c1, 30, 7);
  const amount = /%$/.test(p.figure || '') ? { prefix: '', number: parseFloat(p.figure), decimals: 0, suffix: '%' } : null;
  const figText = amount ? counting(frame, c1, span, amount) : p.figure;
  const labW = 826 - figW - 30;
  const lab = rise(frame, c2 - 2, 30, 8);
  if (!tray.on) return null;
  return (
    <Layer depth={1}>
      {fig.on ? (
        <div style={{ position: 'absolute', left: 74, top: top + fig.y, opacity: fig.opacity }}>
          <Numeral text={figText} size={figSize} />
        </div>
      ) : null}
      {p.label && lab.on ? (
        <div style={{ position: 'absolute', left: 74 + figW + 30, top: top + figSize * 0.12 + lab.y, opacity: lab.opacity }}>
          <Headline lines={wrap(p.label, labW, 58).slice(0, 3)} width={labW} max={58} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: X + tray.x, top: trayTop + tray.y, width: trayW, height: trayH, transform: `rotate(${-1 + tray.r}deg)` }}>
        <Cut w={trayW} h={trayH} d={rounded(trayW, trayH, 22, seed)} color={t.inverted ? '#2A2620' : t.card} dark={t.inverted} seed={seed} lift={0.3 + tray.lift * 0.6} />
        <svg data-noprobe width={trayW} height={trayH} style={{ position: 'absolute', left: 0, top: 0 }}>
          {Array.from({ length: of }, (_, i) => {
            const cx = 22 + (i % 10) * pitch + pitch / 2 + jit(seed, i, 1.5);
            const cy = 22 + Math.floor(i / 10) * pitch + pitch / 2 + jit(seed, i + 300, 1.5);
            const on = i < fillTo;
            return (
              <g key={i}>
                <circle cx={cx + 1.5} cy={cy + 2.5} r={r} fill="rgba(46, 32, 14, 0.3)" />
                <circle cx={cx} cy={cy} r={r} fill={on ? t.accent : BRIGHT} stroke={on ? t.accentDeep : 'rgba(21, 19, 15, 0.35)'} strokeWidth={on ? 2.4 : 1.6} />
                {on ? <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={t.accentDeep} strokeWidth={1.4} /> : null}
              </g>
            );
          })}
        </svg>
      </div>
    </Layer>
  );
};
