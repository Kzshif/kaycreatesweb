// sources.md: the fact file. Every number that is spoken or shown must trace
// back to a company report, a regulator filing or a major news outlet, with a
// URL and a date. This file parses a fact file and enforces that.
import fs from 'node:fs';
import { cleanQuotes, figures } from './text.mjs';

export const SOURCE_TYPES = ['company report', 'regulator filing', 'major news outlet'];

// How a figure was confirmed. `search-verified`: a web search returned the wording from the page at
// the URL (the page itself could not be opened). `page-read`: someone opened the page and read it.
export const VERIFIED = ['search-verified', 'page-read'];
// high = two independent results agree. Anything lower goes to the top of the batch report.
export const CONFIDENCE = ['high', 'medium', 'low'];

// Not acceptable as a source, whatever they say.
const BANNED = [
  'wikipedia.org', 'wikimedia.org', 'statista.com', 'investopedia.com', 'medium.com', 'substack.com', 'reddit.com', 'quora.com', 'fandom.com',
  'youtube.com', 'youtu.be', 'tiktok.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'blogspot.com', 'wordpress.com',
  'macrotrends.net', 'stockanalysis.com', 'companiesmarketcap.com', 'businessofapps.com', 'demandsage.com', 'zippia.com', 'fool.com', 'seekingalpha.com',
  'finance.yahoo.com', 'yahoo.com', 'msn.com', 'visualcapitalist.com', 'howstuffworks.com', 'britannica.com', 'chatgpt.com', 'perplexity.ai',
];

const MAJOR_NEWS = [
  'reuters.com', 'apnews.com', 'bbc.co.uk', 'bbc.com', 'ft.com', 'wsj.com', 'nytimes.com', 'bloomberg.com', 'theguardian.com', 'cnbc.com',
  'washingtonpost.com', 'economist.com', 'npr.org', 'cnn.com', 'telegraph.co.uk', 'thetimes.com', 'thetimes.co.uk', 'news.sky.com', 'independent.co.uk',
  'fortune.com', 'foxbusiness.com', 'axios.com', 'politico.com', 'time.com', 'usatoday.com', 'latimes.com', 'abcnews.go.com', 'nbcnews.com', 'today.com', 'cbsnews.com', 'pbs.org',
  'marketwatch.com', 'barrons.com', 'theatlantic.com', 'newyorker.com', 'wired.com', 'theverge.com', 'techcrunch.com', 'itv.com', 'standard.co.uk',
  'forbes.com', 'businessinsider.com', 'engadget.com', 'arstechnica.com',
  // games, film, music and sport: the trade and specialist press with its own reporting and editors
  'ign.com', 'gamespot.com', 'polygon.com', 'kotaku.com', 'eurogamer.net', 'gamesindustry.biz', 'gamesbeat.com', 'videogameschronicle.com', 'gamesradar.com', 'pcgamer.com',
  'variety.com', 'hollywoodreporter.com', 'deadline.com', 'billboard.com', 'rollingstone.com', 'pollstar.com', 'boxofficemojo.com', 'the-numbers.com',
  'espn.com', 'theathletic.com', 'skysports.com', 'guinnessworldrecords.com',
  // trade press for restaurants, retail, music and the creator economy
  'qsrmagazine.com', 'restaurantbusinessonline.com', 'nrn.com', 'restaurantdive.com', 'retaildive.com', 'modernretail.co',
  'musicbusinessworldwide.com', 'tubefilter.com', 'thewrap.com', 'adage.com', 'adweek.com', 'sportico.com', 'frontofficesports.com',
];

const REGULATORS = [
  'sec.gov', 'justice.gov', 'ftc.gov', 'federalreserve.gov', 'treasury.gov', 'irs.gov', 'bls.gov', 'bea.gov', 'census.gov', 'uscourts.gov', 'supremecourt.gov',
  'courtlistener.com', 'govinfo.gov', 'congress.gov', 'gov.uk', 'service.gov.uk', 'fca.org.uk', 'bankofengland.co.uk', 'ons.gov.uk', 'parliament.uk',
  'judiciary.uk', 'europa.eu', 'oecd.org', 'imf.org', 'worldbank.org',
];

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};
const inList = (host, list) => list.some((d) => host === d || host.endsWith(`.${d}`));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

