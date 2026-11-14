// Subtitles: group timed words into pages of 2-4 words.
// Pages break where a reader would pause, never in the middle of a figure.
import { norm } from './text.mjs';

const WEAK_END = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'but', 'its', "it's", 'is', 'are', 'was', 'were', 'from', 'by', 'with', 'that',
  'this', 'their', 'his', 'her', 'as', 'than', 'per', 'every', 'each', 'no', 'not', 'very', 'more', 'most', 'just', 'only', 'about', 'over', 'under',
  'nearly', 'almost', 'your', 'our', 'my', 'which', 'who', 'if', 'so', 'because', 'when', 'while', 'into', 'onto',
]);
const UNIT = /^(trillion|billion|million|thousand|hundred|percent|cent|times|dollars?|pounds?|cents?|pence|bn|mn|tn|a|each|every|per)$/;
const PAIRS = [['more', 'than'], ['less', 'than'], ['at', 'least'], ['per', 'cent'], ['a', 'year'], ['each', 'year'], ['every', 'year'], ['a', 'day'], ['every', 'day'], ['out', 'of']];

const MAX_CHARS = 26; // two lines of ~13 characters at the largest caption size
const sentenceEnd = (w) => /[.!?…]["')\]]?$/.test(w);
const clauseEnd = (w) => /[,;:—–]["')\]]?$/.test(w);
const hasDigit = (w) => /\d/.test(w);

/** Words i-1 and i belong together: "$5.3 | billion", "51 | percent", "more | than". */
function glued(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (hasDigit(a) && UNIT.test(y) && !/^(a|each|every|per)$/.test(y)) return true;
  if (/^(trillion|billion|million|thousand)$/.test(x) && /^(dollars?|pounds?|euros?)$/.test(y)) return true;
  return PAIRS.some(([p, q]) => p === x && q === y);
}

export const displayWord = (w) =>
  w
    .replace(/^["'(\[“‘]+/, '')
    .replace(/["')\]”’]+$/, '')
    .replace(/[,.;:—–…]+$/, '')
    .replace(/^[—–-]+/, '');

function chunkCost(words, i, j, isLastInSentence) {
  const k = j - i;
  const text = words.slice(i, j).map(displayWord).join(' ');
  let cost = [0, 6, 1, 0, 0.6][k];
  if (k === 1 && (text.length >= 10 || isLastInSentence)) cost = 2.2;
  if (text.length > MAX_CHARS) cost += 60;
  else if (text.length > 22) cost += 1.5;
  const last = words[j - 1];
  if (!isLastInSentence) {
    if (WEAK_END.has(norm(last)) && !clauseEnd(last)) cost += 2.5;
    if (words[j] && glued(last, words[j])) cost += 9;
    if (clauseEnd(last)) cost -= 0.9;
  }
  // a clause break in the middle of a page reads badly
  for (let m = i; m < j - 1; m++) if (clauseEnd(words[m])) cost += 1.2;
  return cost;
}

/** Split one sentence (array of word strings) into pages of 1-4 words, minimising total cost. */
function splitSentence(words) {
  const n = words.length;
  const best = new Array(n + 1).fill(Infinity);
  const prev = new Array(n + 1).fill(0);
  best[0] = 0;
  for (let j = 1; j <= n; j++) {
    for (let k = 1; k <= 4 && j - k >= 0; k++) {
      const c = best[j - k] + chunkCost(words, j - k, j, j === n);
      if (c < best[j]) {
        best[j] = c;
        prev[j] = j - k;
      }
    }
  }
  const cuts = [];
  for (let j = n; j > 0; j = prev[j]) cuts.unshift([prev[j], j]);
  return cuts;
}

/**
 * words: [{ w, start, end }] in script order (seconds).
 * returns pages: [{ start, end, words: [{ t, start, end }] }]
 */
export function buildCaptions(words) {
  const pages = [];
  let s = 0;
  for (let i = 0; i < words.length; i++) {
    if (sentenceEnd(words[i].w) || i === words.length - 1) {
      const sent = words.slice(s, i + 1);
      for (const [a, b] of splitSentence(sent.map((x) => x.w))) {
        const ws = sent.slice(a, b).map((x) => ({ t: displayWord(x.w), start: x.start, end: x.end })).filter((x) => x.t);
        if (ws.length) pages.push({ start: ws[0].start, end: ws[ws.length - 1].end, words: ws });
      }
      s = i + 1;
    }
  }
  // Hold each page until the next one starts when the gap is short, so captions never flicker.
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1];
    const p = pages[i];
    if (next) {
      const gap = next.start - p.end;
      p.end = gap < 0.45 ? next.start : p.end + 0.22;
      if (p.end - p.start < 0.32) p.end = Math.min(next.start, p.start + 0.32);
    } else p.end += 0.3;
  }
  return pages;
}

export function captionStats(pages) {
  const sizes = pages.map((p) => p.words.length);
  return {
    pages: pages.length,
    singles: sizes.filter((n) => n === 1).length,
    over: sizes.filter((n) => n > 4).length,
    avg: +(sizes.reduce((a, b) => a + b, 0) / Math.max(1, sizes.length)).toFixed(2),
    longest: Math.max(0, ...pages.map((p) => p.words.map((w) => w.t).join(' ').length)),
  };
}
