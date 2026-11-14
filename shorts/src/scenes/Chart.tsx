// Scene type: animated chart.
// Forms follow the data-viz rules this pipeline was built with:
//   - one series is the point, the rest are context: one accent, the rest neutral
//   - part-to-whole is a segmented bar, never a donut or pie
//   - one axis only; solid hairline grid; labels in text colour, never the data colour
//   - a gap in the background colour separates touching marks (no outlines)
import React from 'react';
import { Easing, spring } from 'remotion';
import { D, Head, SourceLine, Stage, T } from '../components/ui';
import { clamp, tween, useScene } from '../lib/anim';
import { textWidth } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Item = { label: string; value: number; display?: string; highlight?: boolean };
type ChartProps = { title?: string; series: Item[]; note?: string; max?: number; source?: string };

export const Chart: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as ChartProps;
  const series = p.series || [];
  const W = STAGE.width;
  const hot = series.some((x) => x.highlight) ? series.map((x) => !!x.highlight) : series.map((_, i) => i === series.length - 1);
  const maxV = p.max ?? Math.max(...series.map((x) => x.value), 1e-9);
  const corner = Math.min(look.radius, 22);
  const grow = (i: number) => spring({ frame: frame - s.at(i), fps, config: { damping: 16, stiffness: 120, mass: 0.8 } });
  const note = p.note ? (
    <div style={{ marginTop: 26, ...s.enter(series.length - 1, 10) }}>
      <T size={42} color={look.muted} bold>
        {p.note}
      </T>
    </div>
  ) : null;

  switch (scene.variant) {
    // ------------------------------------------------------------ bars ----
    case 'bars': {
      const H = 640;
      const slot = W / series.length;
      const bw = Math.min(190, slot * 0.6);
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.title} />
          <div style={{ position: 'relative', height: H + 96 }}>
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <div key={g} style={{ position: 'absolute', left: 0, right: 0, top: 96 + H * (1 - g), height: 2, background: look.line }} />
            ))}
            {series.map((it, i) => {
              const g = grow(i);
              const h = Math.max(6, (it.value / maxV) * H) * g;
              return (
                <div key={i} style={{ position: 'absolute', left: slot * i, width: slot, bottom: 0, height: H + 96, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', visibility: s.on(i) ? 'visible' : 'hidden' }}>
                  {it.display ? (
                    <D size={hot[i] ? 76 : 54} color={look.fg} style={{ marginBottom: 14, whiteSpace: 'nowrap', opacity: clamp(g * 1.4 - 0.3) }}>
                      {it.display}
                    </D>
                  ) : null}
                  <div style={{ width: bw, height: h, background: hot[i] ? look.accent : look.n[1], borderRadius: `${corner}px ${corner}px 0 0` }} />
                </div>
              );
            })}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: -3, height: 4, background: look.fg }} />
          </div>
          <div style={{ display: 'flex', marginTop: 20 }}>
            {series.map((it, i) => (
              <div key={i} style={{ width: slot, textAlign: 'center', padding: '0 8px', boxSizing: 'border-box', visibility: s.on(i) ? 'visible' : 'hidden' }}>
                <T size={38} bold color={hot[i] ? look.fg : look.muted} lh={1.1}>
                  {it.label}
                </T>
              </div>
            ))}
          </div>
          {note}
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ----------------------------------------------------------- hbars ----
    case 'hbars': {
      const bh = Math.min(86, Math.max(48, 560 / series.length - 76));
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.title} />
          {series.map((it, i) => {
            const g = grow(i);
            const full = Math.max(10, (it.value / maxV) * W);
            const lw = it.display ? textWidth(it.display, look.display, look.displayWeight, 60, look.tracking) : 0;
            const outside = full + 18 + lw <= W;
            return (
              <div key={i} style={{ marginBottom: 30, visibility: s.on(i) ? 'visible' : 'hidden' }}>
                <T size={42} bold color={hot[i] ? look.fg : look.muted} style={{ marginBottom: 10 }}>
                  {it.label}
                </T>
                <div style={{ display: 'flex', alignItems: 'center', height: bh, position: 'relative' }}>
                  <div style={{ width: full * g, height: bh, background: hot[i] ? look.accent : look.n[1], borderRadius: `0 ${corner}px ${corner}px 0` }} />
                  {it.display ? (
                    <D
                      size={60}
                      color={outside ? look.fg : hot[i] ? look.onAccent : look.bg}
                      style={{ position: 'absolute', left: outside ? full * g + 18 : Math.max(8, full * g - lw - 20), whiteSpace: 'nowrap', opacity: clamp(g * 1.5 - 0.4), lineHeight: `${bh}px` }}
                    >
                      {it.display}
                    </D>
                  ) : null}
                </div>
              </div>
            );
          })}
          {note}
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ------------------------------------------------------------ line ----
    case 'line': {
      const H = 560;
      const padL = 12;
      const padR = 40;
      const lo = Math.min(0, ...series.map((x) => x.value));
      const x = (i: number) => padL + (i / Math.max(1, series.length - 1)) * (W - padL - padR);
      const HEAD = 150; // headroom above the highest point, so the end label always has clear space
      const y = (v: number) => HEAD + (1 - (v - lo) / (maxV - lo)) * (H - 20 - HEAD);
      const pts = series.map((it, i) => [x(i), y(it.value)] as const);
      const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
      const area = `${d} L${pts[pts.length - 1][0].toFixed(1)} ${H - 20} L${pts[0][0].toFixed(1)} ${H - 20} Z`;
      const draw = tween(frame, 2, Math.max(14, s.at(1) - 4), Easing.inOut(Easing.cubic));
      const end = pts[pts.length - 1];
      const last = series[series.length - 1];
      const first = series[0];
      const dot = spring({ frame: frame - s.at(1), fps, config: look.spring });
      // the end label sits above every part of the line that runs beneath it
      const endW = last.display ? textWidth(last.display, look.display, look.displayWeight, 88, look.tracking) : 0;
      const under = pts.filter(([px]) => px >= end[0] - endW - 60).map(([, py]) => py);
      const endTop = Math.max(0, Math.min(end[1], ...under) - 132);
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.title} />
          <div style={{ position: 'relative', height: H }}>
            <svg width={W} height={H} style={{ position: 'absolute', overflow: 'visible' }}>
              {[0, 0.33, 0.66].map((g) => (
                <line key={g} x1={0} x2={W} y1={HEAD + (H - 20 - HEAD) * g} y2={HEAD + (H - 20 - HEAD) * g} stroke={look.line} strokeWidth={2} />
              ))}
              <line x1={0} x2={W} y1={H - 20} y2={H - 20} stroke={look.fg} strokeWidth={4} />
              <clipPath id="line-reveal">
                <rect x={0} y={0} width={W * draw} height={H} />
              </clipPath>
              <path d={area} fill={look.accent} opacity={0.14} clipPath="url(#line-reveal)" />
              <path d={d} fill="none" stroke={look.accent} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              <circle cx={pts[0][0]} cy={pts[0][1]} r={10} fill={look.n[2]} stroke={look.bg} strokeWidth={5} />
              <circle cx={end[0]} cy={end[1]} r={17 * dot} fill={look.accent} stroke={look.bg} strokeWidth={6} />
            </svg>
            {first.display ? (
              <D size={48} color={look.muted} style={{ position: 'absolute', left: 0, top: Math.max(0, pts[0][1] - 92), whiteSpace: 'nowrap' }}>
                {first.display}
              </D>
            ) : null}
            {last.display ? (
              <D size={88} style={{ position: 'absolute', right: padR - 22, top: endTop, whiteSpace: 'nowrap', transform: `scale(${dot})`, transformOrigin: 'right bottom' }}>
                {last.display}
              </D>
            ) : null}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingRight: padR - 30 }}>
            <T size={40} bold color={look.muted}>
              {first.label}
            </T>
            <T size={40} bold>
              {last.label}
            </T>
          </div>
          {p.note ? (
            <div style={{ marginTop: 24, ...s.enter(1, 6) }}>
              <T size={42} color={look.muted} bold>
                {p.note}
              </T>
            </div>
          ) : null}
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ------------------------------------------------------- segmented ----
    // One whole, split into parts. Each part is a block; the legend names them.
    case 'segmented': {
      const total = series.reduce((a, b) => a + b.value, 0) || 1;
      const gap = 8;
      const bandH = 190;
      const usable = W - gap * (series.length - 1);
      let neutral = 0;
      const fills = series.map((_, i) => (hot[i] ? look.accent : look.n[2 - (neutral++ % 3)]));
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.title} />
          <div style={{ display: 'flex', gap, height: bandH }}>
            {series.map((it, i) => {
              const g = grow(i);
              const w = (it.value / total) * usable;
              const share = `${Math.round((it.value / total) * 100)}%`;
              const fits = w > textWidth(share, look.display, look.displayWeight, 62, look.tracking) + 30;
              return (
                <div
                  key={i}
                  style={{
                    width: w * g,
                    height: bandH,
                    background: fills[i],
                    borderRadius: corner * 0.7,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-end',
                    visibility: s.on(i) ? 'visible' : 'hidden',
                  }}
                >
                  {fits ? (
                    <D size={62} color={hot[i] ? look.onAccent : look.bg} style={{ padding: '0 0 14px 16px', whiteSpace: 'nowrap', opacity: clamp(g * 2 - 1) }}>
                      {share}
                    </D>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 40 }}>
            {series.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '15px 0', borderBottom: `2px solid ${look.line}`, ...s.enter(i, 4) }}>
                <div style={{ width: 34, height: 34, background: fills[i], borderRadius: corner * 0.4, flexShrink: 0 }} />
                <T size={44} bold color={hot[i] ? look.fg : look.muted} style={{ flex: 1 }}>
                  {it.label}
                </T>
                {it.display ? (
                  <D size={54} style={{ whiteSpace: 'nowrap' }}>
                    {it.display}
                  </D>
                ) : null}
              </div>
            ))}
          </div>
          {note}
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ----------------------------------------------------------- meter ----
    // A single ratio against its whole.
    default: {
      const it = series[0] ?? { label: '', value: 0 };
      const whole = p.max ?? 100;
      const fill = spring({ frame: frame - s.at(1), fps, config: { damping: 20, stiffness: 60, mass: 1 } });
      const ratio = clamp(it.value / whole);
      const trackH = 120;
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <Head title={p.title} />
          <D size={330} lh={0.95} style={{ whiteSpace: 'nowrap', opacity: s.on(1) ? 1 : 0.18 }}>
            {it.display ?? `${Math.round(it.value * fill)}`}
          </D>
          <T size={56} bold style={{ marginTop: 14 }}>
            {it.label}
          </T>
          <div style={{ position: 'relative', height: trackH, marginTop: 44, background: look.n[0], borderRadius: corner, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ratio * fill * 100}%`, background: look.accent, borderRadius: corner }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <T size={36} bold color={look.muted}>
              0
            </T>
            <T size={36} bold color={look.muted}>
              {whole === 100 ? '100%' : String(whole)}
            </T>
          </div>
          {p.note ? (
            <div style={{ marginTop: 20, ...s.enter(1, 10) }}>
              <T size={44} color={look.muted} bold>
                {p.note}
              </T>
            </div>
          ) : null}
          <SourceLine text={p.source} />
        </Stage>
      );
    }
  }
};