/**
 * sources.md =
 *   # Sources: 001 Costco
 *
 *   ## 1. Membership fees were $5,323 million in fiscal 2025
 *   - Figures: $5.3 billion
 *   - Exact: $5,323 million
 *   - Source: Costco Wholesale Corporation, Form 10-K, fiscal year ended 31 Aug 2025
 *   - Type: regulator filing
 *   - URL: https://www.sec.gov/...
 *   - Date: 2025-10-08
 *   - Quote: "Membership fees ... 5,323"
 *   - Year: fiscal 2025 (year ended 31 August 2025)
 *   - Verified: search-verified
 *   - Agrees: Retail Insider, https://retail-insider.com/... ("$5.32 billion")
 *   - Confidence: high
 *   - Checked: 2026-11-14
 *
 *   ## 2. Membership fees were about half of operating income
 *   - Figures: half, 51%
 *   - Derived: 5323 / 10383 * 100 = 51.3
 *   - From: 1, 3
 */
export function parseSources(file) {
  const raw = cleanQuotes(fs.readFileSync(file, 'utf8'));
  const claims = [];
  const blocks = raw.split(/^## +/m).slice(1);
  for (const block of blocks) {
    const [head, ...rest] = block.split('\n');
    const m = head.match(/^(\d+)[.)]\s*(.*)$/);
    const fields = {};
    let last = null;
    for (const line of rest) {
      const f = line.match(/^\s*[-*]\s*([A-Za-z][A-Za-z ]*?):\s*(.*)$/);
      if (f) {
        last = f[1].trim().toLowerCase();
        fields[last] = f[2].trim();
      } else if (last && /^\s{2,}\S/.test(line)) fields[last] += ` ${line.trim()}`;
    }
    claims.push({ n: m ? +m[1] : claims.length + 1, title: (m ? m[2] : head).trim(), fields });
  }
  for (const c of claims) {
    const f = c.fields.figures || '';
    c.figures = /^none$/i.test(f.trim()) ? [] : figures(f);
    c.keys = new Set(c.figures.map((x) => x.key));
    c.exact = c.fields.exact ? figures(c.fields.exact).find((x) => x.kind === 'digit') : null;
  }
  return { claims };
}

