// Text measuring. Sizes are computed from real glyph widths (fonts are loaded
// before the first frame), so headlines fill the width exactly and never spill
// into a YouTube button zone.
let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

/** Width in px of `text` set in `family` at `size`, with `tracking` in em per character. */
export const textWidth = (text: string, family: string, weight: number | string, size: number, tracking = 0): number => {
  const key = `${family}|${weight}|${text}`;
  let em = cache.get(key);
  if (em === undefined) {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return text.length * size * 0.6;
    ctx.font = `${weight} 200px "${family}"`;
    em = ctx.measureText(text).width / 200;
    cache.set(key, em);
  }
  return (em + tracking * text.length) * size;
};

/** Largest font size (<= maxSize) at which `text` fits in `maxWidth`. */
export const fitSize = (text: string, family: string, weight: number | string, maxWidth: number, maxSize: number, tracking = 0, minSize = 24): number => {
  const w = textWidth(text, family, weight, 100, tracking);
  if (w <= 0) return maxSize;
  return Math.max(minSize, Math.min(maxSize, Math.floor((maxWidth / w) * 100)));
};

/** One size at which every line fits. */
export const fitLines = (lines: string[], family: string, weight: number | string, maxWidth: number, maxSize: number, tracking = 0, minSize = 24): number =>
  Math.min(...lines.map((l) => fitSize(l, family, weight, maxWidth, maxSize, tracking, minSize)));

/** Greedy wrap into lines no wider than maxWidth at the given size. */
export const wrapText = (text: string, family: string, weight: number | string, size: number, maxWidth: number, tracking = 0): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && textWidth(next, family, weight, size, tracking) > maxWidth) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
};
