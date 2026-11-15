// Scene type: before / after split. Two states of the same thing, set against each other.
import React from 'react';
import { Easing, spring } from 'remotion';
import { D, L, SourceLine, Stage, T } from '../components/ui';
import { Icon } from '../icons';
import { clamp, tween, useScene } from '../lib/anim';
import { fitSize } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Side = { tag: string; title?: string; figure?: string; icon?: string; note?: string };
type SplitProps = { a: Side; b: Side; verdict?: string; source?: string };

export const Split: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as SplitProps;
  const W = STAGE.width;
  const H = STAGE.height;

  const Panel: React.FC<{ side: Side; hot: boolean; w: number; h: number }> = ({ side, hot, w, h }) => {
    const fg = hot ? look.onAccent : look.fg;
    const sub = hot ? look.onAccent : look.muted;
    const inner = w - 76;
    const title = side.title ? (look.upper ? side.title.toUpperCase() : side.title) : '';
    return (
      <div
        style={{
          width: w,
          height: h,
          background: hot ? look.accent : look.card,
          border: hot ? 'none' : `3px solid ${look.line}`,
          borderRadius: look.radius,
          boxSizing: 'border-box',
          padding: '32px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
          {side.icon ? <Icon name={side.icon} size={76} color={fg} accent={hot ? look.bg : look.accent} /> : null}
          <L size={34} color={sub} style={{ opacity: hot ? 0.82 : 1 }}>
            {side.tag}
          </L>
        </div>
        {side.figure ? (
          <D size={fitSize(side.figure, look.display, look.displayWeight, inner, Math.min(230, h * 0.44), look.tracking, 60)} color={fg} style={{ whiteSpace: 'nowrap' }}>
            {side.figure}
          </D>
        ) : null}
        {title ? (
          <D size={side.figure ? 60 : fitSize(title, look.display, look.displayWeight, inner, Math.min(130, h * 0.3), look.tracking, 52)} color={fg} lh={1.02} style={{ marginTop: side.figure ? 8 : 0 }}>
            {title}
          </D>
        ) : null}
        {side.note ? (
          <T size={38} bold color={sub} style={{ marginTop: 12, opacity: hot ? 0.85 : 1 }} lh={1.1}>
            {side.note}
          </T>
        ) : null}
      </div>
    );
  };

  const verdict = p.verdict ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, ...s.enter(2) }}>
      <div style={{ width: 14, alignSelf: 'stretch', background: look.accent, borderRadius: look.radius ? 7 : 0 }} />
      <D size={fitSize(look.upper ? p.verdict.toUpperCase() : p.verdict, look.display, look.displayWeight, W - 60, 84, look.tracking, 44)} lh={1.05}>
        {look.upper ? p.verdict.toUpperCase() : p.verdict}
      </D>
    </div>
  ) : null;

  // ---------------------------------------------------------- halves ----
  if (scene.variant === 'halves') {
    const vh = p.verdict ? 130 : 0;
    const ph = (H - 26 - vh - (p.source ? 44 : 0)) / 2;
    const dim = tween(frame, s.at(1), 8);
    return (
      <Stage>
        <div style={{ ...s.enter(0), opacity: 1 - dim * 0.45 }}>
          <Panel side={p.a} hot={false} w={W} h={ph} />
        </div>
        <div style={{ height: 26 }} />
        <div style={{ ...s.enter(1) }}>
          <Panel side={p.b} hot w={W} h={ph} />
        </div>
        {verdict ? <div style={{ marginTop: 26 }}>{verdict}</div> : null}
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // ----------------------------------------------------------- cards ----
  // Two overlapping cards. The second lands on top of the first.
  if (scene.variant === 'cards') {
    const cw = 640;
    const ch = 440;
    const a = spring({ frame: frame - s.at(0), fps, config: look.spring });
    const b = spring({ frame: frame - s.at(1), fps, config: look.spring });
    return (
      <Stage style={{ justifyContent: 'center' }}>
        <div style={{ position: 'relative', height: ch * 2 - 60 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, transform: `rotate(${-3 - b * 2}deg) scale(${0.85 + 0.15 * a - 0.04 * b})`, opacity: clamp(a * 3) * (1 - 0.3 * b), transformOrigin: 'left top' }}>
            <Panel side={p.a} hot={false} w={cw} h={ch} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: W - cw - 24,
              top: ch - 90,
              transform: `rotate(${2.5 * b}deg) translateY(${(1 - b) * 140}px) scale(${0.9 + 0.1 * b})`,
              opacity: clamp(b * 3),
              visibility: s.on(1) ? 'visible' : 'hidden',
              boxShadow: '0 26px 50px rgba(0,0,0,0.3)',
              borderRadius: look.radius,
            }}
          >
            <Panel side={p.b} hot w={cw} h={ch} />
          </div>
        </div>
        {verdict ? <div style={{ marginTop: 34 }}>{verdict}</div> : null}
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // ---------------------------------------------------------- slider ----
  // One frame. A divider sweeps down and the "after" replaces the "before".
  const fh = H - (p.verdict ? 150 : 0) - (p.source ? 44 : 0);
  const sweep = tween(frame, s.at(1), 14, Easing.inOut(Easing.cubic));
  return (
    <Stage>
      <div style={{ position: 'relative', height: fh, ...s.enter(0) }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Panel side={p.a} hot={false} w={W} h={fh} />
        </div>
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 ${(1 - sweep) * 100}% 0)` }}>
          <Panel side={p.b} hot w={W} h={fh} />
        </div>
        {sweep > 0 && sweep < 1 ? <div style={{ position: 'absolute', left: -14, right: -14, top: fh * sweep - 6, height: 12, background: look.fg, borderRadius: 6 }} /> : null}
      </div>
      {verdict ? <div style={{ marginTop: 30 }}>{verdict}</div> : null}
      <SourceLine text={p.source} />
    </Stage>
  );
};
