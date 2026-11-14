// Scene type: price breakdown. Where the money in one price or one total goes.
import React from 'react';
import { Easing, spring } from 'remotion';
import { D, Head, SourceLine, Stage, T } from '../components/ui';
import { Icon } from '../icons';
import { clamp, tween, useScene } from '../lib/anim';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Item = { label: string; display: string; value?: number; highlight?: boolean };
type BreakdownProps = { title?: string; items: Item[]; total?: { label: string; display: string }; source?: string };

// A till receipt is always paper-coloured, whatever the look.
const PAPER = '#FBF8F0';
const INK = '#17181C';

export const Breakdown: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as BreakdownProps;
  const items = p.items || [];
  const W = STAGE.width;
  const hot = items.some((x) => x.highlight) ? items.map((x) => !!x.highlight) : items.map(() => false);
  const totalCue = items.length;

  // --------------------------------------------------------- receipt ----
  if (scene.variant === 'receipt') {
    const rw = 690;
    const rowH = Math.min(118, (STAGE.height - 330) / (items.length + (p.total ? 1.4 : 0)));
    const fs = Math.min(46, rowH * 0.42);
    const printed = items.filter((_, i) => s.on(i)).length + (p.total && s.on(totalCue) ? 1.4 : 0);
    const target = 150 + printed * rowH + 70;
    const height = 150 + (target - 150) * 1; // rows appear as the paper feeds out
    const feed = spring({ frame, fps, config: { damping: 20, stiffness: 120, mass: 0.7 } });
    const zig = Array.from({ length: 24 }, (_, i) => `${(i / 23) * 100}% ${i % 2 ? 100 : 97.2}%`).join(', ');
    return (
      <Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: rw + 60, height: 26, background: look.fg, borderRadius: 13, marginBottom: -12, zIndex: 2 }} />
        <div
          style={{
            width: rw,
            minHeight: height,
            background: PAPER,
            color: INK,
            padding: '44px 46px 62px',
            boxSizing: 'border-box',
            fontFamily: '"JetBrains Mono"',
            transform: `rotate(-1.6deg) translateY(${(1 - feed) * -60}px)`,
            transformOrigin: 'top center',
            clipPath: `polygon(0 0, 100% 0, ${zig.split(', ').reverse().join(', ')})`,
            boxShadow: '0 30px 60px rgba(0,0,0,0.28)',
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>{p.title ?? 'Receipt'}</div>
          <div style={{ borderTop: `4px dashed ${INK}`, margin: '22px 0 10px', opacity: 0.5 }} />
          {items.map((it, i) => {
            const pr = tween(frame, s.at(i), 7, Easing.out(Easing.quad));
            return (
              <div
                key={i}
                style={{
                  display: s.on(i) ? 'flex' : 'none',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: rowH,
                  gap: 20,
                  background: hot[i] ? look.accent : 'transparent',
                  color: hot[i] ? look.onAccent : INK,
                  margin: '0 -18px',
                  padding: '0 18px',
                  clipPath: `inset(0 ${(1 - pr) * 100}% 0 0)`,
                }}
              >
                <span style={{ fontSize: fs, fontWeight: 700, lineHeight: 1.1 }}>{it.label}</span>
                <span style={{ fontSize: fs * 1.18, fontWeight: 800, whiteSpace: 'nowrap' }}>{it.display}</span>
              </div>
            );
          })}
          {p.total && s.on(totalCue) ? (
            <div style={{ clipPath: `inset(0 ${(1 - tween(frame, s.at(totalCue), 8)) * 100}% 0 0)` }}>
              <div style={{ borderTop: `5px double ${INK}`, margin: '12px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: rowH * 1.2 }}>
                <span style={{ fontSize: fs * 1.05, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.total.label}</span>
                <span style={{ fontSize: fs * 1.55, fontWeight: 800, whiteSpace: 'nowrap' }}>{p.total.display}</span>
              </div>
            </div>
          ) : null}
        </div>
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // ----------------------------------------------------------- stack ----
  // One tall column split in proportion. Needs a numeric value per item.
  if (scene.variant === 'stack') {
    const H = 760;
    const colW = 210;
    const gap = 8;
    const sum = items.reduce((a, b) => a + (b.value ?? 0), 0) || 1;
    const usable = H - gap * (items.length - 1);
    let neutral = 0;
    const fills = items.map((_, i) => (hot[i] ? look.accent : look.n[2 - (neutral++ % 3)]));
    // built from the bottom up
    let y = H;
    const geo = items.map((it) => {
      const h = Math.max(8, ((it.value ?? 0) / sum) * usable);
      y -= h;
      const g = { top: y, h };
      y -= gap;
      return g;
    });
    const labelY = geo.map((g) => g.top + g.h / 2);
    const minGap = 142;
    for (let i = 1; i < labelY.length; i++) labelY[i] = Math.min(labelY[i], labelY[i - 1] - minGap);
    for (let i = labelY.length - 2; i >= 0; i--) labelY[i] = Math.max(labelY[i], labelY[i + 1] + minGap);
    const shift = Math.max(0, 56 - Math.min(...labelY));
    return (
      <Stage style={{ justifyContent: 'center' }}>
        <Head title={p.title} />
        {p.total ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginBottom: 24, ...s.enter(totalCue) }}>
            <D size={110} style={{ whiteSpace: 'nowrap' }}>
              {p.total.display}
            </D>
            <T size={42} bold color={look.muted}>
              {p.total.label}
            </T>
          </div>
        ) : null}
        <div style={{ position: 'relative', height: H }}>
          <svg width={W} height={H} style={{ position: 'absolute', overflow: 'visible' }}>
            {geo.map((g, i) => {
              const gr = spring({ frame: frame - s.at(i), fps, config: { damping: 16, stiffness: 130, mass: 0.7 } });
              if (!s.on(i)) return null;
              const cy = g.top + g.h / 2;
              const ly = labelY[i] + shift;
              return (
                <g key={i}>
                  <rect x={0} y={g.top + g.h * (1 - gr)} width={colW} height={g.h * gr} fill={fills[i]} rx={Math.min(look.radius * 0.5, 12)} />
                  <path d={`M${colW + 8} ${cy} L${colW + 34} ${cy} L${colW + 52} ${ly} L${colW + 74} ${ly}`} fill="none" stroke={look.n[2]} strokeWidth={3} opacity={clamp(gr * 2 - 1)} />
                </g>
              );
            })}
          </svg>
          {items.map((it, i) => (
            <div key={i} style={{ position: 'absolute', left: colW + 88, top: labelY[i] + shift - 56, width: W - colW - 88, ...s.enter(i, 4) }}>
              <T size={38} bold color={hot[i] ? look.fg : look.muted} lh={1.08}>
                {it.label}
              </T>
              <D size={hot[i] ? 74 : 56} style={{ whiteSpace: 'nowrap', marginTop: 2 }}>
                {it.display}
              </D>
            </div>
          ))}
        </div>
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // ----------------------------------------------------------- coins ----
  // Each coin is one unit: "of every $10, $7 goes to...".
  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.title} />
      {items.map((it, i) => {
        const n = Math.max(1, Math.min(12, Math.round(it.value ?? 1)));
        const coin = Math.min(86, Math.floor((W - 10 * 11) / 12) + 22);
        return (
          <div key={i} style={{ marginBottom: 30, paddingBottom: 26, borderBottom: i < items.length - 1 ? `2px solid ${look.line}` : 'none', visibility: s.on(i) ? 'visible' : 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20, ...s.enter(i) }}>
              <T size={44} bold color={hot[i] ? look.fg : look.muted} lh={1.1}>
                {it.label}
              </T>
              <D size={hot[i] ? 82 : 62} style={{ whiteSpace: 'nowrap' }}>
                {it.display}
              </D>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              {Array.from({ length: n }, (_, k) => {
                const pr = spring({ frame: frame - s.at(i) - 3 - k * 2, fps, config: { damping: 11, stiffness: 240, mass: 0.5 } });
                return (
                  <div key={k} style={{ transform: `scale(${pr})` }}>
                    <Icon name="coin" size={coin} color={hot[i] ? look.accent : look.n[2]} accent={hot[i] ? look.accent : look.n[0]} stroke={3.2} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {p.total ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...s.enter(totalCue) }}>
          <T size={46} bold>
            {p.total.label}
          </T>
          <D size={92} color={look.accent} style={{ whiteSpace: 'nowrap' }}>
            {p.total.display}
          </D>
        </div>
      ) : null}
      <SourceLine text={p.source} />
    </Stage>
  );
};
