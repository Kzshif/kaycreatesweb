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

/**
 * A modern hillside mansion: a long glass ground floor, a cantilevered upper floor with a ribbon
 * window, flat roof slabs, a pool on the terrace and a palm behind. No signs, no real house.
 */
const Mansion: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  const wall = mix(BRIGHT, MANILA, 0.18);
  const fronds = [-150, -112, -70, -30, 8, 44].map((deg, k) => {
    const a = (deg * Math.PI) / 180;
    const len = k === 0 || k === 5 ? 92 : 112;
    const ex = 512 + Math.cos(a) * len;
    const ey = 78 + Math.sin(a) * len + 26;
    const mx = 512 + Math.cos(a) * len * 0.55;
    const my = 78 + Math.sin(a) * len * 0.55 - 16;
    return `M512 78 Q${(mx - 10).toFixed(1)} ${(my - 14).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} Q${(mx + 8).toFixed(1)} ${(my + 18).toFixed(1)} 512 86 Z`;
  });
  const glass = (x: number, y: number, w: number, h: number, key: number) => (
    <div key={key} style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: t.accentWash, border: `4px solid ${t.ink}`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: w * 0.18, top: -20, width: 7, height: h + 40, background: rgba(BRIGHT, 0.7), transform: 'rotate(28deg)' }} />
      <div style={{ position: 'absolute', left: w * 0.32, top: -20, width: 3, height: h + 40, background: rgba(BRIGHT, 0.5), transform: 'rotate(28deg)' }} />
    </div>
  );
  return (
    <div style={{ position: 'absolute', width: 600, height: 440 }}>
      <div style={{ position: 'absolute', inset: 0, filter: shadowOf(0.3) }}>
        <svg width={600} height={440} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <path d="M498 372 C502 280 500 170 512 82" fill="none" stroke={mix(KRAFT, t.ink, 0.25)} strokeWidth={15} strokeLinecap="round" />
          {[300, 250, 200, 150, 110].map((y) => (
            <path key={y} d={`M${496 + (372 - y) * 0.05} ${y} l14 -6`} stroke={rgba(t.ink, 0.35)} strokeWidth={3} />
          ))}
          {fronds.map((d, k) => (
            <path key={k} d={d} fill={k % 2 ? t.accentDeep : t.accent} stroke={rgba(t.ink, 0.35)} strokeWidth={2} />
          ))}
        </svg>
      </div>
      <Cut w={600} h={440} d={poly([[0, 364], [600, 364], [600, 440], [0, 440]] as Pt[], seed + 5)} color={MANILA} seed={seed + 5} lift={0.12}>
        <div style={{ position: 'absolute', left: 64, top: 384, width: 330, height: 40, background: t.accentWash, border: `4px solid ${t.ink}`, borderRadius: 6 }}>
          <svg width={330} height={40} style={{ position: 'absolute', inset: 0 }}>
            <path d="M24 14 q18 -7 36 0 t36 0 M140 26 q18 -7 36 0 t36 0 M238 12 q14 -6 28 0 t28 0" fill="none" stroke={rgba(BRIGHT, 0.85)} strokeWidth={4} strokeLinecap="round" />
          </svg>
        </div>
      </Cut>
      <Cut w={600} h={440} d={poly([[32, 218], [568, 218], [568, 368], [32, 368]] as Pt[], seed)} color={wall} seed={seed} lift={0.4}>
        {[0, 1, 2, 3].map((k) => glass(66 + k * 118, 244, 104, 124, k))}
        <div style={{ position: 'absolute', left: 32, top: 218, width: 536, height: 10, background: rgba(t.ink, 0.12) }} />
      </Cut>
      <Cut w={600} h={440} d={poly([[148, 116], [506, 116], [506, 212], [148, 212]] as Pt[], seed + 1)} color={BRIGHT} seed={seed + 1} lift={0.44}>
        <div style={{ position: 'absolute', left: 172, top: 140, width: 310, height: 50, background: t.accentWash, border: `4px solid ${t.ink}` }}>
          {[1, 2, 3, 4].map((k) => (
            <div key={k} style={{ position: 'absolute', left: k * 62 - 2, top: 0, width: 4, height: 42, background: t.ink }} />
          ))}
          <div style={{ position: 'absolute', left: 40, top: -10, width: 6, height: 70, background: rgba(BRIGHT, 0.65), transform: 'rotate(34deg)' }} />
        </div>
      </Cut>
      <Cut w={600} h={440} d={poly([[130, 100], [526, 100], [526, 120], [130, 120]] as Pt[], seed + 2)} color={t.ink} dark seed={seed + 2} lift={0.5} />
      <Cut w={600} h={440} d={poly([[14, 204], [586, 204], [586, 224], [14, 224]] as Pt[], seed + 3)} color={t.ink} dark seed={seed + 3} lift={0.5} />
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

/** A game controller: shoulder buttons, a pad, two sticks and four face buttons. */
const Controller: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  const body = 'M92 98 Q128 66 204 70 H316 Q392 66 428 98 Q476 152 496 262 Q506 328 458 332 Q422 334 394 290 L368 248 H152 L126 290 Q98 334 62 332 Q14 328 24 262 Q44 152 92 98 Z';
  return (
    <div style={{ position: 'absolute', width: 520, height: 340 }}>
      <Cut w={520} h={340} d="M104 74 Q112 46 150 44 H196 Q214 46 216 70 Z" color={t.accentDeep} seed={seed + 1} lift={0.2} />
      <Cut w={520} h={340} d="M416 74 Q408 46 370 44 H324 Q306 46 304 70 Z" color={t.accentDeep} seed={seed + 2} lift={0.2} />
      <Cut w={520} h={340} d={body} color={t.accent} seed={seed} lift={0.44}>
        <svg width={520} height={340} style={{ position: 'absolute', inset: 0 }}>
          <path d="M106 104 Q150 82 222 84" fill="none" stroke={rgba(BRIGHT, 0.4)} strokeWidth={7} strokeLinecap="round" />
          <path d="M112 142 h30 v-30 h28 v30 h30 v28 h-30 v30 h-28 v-30 h-30 Z" fill={t.ink} />
          {[[386, 112, BRIGHT], [416, 142, t.accentWash], [356, 142, t.accentWash], [386, 172, BRIGHT]].map(([x, y, c], k) => (
            <circle key={k} cx={x as number} cy={y as number} r={15} fill={c as string} stroke={t.ink} strokeWidth={4} />
          ))}
          {[204, 316].map((x) => (
            <g key={x}>
              <circle cx={x} cy={218} r={36} fill={t.ink} />
              <circle cx={x} cy={218} r={21} fill={mix(t.ink, BRIGHT, 0.72)} />
              <path d={`M${x - 12} ${208} Q${x} ${200} ${x + 12} ${208}`} fill="none" stroke={rgba(BRIGHT, 0.35)} strokeWidth={4} strokeLinecap="round" />
            </g>
          ))}
          <rect x={238} y={118} width={44} height={14} rx={7} fill={BRIGHT} opacity={0.85} />
        </svg>
      </Cut>
    </div>
  );
};

