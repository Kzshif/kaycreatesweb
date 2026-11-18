// Paper Money: the cut-paper products a storyboard can put on the desk. All original, drawn in
// code, in the video's own paper tones and accent. Plain words only where a sign is needed.
import React from 'react';
import { BRIGHT, KRAFT, MANILA, mix, rgba } from '../shared/paper.mjs';
import { Cut, fit, headStyle, labelStyle, poly, rounded, shadowOf, sheet, useLook, type Pt } from './kit';
import { FriesBox, MemberCard, Phone } from './things';

type Style = React.CSSProperties;
type P = { seed?: number; text?: string };

/** A shopping trolley with a few boxes in it. */
const Trolley: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  return (
    <div style={{ position: 'absolute', width: 480, height: 440, filter: shadowOf(0.42) }}>
      <Cut w={120} h={120} d={sheet(120, 120, { seed: seed + 1, m: 4 }).d} color={mix(KRAFT, BRIGHT, 0.7)} shadow={false} seed={seed + 1} style={{ left: 122, top: 6, transform: 'rotate(-6deg)' }} />
      <Cut w={128} h={140} d={sheet(128, 140, { seed: seed + 2, m: 4 }).d} color={MANILA} shadow={false} seed={seed + 2} style={{ left: 226, top: -14, transform: 'rotate(5deg)' }} />
      <Cut w={86} h={96} d={sheet(86, 96, { seed: seed + 3, m: 4 }).d} color={BRIGHT} shadow={false} seed={seed + 3} style={{ left: 316, top: 30, transform: 'rotate(12deg)' }} />
      <Cut w={480} h={440} d={poly([[66, 92], [404, 92], [362, 284], [108, 284]] as Pt[], seed)} color={t.accent} shadow={false} seed={seed}>
        <svg width={480} height={440} style={{ position: 'absolute', inset: 0 }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={`M${120 + k * 58} 96 L${138 + k * 46} 280`} stroke={t.accentDeep} strokeWidth={4} opacity={0.6} />
          ))}
          <path d="M82 156 H388 M96 220 H376" stroke={t.accentDeep} strokeWidth={4} opacity={0.6} />
        </svg>
      </Cut>
      <svg width={480} height={440} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d="M404 92 L436 44 H470" fill="none" stroke={t.type} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M108 284 L128 350 H384" fill="none" stroke={t.type} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        {[150, 362].map((x) => (
          <g key={x}>
            <circle cx={x} cy={394} r={29} fill={t.type} />
            <circle cx={x} cy={394} r={9} fill={BRIGHT} />
          </g>
        ))}
      </svg>
    </div>
  );
};

