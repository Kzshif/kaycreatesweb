// Scene type: kinetic text. A statement delivered line by line, each line on its cue.
import React from 'react';
import { Easing, spring } from 'remotion';
import { D, L, SourceLine, Stage, useCase } from '../components/ui';
import { clamp, tween, useScene } from '../lib/anim';
import { lineText, runs, toLines, type Line } from '../lib/lines';
import { fitLines, fitSize } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type KineticProps = { lines: string[]; emphasis?: string | string[]; source?: string };

const Runs: React.FC<{ line: Line; hot: string; cold: string }> = ({ line, hot, cold }) => (
  <>
    {runs(line).map((p, i) => (
      <span key={i} style={{ color: p.hot ? hot : cold, whiteSpace: 'pre' }}>
        {p.text}
      </span>
    ))}
  </>
);

export const Kinetic: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const cs = useCase();
  const p = scene.props as KineticProps;
  const emphasis = (Array.isArray(p.emphasis) ? p.emphasis : p.emphasis ? [p.emphasis] : []).map(cs);
  const lines = toLines((p.lines || []).map(cs), emphasis);
  const fam = look.display;
  const wt = look.displayWeight;
  const W = STAGE.width;
  // which line is the newest one on screen
  let current = 0;
  lines.forEach((_, i) => {
    if (s.on(i)) current = i;
  });

  switch (scene.variant) {
    // --------------------------------------------------------- cascade ----
    // Lines stack up. Earlier lines step back as each new one lands.
    case 'cascade': {
      // a long line may sit on two rows, so the type can be larger
      const groups: Line[][] = lines.map((l) => {
        if (l.length < 2 || lineText(l).length <= 11) return [l];
        let best = 1;
        let diff = Infinity;
        for (let k = 1; k < l.length; k++) {
          const d = Math.abs(lineText(l.slice(0, k)).length - lineText(l.slice(k)).length);
          if (d < diff) {
            diff = d;
            best = k;
          }
        }
        return [l.slice(0, best), l.slice(best)];
      });
      const rows = groups.flat();
      const size = Math.min(fitLines(rows.map(lineText), fam, wt, W - 10, 210, look.tracking, 60), (STAGE.height * 0.88) / (rows.length * 1.02 + groups.length * 0.16));
      return (
        <Stage style={{ justifyContent: 'center' }}>
          {groups.map((group, i) => {
            const dim = i < current ? tween(frame, s.at(current), 7) : 0;
            return (
              <div key={i} style={{ marginBottom: size * 0.16, ...s.enter(i), transformOrigin: 'left center' }}>
                {group.map((row, k) => (
                  <D key={k} size={size} lh={1.02} style={{ whiteSpace: 'nowrap' }}>
                    {runs(row).map((part, j) => (
                      <span key={j} style={{ color: part.hot ? look.accent : look.fg, opacity: part.hot ? 1 : 1 - dim * 0.6, whiteSpace: 'pre' }}>
                        {part.text}
                      </span>
                    ))}
                  </D>
                ))}
              </div>
            );
          })}
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ------------------------------------------------------------ mask ----
    // Each line is wiped on behind a travelling accent bar. Lines are sized to the full width.
    case 'mask': {
      const sizes = lines.map((l) => fitSize(lineText(l), fam, wt, W - 6, 280, look.tracking, 60));
      const total = sizes.reduce((a, b) => a + b * 1.02, 0);
      const k = Math.min(1, (STAGE.height * 0.9) / total);
      return (
        <Stage style={{ justifyContent: 'center' }}>
          {lines.map((line, i) => {
            const pr = tween(frame, s.at(i), 10, Easing.inOut(Easing.cubic));
            const size = sizes[i] * k;
            return (
              <div key={i} style={{ position: 'relative', visibility: s.on(i) ? 'visible' : 'hidden' }}>
                <D size={size} lh={1.02} style={{ whiteSpace: 'nowrap', clipPath: `inset(-10% ${(1 - pr) * 100}% -10% 0)` }}>
                  <Runs line={line} hot={look.accent} cold={look.fg} />
                </D>
                <div
                  style={{
                    position: 'absolute',
                    top: size * 0.1,
                    bottom: size * 0.06,
                    left: `${pr * 100}%`,
                    width: 16,
                    marginLeft: -16 * pr,
                    background: look.accent,
                    opacity: pr < 1 ? 1 : 0,
                  }}
                />
              </div>
            );
          })}
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ----------------------------------------------------------- scale ----
    // One line at a time, as large as it will go. Each cue swaps it for the next.
    case 'scale': {
      const line = lines[current] ?? [];
      const text = lineText(line);
      const words = text.split(' ');
      // break a long line in two so it can be bigger
      let rows: Line[] = [line];
      if (words.length >= 3 && text.length > 10) {
        let best = 1;
        let diff = Infinity;
        for (let k = 1; k < line.length; k++) {
          const d = Math.abs(lineText(line.slice(0, k)).length - lineText(line.slice(k)).length);
          if (d < diff) {
            diff = d;
            best = k;
          }
        }
        rows = [line.slice(0, best), line.slice(best)];
      }
      const size = fitLines(rows.map(lineText), fam, wt, W - 50, 290, look.tracking, 60);
      const pop = spring({ frame: frame - s.at(current), fps, config: look.spring });
      return (
        <Stage style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <L size={32} color={look.accent} style={{ marginBottom: 26 }}>
            {`${String(current + 1).padStart(2, '0')} / ${String(lines.length).padStart(2, '0')}`}
          </L>
          <div style={{ transform: `scale(${0.8 + 0.2 * pop})`, opacity: clamp(pop * 3) }}>
            {rows.map((r, i) => (
              <D key={`${current}-${i}`} size={size} lh={1.0} style={{ whiteSpace: 'nowrap' }}>
                <Runs line={r} hot={look.accent} cold={look.fg} />
              </D>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 44 }}>
            {lines.map((_, i) => (
              <div key={i} style={{ width: i === current ? 66 : 22, height: 12, borderRadius: look.radius ? 6 : 0, background: i <= current ? look.accent : look.n[0] }} />
            ))}
          </div>
          <SourceLine text={p.source} />
        </Stage>
      );
    }

    // ---------------------------------------------------------- ticker ----
    // Ruled rows, like a departures board. Each row rolls up into place.
    default: {
      const size = Math.min(fitLines(lines.map(lineText), fam, wt, W - 118, 150, look.tracking, 54), (STAGE.height * 0.84) / lines.length - 44);
      const rowH = size * 1.14 + 40;
      return (
        <Stage style={{ justifyContent: 'center' }}>
          <div style={{ height: 4, background: look.fg }} />
          {lines.map((line, i) => {
            const pr = spring({ frame: frame - s.at(i), fps, config: { damping: 18, stiffness: 200, mass: 0.6 } });
            return (
              <div key={i} style={{ height: rowH, borderBottom: `3px solid ${i === lines.length - 1 ? look.fg : look.line}`, display: 'flex', alignItems: 'center', gap: 26, overflow: 'hidden' }}>
                <L size={30} color={i === current && s.on(i) ? look.accent : look.muted} style={{ width: 62, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </L>
                <div style={{ transform: `translateY(${(1 - pr) * rowH}px)`, visibility: s.on(i) ? 'visible' : 'hidden' }}>
                  <D size={size} lh={1.1} style={{ whiteSpace: 'nowrap' }}>
                    <Runs line={line} hot={look.accent} cold={look.fg} />
                  </D>
                </div>
              </div>
            );
          })}
          <SourceLine text={p.source} />
        </Stage>
      );
    }
  }
};
