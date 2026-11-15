// Scene type: product mockup. Original drawings of generic objects: a card, a
// phone, a receipt, a shopfront, a box, a price tag. Names appear as plain
// text only. No logos, no brand lettering, no brand colours.
import React from 'react';
import { Easing, spring } from 'remotion';
import { D, Head, L, SourceLine, Stage, T } from '../components/ui';
import { Icon } from '../icons';
import { clamp, tween, useScene } from '../lib/anim';
import { fitSize } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type MockupProps = {
  heading?: string;
  title?: string;
  sub?: string;
  price?: string;
  query?: string;
  rows?: { label: string; value?: string }[];
  callouts?: string[];
  source?: string;
};

const PAPER = '#FBF8F0';
const INK = '#17181C';

export const Mockup: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as MockupProps;
  const W = STAGE.width;
  const t = frame / fps;
  const land = spring({ frame, fps, config: look.spring });
  const up = (str: string) => (look.upper ? str.toUpperCase() : str);
  const callouts = p.callouts || [];

  // which callout is the newest one on screen (-1 before the first)
  let live = -1;
  callouts.forEach((_, i) => {
    if (s.on(i + 1)) live = i;
  });
  const Callouts: React.FC<{ width?: number; row?: boolean }> = ({ width, row }) => (
    <div style={{ display: 'flex', flexDirection: row ? 'row' : 'column', flexWrap: 'wrap', gap: 14, width }}>
      {callouts.map((c, i) => {
        const hot = i === live;
        return (
          <div
            key={i}
            style={{
              background: hot ? look.accent : 'transparent',
              borderLeft: `10px solid ${look.accent}`,
              borderRadius: Math.min(look.radius, 14),
              padding: '12px 20px 12px 18px',
              alignSelf: 'flex-start',
              ...s.enter(i + 1),
            }}
          >
            <T size={row ? 44 : 48} bold lh={1.08} color={hot ? look.onAccent : look.fg}>
              {c}
            </T>
          </div>
        );
      })}
    </div>
  );

  switch (scene.variant) {
    // ------------------------------------------------------------ card ----
    case 'card': {
      const cw = 680;
      const ch = 424;
      const ry = -30 * (1 - land) + Math.sin(t * 1.3) * 5 - 7;
      const rx = 9 + Math.cos(t * 1.1) * 2.5;
      const sheen = ((t * 0.55) % 1.6) * 150 - 40;
      const title = up(p.title ?? 'Member');
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.heading} />
          <div style={{ perspective: 1500, height: ch + 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: cw, height: ch, transformStyle: 'preserve-3d', transform: `rotateY(${ry}deg) rotateX(${rx}deg) translateY(${Math.sin(t * 1.6) * 8}px) scale(${0.8 + 0.2 * land})` }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 34, background: look.n[0], transform: 'translate(34px, 38px) rotate(5deg)' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 34, background: look.accent, overflow: 'hidden', boxShadow: '0 34px 70px rgba(0,0,0,0.35)' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 150, height: 62, background: look.onAccent, opacity: 0.14 }} />
                <div style={{ position: 'absolute', top: -80, bottom: -80, left: `${sheen}%`, width: 110, background: '#FFFFFF', opacity: 0.16, transform: 'rotate(18deg)' }} />
                <div style={{ position: 'absolute', left: 44, top: 38 }}>
                  <D size={fitSize(title, look.display, look.displayWeight, cw - 200, 92, look.tracking, 40)} color={look.onAccent} style={{ whiteSpace: 'nowrap' }}>
                    {title}
                  </D>
                </div>
                <div style={{ position: 'absolute', right: 44, top: 44 }}>
                  <Icon name="star" size={72} color={look.onAccent} accent={look.onAccent} />
                </div>
                <div style={{ position: 'absolute', left: 44, top: 232, width: 96, height: 72, borderRadius: 14, border: `4px solid ${look.onAccent}`, opacity: 0.75, boxSizing: 'border-box' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 30, height: 4, background: look.onAccent }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 42, width: 4, background: look.onAccent }} />
                </div>
                <div style={{ position: 'absolute', left: 176, top: 256, display: 'flex', gap: 26 }}>
                  {[0, 1, 2].map((g) => (
                    <div key={g} style={{ display: 'flex', gap: 9 }}>
                      {[0, 1, 2, 3].map((d) => (
                        <div key={d} style={{ width: 15, height: 15, borderRadius: '50%', background: look.onAccent, opacity: 0.7 }} />
                      ))}
                    </div>
                  ))}
                </div>
                {p.sub ? (
                  <div style={{ position: 'absolute', left: 44, bottom: 36 }}>
                    <L size={36} color={look.onAccent}>
                      {p.sub}
                    </L>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 30 }}>
            <Callouts />
          </div>
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ----------------------------------------------------------- phone ----
    case 'phone': {
      const pw = 420;
      const ph = Math.min(880, STAGE.height - (p.heading ? 70 : 0) - 10);
      const query = p.query ?? '';
      const typed = query.slice(0, Math.round(tween(frame, 8, Math.max(10, query.length * 1.4), (x) => x) * query.length));
      const caret = Math.floor(frame / 8) % 2 === 0;
      const rows = p.rows ?? [];
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.heading} />
          <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
            <div
              style={{
                width: pw,
                height: ph,
                borderRadius: 66,
                background: look.dark ? '#05060A' : '#1B1D22',
                border: `5px solid ${look.n[1]}`,
                boxSizing: 'border-box',
                padding: 15,
                flexShrink: 0,
                transform: `translateY(${(1 - land) * 80}px) rotate(${-2.5 * (1 - land)}deg)`,
                opacity: clamp(land * 3),
                boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: 50, background: look.card, overflow: 'hidden', position: 'relative', boxSizing: 'border-box', padding: '58px 24px 24px' }}>
                <div style={{ position: 'absolute', top: 16, left: '50%', marginLeft: -52, width: 104, height: 26, borderRadius: 13, background: look.dark ? '#05060A' : '#1B1D22' }} />
                {p.title ? (
                  <T size={32} bold style={{ marginBottom: 18 }}>
                    {p.title}
                  </T>
                ) : null}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 76, borderRadius: 38, background: look.bg, border: `3px solid ${look.accent}`, padding: '0 20px', boxSizing: 'border-box' }}>
                  <Icon name="search" size={40} color={look.fg} accent="none" stroke={4} />
                  <T size={fitSize(`${query}|`, look.text, look.bold, pw - 30 - 46 - 52 - 12, 32, 0, 18)} bold style={{ whiteSpace: 'nowrap' }}>
                    {typed}
                    <span style={{ opacity: caret ? 1 : 0, color: look.accent }}>|</span>
                  </T>
                </div>
                <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(rows.length ? rows : [{ label: '' }, { label: '' }, { label: '' }, { label: '' }]).map((r, i) => {
                    const pr = spring({ frame: frame - 22 - i * 4, fps, config: look.spring });
                    // the highlighted row moves down the screen as each callout lands
                    const first = rows.length > 0 && i === Math.max(0, Math.min(live, rows.length - 1));
                    return (
                      <div
                        key={i}
                        style={{
                          borderRadius: Math.min(look.radius, 22),
                          background: first ? look.accent : look.bg,
                          padding: '18px 20px',
                          minHeight: 92,
                          boxSizing: 'border-box',
                          transform: `translateY(${(1 - pr) * 30}px)`,
                          opacity: clamp(pr * 2),
                        }}
                      >
                        {r.label ? (
                          <T size={30} bold color={first ? look.onAccent : look.fg} lh={1.1}>
                            {r.label}
                          </T>
                        ) : (
                          <div style={{ height: 16, width: '70%', borderRadius: 8, background: look.n[0] }} />
                        )}
                        {r.value ? (
                          <T size={26} bold color={first ? look.onAccent : look.muted} style={{ marginTop: 4, opacity: first ? 0.85 : 1 }}>
                            {r.value}
                          </T>
                        ) : (
                          <div style={{ height: 12, width: '46%', borderRadius: 6, background: look.n[0], marginTop: 12, opacity: r.label ? 0 : 1 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <Callouts width={W - pw - 40} />
          </div>
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // --------------------------------------------------------- receipt ----
    case 'receipt': {
      const rows = p.rows ?? [];
      const zig = Array.from({ length: 22 }, (_, i) => `${(i / 21) * 100}% ${i % 2 ? 100 : 96.6}%`);
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.heading} />
          <div
            style={{
              width: 600,
              background: PAPER,
              color: INK,
              fontFamily: '"JetBrains Mono"',
              padding: '40px 42px 64px',
              boxSizing: 'border-box',
              transform: `rotate(${-2.2 + (1 - land) * -5}deg) translateY(${(1 - land) * -70}px)`,
              clipPath: `polygon(0 0, 100% 0, ${[...zig].reverse().join(', ')})`,
              opacity: clamp(land * 3),
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 800, textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.title ?? 'Receipt'}</div>
            <div style={{ borderTop: `4px dashed ${INK}`, opacity: 0.5, margin: '20px 0 14px' }} />
            {rows.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 36, fontWeight: 700, padding: '10px 0' }}>
                <span>{r.label}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{r.value}</span>
              </div>
            ))}
            {p.price ? (
              <>
                <div style={{ borderTop: `5px double ${INK}`, margin: '14px 0 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
                  <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '0.05em' }}>TOTAL</span>
                  <span style={{ fontSize: 68, fontWeight: 800, background: look.accent, color: look.onAccent, padding: '0 14px' }}>{p.price}</span>
                </div>
              </>
            ) : null}
          </div>
          <div style={{ marginTop: 44 }}>
            <Callouts />
          </div>
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ------------------------------------------------------ storefront ----
    case 'storefront': {
      const sw = W;
      const sh = 560;
      const unroll = tween(frame, 4, 12, Easing.out(Easing.cubic));
      const sign = spring({ frame: frame - 6, fps, config: look.spring });
      const title = up(p.title ?? 'Shop');
      const stripes = 9;
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.heading} />
          <div style={{ position: 'relative', width: sw, height: sh, transform: `translateY(${(1 - land) * 60}px)`, opacity: clamp(land * 3) }}>
            <svg width={sw} height={sh} style={{ position: 'absolute' }}>
              <rect x={40} y={130} width={sw - 80} height={sh - 150} fill={look.card} stroke={look.n[1]} strokeWidth={5} />
              <rect x={84} y={300} width={220} height={190} fill={look.bg2} stroke={look.n[1]} strokeWidth={5} />
              <rect x={sw - 304} y={300} width={220} height={190} fill={look.bg2} stroke={look.n[1]} strokeWidth={5} />
              <rect x={sw / 2 - 74} y={292} width={148} height={sh - 312} fill={look.accent} />
              <circle cx={sw / 2 + 44} cy={418} r={9} fill={look.onAccent} />
              <line x1={0} y1={sh - 18} x2={sw} y2={sh - 18} stroke={look.fg} strokeWidth={6} />
              {/* awning: stripes unroll from the fascia */}
              <g transform={`translate(0 168) scale(1 ${unroll})`}>
                {Array.from({ length: stripes }, (_, i) => {
                  const x0 = 18 + (i * (sw - 36)) / stripes;
                  const x1 = 18 + ((i + 1) * (sw - 36)) / stripes;
                  return <path key={i} d={`M${x0 + 16} 0 L${x1 + 16 - 32 * ((i + 1) / stripes) * 0} 0 L${x1} 96 a${(x1 - x0) / 2} 22 0 0 1 ${x0 - x1} 0 Z`} fill={i % 2 ? look.card : look.accent} stroke={look.bg} strokeWidth={3} />;
                })}
              </g>
              <rect x={22} y={36} width={sw - 44} height={132} rx={Math.min(look.radius, 20)} fill={look.fg} transform={`translate(0 ${(1 - sign) * -40})`} />
            </svg>
            <div style={{ position: 'absolute', left: 22, top: 36, width: sw - 44, height: 132, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - sign) * -40}px)` }}>
              <D size={fitSize(title, look.display, look.displayWeight, sw - 120, 104, look.tracking, 40)} color={look.bg} style={{ whiteSpace: 'nowrap' }}>
                {title}
              </D>
            </div>
          </div>
          {p.sub ? (
            <T size={46} bold style={{ marginTop: 20 }}>
              {p.sub}
            </T>
          ) : null}
          <div style={{ marginTop: 26 }}>
            <Callouts />
          </div>
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ------------------------------------------------------------- box ----
    case 'box': {
      const drop = spring({ frame, fps, config: { damping: 9, stiffness: 150, mass: 0.9 } });
      const title = up(p.title ?? 'Parcel');
      const bw = 520;
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.heading} />
          <div style={{ position: 'relative', width: W, height: 560 }}>
            <div style={{ position: 'absolute', left: (W - bw) / 2, top: 20, width: bw, height: 500, transform: `translateY(${(1 - drop) * -420}px) scaleY(${1 + 0.05 * Math.sin(Math.min(1, drop) * Math.PI) * (drop < 1 ? 1 : 0)})`, transformOrigin: 'bottom center' }}>
              <svg width={bw} height={500} viewBox="0 0 520 500">
                <path d="M260 20 L500 130 L260 240 L20 130 Z" fill={look.n[0]} stroke={look.bg} strokeWidth={6} strokeLinejoin="round" />
                <path d="M20 130 L260 240 L260 480 L20 370 Z" fill={look.n[1]} stroke={look.bg} strokeWidth={6} strokeLinejoin="round" />
                <path d="M500 130 L260 240 L260 480 L500 370 Z" fill={look.n[2]} stroke={look.bg} strokeWidth={6} strokeLinejoin="round" />
                <path d="M225 36 L295 36 L535 146 L465 146 Z" fill={look.accent} transform="translate(-140 64) scale(0.82)" />
                <path d="M90 190 L230 254 L230 350 L90 286 Z" fill={PAPER} />
              </svg>
              <div style={{ position: 'absolute', left: 96, top: 222, width: 130, transform: 'skewY(24.6deg)', transformOrigin: 'left top' }}>
                <div style={{ fontFamily: '"JetBrains Mono"', fontWeight: 800, fontSize: fitSize(title, 'JetBrains Mono', 800, 122, 40, 0, 14), color: INK, lineHeight: 1.05 }}>{title}</div>
                <div style={{ height: 6, background: INK, opacity: 0.6, marginTop: 8, width: '80%' }} />
                <div style={{ height: 6, background: INK, opacity: 0.35, marginTop: 6, width: '55%' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 30, right: 30, bottom: 0, height: 6, background: look.fg }} />
          </div>
          {p.sub ? (
            <T size={46} bold style={{ marginTop: 22 }}>
              {p.sub}
            </T>
          ) : null}
          <div style={{ marginTop: 26 }}>
            <Callouts />
          </div>
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ------------------------------------------------------------- tag ----
    default: {
      const swing = Math.sin(t * 3.2) * 9 * Math.exp(-t * 0.9) + Math.sin(t * 1.1) * 1.6;
      const price = p.price ?? '';
      const tw = 560;
      const th = 640;
      return (
        <Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Head title={p.heading} style={{ alignSelf: 'flex-start' }} />
          <div style={{ position: 'relative', width: tw, height: th + 120, transform: `rotate(${swing}deg) translateY(${(1 - land) * -120}px)`, transformOrigin: 'top center', opacity: clamp(land * 3) }}>
            <svg width={tw} height={th + 120} style={{ position: 'absolute' }}>
              <line x1={tw / 2} y1={0} x2={tw / 2} y2={176} stroke={look.fg} strokeWidth={6} />
              <path d={`M${tw / 2} 120 L${tw - 30} 300 V${th + 90} a${Math.max(8, look.radius)} ${Math.max(8, look.radius)} 0 0 1 -${Math.max(8, look.radius)} ${Math.max(8, look.radius)} H${30 + Math.max(8, look.radius)} a${Math.max(8, look.radius)} ${Math.max(8, look.radius)} 0 0 1 -${Math.max(8, look.radius)} -${Math.max(8, look.radius)} V300 Z`} fill={look.accent} />
              <circle cx={tw / 2} cy={208} r={30} fill={look.bg} />
              <circle cx={tw / 2} cy={208} r={30} fill="none" stroke={look.onAccent} strokeWidth={6} opacity={0.5} />
            </svg>
            <div style={{ position: 'absolute', left: 60, right: 60, top: 320, textAlign: 'center' }}>
              {p.title ? (
                <L size={40} color={look.onAccent} style={{ marginBottom: 14 }}>
                  {p.title}
                </L>
              ) : null}
              <D size={fitSize(price, look.display, look.displayWeight, tw - 130, 250, look.tracking, 60)} color={look.onAccent} lh={1} style={{ whiteSpace: 'nowrap' }}>
                {price}
              </D>
              {p.sub ? (
                <T size={40} bold color={look.onAccent} style={{ marginTop: 14 }} lh={1.1}>
                  {p.sub}
                </T>
              ) : null}
            </div>
          </div>
          <div style={{ marginTop: 22, alignSelf: 'flex-start' }}>
            <Callouts row />
          </div>
          <SourceLine text={p.source} />
        </Stage>
      );
    }
  }
};
