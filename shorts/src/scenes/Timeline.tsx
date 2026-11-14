// Scene type: timeline. Dated events in order.
import React from 'react';
import { spring } from 'remotion';
import { D, Head, Pill, SourceLine, Stage, T } from '../components/ui';
import { clamp, tween, useScene } from '../lib/anim';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Event = { year: string; title: string; figure?: string };
type TimelineProps = { title?: string; events: Event[]; source?: string };

export const Timeline: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as TimelineProps;
  const events = p.events || [];
  const W = STAGE.width;
  let current = 0;
  events.forEach((_, i) => {
    if (s.on(i)) current = i;
  });

  // ------------------------------------------------------------ rail ----
  if (scene.variant === 'rail') {
    const avail = STAGE.height - (p.title ? 70 : 0) - (p.source ? 40 : 0) - 20;
    const pitch = Math.min(300, avail / events.length);
    const railX = 26;
    const reach = current * pitch + tween(frame, s.at(current), 10) * 0; // the rail has reached the newest event
    const draw = current === 0 ? 0 : (current - 1) * pitch + tween(frame, s.at(current) - 2, 10) * pitch;
    return (
      <Stage style={{ justifyContent: 'center' }}>
        <Head title={p.title} />
        <div style={{ position: 'relative', height: pitch * events.length }}>
          <div style={{ position: 'absolute', left: railX - 4, top: 40, width: 8, height: pitch * (events.length - 1), background: look.n[0], borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: railX - 4, top: 40, width: 8, height: Math.max(0, draw + reach * 0), background: look.accent, borderRadius: 4 }} />
          {events.map((e, i) => {
            const pr = spring({ frame: frame - s.at(i), fps, config: look.spring });
            const live = i === current;
            return (
              <div key={i} style={{ position: 'absolute', left: 0, top: pitch * i, width: W, height: pitch, visibility: s.on(i) ? 'visible' : 'hidden' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: railX - 22,
                    top: 18,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: live ? look.accent : look.bg,
                    border: `7px solid ${look.accent}`,
                    boxSizing: 'border-box',
                    transform: `scale(${pr})`,
                  }}
                />
                <div style={{ position: 'absolute', left: 92, top: 0, width: W - 92, ...s.enter(i, 2, 'slide') }}>
                  <D size={Math.min(118, pitch * 0.42)} color={live ? look.accent : look.fg} lh={0.95} style={{ whiteSpace: 'nowrap' }}>
                    {e.year}
                  </D>
                  <T size={Math.min(46, pitch * 0.18)} bold lh={1.1} style={{ marginTop: 6 }} color={live ? look.fg : look.muted}>
                    {e.title}
                  </T>
                  {e.figure ? (
                    <Pill filled={live} size={32} style={{ marginTop: 12 }}>
                      {e.figure}
                    </Pill>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <SourceLine text={p.source} />
      </Stage>
    );
  }

  // ----------------------------------------------------------- steps ----
  // Equal cards stepping up and across. The cards are the same size on
  // purpose: position shows order, not amount.
  const n = events.length;
  const cw = Math.min(430, W - (n - 1) * 96);
  const ch = Math.min(250, (STAGE.height - 120) / n + 40);
  const dx = n > 1 ? (W - cw) / (n - 1) : 0;
  const dy = n > 1 ? (STAGE.height - 110 - ch - (p.title ? 70 : 0)) / (n - 1) : 0;
  const blockH = ch + dy * (n - 1);
  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.title} />
      <div style={{ position: 'relative', height: blockH }}>
        {events.map((e, i) => {
          const pr = spring({ frame: frame - s.at(i), fps, config: look.spring });
          const live = i === current;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: dx * i,
                top: blockH - ch - dy * i,
                width: cw,
                height: ch,
                boxSizing: 'border-box',
                padding: '22px 30px',
                background: live ? look.accent : look.card,
                border: live ? 'none' : `3px solid ${look.line}`,
                borderRadius: look.radius,
                transform: `translateY(${(1 - pr) * 60}px) scale(${0.9 + 0.1 * pr})`,
                opacity: clamp(pr * 3),
                visibility: s.on(i) ? 'visible' : 'hidden',
                boxShadow: '0 18px 36px rgba(0,0,0,0.22)',
              }}
            >
              <D size={Math.min(96, ch * 0.4)} color={live ? look.onAccent : look.fg} lh={0.95} style={{ whiteSpace: 'nowrap' }}>
                {e.year}
              </D>
              <T size={36} bold lh={1.08} color={live ? look.onAccent : look.muted} style={{ marginTop: 8 }}>
                {e.title}
              </T>
              {e.figure ? (
                <T size={38} bold color={live ? look.onAccent : look.fg} style={{ marginTop: 4 }}>
                  {e.figure}
                </T>
              ) : null}
            </div>
          );
        })}
      </div>
      <SourceLine text={p.source} />
    </Stage>
  );
};
