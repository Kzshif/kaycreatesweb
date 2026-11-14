// script.md: the words that are spoken. This file parses one and checks it
// against every script rule in the brief.
import fs from 'node:fs';
import { RULES } from '../../src/shared/spec.mjs';
import { cleanQuotes, estimateSeconds, figures, norm, sentences, tokens } from './text.mjs';

/**
 * script.md =
 *   ---
 *   id: 001
 *   company: Costco
 *   topic: Membership fees are the profit
 *   idea: One sentence: the single idea of the video.
 *   names: iPhone 15 | Model 3        (optional: digit-names that are not figures)
 *   say: AWS=A W S | Nvidia=en-vidia  (optional: pronunciation help for the fallback voice)
 *   ---
 *   First spoken line (the hook).
 *   Next line.
 *   # lines starting with # are notes and are never spoken
 */
export function parseScript(file) {
  const raw = cleanQuotes(fs.readFileSync(file, 'utf8'));
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  let body = raw;
  if (m) {
    body = m[2];
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('>'));
  const text = lines.join('\n');
  const say = Object.fromEntries(
    String(meta.say || '')
      .split('|')
      .map((p) => p.split('=').map((x) => x.trim()))
      .filter((p) => p.length === 2 && p[0]),
  );
  const names = String(meta.names || '')
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);
  return { meta, lines, text, say, names, words: tokens(text), sentences: sentences(text) };
}

// Openers that waste the first two seconds.
const WEAK_OPENERS = [
  /^did you know/i, /^have you ever/i, /^ever wonder/i, /^what if/i, /^in this video/i, /^today/i, /^let'?s/i, /^so[, ]/i,
  /^here'?s/i, /^hey/i, /^hi[, ]/i, /^welcome/i, /^imagine/i, /^you won'?t believe/i, /^fun fact/i, /^okay/i, /^this is/i, /^there is/i, /^there'?s/i,
];

const FILLER = [
  'did you know', 'believe it or not', "you won't believe", 'let me explain', "let's dive in", 'dive into', 'at the end of the day', 'the truth is',
  'the thing is', "here's the thing", 'in other words', 'as a matter of fact', 'in fact', 'to be honest', 'needless to say', 'it turns out',
  'basically', 'literally', 'actually', 'honestly', 'obviously', 'essentially', 'simply put', 'in this video', 'stick around', 'stay tuned',
  'without further ado', 'in a nutshell', 'long story short', 'you see', 'mind-blowing', 'game-changer', 'game changer', 'crazy', 'insane', 'secret sauce',
];

// The channel explains business models. It never tells anyone what to do with money.
const ADVICE = [
  /\byou should\b/i, /\byou need to\b/i, /\byou must\b/i, /\bdon'?t (buy|sell|miss)\b/i, /\b(buy|sell|short|hold)(ing)? (the |its |their )?(stock|shares)\b/i,
  /\binvest(ing)? in\b/i, /\b(a |an )?(good|great|smart|bad|safe) (investment|buy)\b/i, /\bfinancial advice\b/i, /\bstock tip\b/i, /\bget rich\b/i,
  /\bworth (buying|investing)\b/i, /\bmy advice\b/i, /\bi recommend\b/i, /\b(under|over)valued\b/i, /\bprice target\b/i, /\bportfolio\b/i, /\bside hustle\b/i,
];

const JARGON = {
  monetize: 'make money from', monetise: 'make money from', leverage: 'use', leverages: 'uses', utilize: 'use', utilise: 'use', ecosystem: 'group of products',
  synergy: '', synergies: '', 'revenue stream': 'way it earns', 'revenue streams': 'ways it earns', ebitda: 'profit', 'value proposition': '', 'business model': 'way it makes money',
  'vertical integration': 'owning each step', amortize: 'spread the cost', 'loss leader': 'sold at a loss on purpose', 'flywheel': '', 'top line': 'sales', 'bottom line': 'profit',
  'margins': 'profit per sale', 'gross margin': 'profit per sale', 'market capitalization': 'company value', 'market cap': 'company value', 'ancillary': 'extra',
};

