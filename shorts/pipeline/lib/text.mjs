// Text utilities shared by the script linter, the fact checker, the captions
// and the fallback voice: tokenising, finding every figure, and turning
// written figures into the words a narrator actually says.

// ------------------------------------------------------------- words -------
export const cleanQuotes = (s) => String(s).replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"');

/** Whitespace tokens that contain at least one letter or digit. These are the "words". */
export function tokens(text) {
  return cleanQuotes(text)
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
}

/** Lower-cased token with edge punctuation removed, for matching. */
export function norm(token) {
  return cleanQuotes(token)
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}$£€]+/u, '')
    .replace(/[^\p{L}\p{N}%]+$/u, '');
}

const ABBREV = /\b(U\.S|U\.K|E\.U|Inc|Corp|Co|Ltd|vs|Mr|Mrs|Ms|Dr|St|No|approx|est)\.$/i;

export function sentences(text) {
  const out = [];
  for (const line of cleanQuotes(text).split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    let buf = '';
    const parts = t.split(/(?<=[.!?…])\s+/);
    for (const p of parts) {
      buf = buf ? `${buf} ${p}` : p;
      if (ABBREV.test(buf)) continue; // "U.S. sales" is not a sentence break
      out.push(buf);
      buf = '';
    }
    if (buf) out.push(buf);
  }
  return out;
}

// ----------------------------------------------------------- figures -------
// Names that contain digits but are not claims.
const NUMERIC_NAMES = [
  /\b10-[KQ]\b/gi, /\b8-K\b/gi, /\b20-F\b/gi, /\bS-1\b/gi, /\b401\(k\)/gi, /\b24\/7\b/g, /\b7-Eleven\b/gi,
  // names that look like amounts only count as names standing alone: "3M" the company, not "$5.3M"
  /(?<![\d.,$£€])\b3M\b/g,
  /(?<![\d.,$£€])\b[45]G\b/g, /(?<![\d.,$£€])\b4K\b/g, /\bWeb ?[23](\.0)?\b/gi, /\bFormula ?1\b/gi, /\bF1\b/g, /\bCOVID-19\b/gi, /\b(737|747|787|A320|A380)\b/g,
  /\b(iPhone|iPad|PlayStation|PS|Xbox|Windows|Galaxy S|Pixel|Model|Series|Switch) ?\d+\b/gi,
  // game titles and studios with digits in their names
  /\b(GTA|FIFA|FC|Madden|Halo|Forza|Mario Kart|Black Ops|Modern Warfare|Battlefield|Fortnite Chapter) ?\d+\b/gi, /\bNBA ?2K\d*\b/gi, /\b2K\d*\b/g, /\bTake-Two\b/gi,
];

const MAG_WORDS = { trillion: 1e12, tn: 1e12, billion: 1e9, bn: 1e9, million: 1e6, mn: 1e6, m: 1e6, thousand: 1e3, k: 1e3 };

const FIG_RE = new RegExp(
  [
    '(?<cur>[$£€])?',
    '(?<num>\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)',
    '(?:(?<ord>st|nd|rd|th)\\b|(?<dec>s)\\b)?',
    '(?:\\s?(?<mag>trillion|billion|million|thousand|tn|bn|mn|m|k)\\b)?',
    '(?:\\s?(?<pct>%|percent\\b|per cent\\b))?',
    '(?:\\s?(?<mult>x|times)\\b)?',
    '(?:(?<centsign>¢)|\\s(?<curword>dollars?|pounds?|euros?|cents?|pence)\\b)?',
  ].join(''),
  'gi',
);

