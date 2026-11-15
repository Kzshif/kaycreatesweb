// Paper Money: the objects on the desk. Receipts, price tags, rubber stamps and the cut-paper
// products each video features. All original, drawn in code; plain words, never a logo.
import React, { useMemo } from 'react';
import { staticFile } from 'remotion';
import { BRIGHT, KRAFT, MANILA, SHADOW, TYPE, mix, rgba } from '../shared/paper.mjs';
import { Cut, Numeral, WEAR, fit, hash, headStyle, jit, labelStyle, measure, numStyle, poly, rounded, sheet, useLook, type Pt } from './kit';

type Style = React.CSSProperties;

// --------------------------------------------------------------- receipt
export type ReceiptRow = { label: string; value: string; mark?: boolean };
/** A till receipt: pinked top and bottom, mono labels, numerals in Fraunces. `mark` highlights a row. */
export const Receipt: React.FC<{ w: number; title: string; rows: ReceiptRow[]; foot?: string; seed?: number; lift?: number; style?: Style }> = ({ w, title, rows, foot, seed = 1, lift = 0.3, style }) => {
  const t = useLook();
  const pad = 36;
  const rowH = 84;
  const h = 62 + 46 + rows.length * rowH + (foot ? 58 : 16) + 30;
  const d = useMemo(() => sheet(w, h, { seed, edges: 'zczc', m: 9, tooth: 17 }).d, [w, h, seed]);
  const rule: Style = { position: 'absolute', left: pad, right: pad, borderTop: `2.5px dashed ${rgba(t.ink, 0.42)}` };
  return (
    <Cut w={w} h={h} d={d} color={BRIGHT} seed={seed} lift={lift} style={style}>
      <div data-box style={{ position: 'absolute', inset: 0 }}>
        <div style={{ ...labelStyle(23, t.ink), position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center' }}>{title}</div>
        <div style={{ ...rule, top: 92 }} />
        {rows.map((r, i) => {
          const top = 108 + i * rowH;
          const size = Math.min(50, fit([r.value], 'numeral', w - pad * 2, 50));
          return (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top, height: rowH }}>
              {r.mark ? (
                <svg width={w} height={rowH} style={{ position: 'absolute', left: 0, top: 0 }}>
                  <path d={`M${pad - 12} 12 L${w - pad + 8} 7 L${w - pad + 13} ${rowH - 13} L${pad - 8} ${rowH - 8} Z`} fill={t.hl} />
                </svg>
              ) : null}
              <div style={{ ...labelStyle(20, rgba(t.ink, 0.78)), position: 'absolute', left: pad, top: 8 }}>{r.label}</div>
              <div style={{ ...numStyle(size), color: t.ink, position: 'absolute', right: pad, top: 32 }}>{r.value}</div>
              <div style={{ ...rule, top: rowH - 2, opacity: i === rows.length - 1 ? 1 : 0.6 }} />
            </div>
          );
        })}
        {foot ? <div style={{ ...labelStyle(18, rgba(t.ink, 0.7)), position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center' }}>{foot}</div> : null}
      </div>
    </Cut>
  );
};

// ------------------------------------------------------------- price tag
/**
 * A price tag hanging from a pin on a string. Place it by its pin (left/top in `style`);
 * `swing` is the angle it has swung to, in degrees.
 */
export const PriceTag: React.FC<{ label: string; price: string; sub?: string; w?: number; h?: number; cord?: number; swing?: number; seed?: number; lift?: number; style?: Style }> = ({ label, price, sub, w = 300, h = 380, cord = 96, swing = 0, seed = 1, lift = 0.45, style }) => {
  const t = useLook();
  const c = 50;
  const d = useMemo(() => poly([[c, 4], [w - c, 4], [w - 4, c], [w - 4, h - 4], [4, h - 4], [4, c]] as Pt[], seed), [w, h, seed]);
  const size = fit([price], 'numeral', w - 62, 132);
  return (
    <div style={{ position: 'absolute', width: 0, height: 0, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transform: `rotate(${swing}deg)`, transformOrigin: '0 0' }}>
        <svg width={40} height={cord + 60} viewBox={`-20 0 40 ${cord + 60}`} style={{ position: 'absolute', left: -20, top: 0, overflow: 'visible' }}>
          <path d={`M0 0 C 7 ${cord * 0.4}, -6 ${cord * 0.7}, 0 ${cord + 44}`} fill="none" stroke={t.type} strokeWidth={3.2} strokeLinecap="round" />
        </svg>
        <Cut w={w} h={h} d={d} color={t.accent} seed={seed} lift={lift} style={{ left: -w / 2, top: cord }}>
          <div data-box style={{ position: 'absolute', inset: 0 }}>
            <div style={{ ...labelStyle(23, t.onAccent), position: 'absolute', left: 0, right: 0, top: 98, textAlign: 'center' }}>{label}</div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 138, textAlign: 'center' }}>
              <Numeral text={price} size={size} color={t.onAccent} shade={t.accentDeep} gap={t.accent} />
            </div>
            {sub ? <div style={{ ...labelStyle(21, t.onAccent), position: 'absolute', left: 0, right: 0, top: 148 + size * 0.98, textAlign: 'center' }}>{sub}</div> : null}
          </div>
          <svg width={w} height={90} style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle cx={w / 2} cy={46} r={17} fill={t.ground} stroke={t.accentDeep} strokeWidth={5} />
          </svg>
        </Cut>
      </div>
      <svg width={36} height={36} viewBox="-18 -18 36 36" style={{ position: 'absolute', left: -18, top: -18, filter: `drop-shadow(1px 2px 1.2px ${rgba(SHADOW, 0.45)})` }}>
        <circle r={11} fill={t.type} />
        <circle cx={-3} cy={-3} r={3.2} fill={rgba(BRIGHT, 0.55)} />
      </svg>
    </div>
  );
};

// ----------------------------------------------------------------- stamp
/** The ink a rubber stamp leaves: double border, block capitals, worn where the rubber did not take. */
export const Stamp: React.FC<{ lines: string[]; sub?: string; width: number; rot?: number; seed?: number; press?: number; style?: Style }> = ({ lines, sub, width, rot = -8, seed = 1, press = 1, style }) => {
  const t = useLook();
  const inner = width - 2 * (9 + 30);
  const size = fit(lines.map((l) => l.toUpperCase()), 'headline', inner, 150);
  return (
    <div style={{ position: 'absolute', width, transform: `rotate(${rot}deg)`, mixBlendMode: t.inverted ? 'normal' : 'multiply', ...style }}>
      {/* a thin even film of ink, then the full impression with its worn patches on top */}
      {[0.4, 0.58].map((alpha, pass) => (
        <div
          key={pass}
          {...(pass === 0 ? { 'data-noprobe': true } : {})}
          style={{
            position: pass === 0 ? 'absolute' : 'relative',
            inset: pass === 0 ? 0 : undefined,
            opacity: alpha * press,
            ...(pass === 1
              ? {
                  WebkitMaskImage: `url(${staticFile(WEAR)})`,
                  maskImage: `url(${staticFile(WEAR)})`,
                  WebkitMaskSize: '512px 512px',
                  maskSize: '512px 512px',
                  WebkitMaskPosition: `${Math.round(hash(seed, 3) * 400)}px ${Math.round(hash(seed, 4) * 400)}px`,
                  maskPosition: `${Math.round(hash(seed, 3) * 400)}px ${Math.round(hash(seed, 4) * 400)}px`,
                }
              : {}),
          }}
        >
          <div {...(pass === 1 ? { 'data-box': true } : {})} style={{ border: `9px solid ${t.stamp}`, borderRadius: 16, padding: '20px 30px 18px', outline: `3px solid ${t.stamp}`, outlineOffset: -19, textAlign: 'center' }}>
            {lines.map((l, i) => (
              <div key={i} style={{ ...headStyle(size, t.stamp), letterSpacing: '0.005em', lineHeight: 0.98 }}>
                {l.toUpperCase()}
              </div>
            ))}
            {sub ? <div style={{ ...labelStyle(25, t.stamp), fontWeight: 500, letterSpacing: '0.16em', marginTop: 8 }}>{sub}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
};
/** Ink thrown out by the stamp landing. */
export const Specks: React.FC<{ n?: number; seed?: number; spread?: [number, number]; style?: Style }> = ({ n = 14, seed = 1, spread = [520, 240], style }) => {
  const t = useLook();
  return (
    <svg width={spread[0]} height={spread[1]} style={{ position: 'absolute', overflow: 'visible', mixBlendMode: t.inverted ? 'normal' : 'multiply', ...style }}>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={hash(seed, i) * spread[0]} cy={hash(seed, i + 50) * spread[1]} r={1.4 + hash(seed, i + 90) ** 2.2 * 5.5} fill={t.stamp} opacity={0.55 + hash(seed, i + 120) * 0.4} />
      ))}
    </svg>
  );
};
/** The stamp itself, cut from paper: knob, neck, collar, block, inked rubber. */
export const StampTool: React.FC<{ size?: number; style?: Style; lift?: number }> = ({ size = 300, style, lift = 1 }) => {
  const t = useLook();
  const wood = mix(SHADOW, KRAFT, 0.2);
  const s = size / 300;
  return (
    <svg
      width={260 * s}
      height={300 * s}
      viewBox="-130 -235 260 300"
      style={{ position: 'absolute', overflow: 'visible', filter: `drop-shadow(${2 + lift * 5}px ${4 + lift * 12}px ${2 + lift * 5}px ${rgba(SHADOW, 0.3)}) drop-shadow(${8 + lift * 22}px ${16 + lift * 44}px ${14 + lift * 26}px ${rgba(SHADOW, 0.2)})`, ...style }}
    >
      <ellipse cx={0} cy={-172} rx={62} ry={52} fill={wood} stroke={t.ink} strokeWidth={3.5} />
      <path d="M-34 -168 Q-6 -196 34 -176" fill="none" stroke={rgba(BRIGHT, 0.35)} strokeWidth={5} strokeLinecap="round" />
      <path d="M-24 -126 L24 -126 L32 -46 L-32 -46 Z" fill={wood} stroke={t.ink} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={-50} y={-50} width={100} height={22} rx={5} fill={t.accent} stroke={t.ink} strokeWidth={3.5} />
      <rect x={-112} y={-28} width={224} height={56} rx={9} fill={t.ink} stroke={t.ink} strokeWidth={3.5} />
      <path d="M-100 -14 H100" stroke={rgba(BRIGHT, 0.2)} strokeWidth={3} strokeLinecap="round" />
      <rect x={-104} y={28} width={208} height={15} rx={3} fill={t.stamp} stroke={t.ink} strokeWidth={3} />
    </svg>
  );
};

// ----------------------------------------------------------- the products
/** A carton of fries, in cut paper: every fry its own strip, a few millimetres above the next. */
export const FriesBox: React.FC<{ scale?: number; seed?: number; label?: string; style?: Style }> = ({ scale = 1, seed = 1, label = 'FRIES', style }) => {
  const t = useLook();
  const fries = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => {
        const u = i / 12;
        const w = 40 + hash(seed, i) * 16;
        const h = 268 + hash(seed, i + 20) * 150 - Math.abs(u - 0.5) * 120;
        return { x: 78 + u * 322 + jit(seed, i + 40, 9), w, h, rot: (u - 0.5) * 34 + jit(seed, i + 60, 5), tone: i % 3, d: sheet(w, h, { seed: seed + i, edges: 'cccc', m: 4 }).d, back: i % 2 === 0 };
      }),
    [seed],
  );
  const tones = [mix(KRAFT, BRIGHT, 0.3), mix(KRAFT, BRIGHT, 0.44), mix(KRAFT, BRIGHT, 0.58)];
  const fry = (f: (typeof fries)[number], i: number) => (
    <Cut key={i} w={f.w} h={f.h} d={f.d} color={tones[f.tone]} seed={seed + i} lift={f.back ? 0.18 : 0.34} style={{ left: f.x, top: 352 - f.h, transform: `rotate(${f.rot}deg)`, transformOrigin: '50% 100%' }}>
      <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 4, background: rgba(BRIGHT, 0.5) }} />
      <div style={{ position: 'absolute', right: 6, top: 6, bottom: 6, width: 5, background: rgba(SHADOW, 0.16) }} />
    </Cut>
  );
  return (
    <div style={{ position: 'absolute', width: 520, height: 640, transform: `scale(${scale})`, transformOrigin: '0 0', ...style }}>
      <Cut w={520} h={640} d="M56 262 Q260 150 464 262 L446 352 L74 352 Z" color={t.accentDeep} seed={seed + 30} lift={0.2} />
      {fries.filter((f) => f.back).map(fry)}
      {fries.filter((f) => !f.back).map(fry)}
      <Cut w={520} h={640} d="M52 258 Q260 372 468 258 L414 620 Q260 640 106 620 Z" color={t.accent} seed={seed + 31} lift={0.5}>
        <svg width={520} height={640} style={{ position: 'absolute', inset: 0 }}>
          <path d="M96 318 L140 606" stroke={t.accentDeep} strokeWidth={3} opacity={0.5} />
          <path d="M424 318 L380 606" stroke={t.accentDeep} strokeWidth={3} opacity={0.5} />
          <path d="M52 258 Q260 372 468 258 L463 290 Q260 400 57 290 Z" fill={t.accentDeep} opacity={0.42} />
          <path d="M60 296 Q260 404 460 296" fill="none" stroke={rgba(BRIGHT, 0.3)} strokeWidth={4} />
        </svg>
      </Cut>
      <Cut w={212} h={88} d={rounded(212, 88, 18, seed + 5)} color={BRIGHT} seed={seed + 32} lift={0.12} style={{ left: 154, top: 440, transform: 'rotate(-3deg)' }}>
        <div data-box style={{ ...labelStyle(30, t.ink), position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</div>
      </Cut>
    </div>
  );
};

/** A phone, in cut paper, showing a search box and a list with one entry already chosen. */
export const Phone: React.FC<{ w?: number; query?: string; badge?: string; seed?: number; style?: Style }> = ({ w = 350, query = 'pizza near me', badge = 'DEFAULT', seed = 1, style }) => {
  const t = useLook();
  const h = w * 2;
  const sw = w - 34;
  const sh = h - 34;
  const bar = sw - 44;
  const badgeW = Math.ceil(measure(badge, 'label', 21)) + 30;
  return (
    <div style={{ position: 'absolute', width: w, height: h, ...style }}>
      <Cut w={w} h={h} d={rounded(w, h, w * 0.16, seed)} color={t.ink} dark seed={seed} lift={0.55} />
      <Cut w={sw} h={sh} d={rounded(sw, sh, w * 0.115, seed + 1, 2)} color={BRIGHT} seed={seed + 2} lift={0.02} style={{ left: 17, top: 17 }}>
        <div style={{ position: 'absolute', left: sw / 2 - 52, top: 18, width: 104, height: 26, borderRadius: 13, background: t.ink }} />
        <div style={{ position: 'absolute', left: sw / 2 - 58, bottom: 16, width: 116, height: 8, borderRadius: 4, background: rgba(t.ink, 0.8) }} />
      </Cut>
      <Cut w={bar} h={76} d={rounded(bar, 76, 34, seed + 3, 3)} color={t.card} seed={seed + 4} lift={0.14} style={{ left: 39, top: 104 }}>
        <svg width={76} height={76} viewBox="0 0 76 76" style={{ position: 'absolute', left: 6, top: 0 }}>
          <circle cx={34} cy={35} r={12} fill="none" stroke={t.ink} strokeWidth={5} />
          <path d="M43 44 L54 55" stroke={t.ink} strokeWidth={5.5} strokeLinecap="round" />
        </svg>
        <div data-box style={{ ...labelStyle(Math.min(24, fit([query], 'label', bar - 100, 24)), t.ink), textTransform: 'none', letterSpacing: '0.02em', position: 'absolute', left: 72, top: 22 }}>{query}</div>
      </Cut>
      {[0, 1, 2].map((i) => {
        const top = 214 + i * 126;
        return (
          <Cut key={i} w={bar} h={108} d={sheet(bar, 108, { seed: seed + 10 + i, m: 4 }).d} color={i === 0 ? t.accentWash : mix(t.ink, BRIGHT, 0.045)} seed={seed + 20 + i} lift={i === 0 ? 0.22 : 0.08} style={{ left: 39, top, transform: `rotate(${i === 0 ? -1.2 : jit(seed, i, 0.6)}deg)` }}>
            {i === 0 ? (
              <div data-box style={{ position: 'absolute', left: 16, top: 16, width: badgeW, height: 36, borderRadius: 8, background: t.accent }}>
                <div style={{ ...labelStyle(21, t.onAccent), position: 'absolute', left: 15, top: 5 }}>{badge}</div>
              </div>
            ) : (
              <div style={{ position: 'absolute', left: 18, top: 22, width: bar * 0.42, height: 13, borderRadius: 6, background: rgba(t.ink, 0.5) }} />
            )}
            <div style={{ position: 'absolute', left: 18, top: i === 0 ? 68 : 50, width: bar * 0.7, height: 11, borderRadius: 5, background: rgba(t.ink, 0.22) }} />
            <div style={{ position: 'absolute', left: 18, top: i === 0 ? 86 : 72, width: bar * 0.52, height: 11, borderRadius: 5, background: rgba(t.ink, 0.16) }} />
          </Cut>
        );
      })}
    </div>
  );
};

/** A membership card, in cut paper. */
export const MemberCard: React.FC<{ w?: number; word?: string; price: string; sub?: string; seed?: number; lift?: number; style?: Style }> = ({ w = 420, word = 'MEMBER', price, sub = 'A YEAR', seed = 1, lift = 0.4, style }) => {
  const t = useLook();
  const h = Math.round(w * 0.63);
  const k = w / 420;
  const size = Math.min(140 * k, fit([price], 'numeral', w * 0.5, 140 * k));
  return (
    <Cut w={w} h={h} d={rounded(w, h, 26 * k, seed)} color={t.accent} seed={seed} lift={lift} style={style}>
      <div data-box style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 34 * k, height: 44 * k, background: t.accentDeep }} />
        <div style={{ position: 'absolute', left: 30 * k, top: 106 * k, width: 70 * k, height: 54 * k, borderRadius: 9 * k, background: BRIGHT, border: `2.5px solid ${t.accentDeep}` }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '33%', borderTop: `2px solid ${t.accentDeep}` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '66%', borderTop: `2px solid ${t.accentDeep}` }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: `2px solid ${t.accentDeep}` }} />
        </div>
        <div style={{ ...labelStyle(27 * k, t.onAccent), position: 'absolute', left: 30 * k, top: 186 * k }}>{word}</div>
        <div style={{ position: 'absolute', right: 26 * k, top: 96 * k, textAlign: 'right' }}>
          <Numeral text={price} size={size} color={t.onAccent} shade={t.accentDeep} gap={t.accent} />
          <div style={{ ...labelStyle(22 * k, t.onAccent), marginTop: 4 * k }}>{sub}</div>
        </div>
      </div>
    </Cut>
  );
};

