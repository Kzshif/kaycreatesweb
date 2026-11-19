// Scenes built around money itself: the opening hit, a counter, coin stacks, a note cut by scissors.
import React from 'react';
import { CAPTION, MANILA, TEXT_RIGHT } from '../shared/paper.mjs';
import { Backing, Cut, Headline, Label, Layer, Numeral, Slip, clamp, fit, glide, jit, lerp, measure, onTwos, ramp, settle, sheet, thump, useLook } from '../paper/kit';
import { Coin, CoinStack, Note, Scissors, stackBox, stackHeight, type Fall } from '../paper/money';
import { Product, productHeight } from '../paper/products';
import { PriceTag, stampHeight } from '../paper/things';
import type { SceneProps } from '../types';
import { Kicker, Lines, StampSlam, counting, cue, drop, fitStack, linesHeight, rise, stampTilt } from './common';

const TALL = new Set(['fries', 'phone', 'tradingcard', 'sprout', 'can', 'rocket']);

// ------------------------------------------------------------------ slam
/** The claim lands 10% oversize and settles, growing from its centre. */
const SLAM = 1.1;
/** The widest a slammed line may be so that, even at its largest, it stays clear of YouTube's buttons. */
const slamWidth = (x: number, want: number) => Math.min(want, (TEXT_RIGHT - x) / (1 + (SLAM - 1) / 2));
/** The key number lands on the desk before the first word is finished. */
const SlamNumber: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const t = useLook();
  let k = 1;
  const cUnit = p.unit ? cue(scene, k++) : Infinity;
  const lines: string[] = p.lines || [];
  const cLines = lines.length ? cue(scene, k++) : Infinity;
  const cEnd = cue(scene, k);
  const numTop = 392;
  const lineSize = lines.length ? fit(lines, 'headline', 760, 92) : 0;
  const unitNatural = p.unit ? fit([p.unit], 'headline', 700, 196) : 0;
  // the figure, its unit and the lines all rest above the subtitle strip: a short figure ("$1")
  // fits at full size and would push the lines under it, so figure and unit shrink together
  const stackBottom = (s: number, u: number) => numTop + s * 0.86 + 2 + (p.unit ? u * 0.94 + 2 : 6) + lines.length * lineSize * 0.94 + (p.mark ? 22 : 0);
  let size = fit([p.figure], 'numeral', 690, 400);
  let unitSize = unitNatural;
  while (size > 240 && stackBottom(size, unitSize) > CAPTION.top - 30) {
    size -= 4;
    unitSize = Math.min(unitNatural, Math.round(size * 0.49));
  }
  const headTop = numTop + size * 0.86 + 2;
  const lineTop = headTop + (p.unit ? unitSize * 0.94 + 2 : 6);
  const slam = thump(frame, 0, 9, 0.12);
  const a = rise(frame, cUnit - 2, 46, 8);
  const under = glide(ramp(frame, cEnd - 1, 9));
  const last = lines[lines.length - 1] || '';
  const markAt = p.mark && last.includes(p.mark) ? last.indexOf(p.mark) : -1;
  const coins = [
    { x: 826, y: 706, r: 96, rot: 18 },
    { x: 930, y: 878, r: 70, rot: -24 },
    { x: 866, y: 318, r: 58, rot: 30 },
  ];
  return (
    <>
      <Layer depth={1}>
        <Kicker text={p.kicker} frame={frame} at={8} seed={seed + 4} />
        <div style={{ position: 'absolute', left: 72, top: numTop, transform: `scale(${(1.12 - 0.12 * slam).toFixed(4)}) rotate(${(-2.5 * (1 - slam)).toFixed(2)}deg)`, transformOrigin: '0% 62%' }}>
          <Numeral text={p.figure} size={size} />
        </div>
        {p.unit && a.on ? (
          <div style={{ position: 'absolute', left: 80, top: headTop + a.y, opacity: a.opacity }}>
            <Headline lines={[p.unit]} width={700} max={unitSize} />
          </div>
        ) : null}
        <Lines lines={lines} frame={frame} at={cLines - 2} x={84} y={lineTop} width={760} max={92} stagger={4} />
        {markAt >= 0 && frame >= cEnd - 1 ? (
          <svg width={900} height={30} style={{ position: 'absolute', left: 84 + measure(last.slice(0, markAt), 'headline', lineSize) - 4, top: lineTop + (lines.length - 1) * lineSize * 0.94 + lineSize * 0.93, overflow: 'visible' }}>
            <path d={`M0 12 C ${measure(p.mark, 'headline', lineSize) * 0.3} 2, ${measure(p.mark, 'headline', lineSize) * 0.6} 20, ${measure(p.mark, 'headline', lineSize) + 6} 9`} fill="none" stroke={t.accent} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - under} />
          </svg>
        ) : null}
      </Layer>
      <Layer depth={1.5}>
        {coins.map((c, i) => {
          const d = drop(frame, cEnd + i * 5, seed + 40 + i, [jit(seed + 40, i, 60), -340, jit(seed + 41, i, 40)]);
          return d.on ? <Coin key={i} r={c.r} seed={seed + 41 + i} lift={0.2 + d.lift * 0.6} style={{ left: c.x + d.x, top: c.y + d.y, transform: `rotate(${c.rot + d.r}deg)` }} /> : null;
        })}
      </Layer>
    </>
  );
};

