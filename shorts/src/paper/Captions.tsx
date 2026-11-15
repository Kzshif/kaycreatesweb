// Paper Money captions: two to four words at a time on a strip of bright paper in the centre
// third of the frame, ink on cream. The word being spoken gets a highlighter swipe in the accent
// colour that draws on behind it. The strip carries its own background, so the words stay
// readable over any scene.
import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { BRIGHT, CAPTION, INK, TYPE, contrast } from '../shared/paper.mjs';
import { Cut, headStyle, jit, measure, ramp, settle, sheet, thump, useLook } from './kit';

export type CapWord = { t: string; from: number; to: number };
export type CapPage = { from: number; to: number; words: CapWord[] };

const PAD_X = 44;
const PAD_Y = 26;
const EDGE = 12; // room for the torn ends

/** Break the words into one or two balanced lines and pick the largest size that fits. */
export function layoutCaption(words: string[]): { size: number; lines: number[][]; widths: number[]; lineW: number[]; space: number } {
  const max = CAPTION.right - CAPTION.left - 2 * (PAD_X + EDGE);
  const at = (size: number) => {
    const space = size * 0.25;
    const widths = words.map((w) => measure(w, 'headline', size));
    const width = (idx: number[]) => idx.reduce((a, i) => a + widths[i], 0) + space * Math.max(0, idx.length - 1);
    const all = words.map((_, i) => i);
    let lines = [all];
    if (width(all) > max && words.length > 1) {
      let best = Infinity;
      for (let cut = 1; cut < words.length; cut++) {
        const a = all.slice(0, cut);
        const b = all.slice(cut);
        const worst = Math.max(width(a), width(b)) + Math.abs(width(a) - width(b)) * 0.15;
        if (worst < best) {
          best = worst;
          lines = [a, b];
        }
      }
    }
    return { size, lines, widths, lineW: lines.map(width), space };
  };
  let L = at(TYPE.captionSize);
  const widest = Math.max(...L.lineW);
  if (widest > max) L = at(Math.max(TYPE.captionMin, Math.floor((TYPE.captionSize * max) / widest)));
  return L;
}

/** One caption page. `active` is the word being spoken, `progress` how far its highlight has drawn on. */
export const CaptionStrip: React.FC<{ words: string[]; active: number; progress: number; seed?: number; pop?: number }> = ({ words, active, progress, seed = 1, pop = 1 }) => {
  const t = useLook();
  const L = useMemo(() => layoutCaption(words), [words.join(' ')]); // eslint-disable-line react-hooks/exhaustive-deps
  const lineH = Math.round(L.size * 1.04);
  const w = Math.ceil(Math.max(...L.lineW)) + 2 * (PAD_X + EDGE);
  const h = L.lines.length * lineH + 2 * PAD_Y + 2 * 8;
  const shape = useMemo(() => sheet(w, h, { seed, edges: 'ctct', m: EDGE, rough: 3.2 }), [w, h, seed]);
  const left = (CAPTION.left + CAPTION.right) / 2 - w / 2;
  const top = CAPTION.centre - h / 2;
  const ratio = Math.min(contrast(INK, BRIGHT), contrast(INK, t.hl));
  return (
    <div
      data-caption={JSON.stringify({ fontPx: L.size, contrast: +ratio.toFixed(2), words: words.length })}
      style={{ position: 'absolute', left, top, width: w, height: h, transform: `rotate(${jit(seed, 1, 0.8).toFixed(2)}deg) scale(${(0.93 + 0.07 * pop).toFixed(3)})` }}
    >
      <Cut w={w} h={h} d={shape.d} core={shape.core} color={BRIGHT} seed={seed} lift={0.34}>
        <div data-box style={{ position: 'absolute', inset: 0 }}>
          {L.lines.map((idx, li) => {
            let x = (w - L.lineW[li]) / 2;
            return idx.map((i) => {
              const ww = L.widths[i];
              const x0 = x;
              x += ww + L.space;
              const isNow = i === active;
              const p = isNow ? progress : 0;
              const y = PAD_Y + 8 + li * lineH;
              const hw = ww + 26;
              // a marker stroke: slightly uneven, wider than the word, drawn left to right
              const band = `M0 ${L.size * 0.2 + jit(seed, i, 3)} L${hw * p} ${L.size * 0.16 + jit(seed, i + 9, 3)} L${hw * p + 5} ${L.size * 1.0 + jit(seed, i + 5, 3)} L3 ${L.size * 1.03 + jit(seed, i + 7, 3)} Z`;
              return (
                <div key={i} style={{ position: 'absolute', left: x0, top: y, height: lineH }}>
                  {p > 0.01 ? (
                    <svg data-highlight width={hw} height={lineH + 10} style={{ position: 'absolute', left: -13, top: -4, overflow: 'visible' }}>
                      <path d={band} fill={t.hl} />
                    </svg>
                  ) : null}
                  <span style={{ ...headStyle(L.size, INK), position: 'relative', lineHeight: `${lineH}px` }}>{words[i]}</span>
                </div>
              );
            });
          })}
        </div>
      </Cut>
    </div>
  );
};

/** The captions of a whole video: finds the page on screen and the word being spoken. */
export const Captions: React.FC<{ pages: CapPage[] }> = ({ pages }) => {
  const frame = useCurrentFrame();
  const index = pages.findIndex((p) => frame >= p.from && frame < p.to);
  if (index < 0) return null;
  const page = pages[index];
  let active = -1;
  page.words.forEach((w, i) => {
    if (frame >= w.from - 1) active = i;
  });
  const start = active >= 0 ? page.words[active].from - 1 : page.from;
  return <CaptionStrip words={page.words.map((w) => w.t)} active={active} progress={settle(ramp(frame, start, 4))} seed={index + 1} pop={Math.min(1, thump(frame, page.from - 1, 7, 0.05))} />;
};