/** A chocolate bar, its wrapper torn open at one end. `text` is the plain word on the band. */
const Bar: React.FC<P> = ({ seed = 1, text = 'CHOCOLATE' }) => {
  const t = useLook();
  const choc = mix(t.ink, KRAFT, 0.58);
  const size = Math.min(40, fit([text.toUpperCase()], 'headline', 230, 40));
  return (
    <div style={{ position: 'absolute', width: 520, height: 260 }}>
      <Cut w={520} h={260} d={poly([[300, 40], [508, 52], [500, 222], [292, 214]] as Pt[], seed + 1)} color={choc} dark seed={seed + 1} lift={0.3}>
        <svg width={520} height={260} style={{ position: 'absolute', inset: 0 }}>
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={318 + c * 60} y={62 + r * 52} width={48} height={40} rx={5} fill="none" stroke={rgba(BRIGHT, 0.22)} strokeWidth={4} />
          )))}
        </svg>
      </Cut>
      <Cut w={520} h={260} d={`M14 34 L330 26 ${Array.from({ length: 7 }, (_, k) => `L${k % 2 ? 342 : 318} ${26 + (k + 1) * 28.6}`).join(' ')} L14 228 Z`} color={t.accent} seed={seed} lift={0.42}>
        <div style={{ position: 'absolute', left: 30, top: 92, width: 286, height: 78, background: BRIGHT, transform: 'rotate(-1deg)' }} />
        <div data-box style={{ ...headStyle(size, t.ink), position: 'absolute', left: 30, top: 92, width: 286, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-1deg)' }}>{text.toUpperCase()}</div>
        <div style={{ position: 'absolute', left: 14, right: 180, top: 40, height: 8, background: rgba(BRIGHT, 0.35) }} />
      </Cut>
    </div>
  );
};