const PIVOTS = [/\balso\b/i, /\banother (thing|way|reason)\b/i, /\bon top of that\b/i, /\bby the way\b/i, /\bsecond(ly)?,/i, /\bplus,/i, /\bmeanwhile\b/i, /\bnot only\b/i];

// A last line "flows back into the first" when it is left open: it ends on a
// connecting word and has no full stop, so the first line completes it.
const LOOP_ENDINGS = [
  /\b(that'?s|which is|that is|this is|and that'?s|it'?s) (why|how|because|where|what)$/i, /\bbecause$/i, /\bso$/i, /\band$/i, /\bbut$/i, /\bwhich means$/i,
  /\bthe reason$/i, /\b(even )?though$/i, /\bwhile$/i, /\buntil you (remember|learn|see|notice) (that|how)?$/i, /\bonce you (know|see|learn) (that|how)?$/i,
  /\b(all )?thanks to the fact that$/i, /\bwhen you (remember|realise|realize|know|learn) (that)?$/i, /\bnow you know (why|how)$/i, /\bthat$/i, /\bwhy$/i, /\bhow$/i,
];

const issue = (level, rule, message) => ({ level, rule, message });

export function lintScript(script) {
  const out = [];
  const R = RULES.script;
  const n = script.words.length;
  const sents = script.sentences;

  // 1. length
  if (n < R.minWords || n > R.maxWords) out.push(issue('error', 'length', `${n} words; the brief asks for ${R.minWords}-${R.maxWords}.`));
  const est = estimateSeconds(script.text, script.say);
  if (est.seconds < R.minSeconds - 1 || est.seconds > R.maxSeconds + 1) {
    out.push(issue('warn', 'duration', `Reads in about ${est.seconds.toFixed(0)}s (${est.spokenWords} spoken words); target ${R.minSeconds}-${R.maxSeconds}s. Final check happens on the real audio.`));
  }

  // 2. hook
  const hook = sents[0] || '';
  const hookWords = tokens(hook).length;
  const hookSecs = estimateSeconds(hook, script.say).seconds;
  if (hookWords > 12) out.push(issue('error', 'hook', `Hook is ${hookWords} words (~${hookSecs.toFixed(1)}s). The claim has to land in the first 2 seconds: cut to ${R.hookMaxWords} words or fewer.`));
  else if (hookWords > R.hookMaxWords) out.push(issue('warn', 'hook', `Hook is ${hookWords} words (~${hookSecs.toFixed(1)}s). Tighter is safer: aim for ${R.hookMaxWords} or fewer.`));
  if (WEAK_OPENERS.some((re) => re.test(hook))) out.push(issue('error', 'hook', `Hook opens with a warm-up ("${hook.split(' ').slice(0, 3).join(' ')}..."). Start on the claim itself.`));
  if (/\?\s*$/.test(hook)) out.push(issue('error', 'hook', 'Hook is a question. The brief asks for a specific claim, stated.'));
  const company = (script.meta.company || '').toLowerCase();
  const hookHasFigure = figures(hook, { ignore: script.names }).some((f) => f.kind === 'digit');
  const hookHasName = company && company.split(/[\s/&]+/).some((part) => part.length > 2 && hook.toLowerCase().includes(part));
  if (!hookHasFigure && !hookHasName) out.push(issue('error', 'hook', 'Hook names neither the company nor a figure, so it is not specific.'));

  // 3. sentences
  const lens = sents.map((s) => tokens(s).length);
  lens.forEach((len, i) => {
    if (len > 22) out.push(issue('error', 'sentences', `Sentence ${i + 1} is ${len} words. Split it.`));
    else if (len > R.maxSentenceWords) out.push(issue('warn', 'sentences', `Sentence ${i + 1} is ${len} words; keep under ${R.maxSentenceWords}.`));
  });
  const avg = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
  if (avg > R.avgSentenceWords) out.push(issue('warn', 'sentences', `Average sentence is ${avg.toFixed(1)} words; aim for ${R.avgSentenceWords} or fewer.`));

  // 4. filler and advice
  const lower = ` ${script.text.toLowerCase().replace(/\s+/g, ' ')} `;
  for (const f of FILLER) if (new RegExp(`(?<![a-z])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`).test(lower)) out.push(issue('error', 'filler', `Filler phrase: "${f}".`));
  for (const re of ADVICE) {
    const m = script.text.match(re);
    if (m) out.push(issue('error', 'advice', `Reads as advice ("${m[0]}"). The channel explains, it never advises.`));
  }

  // 5. plain words
  for (const [word, plain] of Object.entries(JARGON)) {
    if (new RegExp(`(?<![a-z])${word}(?![a-z])`).test(lower)) out.push(issue('warn', 'plain-words', `Jargon: "${word}"${plain ? ` - try "${plain}"` : ''}.`));
  }
  const longWords = script.words.filter((w) => norm(w).replace(/[^a-z]/g, '').length >= 13);
  if (longWords.length > 2) out.push(issue('warn', 'plain-words', `Long words: ${longWords.map(norm).join(', ')}.`));

  // 6. one idea
  if (!script.meta.idea) out.push(issue('error', 'one-idea', 'Front matter needs `idea:` - the single idea of the video in one sentence.'));
  for (const re of PIVOTS) {
    const m = script.text.match(re);
    if (m) out.push(issue('warn', 'one-idea', `"${m[0]}" often starts a second idea. One idea per video.`));
  }
  const digitFigs = figures(script.text, { ignore: script.names }).filter((f) => f.kind === 'digit' && !f.year);
  const distinct = new Set(digitFigs.map((f) => f.key));
  if (distinct.size > 6) out.push(issue('warn', 'one-idea', `${distinct.size} different figures. More than about five and viewers stop following.`));
  if (distinct.size === 0) out.push(issue('error', 'specific', 'No figures at all. Each video shows a fact with numbers.'));

  // 7. the loop
  const last = (sents[sents.length - 1] || '').trim();
  const lastOpen = last.replace(/[….]+$/, '').replace(/[,—-]+$/, '').trim();
  if (/[.!?]$/.test(last) && !/…$|\.\.\.$/.test(last)) {
    out.push(issue('error', 'loop', `Last line ends with a full stop ("${last}"), so the video ends instead of looping. Leave it open so the first line completes it.`));
  } else if (!LOOP_ENDINGS.some((re) => re.test(lastOpen))) {
    out.push(issue('warn', 'loop', `Check the loop by ear: "...${lastOpen}" -> "${hook}"`));
  }

  // 8. housekeeping
  if (/#\w/.test(script.text)) out.push(issue('error', 'format', 'Hashtags belong in upload.md, not the spoken script.'));
  if (/[™®]/.test(script.text)) out.push(issue('error', 'format', 'Remove trademark symbols.'));
  if (!script.meta.company) out.push(issue('error', 'format', 'Front matter needs `company:`.'));
  if (!script.meta.topic) out.push(issue('error', 'format', 'Front matter needs `topic:`.'));
  const hasPound = /£/.test(script.text);
  const hasDollar = /\$/.test(script.text);
  if (hasPound && !hasDollar) out.push(issue('warn', 'currency', 'Figures are in pounds only. The brief asks for dollars, with pounds where it helps.'));

  return {
    issues: out,
    stats: { words: n, sentences: sents.length, avgSentence: +avg.toFixed(1), seconds: +est.seconds.toFixed(1), spokenWords: est.spokenWords, hookWords, hookSeconds: +hookSecs.toFixed(1), figures: [...distinct] },
    loopSeam: `...${lastOpen}  ->  ${hook}`,
  };
}