/** A cardboard box, taped shut. */
const Box: React.FC<P> = ({ seed = 1, text }) => {
  const t = useLook();
  const body = mix(KRAFT, BRIGHT, 0.82);
  return (
    <div style={{ position: 'absolute', width: 440, height: 370 }}>
      <Cut w={440} h={370} d={poly([[6, 56], [206, 44], [214, 122], [34, 122]] as Pt[], seed + 1)} color={MANILA} seed={seed + 1} lift={0.18} />
      <Cut w={440} h={370} d={poly([[226, 44], [434, 52], [404, 122], [220, 122]] as Pt[], seed + 2)} color={mix(KRAFT, BRIGHT, 0.6)} seed={seed + 2} lift={0.18} />
      <Cut w={440} h={370} d={poly([[32, 116], [406, 116], [406, 356], [32, 356]] as Pt[], seed)} color={body} seed={seed} lift={0.4}>
        <div style={{ position: 'absolute', left: 198, top: 116, width: 44, height: 150, background: rgba(BRIGHT, 0.55) }} />
        <div style={{ position: 'absolute', left: 32, right: 34, top: 250, borderTop: `3px solid ${rgba(t.ink, 0.18)}` }} />
      </Cut>
      {text ? (
        <Cut w={190} h={70} d={rounded(190, 70, 10, seed + 4)} color={BRIGHT} seed={seed + 4} lift={0.1} style={{ left: 60, top: 268, transform: 'rotate(-3deg)' }}>
          <div data-box style={{ ...labelStyle(Math.min(26, fit([text.toUpperCase()], 'label', 160, 26)), t.ink), position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{text}</div>
        </Cut>
      ) : null}
    </div>
  );
};

/** A shop front with an awning. `text` is the plain word on its sign. */
const Store: React.FC<P> = ({ seed = 1, text = 'Shop' }) => {
  const t = useLook();
  const scallop = Array.from({ length: 7 }, (_, k) => `Q${30 + k * 71.4 + 35.7} 268 ${30 + (k + 1) * 71.4} 232`).join(' ');
  const size = fit([text.toUpperCase()], 'headline', 440, 58, 20, 0.02);
  return (
    <div style={{ position: 'absolute', width: 560, height: 470 }}>
      <Cut w={560} h={470} d={poly([[40, 150], [520, 150], [520, 448], [40, 448]] as Pt[], seed)} color={BRIGHT} seed={seed} lift={0.3}>
        <div style={{ position: 'absolute', left: 240, top: 292, width: 92, height: 156, background: t.ink }} />
        <div style={{ position: 'absolute', left: 316, top: 366, width: 9, height: 9, borderRadius: 5, background: BRIGHT }} />
        {[72, 360].map((x) => (
          <div key={x} style={{ position: 'absolute', left: x, top: 286, width: 138, height: 104, background: t.accentWash, border: `4px solid ${t.ink}` }}>
            <div style={{ position: 'absolute', left: 18, top: -10, width: 5, height: 130, background: rgba(BRIGHT, 0.75), transform: 'rotate(32deg)' }} />
          </div>
        ))}
      </Cut>
      <Cut w={560} h={470} d={poly([[26, 84], [534, 84], [534, 166], [26, 166]] as Pt[], seed + 1)} color={t.accentDeep} seed={seed + 1} lift={0.36}>
        <div data-box style={{ ...headStyle(size, BRIGHT), position: 'absolute', left: 26, right: 26, top: 84, height: 82, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: `${0.02}em` }}>{text.toUpperCase()}</div>
      </Cut>
      <Cut w={560} h={470} d={`M30 160 H530 V232 ${scallop.split(' ').reverse().join(' ') && ''}${Array.from({ length: 7 }, (_, k) => `Q${530 - k * 71.4 - 35.7} 268 ${530 - (k + 1) * 71.4} 232`).join(' ')} Z`} color={t.accent} seed={seed + 2} lift={0.5}>
        <svg width={560} height={470} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 6 }, (_, k) => (
            <path key={k} d={`M${101.4 + k * 71.4} 160 V250`} stroke={t.accentDeep} strokeWidth={4} opacity={0.55} />
          ))}
        </svg>
      </Cut>
      <Cut w={600} h={30} d={sheet(600, 30, { seed: seed + 3, m: 3 }).d} color={MANILA} seed={seed + 3} lift={0.1} style={{ left: -20, top: 440 }} />
    </div>
  );
};

/** A plot of land with a small building on it and a pin in it: property. */
const Plot: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  return (
    <div style={{ position: 'absolute', width: 560, height: 420 }}>
      <Cut w={560} h={420} d={poly([[70, 150], [524, 118], [494, 372], [30, 394]] as Pt[], seed)} color={MANILA} seed={seed} lift={0.2}>
        <svg width={560} height={420} style={{ position: 'absolute', inset: 0 }}>
          <path d="M96 172 L500 144 L474 352 L60 370 Z" fill="none" stroke={t.ink} strokeWidth={4} strokeDasharray="16 12" opacity={0.75} />
        </svg>
      </Cut>
      <Cut w={560} h={420} d={poly([[168, 250], [330, 240], [326, 338], [164, 346]] as Pt[], seed + 1)} color={BRIGHT} seed={seed + 1} lift={0.34}>
        <div style={{ position: 'absolute', left: 226, top: 282, width: 40, height: 60, background: t.ink, transform: 'rotate(-2deg)' }} />
      </Cut>
      <Cut w={560} h={420} d={poly([[148, 254], [250, 178], [350, 244]] as Pt[], seed + 2)} color={t.accent} seed={seed + 2} lift={0.44} />
      <div style={{ position: 'absolute', left: 392, top: 60, width: 96, height: 140, filter: shadowOf(0.7) }}>
        <svg width={96} height={140} viewBox="0 0 96 140">
          <path d="M48 136 C 30 96, 6 78, 6 48 A42 42 0 1 1 90 48 C 90 78, 66 96, 48 136 Z" fill={t.accent} stroke={t.ink} strokeWidth={4} />
          <circle cx={48} cy={48} r={16} fill={BRIGHT} stroke={t.ink} strokeWidth={4} />
        </svg>
      </div>
    </div>
  );
};