/** A hand-drawn arrow in ink: a curve from one point to another with a two-stroke head. */
export const Arrow: React.FC<{ from: Pt; to: Pt; bend?: number; width?: number; color?: string; draw?: number }> = ({ from, to, bend = 60, width = 6, color, draw = 1 }) => {
  const t = useLook();
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const a = Math.atan2(to[1] - cy, to[0] - cx);
  const head = (da: number) => `M${to[0]} ${to[1]} L${to[0] - Math.cos(a + da) * 30} ${to[1] - Math.sin(a + da) * 30}`;
  const c = color || t.type;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <path d={`M${from[0]} ${from[1]} Q${cx} ${cy} ${to[0]} ${to[1]}`} fill="none" stroke={c} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      {draw > 0.96 ? <path d={`${head(0.5)} ${head(-0.5)}`} fill="none" stroke={c} strokeWidth={width} strokeLinecap="round" /> : null}
    </svg>
  );
};

/** A pencil, in cut paper: lies on the desk and says somebody is making this by hand. */
export const Pencil: React.FC<{ length?: number; style?: Style }> = ({ length = 520, style }) => {
  const t = useLook();
  const L = length;
  return (
    <svg width={L} height={44} viewBox={`0 0 ${L} 44`} style={{ position: 'absolute', overflow: 'visible', filter: `drop-shadow(1.5px 3px 1.5px ${rgba(SHADOW, 0.36)}) drop-shadow(6px 12px 9px ${rgba(SHADOW, 0.2)})`, ...style }}>
      <rect x={0} y={5} width={34} height={34} rx={7} fill={mix(t.accent, BRIGHT, 0.3)} stroke={t.ink} strokeWidth={2.5} />
      <rect x={32} y={5} width={26} height={34} fill={mix(t.ink, BRIGHT, 0.5)} stroke={t.ink} strokeWidth={2.5} />
      <path d={`M40 5 V39 M49 5 V39`} stroke={t.ink} strokeWidth={1.6} />
      <rect x={58} y={5} width={L - 58 - 70} height={34} fill={t.accent} stroke={t.ink} strokeWidth={2.5} />
      <path d={`M58 16 H${L - 70} M58 28 H${L - 70}`} stroke={t.accentDeep} strokeWidth={2} opacity={0.6} />
      <path d={`M${L - 70} 5 L${L - 14} 19 Q${L - 6} 22 ${L - 14} 25 L${L - 70} 39 Z`} fill={mix(KRAFT, BRIGHT, 0.4)} stroke={t.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M${L - 26} 16 L${L - 12} 19.5 Q${L - 6} 22 ${L - 12} 24.5 L${L - 26} 28 Z`} fill={t.ink} />
    </svg>
  );
};

/** Offcuts: the slivers left on the desk after cutting. */
export const Offcuts: React.FC<{ n?: number; seed?: number; spread?: [number, number]; style?: Style }> = ({ n = 7, seed = 1, spread = [420, 200], style }) => {
  const t = useLook();
  const colors = [t.accent, t.accentWash, BRIGHT, t.accent, MANILA];
  return (
    <div style={{ position: 'absolute', width: spread[0], height: spread[1], ...style }}>
      {Array.from({ length: n }, (_, i) => {
        const w = 26 + hash(seed, i) * 74;
        const h = 12 + hash(seed, i + 10) * 30;
        const pts: Pt[] = hash(seed, i + 20) > 0.5 ? [[2, 2], [w - 2, 2 + h * 0.3], [w * 0.4, h - 2]] : [[2, 2], [w - 2, 4], [w - 6, h - 2], [5, h - 5]];
        return <Cut key={i} w={w} h={h} d={poly(pts, seed + i, 0.8)} color={colors[i % colors.length]} seed={seed + i} lift={0.08 + hash(seed, i + 30) * 0.2} style={{ left: hash(seed, i + 40) * (spread[0] - w), top: hash(seed, i + 50) * (spread[1] - h), transform: `rotate(${jit(seed, i + 60, 80)}deg)` }} />;
      })}
    </div>
  );
};

/** An ink pad in its tin: where the stamp gets its colour. */
export const InkPad: React.FC<{ w?: number; seed?: number; style?: Style }> = ({ w = 320, seed = 1, style }) => {
  const t = useLook();
  const h = Math.round(w * 0.7);
  return (
    <div style={{ position: 'absolute', width: w, height: h, ...style }}>
      <Cut w={w} h={h} d={rounded(w, h, 26, seed)} color={t.ink} dark seed={seed} lift={0.5} />
      <Cut w={w - 40} h={h - 40} d={rounded(w - 40, h - 40, 16, seed + 1, 2)} color={t.stamp} seed={seed + 2} lift={0.02} style={{ left: 20, top: 20 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${staticFile(WEAR)})`, backgroundSize: '512px 512px', opacity: 0.16, mixBlendMode: 'multiply' }} />
        <div style={{ position: 'absolute', left: '22%', top: '34%', width: '56%', height: '30%', borderRadius: 10, border: `3px solid ${rgba(t.ink, 0.22)}` }} />
      </Cut>
    </div>
  );
};

export const FONT_NAMES = { headline: TYPE.headline.family, numeral: TYPE.numeral.family, label: TYPE.label.family };