/** A product lands on the desk with the claim beside it. */
const SlamObject: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const lines: string[] = p.lines || [];
  let k = 1;
  const cLine2 = lines.length > 1 ? cue(scene, k++) : Infinity;
  const cTag = p.tag ? cue(scene, k++) : Infinity;
  const slam = thump(frame, 0, 9, 0.12);
  const f2 = onTwos(frame);
  const land = thump(f2, 0, 9, 0.1);
  // the phone stands beside the claim; other tall products (a can, a card, a pot) would squeeze
  // the claim into a narrow column, so the claim runs full width and the product stands under it
  const side = TALL.has(p.product) && p.product === 'phone';
  const tall = side;
  const stood = TALL.has(p.product) && !side;
  const tx0 = side ? 92 + 300 + 36 : 84;
  const tw = slamWidth(tx0, side ? TEXT_RIGHT - tx0 : 800);
  const ty = p.kicker ? 366 : 322;
  const max = side ? 124 : 132;
  const size = fit(lines, 'headline', tw, max);
  const textBottom = ty + lines.length * size * 0.94;
  // a short product sits in whatever room the claim leaves under it
  const room = Math.max(stood ? 300 : 220, 1000 - (side ? 300 : textBottom + 30));
  // with a price tag the product moves left to leave the tag room inside the safe area
  const pw = side ? 300 : Math.min(stood ? 420 : p.tag ? 460 : 540, (room * 520) / Math.max(1, productHeight(p.product, 520)));
  const ph = productHeight(p.product, pw);
  const px = side ? 92 : p.tag ? 84 : stood ? Math.min(TEXT_RIGHT - pw, 560 - pw / 2) : 491 - pw / 2;
  const py = 996 - ph;
  // the product drops in from above, but never through the claim: the first frames are the hook
  const fall = side ? 150 : Math.max(0, Math.min(150, py - textBottom - 24));
  const tx = tx0;
  const swing = (at: number) => {
    const s = f2 - at;
    return s < 0 ? null : 62 * Math.exp(-s / 9) * Math.cos(s / 3.1) + 5;
  };
  const sw = swing(cTag);
  return (
    <>
      <Layer depth={1}>
        <Kicker text={p.kicker} frame={frame} at={8} seed={seed + 4} x={tall ? tx : 86} y={292} />
        <div style={{ position: 'absolute', left: px, top: py - fall * (1 - land), transform: `rotate(${(tall ? -4 : -2) - 7 * (1 - land)}deg) scale(${(1.08 - 0.08 * land).toFixed(3)})`, transformOrigin: '50% 80%' }}>
          <Product name={p.product} w={pw} seed={seed + 7} text={p.text} price={p.price} />
        </div>
        <div style={{ position: 'absolute', left: tx, top: ty, transform: `scale(${(SLAM - (SLAM - 1) * slam).toFixed(4)})`, transformOrigin: '50% 50%' }}>
          <Headline lines={[lines[0] || '']} width={tw} max={size} />
        </div>
        <Lines lines={lines.slice(1)} frame={frame} at={cLine2 - 2} x={tx} y={ty + size * 0.94} width={tw} max={size} stagger={5} />
      </Layer>
      {p.tag && sw !== null ? (
        <Layer depth={1.35}>
          <PriceTag label={p.tag.label} price={p.tag.price} sub={p.tag.sub} w={270} h={340} cord={84} swing={sw} seed={seed + 9} style={{ left: 700, top: tall ? 560 : 548 }} />
        </Layer>
      ) : null}
    </>
  );
};