/** A burger, one layer of paper at a time. */
const Burger: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  const bun = mix(KRAFT, BRIGHT, 0.72);
  return (
    <div style={{ position: 'absolute', width: 440, height: 380 }}>
      <Cut w={440} h={380} d={rounded(440, 380, 1, seed + 5).replace(/.*/, 'M44 300 H396 Q402 356 350 362 H90 Q38 356 44 300 Z')} color={bun} seed={seed + 5} lift={0.3} />
      <Cut w={440} h={380} d="M34 246 Q34 232 50 232 H390 Q406 232 406 248 V284 Q406 300 390 300 H50 Q34 300 34 284 Z" color={mix(t.ink, KRAFT, 0.72)} dark seed={seed + 4} lift={0.3} />
      <Cut w={440} h={380} d="M26 214 H414 V238 H330 L300 276 L270 238 H26 Z" color={t.accent} seed={seed + 3} lift={0.26} />
      <Cut w={440} h={380} d={`M22 196 ${Array.from({ length: 8 }, (_, k) => `Q${22 + k * 49.5 + 24.7} ${k % 2 ? 172 : 228} ${22 + (k + 1) * 49.5} 196`).join(' ')} V214 H22 Z`} color={t.accentWash} seed={seed + 2} lift={0.24} />
      <Cut w={440} h={380} d="M40 190 Q36 44 220 40 Q404 44 400 190 Z" color={bun} seed={seed + 1} lift={0.4}>
        <svg width={440} height={380} style={{ position: 'absolute', inset: 0 }}>
          {[[150, 92, 20], [226, 70, -14], [300, 100, 30], [186, 130, -30], [264, 138, 10], [112, 142, 40], [336, 150, -20]].map(([x, y, r], k) => (
            <ellipse key={k} cx={x} cy={y} rx={13} ry={6} fill={BRIGHT} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          <path d="M70 176 Q72 70 214 62" fill="none" stroke={rgba(BRIGHT, 0.4)} strokeWidth={6} strokeLinecap="round" />
        </svg>
      </Cut>
    </div>
  );
};

const BASE: Record<string, [number, number]> = { card: [420, 265], trolley: [480, 440], box: [440, 370], store: [560, 470], fries: [520, 640], burger: [440, 380], plot: [560, 420], phone: [350, 700] };
/** Natural height of a product drawn `w` wide. */
export const productHeight = (name: string, w: number): number => {
  const [bw, bh] = BASE[name] || [400, 400];
  return (bh / bw) * w;
};

/** Any product by name, drawn `w` wide. `text` is the plain word on it, where it has one. */
export const Product: React.FC<{ name: string; w: number; seed?: number; text?: string; price?: string; style?: Style }> = ({ name, w, seed = 1, text, price, style }) => {
  const [bw, bh] = BASE[name] || [400, 400];
  const k = w / bw;
  const inner =
    name === 'card' ? (
      <MemberCard w={420} word={text || 'MEMBER'} price={price || ''} sub={price ? 'a year' : ''} seed={seed} />
    ) : name === 'trolley' ? (
      <Trolley seed={seed} />
    ) : name === 'box' ? (
      <Box seed={seed} text={text} />
    ) : name === 'store' ? (
      <Store seed={seed} text={text} />
    ) : name === 'fries' ? (
      <FriesBox seed={seed} label={text || 'FRIES'} />
    ) : name === 'burger' ? (
      <Burger seed={seed} />
    ) : name === 'plot' ? (
      <Plot seed={seed} />
    ) : (
      <Phone w={350} seed={seed} query={text || 'pizza near me'} />
    );
  return (
    <div style={{ position: 'absolute', width: w, height: bh * k, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: bw, height: bh, transform: `scale(${k})`, transformOrigin: '0 0' }}>{inner}</div>
    </div>
  );
};