/** An event ticket with a tear-off stub. `text` names the event; `price` goes on the stub. */
const Ticket: React.FC<P & { price?: string }> = ({ seed = 1, text = 'ADMIT ONE', price }) => {
  const t = useLook();
  // the stub is marked off by two half-moon notches, top and bottom
  const d = 'M16 14 H364 A18 18 0 0 0 400 14 H526 V238 H400 A18 18 0 0 0 364 238 H16 Z';
  const size = Math.min(52, fit([text.toUpperCase()], 'headline', 300, 52));
  return (
    <div style={{ position: 'absolute', width: 540, height: 250 }}>
      <Cut w={540} h={250} d={d} color={BRIGHT} seed={seed} lift={0.4}>
        <div style={{ position: 'absolute', left: 16, top: 14, width: 18, bottom: 12, background: t.accent }} />
        <div style={{ ...labelStyle(18, t.ink), position: 'absolute', left: 56, top: 40 }}>Admit one</div>
        <div data-box style={{ ...headStyle(size, t.ink), position: 'absolute', left: 52, top: 82, width: 300, height: 90, display: 'flex', alignItems: 'center' }}>{text.toUpperCase()}</div>
        <div style={{ position: 'absolute', left: 56, top: 190, width: 280, height: 14, background: `repeating-linear-gradient(90deg, ${t.ink} 0 4px, transparent 4px 9px)`, opacity: 0.55 }} />
        <svg width={540} height={250} style={{ position: 'absolute', inset: 0 }}>
          <path d="M382 34 V220" stroke={t.ink} strokeWidth={4} strokeDasharray="10 9" opacity={0.6} />
        </svg>
        {price ? (
          <div data-box style={{ position: 'absolute', left: 400, top: 60, width: 126, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...headStyle(Math.min(56, fit([price], 'headline', 110, 56)), t.accentDeep) }}>{price}</div>
          </div>
        ) : (
          <div style={{ position: 'absolute', left: 420, top: 70, width: 86, height: 110, background: t.accentWash, transform: 'rotate(-4deg)' }} />
        )}
      </Cut>
    </div>
  );
};

