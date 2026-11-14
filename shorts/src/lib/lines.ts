// Headline layout: lines are lists of words, each word knows whether it is
// emphasised. Long lines can be split so the type grows to fill the stage.
export type Word = { t: string; hot: boolean };
export type Line = Word[];

const clean = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}$£€%.]/gu, '');

/** Turn storyboard lines into words, marking those inside an emphasis phrase. */
export const toLines = (lines: string[], emphasis: string[] = []): Line[] => {
  const phrases = emphasis.map((e) => e.split(/\s+/).map(clean).filter(Boolean)).filter((p) => p.length);
  return lines.map((line) => {
    const words = line.split(/\s+/).filter(Boolean);
    const keys = words.map(clean);
    const hot = new Array(words.length).fill(false);
    for (const p of phrases) {
      for (let i = 0; i + p.length <= keys.length; i++) {
        if (p.every((w, k) => keys[i + k] === w)) for (let k = 0; k < p.length; k++) hot[i + k] = true;
      }
    }
    return words.map((t, i) => ({ t, hot: hot[i] }));
  });
};

export const lineText = (l: Line) => l.map((w) => w.t).join(' ');

/** Consecutive words with the same emphasis, for rendering as spans. */
export const runs = (l: Line): { text: string; hot: boolean }[] => {
  const out: { text: string; hot: boolean }[] = [];
  l.forEach((w, i) => {
    const last = out[out.length - 1];
    if (last && last.hot === w.hot) last.text += ` ${w.t}`;
    else out.push({ text: (i > 0 ? ' ' : '') + w.t, hot: w.hot });
  });
  return out;
};

const splitLine = (l: Line): [Line, Line] => {
  let best = 1;
  let bestDiff = Infinity;
  for (let k = 1; k < l.length; k++) {
    const a = lineText(l.slice(0, k)).length;
    const b = lineText(l.slice(k)).length;
    // prefer not to cut through an emphasised phrase
    const cutsHot = l[k - 1].hot && l[k].hot ? 4 : 0;
    const diff = Math.abs(a - b) + cutsHot;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = k;
    }
  }
  return [l.slice(0, best), l.slice(best)];
};

/**
 * Split the longest lines until the block is at least `minHeight` tall
 * (shorter lines -> larger type), without exceeding `maxLines` or `maxHeight`.
 */
export const growLines = (lines: Line[], heightOf: (ls: Line[]) => number, minHeight: number, maxHeight: number, maxLines = 6): Line[] => {
  let cur = lines;
  for (let guard = 0; guard < 8; guard++) {
    if (heightOf(cur) >= minHeight || cur.length >= maxLines) break;
    // Only the longest line limits the type size, so it is the only one worth splitting.
    let idx = 0;
    cur.forEach((l, i) => {
      if (lineText(l).length > lineText(cur[idx]).length) idx = i;
    });
    if (cur[idx].length < 2 || lineText(cur[idx]).length <= 7) break;
    const [a, b] = splitLine(cur[idx]);
    const next = [...cur.slice(0, idx), a, b, ...cur.slice(idx + 1)];
    if (heightOf(next) > maxHeight) break;
    cur = next;
  }
  return cur;
};
