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
        <div data-box style={{ ...labelStyle(size, t.onAccent), position: 'absolute', left: 130, top: 140, width: 120, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{text}</div>
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

const BASE: Record<string, [number, number]> = { card: [420, 265], trolley: [480, 440], box: [440, 370], store: [560, 470], fries: [520, 640], burger: [440, 380], plot: [560, 420], phone: [350, 700], controller: [520, 340], bar: [520, 260], ticket: [540, 250], record: [520, 440], tradingcard: [300, 420] };
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