/** A vinyl record sliding out of its sleeve. `text` is the plain word on the label. */
const Record: React.FC<P> = ({ seed = 1, text = 'HIT' }) => {
  const t = useLook();
  const size = Math.min(30, fit([text.toUpperCase()], 'label', 120, 30));
  return (
    <div style={{ position: 'absolute', width: 520, height: 440 }}>
      <Cut w={520} h={440} d={poly([[8, 40], [330, 30], [338, 424], [14, 432]] as Pt[], seed + 1)} color={MANILA} seed={seed + 1} lift={0.3}>
        <div style={{ position: 'absolute', left: 40, top: 320, width: 200, height: 12, background: t.accent, opacity: 0.8 }} />
        <div style={{ position: 'absolute', left: 40, top: 344, width: 130, height: 12, background: t.accentDeep, opacity: 0.6 }} />
      </Cut>
      <div style={{ position: 'absolute', left: 140, top: 30, width: 380, height: 380, filter: shadowOf(0.5) }}>
        <svg width={380} height={380} viewBox="0 0 380 380">
          <circle cx={190} cy={190} r={188} fill={t.ink} />
          {[170, 152, 136, 120, 104].map((r) => (
            <circle key={r} cx={190} cy={190} r={r} fill="none" stroke={rgba(BRIGHT, 0.1)} strokeWidth={3} />
          ))}
          <path d="M80 92 A150 150 0 0 1 176 44" fill="none" stroke={rgba(BRIGHT, 0.28)} strokeWidth={9} strokeLinecap="round" />
          <circle cx={190} cy={190} r={74} fill={t.accent} />
          <circle cx={190} cy={190} r={8} fill={BRIGHT} />
        </svg>
        <div data-box style={{ ...labelStyle(size, t.onAccent), position: 'absolute', left: 130, top: 134, width: 120, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{text}</div>
      </div>
    </div>
  );
};

/** A collectible trading card: foil border, an abstract burst in the art window, a name bar. No real artwork. */
const TradingCard: React.FC<P> = ({ seed = 1, text = 'RARE' }) => {
  const t = useLook();
  const size = Math.min(34, fit([text.toUpperCase()], 'headline', 230, 34));
  const rays = Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2;
    return `M150 172 L${(150 + Math.cos(a) * 120).toFixed(1)} ${(172 + Math.sin(a) * 120).toFixed(1)} L${(150 + Math.cos(a + 0.18) * 120).toFixed(1)} ${(172 + Math.sin(a + 0.18) * 120).toFixed(1)} Z`;
  }).join(' ');
  return (
    <div style={{ position: 'absolute', width: 300, height: 420 }}>
      <Cut w={300} h={420} d={rounded(300, 420, 18, seed)} color={t.accent} seed={seed} lift={0.42}>
        <div style={{ position: 'absolute', left: 16, top: 16, right: 16, bottom: 16, borderRadius: 10, background: mix(t.accent, BRIGHT, 0.55) }} />
        <div style={{ position: 'absolute', left: 30, top: 30, width: 240, height: 56, borderRadius: 6, background: BRIGHT }} />
        <div data-box style={{ ...headStyle(size, t.ink), position: 'absolute', left: 30, top: 30, width: 240, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{text.toUpperCase()}</div>
        <svg width={300} height={420} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <clipPath id={`art${seed}`}>
              <rect x={30} y={98} width={240} height={150} rx={6} />
            </clipPath>
          </defs>
          <rect x={30} y={98} width={240} height={150} rx={6} fill={t.accentWash} />
          <g clipPath={`url(#art${seed})`}>
            <path d={rays} fill={rgba(BRIGHT, 0.55)} />
            <circle cx={150} cy={172} r={34} fill={t.accentDeep} />
            <circle cx={150} cy={172} r={14} fill={BRIGHT} />
          </g>
          {[0, 1, 2].map((k) => (
            <rect key={k} x={30} y={266 + k * 30} width={240 - k * 50} height={12} rx={6} fill={rgba(t.ink, k ? 0.16 : 0.28)} />
          ))}
          <path d="M40 30 L120 30 L60 390 L20 390 Z" fill={rgba(BRIGHT, 0.18)} />
          <path d="M150 30 L190 30 L130 390 L110 390 Z" fill={rgba(BRIGHT, 0.12)} />
        </svg>
      </Cut>
    </div>
  );
};

/** A seedling in a paper pot: two leaves and a bud on a curling stem. `text` is the plain word on the pot's label. */
const Sprout: React.FC<P> = ({ seed = 1, text = 'GROW' }) => {
  const t = useLook();
  const size = Math.min(40, fit([text.toUpperCase()], 'headline', 176, 40));
  // a leaf from its base to its tip, `w` wide at the middle
  const leaf = (bx: number, by: number, tx: number, ty: number, w: number) => {
    const mx = (bx + tx) / 2;
    const my = (by + ty) / 2;
    const len = Math.hypot(tx - bx, ty - by) || 1;
    const nx = (-(ty - by) / len) * w;
    const ny = ((tx - bx) / len) * w;
    return `M${bx} ${by} Q${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${tx} ${ty} Q${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)} ${bx} ${by} Z`;
  };
  const leaves: [number, number, number, number, number][] = [
    [176, 196, 52, 136, 38],
    [182, 150, 312, 92, 36],
    [180, 104, 150, 26, 22],
  ];
  return (
    <div style={{ position: 'absolute', width: 360, height: 460 }}>
      <svg width={360} height={460} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d="M180 286 C168 236 194 196 178 150 C166 118 184 96 180 74" fill="none" stroke={t.accentDeep} strokeWidth={11} strokeLinecap="round" />
      </svg>
      {leaves.map(([bx, by, tx, ty, w], k) => (
        <Cut key={k} w={360} h={460} d={leaf(bx, by, tx, ty, w)} color={k === 2 ? mix(t.accent, BRIGHT, 0.25) : t.accent} seed={seed + 3 + k} lift={0.26}>
          <svg width={360} height={460} style={{ position: 'absolute', inset: 0 }}>
            <path d={`M${bx} ${by} L${(bx + (tx - bx) * 0.82).toFixed(1)} ${(by + (ty - by) * 0.82).toFixed(1)}`} stroke={rgba(t.accentDeep, 0.7)} strokeWidth={4} strokeLinecap="round" />
          </svg>
        </Cut>
      ))}
      <Cut w={360} h={460} d={poly([[52, 300], [308, 300], [282, 452], [78, 452]] as Pt[], seed)} color={mix(KRAFT, BRIGHT, 0.55)} seed={seed} lift={0.42}>
        <div style={{ position: 'absolute', left: 92, top: 344, width: 176, height: 70, background: BRIGHT, transform: 'rotate(-2deg)' }} />
        <div data-box style={{ ...headStyle(size, t.ink), position: 'absolute', left: 92, top: 344, width: 176, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-2deg)' }}>{text.toUpperCase()}</div>
      </Cut>
      <Cut w={360} h={460} d={poly([[34, 262], [326, 262], [318, 306], [42, 306]] as Pt[], seed + 1)} color={MANILA} seed={seed + 1} lift={0.32}>
        <div style={{ position: 'absolute', left: 50, top: 262, width: 260, height: 14, borderRadius: 7, background: mix(t.ink, KRAFT, 0.45), opacity: 0.9 }} />
      </Cut>
    </div>
  );
};

/** A drink can: lid and pull tab, a printed band with a plain word, and an optional price printed on it. */
const Can: React.FC<P & { price?: string }> = ({ seed = 1, text = 'SODA', price }) => {
  const t = useLook();
  const size = Math.min(54, fit([text.toUpperCase()], 'headline', 200, 54));
  const body = 'M22 70 Q22 44 150 42 Q278 44 278 70 L278 478 Q278 506 150 508 Q22 506 22 478 Z';
  return (
    <div style={{ position: 'absolute', width: 300, height: 520 }}>
      <Cut w={300} h={520} d={body} color={t.accent} seed={seed} lift={0.44}>
        <svg width={300} height={520} style={{ position: 'absolute', inset: 0 }}>
          <path d="M44 80 V470" stroke={rgba(BRIGHT, 0.32)} strokeWidth={16} strokeLinecap="round" />
          <path d="M252 84 V468" stroke={rgba(t.ink, 0.14)} strokeWidth={20} strokeLinecap="round" />
          <ellipse cx={150} cy={64} rx={120} ry={20} fill={mix(BRIGHT, KRAFT, 0.3)} stroke={rgba(t.ink, 0.35)} strokeWidth={4} />
          <ellipse cx={150} cy={64} rx={96} ry={13} fill="none" stroke={rgba(t.ink, 0.22)} strokeWidth={3} />
          <rect x={126} y={54} width={50} height={18} rx={9} fill={mix(BRIGHT, KRAFT, 0.55)} stroke={rgba(t.ink, 0.4)} strokeWidth={3} />
          <path d="M28 476 Q150 500 272 476" fill="none" stroke={rgba(t.ink, 0.2)} strokeWidth={4} />
        </svg>
        <div style={{ position: 'absolute', left: 22, right: 22, top: 176, height: 132, background: BRIGHT }} />
        <div style={{ position: 'absolute', left: 22, right: 22, top: 176, height: 10, background: t.accentDeep, opacity: 0.8 }} />
        <div data-box style={{ ...headStyle(size, t.ink), position: 'absolute', left: 50, top: 190, width: 200, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{text.toUpperCase()}</div>
      </Cut>
      {price ? (
        <Cut w={150} h={150} d={rounded(150, 150, 75, seed + 2)} color={BRIGHT} seed={seed + 2} lift={0.24} style={{ left: 150, top: 330, transform: 'rotate(-8deg)' }}>
          <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `5px solid ${t.ink}` }} />
          <div data-box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...headStyle(Math.min(64, fit([price], 'headline', 104, 64)), t.ink) }}>{price}</div>
          </div>
        </Cut>
      ) : null}
    </div>
  );
};

/** A rocket on its flame: nose cone, a porthole, fins and a ragged plume. No markings. */
const Rocket: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  const body = 'M150 20 C204 64 222 138 222 212 L222 444 Q222 462 204 462 H96 Q78 462 78 444 L78 212 C78 138 96 64 150 20 Z';
  const plume = `M100 470 ${Array.from({ length: 9 }, (_, k) => {
    const x = 100 + (k + 1) * 11.1;
    const y = 520 + (k % 2 ? 22 : 64) + (k === 4 ? 30 : 0);
    return `L${x.toFixed(1)} ${y}`;
  }).join(' ')} L200 470 Z`;
  return (
    <div style={{ position: 'absolute', width: 300, height: 600 }}>
      <Cut w={300} h={600} d={plume} color={mix(KRAFT, t.accent, 0.35)} seed={seed + 4} lift={0.18} />
      <Cut w={300} h={600} d="M118 470 L130 534 L150 506 L170 534 L182 470 Z" color={BRIGHT} seed={seed + 5} lift={0.1} />
      <Cut w={300} h={600} d="M78 330 L22 420 L22 462 L78 444 Z" color={t.accentDeep} seed={seed + 1} lift={0.3} />
      <Cut w={300} h={600} d="M222 330 L278 420 L278 462 L222 444 Z" color={t.accentDeep} seed={seed + 2} lift={0.3} />
      <Cut w={300} h={600} d={body} color={BRIGHT} seed={seed} lift={0.44}>
        <svg width={300} height={600} style={{ position: 'absolute', inset: 0 }}>
          <path d="M150 20 C188 52 206 98 214 148 H86 C94 98 112 52 150 20 Z" fill={t.accent} />
          <rect x={78} y={384} width={144} height={22} fill={t.accent} />
          <rect x={78} y={414} width={144} height={8} fill={t.accentDeep} opacity={0.7} />
          <circle cx={150} cy={232} r={38} fill={t.ink} />
          <circle cx={150} cy={232} r={27} fill={t.accentWash} />
          <path d="M136 220 Q146 212 158 214" fill="none" stroke={rgba(BRIGHT, 0.7)} strokeWidth={6} strokeLinecap="round" />
          <path d="M96 170 V440" stroke={rgba(t.ink, 0.1)} strokeWidth={10} strokeLinecap="round" />
          <path d="M206 176 V440" stroke={rgba(t.ink, 0.14)} strokeWidth={12} strokeLinecap="round" />
        </svg>
      </Cut>
    </div>
  );
};

