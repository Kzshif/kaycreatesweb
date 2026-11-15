// Scene type: counter. One big figure that counts, rolls or locks into place.
import React from 'react';
import { Easing, random, spring } from 'remotion';
import { D, Head, Pill, SourceLine, Stage, T, useCase } from '../components/ui';
import { clamp, tween, useScene } from '../lib/anim';
import { fitSize, textWidth } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type CounterProps = { prefix?: string; value: number; decimals?: number; suffix?: string; label: string; sub?: string; also?: string; source?: string };

const format = (v: number, decimals: number) => {
  const [whole, frac] = v.toFixed(decimals).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${grouped}.${frac}` : grouped;
};

export const Counter: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const cs = useCase();
  const p = scene.props as CounterProps;
  const decimals = p.decimals ?? 0;
  const final = format(p.value, decimals);
  const prefix = p.prefix ?? '';
  const fam = look.display;
  const wt = look.displayWeight;
  const W = STAGE.width;

  // Digits get one shared width so the number does not jitter while it moves.
  const size = Math.min(380, fitSize(`${prefix}${final}`, fam, wt, (W - 24) * 0.94, 380, look.tracking, 90));
  const widest = Math.max(...'0123456789'.split('').map((d) => textWidth(d, fam, wt, size)));
  // Each column is as wide as the digit it ends on (so the settled number is spaced like normal
  // type), but never under 78% of the widest digit, so digits passing through still fit.
  const colW = (ch: string) => Math.max(textWidth(/\d/.test(ch) ? ch : '0', fam, wt, size), widest * 0.78) + look.tracking * size;
  const chars = final.split('');
  const run = 26; // frames the count takes
  // As the opening shot of a video the real figure must be readable on frame 0, so the
  // number starts on its final value and only spins or flickers in place.
  const opening = scene.from === 0;
  const done = opening ? 1 : tween(frame, 0, run, Easing.out(Easing.exp));

  let shown: string[] = chars;
  if (scene.variant === 'countup') {
    // count from zero, keeping the final layout: unused leading places stay blank
    const cur = format(p.value * done, decimals);
    shown = cur.padStart(final.length, ' ').split('');
  }

  const digit = (ch: string, i: number) => {
    const isDigit = /\d/.test(ch);
    const box: React.CSSProperties = { display: 'inline-block', width: isDigit || ch === ' ' ? colW(chars[i] ?? ch) : undefined, textAlign: 'center' };
    if (!isDigit) return <span key={i} style={box}>{ch === ' ' ? ' ' : ch}</span>;

    if (scene.variant === 'odometer') {
      // each column is a strip of digits that rolls to its value; right-hand columns settle last
      const order = chars.filter((c) => /\d/.test(c)).length;
      const nth = chars.slice(0, i).filter((c) => /\d/.test(c)).length;
      const pr = spring({ frame: frame - nth * 2, fps, config: { damping: 15, stiffness: 70, mass: 0.9 } });
      const turns = 10 * (1 + (order - nth)); // extra turns for the drama
      const pos = opening ? Number(ch) + pr * turns : pr * (Number(ch) + turns);
      return (
        <span key={i} style={{ ...box, height: size * 0.98, overflow: 'hidden', verticalAlign: 'top', position: 'relative' }}>
          <span style={{ display: 'block', transform: `translateY(${-(pos % 10) * size * 0.98}px)` }}>
            {Array.from({ length: 11 }, (_, n) => (
              <span key={n} style={{ display: 'block', height: size * 0.98 }}>
                {n % 10}
              </span>
            ))}
          </span>
        </span>
      );
    }
    if (scene.variant === 'slot') {
      // digits flicker, then lock from left to right
      const nth = chars.slice(0, i).filter((c) => /\d/.test(c)).length;
      const lockAt = 7 + nth * 4;
      const locked = frame >= lockAt || (opening && frame < 2);
      const pop = spring({ frame: frame - lockAt, fps, config: { damping: 10, stiffness: 300, mass: 0.4 } });
      const flick = Math.floor(random(`${i}-${Math.floor(frame / 2)}`) * 10);
      return (
        <span key={i} style={{ ...box, color: locked ? undefined : look.n[2], transform: locked ? `scale(${1.16 - 0.16 * pop})` : undefined }}>
          {locked ? ch : flick}
        </span>
      );
    }
    return <span key={i} style={box}>{ch}</span>;
  };

  const settle = spring({ frame: frame - (scene.variant === 'slot' ? 7 + chars.length * 4 : run - 4), fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const underline = scene.variant === 'slot' ? clamp(settle) : opening ? tween(frame, 0, 14) : done;

  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.label} />
      <D size={size} lh={0.98} style={{ whiteSpace: 'nowrap' }}>
        {prefix ? <span style={{ color: look.accent }}>{prefix}</span> : null}
        {shown.map(digit)}
      </D>
      {p.suffix ? (
        <D size={Math.min(170, size * 0.52)} color={look.accent} lh={1} style={{ marginTop: 6, whiteSpace: 'nowrap' }}>
          {cs(p.suffix)}
        </D>
      ) : null}
      <div style={{ height: 16, width: W * 0.72, marginTop: 30, background: look.n[0], borderRadius: look.radius ? 8 : 0, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${underline * 100}%`, background: look.accent }} />
      </div>
      {p.sub ? (
        <div style={{ marginTop: 34, ...s.enter(1) }}>
          <T size={52} bold>
            {p.sub}
          </T>
        </div>
      ) : null}
      {p.also ? (
        <div style={{ marginTop: 28, ...s.enter(p.sub ? 2 : 1) }}>
          <Pill size={36}>{p.also}</Pill>
        </div>
      ) : null}
      <SourceLine text={p.source} />
    </Stage>
  );
};
