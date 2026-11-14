// Scene type: money-flow diagram.
//   river: one sum of money splits into streams whose widths are true to the amounts
//   chain: who pays whom, as a chain of icons with money moving along the links
import React from 'react';
import { Easing, spring } from 'remotion';
import { D, Head, L, SourceLine, Stage, T } from '../components/ui';
import { Icon } from '../icons';
import { clamp, tween, useScene } from '../lib/anim';
import { fitSize } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Split = { label: string; display?: string; value: number; tone?: 'accent' | 'muted' };
type Node = { icon: string; label: string; sub?: string };
type FlowProps = { title?: string; source?: { label: string; display?: string }; splits?: Split[]; nodes?: Node[]; links?: string[]; credit?: string };

export const Flow: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as FlowProps;
  const W = STAGE.width;

  // ------------------------------------------------------------- river ----
  if (scene.variant === 'river') {
    const splits = p.splits || [];
    const total = splits.reduce((a, b) => a + b.value, 0) || 1;
    const H = 760;
    const colW = 150; // the source column
    const nodeX = 330; // where each stream ends
    const nodeW = 34;
    const gap = splits.length > 1 ? Math.min(46, (H * 0.3) / (splits.length - 1)) : 0;
    const destH = H - gap * (splits.length - 1);
    const hot = splits.some((x) => x.tone === 'accent') ? splits.map((x) => x.tone === 'accent') : splits.map((_, i) => i === splits.length - 1);
    let neutral = 0;
    const fills = splits.map((_, i) => (hot[i] ? look.accent : look.n[2 - (neutral++ % 3)]));
    // source segments are stacked with no gaps; destination blocks are spaced apart
    let sy = 0;
    let dy = 0;
    const geo = splits.map((sp) => {
      const sh = (sp.value / total) * H;
      const dh = Math.max(10, (sp.value / total) * destH);
      const g = { sy, sh, dy, dh };
      sy += sh;
      dy += dh + gap;
      return g;
    });
    // keep labels from colliding when a stream is thin
    const labelY = geo.map((g) => g.dy + g.dh / 2);
    const minGap = 132;
    for (let i = 1; i < labelY.length; i++) labelY[i] = Math.max(labelY[i], labelY[i - 1] + minGap);
    for (let i = labelY.length - 2; i >= 0; i--) labelY[i] = Math.min(labelY[i], labelY[i + 1] - minGap);
    const colGrow = tween(frame, 0, 14, Easing.out(Easing.cubic));
    const drift = (frame * 2.2) % 44;

    return (
      <Stage style={{ justifyContent: 'center' }}>
        <Head title={p.title} />
        {p.source ? (
          <div style={{ marginBottom: 22 }}>
            <T size={40} bold color={look.muted}>
              {p.source.label}
            </T>
            {p.source.display ? (
              <D size={96} style={{ whiteSpace: 'nowrap' }}>
                {p.source.display}
              </D>
            ) : null}
          </div>
        ) : null}
        <div style={{ position: 'relative', height: H }}>
          <svg width={W} height={H} style={{ position: 'absolute', overflow: 'visible' }}>
            <defs>
              <clipPath id="river-col">
                <rect x={0} y={0} width={colW} height={H * colGrow} />
              </clipPath>
            </defs>
            <g clipPath="url(#river-col)">
              {geo.map((g, i) => (
                <rect key={i} x={0} y={g.sy + (i ? 4 : 0)} width={colW} height={Math.max(2, g.sh - (i ? 4 : 0))} fill={fills[i]} />
              ))}
            </g>
            {geo.map((g, i) => {
              const pr = tween(frame, s.at(i + 1), 12, Easing.inOut(Easing.cubic));
              if (!s.on(i + 1)) return null;
              const x0 = colW;
              const x1 = nodeX;
              const mx = (x0 + x1) / 2;
              const top = `M${x0} ${g.sy + (i ? 4 : 0)} C${mx} ${g.sy + (i ? 4 : 0)}, ${mx} ${g.dy}, ${x1} ${g.dy}`;
              const bottom = `L${x1} ${g.dy + g.dh} C${mx} ${g.dy + g.dh}, ${mx} ${g.sy + g.sh}, ${x0} ${g.sy + g.sh} Z`;
              const mid = `M${x0} ${g.sy + g.sh / 2} C${mx} ${g.sy + g.sh / 2}, ${mx} ${g.dy + g.dh / 2}, ${x1 + nodeW} ${g.dy + g.dh / 2}`;
              const id = `river-${i}`;
              return (
                <g key={i}>
                  <clipPath id={id}>
                    <rect x={x0 - 2} y={-20} width={(x1 + nodeW - x0 + 4) * pr} height={H + 40} />
                  </clipPath>
                  <g clipPath={`url(#${id})`}>
                    <path d={top + bottom} fill={fills[i]} opacity={0.5} />
                    <rect x={x1} y={g.dy} width={nodeW} height={g.dh} fill={fills[i]} />
                    {/* dashes drifting along the stream show the direction of the money */}
                    <path d={mid} fill="none" stroke={look.bg} strokeWidth={Math.min(6, g.dh * 0.3)} strokeDasharray="14 30" strokeDashoffset={-drift} opacity={0.75} />
                  </g>
                </g>
              );
            })}
          </svg>
          {splits.map((sp, i) => {
            const size = fitSize(sp.display ?? '', look.display, look.displayWeight, W - nodeX - nodeW - 30, hot[i] ? 92 : 68, look.tracking, 40);
            return (
              <div key={i} style={{ position: 'absolute', left: nodeX + nodeW + 26, top: labelY[i] - 58, width: W - nodeX - nodeW - 26, ...s.enter(i + 1, 6) }}>
                <T size={38} bold color={hot[i] ? look.fg : look.muted} lh={1.08}>
                  {sp.label}
                </T>
                {sp.display ? (
                  <D size={size} style={{ whiteSpace: 'nowrap', marginTop: 4 }}>
                    {sp.display}
                  </D>
                ) : null}
              </div>
            );
          })}
        </div>
        <SourceLine text={p.credit} />
      </Stage>
    );
  }

  // ------------------------------------------------------------- chain ----
  const nodes = p.nodes || [];
  const links = p.links || [];
  const tile = Math.min(240, (STAGE.height - (p.title ? 70 : 0) - 40) / nodes.length - 86);
  const pitch = tile + 86;
  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.title} />
      <div style={{ position: 'relative', height: pitch * nodes.length - 86 }}>
        {nodes.map((n, i) => {
          const pr = spring({ frame: frame - s.at(i), fps, config: look.spring });
          const last = i === nodes.length - 1;
          const linkOn = i > 0 && s.on(i);
          const flow = ((frame - s.at(i)) * 3.4) % 86;
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div style={{ position: 'absolute', left: tile / 2 - 5, top: pitch * i - 86, width: 10, height: 86, visibility: linkOn ? 'visible' : 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: look.n[0], transform: `scaleY(${clamp(tween(frame, s.at(i) - 2, 8))})`, transformOrigin: 'top' }} />
                  {[0, 1].map((k) => (
                    <div
                      key={k}
                      style={{
                        position: 'absolute',
                        left: -9,
                        top: ((flow + k * 43) % 86) - 14,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: look.accent,
                        border: `4px solid ${look.bg}`,
                        boxSizing: 'border-box',
                      }}
                    />
                  ))}
                </div>
              ) : null}
              {i > 0 && links[i - 1] ? (
                <div style={{ position: 'absolute', left: tile / 2 + 42, top: pitch * i - 86 + 14, ...s.enter(i, 3, 'slide') }}>
                  <div style={{ background: look.accent, borderRadius: Math.min(look.radius, 16), padding: '8px 20px' }}>
                    <L size={34} color={look.onAccent}>
                      {links[i - 1]}
                    </L>
                  </div>
                </div>
              ) : null}
              <div style={{ position: 'absolute', left: 0, top: pitch * i, display: 'flex', alignItems: 'center', gap: 32, width: W, visibility: s.on(i) ? 'visible' : 'hidden' }}>
                <div
                  style={{
                    width: tile,
                    height: tile,
                    borderRadius: Math.min(look.radius * 1.5, tile / 2),
                    background: last ? look.accent : look.card,
                    border: last ? 'none' : `4px solid ${look.line}`,
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transform: `scale(${0.6 + 0.4 * pr})`,
                    opacity: clamp(pr * 3),
                  }}
                >
                  <Icon name={n.icon} size={tile * 0.6} color={last ? look.onAccent : look.fg} accent={last ? look.bg : look.accent} />
                </div>
                <div style={{ ...s.enter(i, 3, 'slide') }}>
                  <D size={fitSize(look.upper ? n.label.toUpperCase() : n.label, look.display, look.displayWeight, W - tile - 40, 112, look.tracking, 44)} style={{ whiteSpace: 'nowrap' }}>
                    {look.upper ? n.label.toUpperCase() : n.label}
                  </D>
                  {n.sub ? (
                    <T size={40} color={look.muted} bold style={{ marginTop: 6 }}>
                      {n.sub}
                    </T>
                  ) : null}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <SourceLine text={p.credit} />
    </Stage>
  );
};
