// Scene type: hook. Six opening styles for the first two seconds.
// Rule for all of them: the claim is readable on frame 0. Nothing fades up from black.
import React from 'react';
import { Easing, random, spring } from 'remotion';
import { D, L, Pill, Stage, T, useCase } from '../components/ui';
import { tween, useScene } from '../lib/anim';
import { growLines, lineText, runs, toLines, type Line } from '../lib/lines';
import { fitLines, fitSize, textWidth } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type HookProps = { kicker?: string; lines: string[]; emphasis?: string | string[]; sub?: string };

const Parts: React.FC<{ line: Line; hot: string; cold: string }> = ({ line, hot, cold }) => (
  <>
    {runs(line).map((p, i) => (
      <span key={i} style={{ color: p.hot ? hot : cold, whiteSpace: 'pre' }}>
        {p.text}
      </span>
    ))}
  </>
);

export const Hook: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const cs = useCase();
  const p = scene.props as HookProps;
  const emphasis = (Array.isArray(p.emphasis) ? p.emphasis : p.emphasis ? [p.emphasis] : []).map(cs);
  const given = toLines((p.lines || []).map(cs), emphasis);
  const isHot = (line: Line) => line.some((w) => w.hot);
  const fam = look.display;
  const wt = look.displayWeight;
  const extra = (p.kicker ? 90 : 0) + (p.sub ? 100 : 0);
  // one shared size for every line, grown by splitting long lines until the block fills the stage
  const uniform = (width: number, max: number, lh: number) => {
    const sizeOf = (ls: Line[]) => fitLines(ls.map(lineText), fam, wt, width, max, look.tracking, 56);
    const lines = growLines(given, (ls) => ls.length * sizeOf(ls) * lh + extra, STAGE.height * 0.5, STAGE.height * 0.9);
    return { lines, size: sizeOf(lines) };
  };
  const sub = p.sub ? (
    <div style={{ marginTop: 34, ...s.enter(1) }}>
      <T size={50} color={look.muted} bold>
        {p.sub}
      </T>
    </div>
  ) : null;

  switch (scene.variant) {
    // ------------------------------------------------------------ slam ----
    // A justified block: every line is scaled to the same width. It lands
    // slightly oversized and punches down to size.
    case 'slam': {
      const W = 752;
      const hit = spring({ frame, fps, config: { damping: 11, stiffness: 210, mass: 0.55 } });
      const bar = tween(frame, 3, 10);
      const sizes = (ls: Line[]) => ls.map((l) => fitSize(lineText(l), fam, wt, W, 310, look.tracking, 60));
      const lines = growLines(given, (ls) => sizes(ls).reduce((a, b) => a + b * 0.98, 0) + extra + 44, STAGE.height * 0.62, STAGE.height * 0.94);
      const sz = sizes(lines);
      return (
        <Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: W, transform: `scale(${1.085 - 0.085 * hit}) rotate(${-1.4 * (1 - hit)}deg)` }}>
            {p.kicker ? (
              <Pill filled size={36} style={{ marginBottom: 30 }}>
                {p.kicker}
              </Pill>
            ) : null}
            {lines.map((line, i) => (
              <D key={i} size={sz[i]} lh={0.94} style={{ whiteSpace: 'nowrap', marginBottom: sz[i] * 0.04 }}>
                <Parts line={line} hot={look.accent} cold={look.fg} />
              </D>
            ))}
            <div style={{ height: 18, marginTop: 26, background: look.accent, borderRadius: look.radius ? 9 : 0, transform: `scaleX(${bar})`, transformOrigin: 'left center' }} />
            {sub}
          </div>
        </Stage>
      );
    }

    // ----------------------------------------------------------- stamp ----
    case 'stamp': {
      const W = 664;
      const hit = spring({ frame, fps, config: { damping: 9, stiffness: 260, mass: 0.6 } });
      const { lines, size } = uniform(W - 96, 200, 1.0);
      return (
        <Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
          {p.kicker ? (
            <L size={36} color={look.muted} style={{ marginBottom: 84 }}>
              {p.kicker}
            </L>
          ) : null}
          <div style={{ position: 'relative', transform: `rotate(-5deg) scale(${1.1 - 0.1 * hit})` }}>
            <div style={{ width: W, boxSizing: 'border-box', padding: '40px 48px 44px', border: `12px solid ${look.accent}`, borderRadius: look.radius, outline: `4px solid ${look.accent}`, outlineOffset: 12 }}>
              {lines.map((line, i) =>
                isHot(line) ? (
                  <div key={i} style={{ background: look.accent, margin: '8px -18px', padding: '6px 18px', borderRadius: look.radius ? 12 : 0 }}>
                    <D size={size} color={look.onAccent} style={{ whiteSpace: 'nowrap' }}>
                      {lineText(line)}
                    </D>
                  </div>
                ) : (
                  <D key={i} size={size} color={look.accent} style={{ whiteSpace: 'nowrap' }}>
                    {lineText(line)}
                  </D>
                ),
              )}
            </div>
            {/* ink specks thrown off by the impact */}
            {Array.from({ length: 14 }, (_, i) => {
              const a = random(`a${i}`) * Math.PI * 2;
              const r = 380 + random(`r${i}`) * 90;
              const d = tween(frame, 2, 9);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: W / 2 + Math.cos(a) * r * d * 0.9,
                    top: (lines.length * size) / 2 + 40 + Math.sin(a) * r * 0.62 * d,
                    width: 7 + random(`s${i}`) * 13,
                    height: 7 + random(`s${i}`) * 13,
                    borderRadius: '50%',
                    background: look.accent,
                    opacity: d * 0.75,
                  }}
                />
              );
            })}
          </div>
          {sub ? <div style={{ marginTop: 40 }}>{sub}</div> : null}
        </Stage>
      );
    }

    // ----------------------------------------------------------- stack ----
    // Each line is a label on its own bar. The first bar is in place on frame 0.
    case 'stack': {
      const { lines, size } = uniform(STAGE.width - 76, 190, 1.22);
      let cold = 0;
      return (
        <Stage style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
          {p.kicker ? (
            <L size={36} color={look.accent} style={{ marginBottom: 30 }}>
              {p.kicker}
            </L>
          ) : null}
          {lines.map((line, i) => {
            const hot = isHot(line) || (!emphasis.length && i === lines.length - 1);
            const text = lineText(line);
            const tone = hot ? 0 : (cold++ % 2) + 1;
            const bg = [look.accent, look.fg, look.card][tone];
            const fg = [look.onAccent, look.bg, look.fg][tone];
            const pr = spring({ frame: frame - i * 2, fps, config: look.spring });
            const w = textWidth(text, fam, wt, size, look.tracking) + 68;
            return (
              <div
                key={i}
                style={{
                  background: bg,
                  border: tone === 2 ? `3px solid ${look.line}` : 'none',
                  boxSizing: 'border-box',
                  width: w,
                  padding: `${size * 0.1}px 34px ${size * 0.12}px`,
                  marginBottom: 14,
                  borderRadius: look.radius,
                  // every bar is readable on frame 0; they snap from a staggered offset into line
                  transform: `translateY(${(1 - pr) * i * 18}px) rotate(${(1 - pr) * (i % 2 ? 1.6 : -1.6)}deg)`,
                  transformOrigin: 'left center',
                }}
              >
                <D size={size} color={fg} style={{ whiteSpace: 'nowrap' }}>
                  {text}
                </D>
              </div>
            );
          })}
          {sub}
        </Stage>
      );
    }

    // ----------------------------------------------------- highlighter ----
    case 'highlighter': {
      const { lines, size } = uniform(STAGE.width - 20, 190, 1.06);
      const sweep = tween(frame, 5, 11, Easing.inOut(Easing.cubic));
      return (
        <Stage style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
          {p.kicker ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 34 }}>
              <div style={{ width: 26, height: 26, background: look.accent, borderRadius: look.radius ? 7 : 0 }} />
              <L size={36} color={look.fg}>
                {p.kicker}
              </L>
            </div>
          ) : null}
          {lines.map((line, i) => (
            <D key={i} size={size} lh={1.06} style={{ whiteSpace: 'nowrap' }}>
              {runs(line).map((part, k) =>
                part.hot ? (
                  <span key={k} style={{ position: 'relative', display: 'inline-block', whiteSpace: 'pre' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: -6,
                        right: -6,
                        bottom: size * 0.07,
                        height: size * 0.3,
                        background: look.accent,
                        opacity: look.dark ? 0.9 : 0.55,
                        borderRadius: 4,
                        transform: `scaleX(${sweep}) skewX(-8deg)`,
                        transformOrigin: 'left center',
                      }}
                    />
                    <span style={{ position: 'relative' }}>{part.text}</span>
                  </span>
                ) : (
                  <span key={k} style={{ whiteSpace: 'pre' }}>
                    {part.text}
                  </span>
                ),
              )}
            </D>
          ))}
          {sub}
        </Stage>
      );
    }

    // -------------------------------------------------------- redacted ----
    // The key words start under a bar. The bar pulls away half a second in.
    case 'redacted': {
      const base = given.some(isHot) ? given : given.map((l, i) => (i === given.length - 1 ? l.map((w) => ({ ...w, hot: true })) : l));
      const sizeOf = (ls: Line[]) => fitLines(ls.map(lineText), fam, wt, STAGE.width - 20, 190, look.tracking, 56);
      const lines = growLines(base, (ls) => ls.length * sizeOf(ls) * 1.08 + extra, STAGE.height * 0.5, STAGE.height * 0.9);
      const size = sizeOf(lines);
      const open = tween(frame, 13, 9, Easing.inOut(Easing.cubic));
      return (
        <Stage style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
          {p.kicker ? (
            <Pill size={34} style={{ marginBottom: 34 }}>
              {p.kicker}
            </Pill>
          ) : null}
          {lines.map((line, i) => (
            <D key={i} size={size} lh={1.08} style={{ whiteSpace: 'nowrap' }}>
              {runs(line).map((part, k) =>
                part.hot ? (
                  <span key={k} style={{ position: 'relative', display: 'inline-block', color: look.accent, whiteSpace: 'pre' }}>
                    {part.text.trimStart()}
                    <span
                      style={{
                        position: 'absolute',
                        left: -8,
                        right: -8,
                        top: -size * 0.02,
                        bottom: -size * 0.02,
                        background: look.fg,
                        borderRadius: look.radius ? 8 : 0,
                        transform: `scaleX(${1 - open}) rotate(-0.6deg)`,
                        transformOrigin: 'right center',
                      }}
                    />
                  </span>
                ) : (
                  <span key={k} style={{ whiteSpace: 'pre' }}>
                    {part.text}
                  </span>
                ),
              )}
            </D>
          ))}
          {sub}
        </Stage>
      );
    }

    // ------------------------------------------------------- spotlight ----
    default: {
      const { lines, size } = uniform(STAGE.width - 70, 190, 1.02);
      // the whole claim is inside the light on frame 0; the light then floods the frame
      const r = 470 + tween(frame, 2, 12, Easing.in(Easing.quad)) * 1400;
      const cx = STAGE.width / 2;
      const cy = STAGE.height * 0.5;
      const mask = `radial-gradient(circle ${r}px at ${cx}px ${cy}px, #000 96%, transparent 100%)`;
      return (
        <>
          <Stage style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', WebkitMaskImage: mask, maskImage: mask }}>
            {p.kicker ? (
              <L size={36} color={look.accent} style={{ marginBottom: 30 }}>
                {p.kicker}
              </L>
            ) : null}
            {lines.map((line, i) => (
              <D key={i} size={size} lh={1.02} style={{ whiteSpace: 'nowrap' }}>
                <Parts line={line} hot={look.accent} cold={look.fg} />
              </D>
            ))}
            {sub}
          </Stage>
          <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle cx={STAGE.left + cx} cy={STAGE.top + cy} r={r} fill="none" stroke={look.accent} strokeWidth={6} opacity={Math.max(0, 1 - tween(frame, 8, 8))} />
          </svg>
        </>
      );
    }
  }
};