/** The claim in type, and a stamp that comes down on it. */
const SlamStamp: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const lines: string[] = p.lines || [];
  const cStamp = cue(scene, 1);
  const cSub = p.sub ? cue(scene, 2) : Infinity;
  const slam = thump(frame, 0, 9, 0.12);
  const w = slamWidth(80, 800);
  const tilt = stampTilt(540);
  const subH = p.sub ? linesHeight([p.sub], 780, 70) : 0;
  // the headline is as big as it can be with the stamp and the line under it resting above the subtitles
  const L = fitStack({
    natural: lines.length ? fit(lines, 'headline', w, 150) : 150,
    min: 72,
    stamp: p.stamp || [],
    layout: (hero, stamp, smax) => {
      const h = linesHeight(lines, w, hero);
      const stampY = 396 + h + 26;
      const stampBottom = stampY + stampHeight(stamp, 540, smax) + tilt;
      const subY = stampBottom + 8;
      return { h, stampY, subY, bottom: p.sub ? subY + subH : stampBottom };
    },
  });
  const sub = rise(frame, cSub - 2, 30, 8);
  return (
    <Layer depth={1}>
      <Kicker text={p.kicker} frame={frame} at={8} seed={seed + 4} />
      <div style={{ position: 'absolute', left: 80, top: 396, transform: `scale(${(SLAM - (SLAM - 1) * slam).toFixed(4)}) rotate(${(-2 * (1 - slam)).toFixed(2)}deg)`, transformOrigin: '50% 50%' }}>
        <Headline lines={lines} width={w} max={L.hero} />
      </div>
      {sub.on ? (
        <div style={{ position: 'absolute', left: 84, top: L.subY + sub.y, opacity: sub.opacity }}>
          <Headline lines={[p.sub]} width={780} max={70} />
        </div>
      ) : null}
      <StampSlam frame={frame} at={cStamp} x={300} y={L.stampY} width={540} lines={L.stamp} max={L.smax} seed={seed + 11} />
    </Layer>
  );
};

export const Slam: React.FC<SceneProps> = (props) => (props.scene.variant === 'object' ? <SlamObject {...props} /> : props.scene.variant === 'stamp' ? <SlamStamp {...props} /> : <SlamNumber {...props} />);

// ----------------------------------------------------------------- count
/** A figure counting up at full frame rate while coins land round it on twos. */
export const Count: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const c = p.count || { prefix: '', number: 0, decimals: 0, suffix: '', word: '' };
  let k = 1;
  const c0 = cue(scene, 0);
  const cLine = p.line ? cue(scene, k++) : Infinity;
  const cSub = p.sub ? cue(scene, k++) : Infinity;
  const full = `${c.prefix}${c.number.toFixed(c.decimals)}${c.suffix}`;
  const size = fit([full], 'numeral', 700, 380);
  const numTop = 402;
  const headTop = numTop + size * 0.86 + 2;
  const wordSize = c.word ? fit([c.word], 'headline', 700, 180) : 0;
  const lineTop = headTop + (c.word ? wordSize * 0.94 + 6 : 8);
  const pop = settle(ramp(frame, c0, 7));
  const w = rise(frame, c0 + 9, 40, 8);
  const sheetD = drop(frame, c0 - 2, seed + 2, [60, -120, 6], true);
  const pile = scene.variant === 'pile';
  const spots = pile
    ? [[826, 470, 76], [912, 600, 60], [840, 690, 54], [720, 300, 48], [930, 380, 46]]
    : [[880, 300, 62], [930, 560, 58], [860, 760, 66], [930, 900, 50], [700, 300, 46]];
  return (
    <>
      <Layer depth={0.55}>{sheetD.on ? <Backing w={640} h={560} seed={seed + 2} style={{ left: 420 + sheetD.x, top: 300 + sheetD.y, transform: `rotate(${6 + sheetD.r}deg)` }} /> : null}</Layer>
      <Layer depth={1}>
        <Kicker text={p.kicker} frame={frame} at={c0 + 3} seed={seed + 4} />
        {frame >= c0 ? (
          <div style={{ position: 'absolute', left: 72, top: numTop + 30 * (1 - pop), opacity: pop }}>
            <Numeral text={counting(frame, c0 + 1, 24, c)} size={size} />
          </div>
        ) : null}
        {c.word && w.on ? (
          <div style={{ position: 'absolute', left: 80, top: headTop + w.y, opacity: w.opacity }}>
            <Headline lines={[c.word]} width={700} max={180} />
          </div>
        ) : null}
        <Lines lines={p.line ? [p.line] : []} frame={frame} at={cLine - 2} x={84} y={lineTop} width={780} max={84} />
        {p.sub ? <Kicker text={p.sub} frame={frame} at={cSub} seed={seed + 6} x={84} y={lineTop + (p.line ? linesHeight([p.line], 780, 84) : 0) + 22} size={23} rot={1.5} /> : null}
      </Layer>
      <Layer depth={1.5}>
        {spots.map(([x, y, r], i) => {
          const d = drop(frame, c0 + 6 + i * 6, seed + 50 + i, [jit(seed + 50, i, 70), -320, jit(seed + 51, i, 40)]);
          return d.on ? <Coin key={i} r={r} seed={seed + 51 + i} lift={0.2 + d.lift * 0.6} style={{ left: x + d.x, top: y + d.y, transform: `rotate(${jit(seed + 52, i, 30) + d.r}deg)` }} /> : null;
        })}
      </Layer>
    </>
  );
};

