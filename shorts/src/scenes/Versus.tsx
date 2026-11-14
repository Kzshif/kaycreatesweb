// Scene type: size comparison. Two amounts, drawn to scale.
import React from 'react';
import { spring } from 'remotion';
import { D, Head, SourceLine, Stage, T } from '../components/ui';
import { clamp, useScene } from '../lib/anim';
import { fitSize } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Side = { label: string; display: string; value: number };
type VersusProps = { title?: string; a: Side; b: Side; note?: string; source?: string };

export const Versus: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as VersusProps;
  const W = STAGE.width;
  const max = Math.max(p.a.value, p.b.value, 1e-9);
  const g = (i: number) => spring({ frame: frame - s.at(i), fps, config: { damping: 14, stiffness: 110, mass: 0.8 } });
  const sides = [p.a, p.b];
  const fills = [look.n[1], look.accent];
  const inks = [look.bg, look.onAccent];
  const note = p.note ? (
    <div style={{ marginTop: 30, ...s.enter(2) }}>
      <T size={48} bold>
        {p.note}
      </T>
    </div>
  ) : null;

  // --------------------------------------------------------- circles ----
  // Areas, not diameters, are proportional to the amounts.
  if (scene.variant === 'circles') {
    const R = 262;
    const r = sides.map((x) => Math.max(30, R * Math.sqrt(x.value / max)));
    const order = r[0] >= r[1] ? [0, 1] : [1, 0]; // bigger circle on top
    return (
      <Stage style={{ justifyContent: 'center' }}>
        <Head title={p.title} />
        {order.map((i) => {
          const x = sides[i];
          const gr = g(i);
          const inside = r[i] > 124;
          const room = W - 2 * r[i] - 34;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 34, marginBottom: 26, visibility: s.on(i) ? 'visible' : 'hidden' }}>
              <div
                style={{
                  width: 2 * r[i],
                  height: 2 * r[i],
                  borderRadius: '50%',
                  background: fills[i],
                  transform: `scale(${gr})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {inside ? (
                  <>
                    <D size={fitSize(x.display, look.display, look.displayWeight, 2 * r[i] - 90, 150, look.tracking, 40)} color={inks[i]} style={{ whiteSpace: 'nowrap' }}>
                      {x.display}
                    </D>
                    <T size={36} bold color={inks[i]} style={{ maxWidth: 2 * r[i] - 90, textAlign: 'center', marginTop: 6 }} lh={1.05}>
                      {x.label}
                    </T>
                  </>
                ) : null}
              </div>
              {!inside ? (
                <div style={{ width: room, opacity: clamp(gr * 2 - 0.6) }}>
                  <D size={fitSize(x.display, look.display, look.displayWeight, room - 6, 120, look.tracking, 40)} style={{ whiteSpace: 'nowrap' }}>
                    {x.display}
                  </D>
                  <T size={40} bold color={look.muted} lh={1.05} style={{ marginTop: 4 }}>
                    {x.label}
                  </T>
                </div>
              ) : null}
            </div>
          );
        })}
        {note}
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // ---------------------------------------------------------- towers ----
  const H = 700;
  const bw = 290;
  const corner = Math.min(look.radius, 24);
  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.title} />
      <div style={{ display: 'flex', gap: 70, alignItems: 'flex-end', height: H + 120, borderBottom: `4px solid ${look.fg}` }}>
        {sides.map((x, i) => {
          const gr = g(i);
          const h = Math.max(8, (x.value / max) * H) * gr;
          return (
            <div key={i} style={{ width: bw, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', visibility: s.on(i) ? 'visible' : 'hidden' }}>
              <D size={fitSize(x.display, look.display, look.displayWeight, bw + 40, 104, look.tracking, 44)} style={{ whiteSpace: 'nowrap', marginBottom: 14, opacity: clamp(gr * 1.6 - 0.4) }}>
                {x.display}
              </D>
              <div style={{ width: bw, height: h, background: fills[i], borderRadius: `${corner}px ${corner}px 0 0` }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 70, marginTop: 18 }}>
        {sides.map((x, i) => (
          <T key={i} size={40} bold color={i ? look.fg : look.muted} style={{ width: bw, visibility: s.on(i) ? 'visible' : 'hidden' }} lh={1.1}>
            {x.label}
          </T>
        ))}
      </div>
      {note}
      <SourceLine text={p.source} />
    </Stage>
  );
};