// Tiny arithmetic evaluator for "Derived:" lines: numbers, + - * / and brackets only.
function evalArithmetic(expr) {
  const s = expr.replace(/,/g, '').replace(/\s+/g, '');
  if (!/^[\d.+\-*/()]+$/.test(s)) throw new Error('only numbers and + - * / ( ) are allowed');
  let i = 0;
  const peek = () => s[i];
  const num = () => {
    const m = s.slice(i).match(/^\d+(\.\d+)?/);
    if (!m) throw new Error(`unexpected "${s[i] ?? 'end'}"`);
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const factor = () => {
    if (peek() === '(') {
      i++;
      const v = sum();
      if (peek() !== ')') throw new Error('missing )');
      i++;
      return v;
    }
    if (peek() === '-') {
      i++;
      return -factor();
    }
    return num();
  };
  const product = () => {
    let v = factor();
    while (peek() === '*' || peek() === '/') {
      const op = s[i++];
      const r = factor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  function sum() {
    let v = product();
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const r = product();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  const v = sum();
  if (i !== s.length) throw new Error(`unexpected "${s[i]}"`);
  return v;
}

const issue = (level, rule, message) => ({ level, rule, message });

/** Is every claim complete and from an accepted kind of source? */
export function checkClaims(src, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const out = [];
  if (!src.claims.length) out.push(issue('error', 'sources', 'No claims in sources.md.'));
  const byN = new Map(src.claims.map((c) => [c.n, c]));
  if (byN.size !== src.claims.length) out.push(issue('error', 'sources', 'Two claims share a number.'));

  for (const c of src.claims) {
    const tag = `Claim ${c.n}`;
    const f = c.fields;
    if (!('figures' in f)) out.push(issue('error', 'sources', `${tag}: missing "Figures:" (the figures exactly as the script says them, or "none").`));

    if (f.derived) {
      // A calculated figure: show the sum, and say which sourced claims it uses.
      const parts = f.derived.split('=');
      if (parts.length !== 2) out.push(issue('error', 'derived', `${tag}: write Derived as "sum = result".`));
      else {
        try {
          const got = evalArithmetic(parts[0]);
          const want = parseFloat(parts[1].replace(/[,%$£\s]/g, ''));
          const tol = Math.max(Math.abs(want) * 0.006, 0.006);
          if (!(Math.abs(got - want) <= tol)) out.push(issue('error', 'derived', `${tag}: ${parts[0].trim()} is ${+got.toPrecision(6)}, not ${parts[1].trim()}.`));
          c.derivedValue = got;
          // "Exact: $275.2 billion" states the unit of the result; its number must be the result of the sum
          if (c.exact) {
            const shown = c.exact.value / (c.exact.unit || 1);
            if (Math.abs(shown - got) > Math.max(Math.abs(got) * 0.006, 0.006)) out.push(issue('error', 'derived', `${tag}: Exact (${c.exact.raw}) does not match the result of the sum (${+got.toPrecision(6)}).`));
          }
        } catch (e) {
          out.push(issue('error', 'derived', `${tag}: cannot read the sum (${e.message}).`));
        }
      }
      const from = String(f.from || '')
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number);
      if (!from.length) out.push(issue('error', 'derived', `${tag}: a derived figure needs "From:" listing the claims it is calculated from.`));
      for (const n of from) {
        if (!byN.has(n)) out.push(issue('error', 'derived', `${tag}: "From" points at claim ${n}, which does not exist.`));
        else if (n === c.n) out.push(issue('error', 'derived', `${tag}: cannot be derived from itself.`));
      }
      continue;
    }

    for (const key of ['source', 'type', 'url', 'date', 'quote', 'checked']) {
      if (!f[key]) out.push(issue('error', 'sources', `${tag}: missing "${key[0].toUpperCase()}${key.slice(1)}:".`));
    }
    const type = (f.type || '').toLowerCase();
    if (f.type && !SOURCE_TYPES.includes(type)) out.push(issue('error', 'sources', `${tag}: Type must be one of: ${SOURCE_TYPES.join(', ')}.`));
    if (f.url) {
      const host = hostOf(f.url);
      if (!/^https:\/\//.test(f.url) || !host) out.push(issue('error', 'sources', `${tag}: URL must be a full https:// address.`));
      else if (inList(host, BANNED)) out.push(issue('error', 'sources', `${tag}: ${host} is not an accepted source. Use the company report, a regulator filing or a major news outlet.`));
      else if (type === 'major news outlet' && !inList(host, MAJOR_NEWS)) out.push(issue('error', 'sources', `${tag}: ${host} is not on the major news outlet list (pipeline/lib/sources.mjs).`));
      else if (type === 'regulator filing' && !inList(host, REGULATORS) && !/\.gov(\.[a-z]{2})?$/.test(host)) out.push(issue('warn', 'sources', `${tag}: ${host} does not look like a regulator or government site.`));
      else if (type === 'company report' && (inList(host, MAJOR_NEWS) || inList(host, REGULATORS))) out.push(issue('warn', 'sources', `${tag}: ${host} is not a company site; check the Type.`));
    }
    for (const key of ['date', 'checked']) {
      if (f[key] && !isDate(f[key])) out.push(issue('error', 'sources', `${tag}: ${key} must be YYYY-MM-DD.`));
      else if (f[key] && f[key] > today) out.push(issue('error', 'sources', `${tag}: ${key} ${f[key]} is in the future.`));
    }
    if (isDate(f.date || '') && isDate(f.checked || '') && !/^y/i.test(f.historic || '')) {
      const ageDays = (Date.parse(f.checked) - Date.parse(f.date)) / 86400000;
      if (ageDays > 800) out.push(issue('warn', 'stale', `${tag}: the source is ${(ageDays / 365).toFixed(1)} years old. Look for a newer figure, or add "Historic: yes" if the claim is about the past.`));
    }
    if (f.quote) {
      if (f.quote.replace(/["\s]/g, '').length < 8) out.push(issue('error', 'sources', `${tag}: Quote is too short to check against the source.`));
      if (c.figures.some((x) => x.kind === 'digit' && !x.year) && !/\d/.test(f.quote)) out.push(issue('warn', 'sources', `${tag}: Quote contains no number; quote the line that carries the figure.`));
    }
    if (c.figures.some((x) => x.kind === 'digit' && !x.year) && !c.exact) {
      out.push(issue('warn', 'sources', `${tag}: add "Exact:" with the precise source value, so rounding can be checked.`));
    }

    // how it was checked, the year it refers to, and how sure we are
    if (f.url) {
      try {
        if (new URL(f.url).pathname.replace(/\/+$/, '').length < 2) out.push(issue('error', 'sources', `${tag}: the URL is a home page. Give the exact page that carries the figure.`));
      } catch {
        /* reported above */
      }
    }
    const verified = (f.verified || '').toLowerCase();
    if (!verified) out.push(issue('error', 'verified', `${tag}: missing "Verified:" (${VERIFIED.join(' or ')}).`));
    else if (!VERIFIED.includes(verified)) out.push(issue('error', 'verified', `${tag}: Verified must be ${VERIFIED.join(' or ')}.`));
    if (!f.year) out.push(issue('error', 'verified', `${tag}: missing "Year:" (the year the figure refers to, e.g. "fiscal 2025").`));
    else if (!/\b(19|20)\d{2}\b/.test(f.year)) out.push(issue('error', 'verified', `${tag}: Year must name a year, e.g. "2022" or "fiscal 2025".`));
    const conf = (f.confidence || '').toLowerCase();
    if (!conf) out.push(issue('error', 'verified', `${tag}: missing "Confidence:" (${CONFIDENCE.join(', ')}).`));
    else if (!CONFIDENCE.includes(conf)) out.push(issue('error', 'verified', `${tag}: Confidence must be one of: ${CONFIDENCE.join(', ')}.`));
    else if (conf === 'high') {
      const second = (f.agrees || '').match(/https:\/\/[^\s)>\]]+/);
      if (!second) out.push(issue('error', 'verified', `${tag}: "Confidence: high" needs "Agrees:" with the link of a second, independent result that gives the same figure.`));
      else if (hostOf(second[0]) === hostOf(f.url || '')) out.push(issue('error', 'verified', `${tag}: the second result is on the same site as the first (${hostOf(second[0])}). It has to be independent.`));
      else if (inList(hostOf(second[0]), BANNED)) out.push(issue('error', 'verified', `${tag}: ${hostOf(second[0])} cannot confirm a figure.`));
    } else if (c.figures.length) {
      out.push(issue('warn', 'verified', `${tag}: confidence ${conf} (${f.agrees && !/^none/i.test(f.agrees) ? 'second result does not fully agree' : 'only one result found'}). Check "${c.title}" by hand before upload.`));
    }
    c.confidence = CONFIDENCE.includes(conf) ? conf : 'low';
  }
  // a calculated figure is only as sure as the least sure figure it is made from
  for (const c of src.claims) {
    if (!c.fields.derived) continue;
    const from = String(c.fields.from || '').split(/[,\s]+/).filter(Boolean).map(Number);
    const levels = from.map((n) => byN.get(n)?.confidence).filter(Boolean);
    c.confidence = levels.length ? CONFIDENCE[Math.max(...levels.map((l) => CONFIDENCE.indexOf(l)))] : 'low';
  }
  return out;
}

/** Figures to check by hand before upload: everything that is not confirmed by two results. */
export function uncertainClaims(src) {
  return src.claims
    .filter((c) => c.confidence && c.confidence !== 'high' && (c.figures.length || c.fields.derived))
    .map((c) => ({
      n: c.n,
      title: c.title,
      confidence: c.confidence,
      figures: c.fields.figures || '',
      url: c.fields.url || null,
      why: c.fields.derived ? `calculated from claim(s) ${c.fields.from}, at least one of which is not confirmed twice` : c.fields.note || (c.fields.agrees && !/^none/i.test(c.fields.agrees) ? c.fields.agrees : 'only one search result carries this figure'),
    }));
}

// Does a rounded, spoken figure fairly represent the exact source value?
function roundingIssue(fig, exact, where) {
  const sameKind = fig.currency === exact.currency && fig.percent === exact.percent && fig.mult === exact.mult;
  if (!sameKind) return null;
  const v = fig.value;
  const x = exact.value;
  if (x === 0) return null;
  const rel = Math.abs(v - x) / Math.abs(x);
  if (rel < 1e-9) return null; // the very same value, however it is written ("99 cents" and $0.99)
  const unit = fig.unit || 1;
  const step = unit / 10 ** fig.decimals;
  const fair = Math.abs(Math.round(x / step) * step - v) < step * 1e-6;
  const q = fig.qualifier;
  const said = `${q ? `${q} ` : ''}${fig.raw}`;
  if (['more than', 'over', 'above', 'at least', 'upwards of'].includes(q)) {
    if (x < v) return issue('error', 'rounding', `${where} says "${said}" but the source value is ${exact.raw}, which is lower.`);
    if (rel > 0.12) return issue('warn', 'rounding', `${where} says "${said}"; the source value ${exact.raw} is ${(rel * 100).toFixed(0)}% higher. A closer figure is more honest.`);
    return null;
  }
  if (['nearly', 'almost', 'just under', 'under', 'less than', 'below', 'close to'].includes(q)) {
    if (x > v && q !== 'close to') return issue('error', 'rounding', `${where} says "${said}" but the source value is ${exact.raw}, which is higher.`);
    if (rel > 0.08 && ['nearly', 'almost', 'just under', 'close to'].includes(q)) return issue('error', 'rounding', `${where} says "${said}" but ${exact.raw} is ${(rel * 100).toFixed(0)}% away.`);
    return null;
  }
  if (fair) return null;
  if (['about', 'around', 'roughly', 'approximately'].includes(q) && rel <= 0.05) return null;
  if (rel <= 0.015) return issue('warn', 'rounding', `${where} says "${said}"; the source value is ${exact.raw}. Not an exact rounding.`);
  return issue('error', 'rounding', `${where} says "${said}" but the source value is ${exact.raw} (${(rel * 100).toFixed(1)}% off).`);
}

/**
 * Is every figure that is spoken or shown backed by a claim?
 * `spoken`, `shown` and `published` (titles, description, pinned comment) are figure lists from text.figures().
 */
export function checkCoverage(src, spoken, shown = [], published = []) {
  const out = [];
  const find = (key) => src.claims.find((c) => c.keys.has(key));
  const seen = new Set();
  const visit = (figs, where) => {
    for (const fig of figs) {
      const id = `${where}:${fig.key}:${fig.qualifier || ''}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const claim = find(fig.key);
      if (!claim) {
        if (fig.kind === 'digit') out.push(issue('error', 'unsourced', `${where} figure "${fig.raw}" has no claim in sources.md. Source it, change it, or cut it.`));
        else out.push(issue('warn', 'unsourced', `${where} says "${fig.raw}". If that is a factual amount, list it under a claim's Figures.`));
        continue;
      }
      if (fig.kind !== 'digit' || fig.year) continue;
      // A derived result with no "Exact:" line is a bare number: only comparable with a bare figure or a percentage.
      const bare = !fig.currency && (fig.unit || 1) === 1;
      const exact = claim.exact || (claim.derivedValue !== undefined && bare ? { value: claim.derivedValue, raw: String(+claim.derivedValue.toPrecision(5)), currency: fig.currency, percent: fig.percent, mult: fig.mult } : null);
      if (!exact) continue;
      const r = roundingIssue(fig, exact, where);
      if (r) out.push(r);
    }
  };
  visit(spoken, 'Script');
  visit(shown, 'On-screen');
  visit(published, 'Title, description or pinned comment');
  return out;
}