/** A toy building brick, eight studs on top, seen slightly from above. Plain plastic: no lettering on the studs. */
const Brick: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  const top = mix(t.accent, BRIGHT, 0.22);
  const studs = Array.from({ length: 8 }, (_, k) => ({ x: 92 + (k % 4) * 112, y: 96 + Math.floor(k / 4) * 66 }));
  return (
    <div style={{ position: 'absolute', width: 560, height: 380 }}>
      <Cut w={560} h={380} d="M40 150 L520 150 L520 330 Q520 346 504 346 L56 346 Q40 346 40 330 Z" color={t.accentDeep} seed={seed + 1} lift={0.36}>
        <svg width={560} height={380} style={{ position: 'absolute', inset: 0 }}>
          <path d="M60 170 V326" stroke={rgba(BRIGHT, 0.22)} strokeWidth={12} strokeLinecap="round" />
        </svg>
      </Cut>
      <Cut w={560} h={380} d="M70 56 L490 56 L520 150 L40 150 Z" color={top} seed={seed} lift={0.3}>
        <svg width={560} height={380} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {studs.map((st, k) => (
            <g key={k}>
              <ellipse cx={st.x + 2} cy={st.y + 14} rx={38} ry={14} fill={rgba(t.ink, 0.25)} />
              <rect x={st.x - 38} y={st.y - 18} width={76} height={30} fill={t.accent} />
              <ellipse cx={st.x} cy={st.y + 12} rx={38} ry={14} fill={t.accent} />
              <ellipse cx={st.x} cy={st.y - 18} rx={38} ry={14} fill={mix(t.accent, BRIGHT, 0.35)} stroke={rgba(t.ink, 0.25)} strokeWidth={3} />
            </g>
          ))}
        </svg>
      </Cut>
    </div>
  );
};

