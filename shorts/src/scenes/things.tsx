// Scenes built around an object on the desk: a receipt, a price tag, a product, a stamp.
import React from 'react';
import { BRIGHT, MANILA, TEXT_RIGHT } from '../shared/paper.mjs';
import { Backing, Clip, Cut, Headline, Layer, Numeral, Tape, fit, glide, jit, onTwos, ramp, rounded, sheet, useLook } from '../paper/kit';
import { Coin } from '../paper/money';
import { Product, productHeight } from '../paper/products';
import { PriceTag, Receipt, receiptHeight, stampHeight } from '../paper/things';
import type { SceneProps } from '../types';
import { Kicker, Lines, StampSlam, counting, cue, drop, fitStack, linesHeight, rise, stampTilt } from './common';

const TALL = new Set(['fries', 'phone', 'tradingcard', 'sprout', 'can', 'rocket']);

// --------------------------------------------------------------- receipt
/** A receipt unrolls, prints its lines one at a time, and a marker goes over the one that matters. */
export const ReceiptScene: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const rows: { label: string; value: string; mark?: boolean }[] = p.rows || [];
  const n = rows.length;
  const hasMark = rows.some((r) => r.mark);
  const c0 = cue(scene, 0);
  const cMark = hasMark ? cue(scene, 1 + n) : Infinity;
  const w = 610;
  const h = receiptHeight(n, !!p.foot);
  // as large as the stage allows: never wider than 800, never past the stage's foot
  const K = Math.min(1.32, 800 / w, 660 / h);
  const X = 96;
  const Y = 318;
  const f2 = onTwos(frame);
  const reveal = glide(ramp(f2, c0, 12));
  const shown = rows.filter((_, i) => frame >= cue(scene, 1 + i)).length;
  const markOn = hasMark ? glide(ramp(frame, cMark, 8)) : 0;
  if (!(f2 >= c0)) return null;
  return (
    <>
      <Layer depth={1}>
        <div style={{ position: 'absolute', left: X, top: Y, width: w, height: h, transform: `rotate(-2.4deg) scale(${K})`, transformOrigin: '0 0' }}>
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(-80px -80px ${((1 - reveal) * h).toFixed(1)}px -80px)` }}>
            <Receipt w={w} title={p.title} rows={rows} foot={p.foot} seed={seed + 1} shown={shown} markOn={markOn} />
          </div>
          {reveal < 0.999 ? (
            <Cut w={w + 24} h={40} d={rounded(w + 24, 40, 18, seed + 2, 2)} color={MANILA} seed={seed + 2} lift={0.5} style={{ left: -12, top: reveal * h - 20 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 5, background: 'rgba(255, 255, 255, 0.35)' }} />
            </Cut>
          ) : null}
          {scene.variant === 'clip' ? <Clip size={100} style={{ left: 40, top: -34, transform: 'rotate(-6deg)' }} /> : <Tape w={130} h={42} seed={seed + 3} style={{ left: w / 2 - 65, top: -16, transform: 'rotate(-4deg)' }} />}
        </div>
      </Layer>
      <Layer depth={1.5}>
        {[[720, Y + h * K + 30, 66], [840, Y + h * K + 60, 54], [610, Y + h * K + 70, 58]].filter(([, y]) => y < 960).map(([x, y, r], i) => {
          const d = drop(frame, (hasMark ? cMark : cue(scene, n)) + 2 + i * 5, seed + 30 + i, [jit(seed + 30, i, 50), -300, jit(seed + 31, i, 40)]);
          return d.on ? <Coin key={i} r={r} seed={seed + 31 + i} lift={0.2 + d.lift * 0.6} style={{ left: x + d.x, top: y + d.y, transform: `rotate(${jit(seed + 32, i, 30) + d.r}deg)` }} /> : null;
        })}
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------- tag
/** A price tag swings in on its string and settles. */
export const TagScene: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const lines: string[] = p.lines || [];
  let k = 1;
  const c0 = cue(scene, 0);
  const cLines = lines.length ? cue(scene, k++) : Infinity;
  const cNote = p.note ? cue(scene, k++) : Infinity;
  const f2 = onTwos(frame);
  const s = f2 - c0;
  const swing = s < 0 ? null : 68 * Math.exp(-s / 9) * Math.cos(s / 3.1) + (p.product ? 5 : -3);
  const withProduct = !!p.product;
  const pw = withProduct ? (TALL.has(p.product) ? (p.product === 'phone' ? 250 : 330) : 400) : 0;
  const ph = withProduct ? productHeight(p.product, pw) : 0;
  const pd = drop(frame, c0 - 4, seed + 3, [0, -240, -8]);
  return (
    <>
      <Layer depth={1}>
        {withProduct && pd.on ? (
          <div style={{ position: 'absolute', left: 96 + pd.x, top: 994 - ph + pd.y, transform: `rotate(${-3 + pd.r}deg)`, transformOrigin: '50% 80%' }}>
            <Product name={p.product} w={pw} seed={seed + 7} text={p.text} price={p.cardPrice} />
          </div>
        ) : null}
        {withProduct ? (
          <Lines lines={lines} frame={frame} at={cLines - 2} x={84} y={316} width={800} max={96} stagger={5} />
        ) : (
          <Lines lines={lines} frame={frame} at={cLines - 2} x={556} y={452} width={TEXT_RIGHT - 556} max={108} stagger={5} />
        )}
        {p.note ? <Kicker text={p.note} frame={frame} at={cNote} seed={seed + 6} x={86} y={withProduct ? 316 + linesHeight(lines, 800, 96) + 24 : 924} size={23} rot={-1.5} /> : null}
      </Layer>
      {swing !== null ? (
        <Layer depth={1.35}>
          {withProduct ? (
            <PriceTag label={p.label} price={p.price} sub={p.sub} w={300} h={372} cord={90} swing={swing} seed={seed + 9} style={{ left: 640, top: 500 }} />
          ) : (
            <PriceTag label={p.label} price={p.price} sub={p.sub} w={410} h={490} cord={104} swing={swing} seed={seed + 9} style={{ left: 316, top: 300 }} />
          )}
        </Layer>
      ) : null}
    </>
  );
};

// --------------------------------------------------------------- product
/** A cut-paper product lands and is labelled, one plain line at a time. */
export const ProductScene: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const t = useLook();
  const callouts: string[] = p.callouts || [];
  const c0 = cue(scene, 0);
  const tall = TALL.has(p.product);
  const pw = tall ? (p.product === 'phone' ? 310 : 410) : Math.min(560, (430 * 520) / Math.max(1, productHeight(p.product, 520)));
  const ph = productHeight(p.product, pw);
  const px = tall ? 92 : 491 - pw / 2;
  const py = tall ? 996 - ph : 336;
  const d = drop(frame, c0, seed, [0, -280, -9]);
  const tx = tall ? px + pw + 40 : 84;
  const tw = tall ? TEXT_RIGHT - tx : 800;
  const max = tall ? 78 : 72;
  const size = callouts.length ? fit(callouts, 'headline', tw - 34, max) : 0;
  const gap = tall ? Math.min(170, 560 / Math.max(1, callouts.length)) : size * 1.16;
  const ty = tall ? 392 : py + ph + 34;
  const second = scene.variant === 'pair' && p.with ? drop(frame, c0 + 5, seed + 2, [80, -220, 10]) : null;
  return (
    <>
      <Layer depth={0.55}>{d.on ? <Backing w={620} h={600} seed={seed + 5} style={{ left: tall ? 40 : 230, top: tall ? 420 : 300, transform: `rotate(${tall ? -5 : 4}deg)` }} /> : null}</Layer>
      <Layer depth={1}>
        {second && second.on ? (
          <div style={{ position: 'absolute', left: (tall ? px + pw * 0.55 : px + pw * 0.62) + second.x, top: py + ph * 0.05 + second.y, transform: `rotate(${9 + second.r}deg)` }}>
            <Product name={p.with} w={pw * 0.56} seed={seed + 8} />
          </div>
        ) : null}
        {d.on ? (
          <div style={{ position: 'absolute', left: px + d.x, top: py + d.y, transform: `rotate(${(tall ? -4 : -1.5) + d.r}deg)`, transformOrigin: '50% 80%' }}>
            <Product name={p.product} w={pw} seed={seed + 7} text={p.text} price={p.price} />
          </div>
        ) : null}
        <Kicker text={p.kicker} frame={frame} at={c0 + 5} seed={seed + 4} x={tall ? tx : 86} y={tall ? 306 : 300} />
        {callouts.map((c, i) => {
          const r = rise(frame, cue(scene, 1 + i) - 2, 34, 8);
          return r.on ? (
            <div key={i} style={{ position: 'absolute', left: tx, top: ty + i * gap + r.y, opacity: r.opacity, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 18, height: 18, background: t.accent, transform: 'rotate(-5deg)', flex: 'none' }} />
              <Headline lines={[c]} width={tw - 34} max={size} />
            </div>
          ) : null;
        })}
      </Layer>
    </>
  );
};

// ----------------------------------------------------------------- stamp
/** A figure or a line, and then the verdict comes down on it. */
const STAMP_W = 540;

export const StampScene: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const lines: string[] = p.lines || [];
  const c0 = cue(scene, 0);
  const c2 = p.sub ? cue(scene, 1) : Infinity;
  const c1 = cue(scene, p.sub ? 2 : 1);
  const over = scene.variant !== 'under';
  const numTop = 392;
  const tilt = stampTilt(STAMP_W);
  // the figure (or, with no figure, the headline) is as big as it can be with the whole stack,
  // stamp included, resting above the subtitle strip
  const L = fitStack({
    natural: p.figure ? fit([p.figure], 'numeral', 690, 400) : lines.length ? fit(lines, 'headline', 800, 150) : 150,
    min: p.figure ? 220 : 72,
    stamp: p.stamp || [],
    layout: (hero, stamp, smax) => {
      const lmax = p.figure ? 84 : hero;
      const lh = linesHeight(lines, 800, lmax);
      const sh = stampHeight(stamp, STAMP_W, smax);
      if (!p.figure) {
        const linesY = 396;
        const stampY = linesY + lh + 30;
        return { lmax, lh, linesY, stampY, bottom: stampY + sh + tilt };
      }
      const figBottom = numTop + hero * 0.86;
      if (over) {
        // the stamp lands on the foot of the figure; the lines clear its lowest corner
        const stampY = numTop + hero * 0.62;
        const linesY = Math.max(figBottom + 12, stampY + sh + tilt + 8);
        return { lmax, lh, linesY, stampY, bottom: linesY + lh + (p.sub ? 18 + 46 : 0) };
      }
      const linesY = figBottom + 12;
      const stampY = linesY + lh + 26;
      return { lmax, lh, linesY, stampY, bottom: stampY + sh + tilt };
    },
  });
  const size = p.figure ? L.hero : 0;
  const { lmax, lh, linesY, stampY } = L;
  const pop = rise(frame, c0, 30, 7);
  // the stamp prints the figure whole, magnitude and all: "90M", "$3.2bn"
  const text = p.figure ? (p.count ? counting(frame, c0 + 1, 20, p.count) + (p.count.tail || '') : p.figure) : '';
  if (!pop.on) return null;
  return (
    <>
      <Layer depth={0.5}>
        <Backing w={640} h={520} seed={seed + 5} tone="bright" style={{ left: -70, top: 520, transform: 'rotate(-5deg)', opacity: 0.55 }} />
      </Layer>
      <Layer depth={1}>
        <Kicker text={p.kicker} frame={frame} at={c0 + 4} seed={seed + 4} />
        {p.figure ? (
          <div style={{ position: 'absolute', left: 70, top: numTop + pop.y, opacity: pop.opacity }}>
            <Numeral text={text} size={size} />
          </div>
        ) : null}
        <Lines lines={lines} frame={frame} at={p.figure ? c0 + 9 : c0} x={84} y={linesY} width={800} max={lmax} stagger={4} />
        {p.sub ? <Kicker text={p.sub} frame={frame} at={c2} seed={seed + 6} x={86} y={over && p.figure ? linesY + lh + 18 : 300} size={23} rot={1.5} /> : null}
        <StampSlam frame={frame} at={c1} x={318} y={stampY} width={STAMP_W} lines={L.stamp} max={L.smax} seed={seed + 11} />
      </Layer>
    </>
  );
};