// ---------------------------------------------------------------- stacks
/** The channel's bar chart: whole coins dealt onto stacks while each figure counts with them. */
export const Stacks: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const t = useLook();
  const items: { label: string; display: string; coins: number; number: number; decimals: number; prefix: string; tail: string }[] = p.stacks || [];
  const n = items.length;
  const three = n >= 3;
  const cw = three ? 196 : 226;
  const centres = three ? [208, 491, 774] : [292, 664];
  const base = 968;
  const tallest = Math.max(1, ...items.map((s) => s.coins));
  const th = clamp((556 - cw * 0.27) / tallest, 12, 24);
  const f2 = onTwos(frame);
  const cNote = p.note ? cue(scene, n) : Infinity;
  const size = three ? 80 : 96;
  return (
    <>
      <Layer depth={0.5}>
        <Cut w={900} h={96} d={sheet(900, 96, { seed: seed + 3, edges: 'ctct', rough: 4, m: 10 }).d} core={sheet(900, 96, { seed: seed + 3, edges: 'ctct', rough: 4, m: 10 }).core} color={t.inverted ? '#2A2620' : t.card} dark={t.inverted} seed={seed + 3} lift={0.1} style={{ left: 40, top: base - 34, transform: 'rotate(-0.6deg)' }} />
      </Layer>
      <Layer depth={1}>
        {items.map((s, i) => {
          const at = cue(scene, i);
          const next = i + 1 < scene.cues.length ? cue(scene, i + 1) : scene.duration;
          const every = clamp((next - at - 12) / s.coins, 1.3, 2.5);
          const cx = centres[i];
          const box = stackBox(s.coins, cw, th);
          const side = cx < 480 ? -1 : 1;
          const landAt = (j: number) => at + j * every + 5;
          const fall = (j: number): Fall => {
            const q = landAt(j) - f2;
            if (q > 5.01) return { show: false };
            if (q > 0) return { dx: side * (q / 5) * 190, dy: 10 + (q / 5) * 34, rot: side * q * 2.4 + jit(seed + i, j, 3) };
            return {};
          };
          const done = clamp((frame - at - 5) / (s.coins * every));
          const started = frame >= at;
          const text = `${s.prefix}${(s.number * done).toFixed(s.decimals)}${s.tail}`;
          const nw = measure(s.display, 'numeral', size);
          const top = base - stackHeight(s.coins, cw, th);
          const pop = settle(ramp(frame, at - 2, 7));
          return (
            <React.Fragment key={i}>
              {started ? <CoinStack count={s.coins} w={cw} th={th} seed={seed + 20 + i} fall={fall} style={{ left: cx - box.W / 2, top: base - box.foot }} /> : null}
              {started ? (
                <div style={{ position: 'absolute', left: clamp(cx - nw / 2, 72, 900 - nw), top: top - size * 0.86 - 30 + 24 * (1 - pop), opacity: pop }}>
                  <Numeral text={text} size={size} />
                </div>
              ) : null}
              <Label size={three ? 23 : 26} color={t.type} style={{ position: 'absolute', left: cx - measure(s.label.toUpperCase(), 'label', three ? 23 : 26) / 2, top: base + 12 }}>
                {s.label}
              </Label>
            </React.Fragment>
          );
        })}
        <Slip text={p.unitLabel || ''} size={22} seed={seed + 5} rot={1.6} style={{ left: 92, top: 1312 }} />
        {p.note ? <Kicker text={p.note} frame={frame} at={cNote} seed={seed + 6} x={86} y={300} size={24} rot={-1.5} /> : null}
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------- cut
/** The channel's pie chart: scissors go through a note and the piece that leaves is the share. */
export const CutNote: React.FC<SceneProps> = ({ scene, frame, seed }) => {
  const p = scene.props;
  const c0 = cue(scene, 0);
  const c1 = cue(scene, 1);
  const c2 = p.note ? cue(scene, 2) : Infinity;
  const w = 776;
  const h = 346;
  const X = 78;
  const Y = 384;
  const rot = -2;
  const share = clamp((p.shareValue || 50) / 100, 0.05, 0.95);
  const right = scene.variant !== 'left';
  const cutFrom = right ? 1 - share : 0;
  const cutTo = right ? 1 : share;
  const f2 = onTwos(frame);
  const d0 = drop(frame, c0, seed, [0, -270, -8], true);
  const draw = ramp(frame, c0 + 4, 20);
  const travel = ramp(f2, c1, 10);
  const done = f2 >= c1 + 10;
  const sep = thump(f2, c1 + 10, 10, 0.1);
  const dir = right ? 1 : -1;
  const at = (fr: number): [number, number] => [X + w * fr * Math.cos((rot * Math.PI) / 180), Y + w * fr * Math.sin((rot * Math.PI) / 180)];
  const cutX = X + w * (right ? 1 - share : share);
  // the scissors come up through the note, then are set down out of the way
  const away = glide(ramp(frame, c1 + 12, 12));
  const sx = lerp(cutX, 860, away);
  const sy = lerp(lerp(Y + h + 170, Y - 70, travel), 880, away);
  const srot = lerp(0, -128, away);
  const snipping = f2 >= c1 && !done;
  const fig = rise(frame, c1 + 10, 40, 8);
  const title = p.title || '';
  const serial = `No ${String(seed).padStart(3, '0')}`;
  if (!d0.on) return null;
  return (
    <>
      <Layer depth={1}>
        {done ? (
          <>
            <Note w={w} h={h} from={right ? 0 : share} to={right ? 1 - share : 1} seed={seed + 1} title={title} serial={serial} lift={0.22} style={{ left: at(right ? 0 : share)[0], top: at(right ? 0 : share)[1], transform: `rotate(${rot}deg)`, transformOrigin: '0 0' }} />
            <Note w={w} h={h} from={cutFrom} to={cutTo} seed={seed + 1} title={title} serial={serial} lift={0.22 + 0.5 * sep} style={{ left: at(cutFrom)[0] + dir * 44 * sep, top: at(cutFrom)[1] + 28 * sep, transform: `rotate(${rot + dir * 8 * sep}deg)`, transformOrigin: right ? '0 0' : '100% 0' }} />
          </>
        ) : (
          <Note w={w} h={h} seed={seed + 1} title={title} serial={serial} draw={draw} lift={0.22 + d0.lift * 0.6} style={{ left: X + d0.x, top: Y + d0.y, transform: `rotate(${rot + d0.r}deg)`, transformOrigin: '0 0' }} />
        )}
        {fig.on ? (
          <>
            <Label size={26} style={{ position: 'absolute', left: 88, top: 782 + fig.y, opacity: fig.opacity }}>
              {p.label}
            </Label>
            <div style={{ position: 'absolute', left: 74, top: 816 + fig.y, opacity: fig.opacity }}>
              <Numeral text={p.share} size={Math.min(212, fit([p.share], 'numeral', 560, 212))} />
            </div>
          </>
        ) : null}
        {p.note ? <Kicker text={p.note} frame={frame} at={c2} seed={seed + 6} x={86} y={300} size={23} rot={-1.5} /> : null}
      </Layer>
      {f2 >= c1 - 4 ? (
        <Layer depth={1.6}>
          <Scissors size={290} open={snipping ? (Math.floor(f2 / 2.5) % 2 ? 6 : 34) : 16} style={{ left: sx - 106, top: sy - 184, transform: `rotate(${srot}deg)`, transformOrigin: '106px 184px' }} />
        </Layer>
      ) : null}
    </>
  );
};