/** A takeaway coffee cup: domed lid, paper sleeve with a plain word, a wisp of steam. No logo. */
const Cup: React.FC<P> = ({ seed = 1, text = 'COFFEE' }) => {
  const t = useLook();
  const size = Math.min(40, fit([text.toUpperCase()], 'headline', 190, 40));
  return (
    <div style={{ position: 'absolute', width: 340, height: 520 }}>
      <svg width={340} height={520} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d="M150 70 C130 46 168 30 150 6 M196 74 C178 52 212 36 196 12" fill="none" stroke={rgba(t.ink, 0.28)} strokeWidth={8} strokeLinecap="round" />
      </svg>
      <Cut w={340} h={520} d="M48 132 L292 132 L262 500 Q260 512 248 512 L92 512 Q80 512 78 500 Z" color={BRIGHT} seed={seed} lift={0.44}>
        <svg width={340} height={520} style={{ position: 'absolute', inset: 0 }}>
          <path d="M70 150 L96 496" stroke={rgba(t.ink, 0.08)} strokeWidth={14} strokeLinecap="round" />
        </svg>
      </Cut>
      <Cut w={340} h={520} d="M58 250 L282 250 L270 392 L70 392 Z" color={mix(KRAFT, BRIGHT, 0.5)} seed={seed + 1} lift={0.26}>
        <div data-box style={{ ...headStyle(size, t.ink), position: 'absolute', left: 74, top: 286, width: 192, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{text.toUpperCase()}</div>
      </Cut>
      <Cut w={340} h={520} d="M34 132 Q36 96 76 92 L264 92 Q304 96 306 132 Z" color={t.accent} seed={seed + 2} lift={0.36}>
        <svg width={340} height={520} style={{ position: 'absolute', inset: 0 }}>
          <rect x={30} y={124} width={280} height={18} rx={9} fill={t.accentDeep} />
          <rect x={150} y={98} width={40} height={10} rx={5} fill={rgba(t.ink, 0.35)} />
        </svg>
      </Cut>
    </div>
  );
};

/** A football: white leather with dark patches, drawn flat with a soft shadow. No markings. */
const Ball: React.FC<P> = ({ seed = 1 }) => {
  const t = useLook();
  const pent = (cx: number, cy: number, r: number, rot: number) =>
    Array.from({ length: 5 }, (_, k) => {
      const a = rot + (k / 5) * Math.PI * 2;
      return `${k ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
    }).join(' ') + ' Z';
  const outer = [0, 1, 2, 3, 4].map((k) => {
    const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
    return { x: 200 + Math.cos(a) * 128, y: 200 + Math.sin(a) * 128, rot: a + Math.PI };
  });
  return (
    <div style={{ position: 'absolute', width: 400, height: 400 }}>
      <Cut w={400} h={400} d="M200 16 A184 184 0 1 1 199.9 16 Z" color={BRIGHT} seed={seed} lift={0.44}>
        <svg width={400} height={400} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <clipPath id={`ball${seed}`}>
              <circle cx={200} cy={200} r={182} />
            </clipPath>
          </defs>
          <g clipPath={`url(#ball${seed})`}>
            <path d={pent(200, 200, 58, -Math.PI / 2)} fill={t.ink} />
            {outer.map((o, k) => (
              <g key={k}>
                <path d={`M${(200 + Math.cos(o.rot + Math.PI) * 58).toFixed(1)} ${(200 + Math.sin(o.rot + Math.PI) * 58).toFixed(1)} L${o.x.toFixed(1)} ${o.y.toFixed(1)}`} stroke={rgba(t.ink, 0.55)} strokeWidth={5} />
                <path d={pent(o.x + Math.cos(o.rot + Math.PI) * 52, o.y + Math.sin(o.rot + Math.PI) * 52, 50, o.rot)} fill={t.ink} />
              </g>
            ))}
            <circle cx={200} cy={200} r={182} fill="none" stroke={rgba(t.ink, 0.14)} strokeWidth={26} />
            <path d="M92 110 Q130 62 196 50" fill="none" stroke={rgba(BRIGHT, 0.85)} strokeWidth={12} strokeLinecap="round" />
          </g>
        </svg>
      </Cut>
    </div>
  );
};

const BASE: Record<string, [number, number]> = { card: [420, 265], trolley: [480, 440], box: [440, 370], store: [560, 470], fries: [520, 640], burger: [440, 380], plot: [560, 420], phone: [350, 700], controller: [520, 340], bar: [520, 260], ticket: [540, 250], record: [520, 440], tradingcard: [300, 420], sprout: [360, 460], can: [300, 520], rocket: [300, 600], brick: [560, 380], cup: [340, 520], ball: [400, 400], mansion: [600, 440] };
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
    ) : name === 'controller' ? (
      <Controller seed={seed} />
    ) : name === 'bar' ? (
      <Bar seed={seed} text={text} />
    ) : name === 'ticket' ? (
      <Ticket seed={seed} text={text} price={price} />
    ) : name === 'record' ? (
      <Record seed={seed} text={text} />
    ) : name === 'tradingcard' ? (
      <TradingCard seed={seed} text={text} />
    ) : name === 'sprout' ? (
      <Sprout seed={seed} text={text} />
    ) : name === 'can' ? (
      <Can seed={seed} text={text} price={price} />
    ) : name === 'rocket' ? (
      <Rocket seed={seed} />
    ) : name === 'brick' ? (
      <Brick seed={seed} />
    ) : name === 'cup' ? (
      <Cup seed={seed} text={text} />
    ) : name === 'ball' ? (
      <Ball seed={seed} />
    ) : name === 'mansion' ? (
      <Mansion seed={seed} />
    ) : (
      // for the phone, `price` is the badge on the top result ("DEFAULT"), shown only when given
      <Phone w={350} seed={seed} query={text || 'pizza near me'} badge={price || ''} />
    );
  return (
    <div style={{ position: 'absolute', width: w, height: bh * k, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: bw, height: bh, transform: `scale(${k})`, transformOrigin: '0 0' }}>{inner}</div>
    </div>
  );
};
