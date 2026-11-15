// Scene type: unit chart. "51 in every 100": a grid where each cell is one unit.
import React from 'react';
import { spring } from 'remotion';
import { D, Head, SourceLine, Stage, T } from '../components/ui';
import { Icon } from '../icons';
import { clamp, useScene } from '../lib/anim';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type RatioProps = { title?: string; total: number; filled: number; label: string; figure?: string; note?: string; icon?: string; source?: string };

export const Ratio: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as RatioProps;
  const W = STAGE.width;
  const total = Math.max(1, Math.round(p.total));
  const filled = Math.max(0, Math.min(total, Math.round(p.filled)));
  const row = scene.variant === 'row';
  const cols = row ? (total <= 6 ? total : Math.ceil(total / 2)) : total <= 25 ? 5 : 10;
  const rows = Math.ceil(total / cols);
  const gap = total > 50 ? 8 : 14;
  const taken = (p.title ? 64 : 0) + (p.figure ? 222 : 0) + 100 + (p.note ? 90 : 0) + (p.source ? 54 : 0) + 16;
  const cell = Math.min(row ? 150 : 132, Math.floor((W - gap * (cols - 1)) / cols), Math.floor((STAGE.height - taken) / rows) - gap);
  const corner = Math.min(look.radius * 0.5, cell * 0.24);
  const step = Math.max(0.6, Math.min(2.4, 26 / Math.max(1, filled))); // the fill sweep takes under a second
  const gridIn = spring({ frame, fps, config: look.spring });

  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.title} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, marginBottom: 8 }}>
        {p.figure ? (
          <D size={230} lh={0.92} color={s.on(1) ? look.fg : look.n[1]} style={{ whiteSpace: 'nowrap' }}>
            {p.figure}
          </D>
        ) : null}
      </div>
      <T size={54} bold style={{ marginBottom: 36 }} lh={1.1}>
        {p.label}
      </T>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap, transform: `scale(${0.94 + 0.06 * gridIn})`, transformOrigin: 'left top' }}>
        {Array.from({ length: total }, (_, i) => {
          const isFilled = i < filled;
          const pr = isFilled ? spring({ frame: frame - s.at(1) - i * step, fps, config: { damping: 12, stiffness: 240, mass: 0.5 } }) : 0;
          const on = pr > 0.02;
          if (p.icon) {
            return (
              <div key={i} style={{ width: cell, height: cell, transform: `scale(${on ? 0.8 + 0.2 * pr : 1})`, opacity: clamp(gridIn * 2) }}>
                <Icon name={p.icon} size={cell} color={on ? look.accent : look.n[0]} accent={on ? look.accent : look.n[0]} stroke={3.4} />
              </div>
            );
          }
          return <div key={i} style={{ width: cell, height: cell, borderRadius: corner, background: on ? look.accent : look.n[0], transform: `scale(${on ? 0.7 + 0.3 * pr : 1})`, opacity: clamp(gridIn * 2) }} />;
        })}
      </div>
      {p.note ? (
        <div style={{ marginTop: 34, ...s.enter(2) }}>
          <T size={46} bold color={look.muted}>
            {p.note}
          </T>
        </div>
      ) : null}
      <SourceLine text={p.source} />
    </Stage>
  );
};