const WORD_FIG_RE =
  /\b(half|halves|thirds?|quarters?|fifths?|tenths?|doubled?|doubles|twice|tripled?|dozens?|hundreds?|thousands?|millions?|billions?|trillions?|majority|most|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/gi;

const trimNum = (n) => {
  const s = Number(n.toPrecision(12)).toString();
  return s;
};

/**
 * Every figure in a piece of text.
 * kind 'digit' = written with digits (must be sourced);
 * kind 'word'  = a number word or quantifier such as "half" or "most" (should be sourced).
 * `key` is a canonical form, so "$5.3 billion", "$5.3bn" and "5.3 billion dollars" match.
 */
export function figures(text, { ignore = [] } = {}) {
  let t = cleanQuotes(text);
  const blank = (m) => ' '.repeat(m.length);
  for (const re of NUMERIC_NAMES) t = t.replace(re, blank);
  for (const name of ignore) t = t.split(name).join(' '.repeat(name.length));

  const found = [];
  const covered = [];
  for (const m of t.matchAll(FIG_RE)) {
    const g = m.groups;
    const raw = m[0].trim();
    let value = parseFloat(g.num.replace(/,/g, ''));
    let cur = g.cur || '';
    const cw = (g.curword || '').toLowerCase();
    if (!cur && cw.startsWith('dollar')) cur = '$';
    if (!cur && cw.startsWith('pound')) cur = '£';
    if (!cur && cw.startsWith('euro')) cur = '€';
    if (!cur && (cw.startsWith('cent') || g.centsign)) {
      cur = '$';
      value /= 100;
    }
    if (!cur && cw === 'pence') {
      cur = '£';
      value /= 100;
    }
    const mag = (g.mag || '').toLowerCase();
    // A bare "m" or "k" only counts as a magnitude next to a currency sign ("$5m"), not "5 m",
    // or as a capital glued to the digits ("90M views", "250K"), which on screen never means metres.
    const glued = (g.mag === 'M' || g.mag === 'K') && /\d[MK]$/.test(m[0].trim());
    const useMag = mag && (mag.length > 1 || cur || glued) ? MAG_WORDS[mag] : 1;
    const abs = value * useMag;
    let key = `${cur}${trimNum(abs)}`;
    if (g.pct) key += '%';
    if (g.mult) key += 'x';
    if (g.ord) key += 'th';
    if (g.dec) key += 's';
    const isYear = !cur && !g.mag && !g.pct && !g.mult && !g.ord && /^\d{4}$/.test(g.num) && value >= 1500 && value <= 2100;
    const decimals = (g.num.split('.')[1] || '').length;
    const before = t.slice(Math.max(0, m.index - 24), m.index);
    const q = before.match(/(more than|over|above|at least|upwards of|nearly|almost|just under|under|less than|below|about|around|roughly|approximately|close to)\s*$/i);
    found.push({ raw, key, kind: 'digit', year: isYear, index: m.index, value: abs, currency: cur, percent: !!g.pct, mult: !!g.mult, unit: useMag, decimals, qualifier: q ? q[1].toLowerCase() : '' });
    covered.push([m.index, m.index + m[0].length]);
  }
  for (const m of t.matchAll(WORD_FIG_RE)) {
    if (covered.some(([a, b]) => m.index >= a && m.index < b)) continue; // part of "5.3 billion"
    const w = m[0].toLowerCase();
    const key = { halves: 'half', doubled: 'double', doubles: 'double', tripled: 'triple' }[w] || w.replace(/s$/, '');
    found.push({ raw: m[0], key, kind: 'word', index: m.index });
  }
  return found.sort((a, b) => a.index - b.index);
}

// ------------------------------------------------------ spoken form --------
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORDINALS = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };

function under100(n) {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

function under1000(n) {
  if (n < 100) return under100(n);
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` and ${under100(rest)}` : ''}`;
}

export function intToWords(n) {
  n = Math.round(n);
  if (n < 1000) return under1000(n);
  const groups = [
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
    [1e3, 'thousand'],
  ];
  const parts = [];
  let rem = n;
  for (const [size, name] of groups) {
    if (rem >= size) {
      parts.push(`${under1000(Math.floor(rem / size))} ${name}`);
      rem %= size;
    }
  }
  if (rem) parts.push(under1000(rem));
  return parts.join(' ');
}

export function numToWords(str) {
  const s = String(str).replace(/,/g, '');
  const [whole, frac] = s.split('.');
  let out = intToWords(parseInt(whole || '0', 10));
  if (frac) out += ` point ${[...frac].map((d) => ONES[+d]).join(' ')}`;
  return out;
}

export function yearToWords(y) {
  y = +y;
  if (y % 1000 === 0) return `${ONES[y / 1000]} thousand`;
  if (y >= 2000 && y <= 2009) return `two thousand and ${ONES[y - 2000]}`;
  const hi = Math.floor(y / 100);
  const lo = y % 100;
  if (lo === 0) return `${under100(hi)} hundred`;
  return `${under100(hi)} ${lo < 10 ? `oh ${ONES[lo]}` : under100(lo)}`;
}

function ordinalWords(n) {
  const w = intToWords(n);
  const last = w.split(/[\s-]/).pop();
  const head = w.slice(0, w.length - last.length);
  if (ORDINALS[last]) return head + ORDINALS[last];
  if (last.endsWith('y')) return `${head}${last.slice(0, -1)}ieth`;
  return `${w}th`;
}

const SAY_DEFAULT = { US: 'U.S.', UK: 'U.K.', EU: 'E.U.', CEO: 'C.E.O.', IPO: 'I.P.O.', AWS: 'A.W.S.', '&': 'and', vs: 'versus', 'vs.': 'versus' };

/**
 * The script as a narrator says it: "$5.3 billion" -> "five point three billion dollars".
 * Used to estimate running time and to feed the fallback voice.
 * `say` is a per-script pronunciation map, e.g. { "AWS": "A W S" }.
 */
export function spokenForm(text, say = {}) {
  let t = cleanQuotes(text);
  const map = { ...SAY_DEFAULT, ...say };
  for (const [from, to] of Object.entries(map)) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu');
    t = t.replace(re, to);
  }
  t = t.replace(/\b10-K\b/g, 'ten K').replace(/\b24\/7\b/g, 'twenty-four seven');
  t = t.replace(FIG_RE, (m0, ...rest) => {
    const g = rest[rest.length - 1];
    const lead = m0.match(/^\s*/)[0];
    const numStr = g.num.replace(/,/g, '');
    const value = parseFloat(numStr);
    const cw = (g.curword || '').toLowerCase();
    const cur = g.cur || (cw.startsWith('dollar') ? '$' : cw.startsWith('pound') ? '£' : cw.startsWith('euro') ? '€' : '');
    const magWord = g.mag ? { tn: 'trillion', bn: 'billion', mn: 'million', m: 'million', k: 'thousand' }[g.mag.toLowerCase()] || g.mag.toLowerCase() : '';
    const unit = { $: ['dollar', 'dollars', 'cents'], '£': ['pound', 'pounds', 'pence'], '€': ['euro', 'euros', 'cents'] }[cur];
    let out;
    if (g.ord) out = ordinalWords(value);
    else if (g.dec) {
      const y = yearToWords(value);
      out = y.endsWith('y') ? `${y.slice(0, -1)}ies` : `${y}s`;
    } else if (!cur && !g.mag && !g.pct && !g.mult && /^\d{4}$/.test(g.num) && value >= 1500 && value <= 2100) out = yearToWords(value);
    else if (unit && !magWord && /\.\d\d$/.test(numStr) && value < 1000) {
      // prices: $1.50 -> "one dollar fifty", $0.99 -> "ninety-nine cents"
      const whole = Math.floor(value);
      const cents = Math.round((value - whole) * 100);
      if (whole === 0) out = `${under100(cents)} ${unit[2]}`;
      else out = `${intToWords(whole)} ${whole === 1 ? unit[0] : unit[1]}${cents ? ` ${cents < 10 ? `oh ${ONES[cents]}` : under100(cents)}` : ''}`;
    } else {
      out = numToWords(numStr);
      if (magWord) out += ` ${magWord}`;
      if (unit) out += ` ${value === 1 && !magWord ? unit[0] : unit[1]}`;
      else if (cw) out += ` ${cw}`;
      else if (g.centsign) out += ' cents';
    }
    if (g.pct) out += ' percent';
    if (g.mult) out += ' times';
    return lead + out;
  });
  return t.replace(/[—–]/g, ', ').replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim();
}

// ----------------------------------------------------------- duration ------
export function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Rough running time of a script when read aloud at a natural pace. */
export function estimateSeconds(text, say = {}) {
  const spoken = spokenForm(text, say);
  const words = tokens(spoken);
  const syl = words.reduce((n, w) => n + w.split('-').reduce((a, p) => a + syllables(p), 0), 0);
  const stops = (spoken.match(/[.!?…]/g) || []).length;
  const commas = (spoken.match(/[,;:]/g) || []).length;
  const pauses = stops * 0.28 + commas * 0.12;
  // 5.0 syllables a second is the channel's pace (about 215 words a minute while speaking).
  return { seconds: syl / 5.0 + pauses, fast: syl / 5.6 + pauses * 0.8, slow: syl / 4.4 + pauses * 1.2, spokenWords: words.length, syllables: syl, spoken };
}

/** Lay words out in time when no real voice exists yet (planning and previews only). */
export function syntheticTimings(text, say = {}) {
  const toks = tokens(text);
  const out = [];
  let t = 0.05;
  for (const tok of toks) {
    const spoken = spokenForm(tok, say);
    const syl = tokens(spoken).reduce((n, w) => n + w.split('-').reduce((a, p) => a + syllables(p), 0), 0) || 1;
    const dur = Math.max(0.12, syl / 4.4);
    out.push({ w: tok, start: +t.toFixed(3), end: +(t + dur * 0.92).toFixed(3) });
    t += dur;
    if (/[.!?…]["')]?$/.test(tok)) t += 0.28;
    else if (/[,;:—]$/.test(tok)) t += 0.12;
  }
  return out;
}
