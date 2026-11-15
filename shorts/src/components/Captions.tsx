// Subtitles: 2-4 words at a time, large, high contrast, the spoken word highlighted.
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useLook } from '../look';
import { textWidth } from '../lib/measure';
import { CAPTION } from '../shared/spec.mjs';
import type { CaptionPage } from '../types';

const MAX = 98;
const MIN = 58;
const GAP = 0.3; // space between words, in em

export const Captions: React.FC<{ pages: CaptionPage[] }> = ({ pages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = useLook();
  const page = pages.find((p) => frame >= p.from && frame < p.to);
  if (!page) return null;

  const family = look.caption;
  const weight = look.captionWeight;
  const words = page.words.map((w) => ({ ...w, t: look.upper ? w.t.toUpperCase() : w.t }));
  const pad = look.captions === 'box' ? 0.36 : 0; // the box style adds padding around the live word
  const lineW = (ws: typeof words, size: number) => ws.reduce((a, w) => a + textWidth(w.t, family, weight, size), 0) + (ws.length - 1) * size * GAP + size * pad;

  // one line if it fits at full size, otherwise the most balanced two lines
  let lines = [words];
  if (lineW(words, MAX) > CAPTION.width && words.length > 1) {
    let best = 1;
    let bestW = Infinity;
    for (let k = 1; k < words.length; k++) {
      const w = Math.max(lineW(words.slice(0, k), MAX), lineW(words.slice(k), MAX));
      if (w < bestW) {
        bestW = w;
        best = k;
      }
    }
    lines = [words.slice(0, best), words.slice(best)];
  }
  const widest = Math.max(...lines.map((l) => lineW(l, MAX)));
  const size = Math.max(MIN, Math.min(MAX, Math.floor((MAX * (CAPTION.width - 8)) / widest)));

  // the live word: the last one that has started
  let live = 0;
  words.forEach((w, i) => {
    if (frame >= w.from) live = i;
  });
  const pageIn = spring({ frame: frame - page.from, fps, config: { damping: 16, stiffness: 260, mass: 0.5 } });

  let index = -1;
  return (
    <div
      style={{
        position: 'absolute',
        left: CAPTION.left,
        top: CAPTION.top,
        width: CAPTION.width,
        height: CAPTION.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.1,
        transform: `scale(${0.94 + 0.06 * pageIn})`,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: 'flex', gap: size * GAP, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
          {line.map((w) => {
            index++;
            const i = index;
            const isLive = i === live;
            const spoken = i < live;
            const pop = spring({ frame: frame - w.from, fps, config: { damping: 13, stiffness: 300, mass: 0.45 } });
            const base: React.CSSProperties = {
              display: 'inline-block',
              position: 'relative',
              fontFamily: `"${family}"`,
              fontWeight: weight,
              fontSize: size,
              lineHeight: 1.08,
              letterSpacing: '-0.01em',
              color: look.fg,
              WebkitTextStroke: `${Math.round(size * 0.1)}px ${look.bg}`,
              paintOrder: 'stroke fill',
            };
            if (look.captions === 'pop') {
              return (
                <span key={i} style={{ ...base, color: isLive ? look.accent : look.fg, transform: isLive ? `scale(${1 + 0.035 * pop}) translateY(${-size * 0.03 * pop}px)` : undefined }}>
                  {w.t}
                </span>
              );
            }
            if (look.captions === 'box') {
              return (
                <span
                  key={i}
                  style={{
                    ...base,
                    WebkitTextStroke: isLive ? '0' : base.WebkitTextStroke,
                    color: isLive ? look.onAccent : look.fg,
                    background: isLive ? look.accent : 'transparent',
                    borderRadius: Math.min(look.radius, size * 0.22),
                    padding: `${size * 0.02}px ${size * 0.18}px`,
                    margin: `0 ${-size * 0.18 + (isLive ? size * 0.18 : 0)}px`,
                    transform: isLive ? `scale(${0.96 + 0.04 * pop})` : undefined,
                  }}
                >
                  {w.t}
                </span>
              );
            }
            if (look.captions === 'underline') {
              return (
                <span key={i} style={base}>
                  {w.t}
                  {isLive ? (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: -size * 0.1,
                        height: size * 0.13,
                        background: look.accent,
                        borderRadius: look.radius ? size * 0.07 : 0,
                        transform: `scaleX(${Math.min(1, pop)})`,
                        transformOrigin: 'left center',
                      }}
                    />
                  ) : null}
                </span>
              );
            }
            // fill: words light up as they are spoken
            return (
              <span key={i} style={{ ...base, color: isLive ? look.accent : spoken ? look.fg : look.n[1] }}>
                {w.t}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
