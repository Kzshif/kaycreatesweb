// Scene type: icon story. A short sequence of original icons that tells the mechanism.
import React from 'react';
import { spring } from 'remotion';
import { D, Head, SourceLine, Stage, T } from '../components/ui';
import { Icon } from '../icons';
import { clamp, useScene } from '../lib/anim';
import { fitSize } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Item = { icon: string; label: string; sub?: string };
type IconsProps = { title?: string; items: Item[]; result?: { icon: string; label: string }; source?: string };

export const Icons: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as IconsProps;
  const items = p.items || [];
  const W = STAGE.width;
  const pop = (i: number, d = 0) => spring({ frame: frame - s.at(i) - d, fps, config: look.spring });
  const resultCue = items.length;

  const Tile: React.FC<{ icon: string; size: number; hot?: boolean; scale: number }> = ({ icon, size, hot, scale }) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(look.radius * 1.5, size / 2),
        background: hot ? look.accent : look.card,
        border: hot ? 'none' : `4px solid ${look.line}`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transform: `scale(${0.5 + 0.5 * scale})`,
        opacity: clamp(scale * 3),
      }}
    >
      <Icon name={icon} size={size * 0.62} color={hot ? look.onAccent : look.fg} accent={hot ? look.bg : look.accent} />
    </div>
  );

  // Operators are drawn, not typed, so they look the same in every font.
  const Op: React.FC<{ kind: 'plus' | 'equals' | 'arrow' | 'down'; size: number; color: string }> = ({ kind, size, color }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ flexShrink: 0 }}>
      {kind === 'plus' ? <path d="M20 6v28M6 20h28" /> : null}
      {kind === 'equals' ? <path d="M6 13h28M6 27h28" /> : null}
      {kind === 'arrow' ? <path d="M5 20h28M22 8l12 12-12 12" /> : null}
      {kind === 'down' ? <path d="M20 5v28M8 22l12 12 12-12" /> : null}
    </svg>
  );

  // ----------------------------------------------------------- chain ----
  // A row of steps joined by arrows, with the outcome underneath.
  if (scene.variant === 'chain') {
    const n = items.length;
    const arrow = 54;
    const tile = Math.min(230, (W - arrow * (n - 1) - 14 * (n - 1) * 2) / n);
    const slot = tile + arrow + 28;
    return (
      <Stage style={{ justifyContent: 'center' }}>
        <Head title={p.title} />
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {items.map((it, i) => (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div style={{ width: arrow + 28, height: tile, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp(pop(i) * 2) }}>
                  <Op kind="arrow" size={arrow} color={look.accent} />
                </div>
              ) : null}
              <div style={{ width: tile, visibility: s.on(i) ? 'visible' : 'hidden' }}>
                <Tile icon={it.icon} size={tile} scale={pop(i)} />
                <div style={{ marginTop: 18, width: tile + 30, marginLeft: -15, textAlign: 'center', ...s.enter(i, 3) }}>
                  <T size={Math.min(40, slot * 0.14)} bold lh={1.08}>
                    {it.label}
                  </T>
                  {it.sub ? (
                    <T size={32} color={look.muted} bold lh={1.08} style={{ marginTop: 4 }}>
                      {it.sub}
                    </T>
                  ) : null}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        {p.result ? (
          <div style={{ marginTop: 44, visibility: s.on(resultCue) ? 'visible' : 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, opacity: clamp(pop(resultCue) * 2) }}>
              <Op kind="down" size={70} color={look.accent} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <Tile icon={p.result.icon} size={210} hot scale={pop(resultCue)} />
              <div style={{ ...s.enter(resultCue, 3, 'slide') }}>
                <D size={fitSize(look.upper ? p.result.label.toUpperCase() : p.result.label, look.display, look.displayWeight, W - 250, 120, look.tracking, 50)} lh={1}>
                  {look.upper ? p.result.label.toUpperCase() : p.result.label}
                </D>
              </div>
            </div>
          </div>
        ) : null}
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // -------------------------------------------------------- equation ----
  if (scene.variant === 'equation') {
    const rowsN = items.length + (p.result ? 1 : 0);
    const tile = Math.min(210, (STAGE.height - (p.title ? 70 : 0) - 60) / rowsN - 74);
    const Row: React.FC<{ icon: string; label: string; sub?: string; hot?: boolean; cue: number }> = ({ icon, label, sub, hot, cue }) => {
      const text = look.upper ? label.toUpperCase() : label;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, visibility: s.on(cue) ? 'visible' : 'hidden' }}>
          <Tile icon={icon} size={tile} hot={hot} scale={pop(cue)} />
          <div style={{ ...s.enter(cue, 3, 'slide') }}>
            <D size={fitSize(text, look.display, look.displayWeight, W - tile - 40, hot ? 112 : 88, look.tracking, 44)} color={hot ? look.accent : look.fg} style={{ whiteSpace: 'nowrap' }}>
              {text}
            </D>
            {sub ? (
              <T size={38} bold color={look.muted} style={{ marginTop: 4 }}>
                {sub}
              </T>
            ) : null}
          </div>
        </div>
      );
    };
    return (
      <Stage style={{ justifyContent: 'center' }}>
        <Head title={p.title} />
        {items.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (
              <div style={{ width: tile, display: 'flex', justifyContent: 'center', padding: '12px 0', opacity: clamp(pop(i) * 2), visibility: s.on(i) ? 'visible' : 'hidden' }}>
                <Op kind="plus" size={50} color={look.muted} />
              </div>
            ) : null}
            <Row icon={it.icon} label={it.label} sub={it.sub} cue={i} />
          </React.Fragment>
        ))}
        {p.result ? (
          <>
            <div style={{ width: tile, display: 'flex', justifyContent: 'center', padding: '12px 0', opacity: clamp(pop(resultCue) * 2), visibility: s.on(resultCue) ? 'visible' : 'hidden' }}>
              <Op kind="equals" size={50} color={look.accent} />
            </div>
            <Row icon={p.result.icon} label={p.result.label} hot cue={resultCue} />
          </>
        ) : null}
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // ------------------------------------------------------------ grid ----
  const cols = 2;
  const rows = Math.ceil(items.length / cols);
  const cw = (W - 26) / cols;
  const chh = Math.min(330, (STAGE.height - (p.title ? 70 : 0) - (p.result ? 210 : 30)) / rows - 26);
  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.title} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cw}px)`, gap: 26 }}>
        {items.map((it, i) => {
          const pr = pop(i);
          return (
            <div
              key={i}
              style={{
                height: chh,
                background: look.card,
                border: `3px solid ${look.line}`,
                borderRadius: look.radius,
                boxSizing: 'border-box',
                padding: 26,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transform: `scale(${0.8 + 0.2 * pr})`,
                opacity: clamp(pr * 3),
                visibility: s.on(i) ? 'visible' : 'hidden',
              }}
            >
              <Icon name={it.icon} size={Math.min(150, chh * 0.46)} color={look.fg} accent={look.accent} />
              <div>
                <T size={42} bold lh={1.06}>
                  {it.label}
                </T>
                {it.sub ? (
                  <T size={32} bold color={look.muted} lh={1.08} style={{ marginTop: 4 }}>
                    {it.sub}
                  </T>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {p.result ? (
        <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 26, background: look.accent, borderRadius: look.radius, padding: '22px 30px', ...s.enter(resultCue) }}>
          <Icon name={p.result.icon} size={110} color={look.onAccent} accent={look.bg} />
          <D size={fitSize(look.upper ? p.result.label.toUpperCase() : p.result.label, look.display, look.displayWeight, W - 220, 92, look.tracking, 44)} color={look.onAccent} lh={1}>
            {look.upper ? p.result.label.toUpperCase() : p.result.label}
          </D>
        </div>
      ) : null}
      <SourceLine text={p.source} />
    </Stage>
  );
};
