// Run with: npm test   (node --test tests/)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ACCENTS, GROUNDS, GROUND_ACCENTS, SCENES, cueCount } from '../src/shared/spec.mjs';
import { buildCaptions, captionStats, displayWord } from '../pipeline/lib/captions.mjs';
import { checkVariety, findPhrase, resolveAnchors, screenFigures, signature, validatePlan } from '../pipeline/lib/plan.mjs';
import { lintScript, parseScript } from '../pipeline/lib/script.mjs';
import { MUSIC, SFX, pickMusic, soundPlan } from '../src/shared/sound.mjs';
import { TITLE_MAX, buildMetadata, buildSrt, disclosure, lintPublish, publishFigures } from '../pipeline/lib/publish.mjs';
import { checkClaims, checkCoverage, parseSources, uncertainClaims } from '../pipeline/lib/sources.mjs';
import { parseCsv, toCsv } from '../pipeline/lib/status.mjs';
import { estimateSeconds, figures, norm, sentences, spokenForm, syntheticTimings, tokens, yearToWords } from '../pipeline/lib/text.mjs';
import { buildProps } from '../pipeline/lib/timing.mjs';

const tmp = (name, text) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shorts-test-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, text);
  return file;
};
const keys = (s) => figures(s).map((f) => f.key);

test('figures: currency, magnitude, percent, years', () => {
  assert.deepEqual(keys('$5.3 billion'), ['$5300000000']);
  assert.deepEqual(keys('$5.3bn'), ['$5300000000']);
  assert.deepEqual(keys('5.3 billion dollars'), ['$5300000000']);
  assert.deepEqual(keys('$5,323 million'), ['$5323000000']);
  assert.deepEqual(keys('51%'), ['51%']);
  assert.deepEqual(keys('51 percent'), ['51%']);
  assert.deepEqual(keys('£4bn'), ['£4000000000']);
  assert.deepEqual(keys('a $1.50 hot dog'), ['$1.5']);
  assert.equal(figures('in 2024')[0].year, true);
  assert.equal(figures('$2024')[0].year, false);
  assert.deepEqual(keys('3x bigger'), ['3x']);
});

test('figures: names with digits are not claims', () => {
  assert.deepEqual(keys('its 10-K filing'), []);
  assert.deepEqual(keys('the iPhone 15 costs $799'), ['$799']);
  assert.deepEqual(figures('the Model 3', { ignore: ['Model 3'] }).map((f) => f.key), []);
});

test('figures: number words and qualifiers', () => {
  const f = figures('more than half of its profit, over $5 billion');
  assert.equal(f[0].kind, 'word');
  assert.equal(f[0].key, 'half');
  assert.equal(f[1].qualifier, 'over');
  assert.deepEqual(figures('5.3 billion').map((x) => x.kind), ['digit']); // "billion" is not double counted
});

test('spoken form', () => {
  assert.equal(spokenForm('$5.3 billion'), 'five point three billion dollars');
  assert.equal(spokenForm('£4bn'), 'four billion pounds');
  assert.equal(spokenForm('51%'), 'fifty-one percent');
  assert.equal(spokenForm('a $1.50 hot dog'), 'a one dollar fifty hot dog');
  assert.equal(spokenForm('$0.99'), 'ninety-nine cents');
  assert.equal(spokenForm('in 2024'), 'in twenty twenty-four');
  assert.equal(yearToWords(1985), 'nineteen eighty-five');
  assert.equal(yearToWords(2005), 'two thousand and five');
  assert.equal(spokenForm('the 1990s'), 'the nineteen nineties');
  assert.equal(spokenForm('900 stores'), 'nine hundred stores');
  assert.equal(spokenForm('3x'), 'three times');
  assert.equal(spokenForm('the 3rd largest'), 'the third largest');
});

test('sentences and tokens', () => {
  assert.equal(sentences('Costco sells cheap. It earns $5.3 billion from cards.').length, 2);
  assert.equal(sentences('U.S. sales rose. Then fell.').length, 2);
  assert.equal(tokens('one — two').length, 2);
  assert.equal(norm('"Billion,"'), 'billion');
});

test('duration estimate is in a sane range', () => {
  const text = Array.from({ length: 90 }, () => 'money').join(' ');
  const e = estimateSeconds(text);
  assert.ok(e.seconds > 30 && e.seconds < 50, String(e.seconds));
});

test('captions: 2-4 words, figures stay together', () => {
  const script = 'Costco made $5.3 billion from membership cards last year. That is more than half of its profit, and the reason prices stay low.';
  const pages = buildCaptions(syntheticTimings(script));
  const st = captionStats(pages);
  assert.equal(st.over, 0);
  assert.ok(st.singles <= 1, JSON.stringify(pages.map((p) => p.words.map((w) => w.t).join(' '))));
  const texts = pages.map((p) => p.words.map((w) => w.t).join(' '));
  assert.ok(texts.some((t) => /\$5\.3 billion/.test(t)), texts.join(' | '));
  assert.ok(texts.some((t) => /more than/.test(t)), texts.join(' | '));
  for (let i = 1; i < pages.length; i++) assert.ok(pages[i].start >= pages[i - 1].end - 1e-6, 'pages never overlap');
  assert.equal(displayWord('profit,'), 'profit');
  assert.equal(displayWord('"why?"'), 'why?');
});

test('csv round trip keeps commas and quotes', () => {
  const rows = [['id', 'problems'], ['001', 'a, "b"; c\nd']];
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
});

const GOOD_SCRIPT = `---
id: 001
company: Costco
topic: Membership fees are the profit
idea: Costco earns most of its profit from membership cards, not from what it sells.
---
Costco barely makes money selling things.
Last year it sold $270 billion of goods.
After paying for the goods and the stores, little was left.
The money is in the card.
Shoppers paid $5.3 billion in membership fees.
That is 51% of the profit the company made from running the business.
A fee costs almost nothing to collect.
So Costco can sell a hot dog for $1.50 and still smile.
Cheap prices bring people in.
The card is what they are there to sell, which is why
`;

test('script lint: a good script passes, bad ones fail for the right reason', () => {
  const good = lintScript(parseScript(tmp('script.md', GOOD_SCRIPT)));
  assert.deepEqual(good.issues.filter((i) => i.level === 'error'), [], JSON.stringify(good.issues, null, 1));
  assert.ok(good.stats.words >= 70 && good.stats.words <= 110, String(good.stats.words));

  const rules = (text) => lintScript(parseScript(tmp('script.md', text))).issues.filter((i) => i.level === 'error').map((i) => i.rule);
  assert.ok(rules(GOOD_SCRIPT.replace('Costco barely makes money selling things.', 'Did you know Costco barely makes money?')).includes('hook'));
  assert.ok(rules(GOOD_SCRIPT.replace('which is why', 'and that is the end.')).includes('loop'));
  assert.ok(rules(GOOD_SCRIPT.replace('The money is in the card.', 'You should buy the stock.')).includes('advice'));
  assert.ok(rules(GOOD_SCRIPT.replace('The money is in the card.', 'Basically the money is in the card.')).includes('filler'));
  assert.ok(rules(GOOD_SCRIPT.split('\n').slice(0, 9).join('\n')).includes('length'));
});

const GOOD_SOURCES = `# Sources: 001

## 1. Net sales were $269,912 million in fiscal 2025
- Figures: $270 billion
- Exact: $269,912 million
- Source: Costco Wholesale Corporation, Form 10-K, fiscal 2025
- Type: regulator filing
- URL: https://www.sec.gov/example
- Date: 2025-10-08
- Quote: "Net sales $ 269,912"
- Year: fiscal 2025
- Verified: search-verified
- Agrees: Retail Insider, https://retail-insider.com/example
- Confidence: high
- Checked: 2026-11-14

## 2. Membership fees were $5,323 million
- Figures: $5.3 billion
- Exact: $5,323 million
- Source: Costco Wholesale Corporation, Form 10-K, fiscal 2025
- Type: regulator filing
- URL: https://www.sec.gov/example
- Date: 2025-10-08
- Quote: "Membership fees 5,323"
- Year: fiscal 2025
- Verified: search-verified
- Agrees: Retail Insider, https://retail-insider.com/example
- Confidence: high
- Checked: 2026-11-14

## 3. Membership fees were 51% of operating income
- Figures: 51%
- Derived: 5323 / 10383 * 100 = 51.3
- From: 2

## 4. The hot dog combo is $1.50
- Figures: $1.50
- Exact: $1.50
- Source: Costco annual report
- Type: company report
- URL: https://investor.costco.com/example
- Date: 2025-10-08
- Quote: "the $1.50 hot dog and soda combo"
- Year: fiscal 2025
- Verified: search-verified
- Agrees: Retail Insider, https://retail-insider.com/example
- Confidence: high
- Checked: 2026-11-14
`;

test('sources: complete file passes; coverage and rounding are enforced', () => {
  const src = parseSources(tmp('sources.md', GOOD_SOURCES));
  assert.deepEqual(checkClaims(src, { today: '2026-11-14' }).filter((i) => i.level === 'error'), []);
  const script = parseScript(tmp('script.md', GOOD_SCRIPT));
  const cov = checkCoverage(src, figures(script.text));
  assert.deepEqual(cov.filter((i) => i.level === 'error'), [], JSON.stringify(cov, null, 1));

  // an unsourced figure is an error
  const bad = checkCoverage(src, figures('It made $9 billion.'));
  assert.equal(bad[0].rule, 'unsourced');
  // a wrong rounding is an error, a fair one is not
  const wrong = parseSources(tmp('sources.md', GOOD_SOURCES.replace('- Figures: $5.3 billion', '- Figures: $5.3 billion, $5.5 billion')));
  assert.equal(checkCoverage(wrong, figures('It made $5.5 billion.')).some((i) => i.rule === 'rounding' && i.level === 'error'), true);
  // "more than" must be true
  const more = parseSources(tmp('sources.md', GOOD_SOURCES.replace('- Figures: $5.3 billion', '- Figures: $5.3 billion, $5.4 billion')));
  assert.equal(checkCoverage(more, figures('more than $5.4 billion')).some((i) => i.level === 'error'), true);
  assert.equal(checkCoverage(src, figures('more than $5.3 billion')).some((i) => i.level === 'error'), false);
});

test('sources: banned sites, bad sums and missing fields are caught', () => {
  const rules = (text) => checkClaims(parseSources(tmp('sources.md', text)), { today: '2026-11-14' }).filter((i) => i.level === 'error');
  assert.ok(rules(GOOD_SOURCES.replace('https://investor.costco.com/example', 'https://en.wikipedia.org/wiki/Costco')).length > 0);
  assert.ok(rules(GOOD_SOURCES.replace('= 51.3', '= 61.3')).some((i) => i.rule === 'derived'));
  assert.ok(rules(GOOD_SOURCES.replace('- Date: 2025-10-08\n- Quote: "the', '- Quote: "the')).length > 0);
  assert.ok(rules(GOOD_SOURCES.replace('- Date: 2025-10-08', '- Date: 2031-01-01')).length > 0);
});

const PLAN = {
  id: '001',
  look: { accent: 'lime', ground: 'ink', type: 'grotesk', motion: 'snap', captions: 'pop', shape: 'sharp' },
  scenes: [
    { type: 'hook', variant: 'slam', props: { lines: ['Costco barely', 'makes money', 'selling things'] } },
    { type: 'counter', variant: 'odometer', at: 'Last year it sold', props: { prefix: '$', value: 270, suffix: 'billion', label: 'of goods sold' } },
    { type: 'mockup', variant: 'card', at: 'The money is in the card', props: { title: 'Member' } },
    { type: 'counter', variant: 'countup', at: 'Shoppers paid', beats: ['in membership fees'], props: { prefix: '$', value: 5.3, decimals: 1, suffix: 'billion', label: 'membership fees', sub: 'in one year' } },
    { type: 'chart', variant: 'meter', at: 'That is 51%', props: { series: [{ label: 'Membership fees', value: 51, display: '51%' }] } },
    { type: 'breakdown', variant: 'receipt', at: 'So Costco can sell', props: { items: [{ label: 'Hot dog and drink', display: '$1.50' }] } },
    { type: 'kinetic', variant: 'cascade', at: 'Cheap prices', props: { lines: ['Cheap prices', 'bring people in'] } },
  ],
};

test('storyboard: valid plan, anchors, on-screen figures', () => {
  const script = parseScript(tmp('script.md', GOOD_SCRIPT));
  const v = validatePlan(PLAN, script);
  assert.deepEqual(v.issues.filter((i) => i.level === 'error'), [], JSON.stringify(v.issues, null, 1));
  assert.equal(v.anchors[0].at, 0);
  assert.ok(v.anchors[3].beats.length === 1);
  assert.ok(findPhrase(script.words.map(norm), '$5.3 billion') > 0);
  const shown = screenFigures(PLAN).map((f) => f.key);
  assert.ok(shown.includes('$270000000000') && shown.includes('$5300000000') && shown.includes('51%') && shown.includes('$1.5'), shown.join(','));

  const broken = structuredClone(PLAN);
  broken.scenes[2].at = 'words that are not there';
  broken.look.accent = 'beige';
  const rules = validatePlan(broken, script).issues.map((i) => i.rule);
  assert.ok(rules.includes('anchor') && rules.includes('look'));
  const mismatch = structuredClone(PLAN);
  mismatch.scenes[4].props.series = [{ label: 'A', value: 10, display: '$10' }, { label: 'B', value: 20, display: '$90' }];
  assert.ok(validatePlan(mismatch, script).issues.some((i) => i.rule === 'chart'));
});

test('variety: neighbours must differ in order, accent and opening', () => {
  const a = signature(PLAN);
  assert.equal(a.opening, 'hook/slam');
  assert.equal(checkVariety(a, [a]).filter((i) => i.level === 'error').length, 4);
  const other = structuredClone(PLAN);
  other.look = { accent: 'coral', ground: 'paper', type: 'editorial', motion: 'glide', captions: 'box', shape: 'soft' };
  other.scenes[0].variant = 'stamp';
  other.scenes.reverse();
  other.scenes.unshift(other.scenes.pop());
  assert.deepEqual(checkVariety(signature(other), [a]).filter((i) => i.level === 'error'), []);
});

test('timing: scenes follow the words, cadence is checked', () => {
  const script = parseScript(tmp('script.md', GOOD_SCRIPT));
  const words = syntheticTimings(script.text);
  const built = buildProps({ plan: PLAN, script, words });
  assert.deepEqual(built.issues.filter((i) => i.rule !== 'cadence' && i.level === 'error'), []);
  const p = built.props;
  assert.equal(p.scenes[0].from, 0);
  for (let i = 1; i < p.scenes.length; i++) assert.equal(p.scenes[i].from, p.scenes[i - 1].from + p.scenes[i - 1].duration);
  assert.equal(p.scenes.at(-1).from + p.scenes.at(-1).duration, p.durationInFrames);
  for (const s of p.scenes) {
    assert.equal(s.cues.length, cueCount({ type: s.type, variant: s.variant, props: s.props }));
    for (let i = 1; i < s.cues.length; i++) assert.ok(s.cues[i] > s.cues[i - 1], `${s.type} cues ascend`);
    assert.ok(s.cues.at(-1) < s.duration, `${s.type} last cue inside scene`);
  }
  assert.ok(p.captions.every((c) => c.words.length >= 1 && c.words.length <= 4));
  assert.equal(p.handle, null); // placeholders in channel.json never reach the screen
  assert.equal(buildProps({ plan: PLAN, script, words, channel: { handle: '[channel name]', cta: '[e.g. follow]' } }).props.cta, null);

  // a storyboard with too few scenes leaves the screen static, and that is an error
  const sparse = { ...PLAN, scenes: [PLAN.scenes[0], { ...PLAN.scenes[6], at: 'Cheap prices' }] };
  assert.ok(buildProps({ plan: sparse, script, words }).issues.some((i) => i.rule === 'cadence' && i.level === 'error'));
});

test('look system: every approved accent has contrast on its ground', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  for (const [ground, accents] of Object.entries(GROUND_ACCENTS)) {
    const g = GROUNDS[ground];
    assert.ok(ratio(g.fg, g.bg) >= 7, `${ground} text`);
    assert.ok(ratio(g.muted, g.bg) >= 4.5, `${ground} muted text`);
    for (const name of accents) {
      const a = ACCENTS[name];
      const fill = g.mode === 'dark' ? a.dark : a.light;
      const on = g.mode === 'dark' ? a.onDark : a.onLight;
      assert.ok(ratio(fill, g.bg) >= 3, `${name} on ${ground}: ${ratio(fill, g.bg).toFixed(2)}`);
      // Labels on a fill are always large and bold, so the WCAG large-text bar (3:1) applies.
      // The values were chosen with APCA (>= Lc 57) using the data-viz skill's validator.
      assert.ok(ratio(on, fill) >= 3, `label on ${name} (${g.mode}): ${ratio(on, fill).toFixed(2)}`);
    }
  }
  assert.ok(Object.keys(SCENES).length >= 10, 'at least 10 scene types');
});

// ------------------------------------------------------------ fact checking
test('sources: every figure is marked search-verified with a year; "high" needs a second, independent result', () => {
  const rules = (text) => checkClaims(parseSources(tmp('sources.md', text)), { today: '2026-11-14' });
  const errors = (text) => rules(text).filter((i) => i.level === 'error');
  assert.ok(errors(GOOD_SOURCES.replace('- Verified: search-verified\n', '')).some((i) => /Verified/.test(i.message)));
  assert.ok(errors(GOOD_SOURCES.replace('- Verified: search-verified', '- Verified: trust me')).some((i) => i.rule === 'verified'));
  assert.ok(errors(GOOD_SOURCES.replace('- Year: fiscal 2025\n', '')).some((i) => /Year/.test(i.message)));
  assert.ok(errors(GOOD_SOURCES.replace('- Year: fiscal 2025', '- Year: last year')).some((i) => /Year/.test(i.message)));
  // "high" with no second link, or a second link on the same site, is refused
  assert.ok(errors(GOOD_SOURCES.replace('- Agrees: Retail Insider, https://retail-insider.com/example', '- Agrees: none found')).some((i) => /second, independent/.test(i.message)));
  assert.ok(errors(GOOD_SOURCES.replaceAll('https://retail-insider.com/example', 'https://www.sec.gov/other-page').replaceAll('https://investor.costco.com/example', 'https://www.sec.gov/Archives/example')).some((i) => /same site/.test(i.message)));
  // a home page is not "the exact page link"
  assert.ok(errors(GOOD_SOURCES.replace('https://investor.costco.com/example', 'https://investor.costco.com/')).some((i) => /home page/.test(i.message)));
  // anything below high is flagged for a check by hand, and so is whatever is calculated from it
  const medium = GOOD_SOURCES.replace('- Confidence: high', '- Confidence: medium');
  assert.ok(rules(medium).some((i) => i.level === 'warn' && /by hand/.test(i.message)));
  const src = parseSources(tmp('sources.md', medium));
  checkClaims(src, { today: '2026-11-14' });
  const flagged = uncertainClaims(src);
  assert.ok(flagged.length >= 1 && flagged.every((c) => c.confidence !== 'high'));
  const clean = parseSources(tmp('sources.md', GOOD_SOURCES));
  checkClaims(clean, { today: '2026-11-14' });
  assert.deepEqual(uncertainClaims(clean), []);
});

// --------------------------------------------------------------- publishing
const PUBLISH_SCRIPT = GOOD_SCRIPT.replace('---\n', "---\ntitles: Costco's real product is a $1.50 hot dog | Why Costco sells at a loss | The card pays for the hot dog\ntags: #Costco #business #money\npinned: Would you pay to shop? Sources are in the description.\n");

test('publishing pack: 3 titles under 60 characters, 3 hashtags, pinned comment, disclosure', () => {
  const script = parseScript(tmp('script.md', PUBLISH_SCRIPT));
  assert.deepEqual(lintPublish(script).filter((i) => i.level === 'error'), []);
  const bad = (from, to) => lintPublish(parseScript(tmp('script.md', PUBLISH_SCRIPT.replace(from, to)))).filter((i) => i.level === 'error');
  assert.ok(bad(' | The card pays for the hot dog', '').some((i) => i.rule === 'titles'), 'two titles are not enough');
  assert.ok(bad('Why Costco sells at a loss', 'Why Costco sells at a loss and what that tells you about the whole of retail').some((i) => /under 60/.test(i.message)));
  assert.ok(bad('#Costco #business #money', '#Costco #business').some((i) => i.rule === 'hashtags'));
  assert.ok(bad('pinned: Would you pay to shop? Sources are in the description.\n', '').some((i) => i.rule === 'pinned'));
  assert.ok(bad('Why Costco sells at a loss', 'Why you should buy the stock').some((i) => /advice/.test(i.message)));
  assert.equal(TITLE_MAX, 59);
  // figures in titles need a source too
  assert.ok(publishFigures(script).some((f) => f.raw.includes('1.50')));

  const src = parseSources(tmp('sources.md', GOOD_SOURCES));
  const md = buildMetadata({ id: '001', script, src, channel: { cta: 'Follow for a new company every day' }, voiceSource: 'recorded' });
  assert.match(md, /## Titles/);
  assert.match(md, /Follow for a new company every day/);
  assert.match(md, /#Costco #business #money/);
  assert.match(md, /## Pinned comment\nWould you pay to shop\?/);
  assert.match(md, /\*\*No\. Leave it unticked\.\*\*/);
  assert.doesNotMatch(md, /Not ready to upload/);
  const tts = buildMetadata({ id: '001', script, src, channel: { cta: '[e.g. follow]' }, voiceSource: 'tts' });
  assert.match(tts, /\*\*Yes, tick it for this file\.\*\*/);
  assert.match(tts, /Not ready to upload/);
  assert.equal(disclosure('recorded').tick, false);
  assert.equal(disclosure('tts').tick, true);
});

test('subtitle file: one cue per sentence, in order, never overlapping', () => {
  const script = parseScript(tmp('script.md', GOOD_SCRIPT));
  const srt = buildSrt(script, syntheticTimings(script.text));
  const cues = srt.trim().split('\n\n');
  assert.ok(cues.length >= script.sentences.length);
  const toMs = (t) => { const [h, m, rest] = t.split(':'); const [s, ms] = rest.split(','); return ((+h * 60 + +m) * 60 + +s) * 1000 + +ms; };
  let last = -1;
  for (const c of cues) {
    const [, times] = c.split('\n');
    const [a, b] = times.split(' --> ').map(toMs);
    assert.ok(a > last - 1 && b > a, c);
    last = b;
  }
  assert.equal(cues.map((c) => c.split('\n').slice(2).join(' ')).join(' '), script.words.join(' '));
});

// -------------------------------------------------------------------- sound
const ASSETS_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'assets');

test('sound: every file in assets/ has a licence entry, and every entry has a file', () => {
  const lic = fs.readFileSync(path.join(ASSETS_DIR, 'licences.md'), 'utf8');
  const listed = new Set([...lic.matchAll(/`((?:sfx|music)\/[A-Za-z0-9_.-]+)`/g)].map((m) => m[1]));
  const onDisk = new Set(['sfx', 'music'].flatMap((d) => fs.readdirSync(path.join(ASSETS_DIR, d)).map((f) => `${d}/${f}`)));
  assert.deepEqual([...onDisk].filter((f) => !listed.has(f)), [], 'files without a licence entry');
  assert.deepEqual([...listed].filter((f) => !onDisk.has(f)), [], 'licence entries without a file');
  for (const [family, count] of Object.entries(SFX)) for (let k = 1; k <= count; k++) assert.ok(onDisk.has(`sfx/${family}-${k}.wav`), `${family}-${k}`);
  for (const bed of MUSIC) assert.ok(onDisk.has(`music/${bed}.ogg`), bed);
});

test('sound: music rotates so neighbours differ; effects follow the cue frames', () => {
  for (let n = 1; n < 40; n++) assert.notEqual(pickMusic(String(n).padStart(3, '0')), pickMusic(String(n + 1).padStart(3, '0')));
  assert.equal(pickMusic('007', { sound: { music: 'vault' } }), 'vault');
  assert.equal(pickMusic('007', { sound: { music: 'none' } }), null);
  assert.throws(() => pickMusic('007', { sound: { music: 'nope' } }));

  const script = parseScript(tmp('script.md', GOOD_SCRIPT));
  const { props } = buildProps({ plan: PLAN, script, words: syntheticTimings(script.text), id: '001' });
  const sp = soundPlan(props, PLAN);
  assert.equal(sp.music, 'music/caper.ogg');
  assert.equal(sp.events[0].t, 0);
  assert.equal(sp.events[0].family, 'slam');
  // one event for each scene change, at that scene's first frame
  for (const sc of props.scenes.slice(1)) assert.ok(sp.events.some((e) => Math.abs(e.t - sc.from / 30) < 0.001), `no sound at scene start ${sc.from}`);
  // sorted, inside the video, never two on top of each other (counter ticks aside)
  for (let i = 1; i < sp.events.length; i++) {
    assert.ok(sp.events[i].t >= sp.events[i - 1].t);
    if (sp.events[i].family !== 'tick') assert.ok(sp.events[i].t - sp.events[i - 1].t >= 0.1, `${sp.events[i - 1].file} and ${sp.events[i].file} collide`);
  }
  assert.ok(sp.events.every((e) => e.t < sp.seconds && e.gainDb < -5 && /^sfx\/[a-z]+-\d\.wav$/.test(e.file)));
  // the next video starts on different files
  const other = soundPlan({ ...props, id: '002' }, PLAN);
  assert.notEqual(other.music, sp.music);
  assert.notDeepEqual(other.events.map((e) => e.file), sp.events.map((e) => e.file));
  assert.deepEqual(soundPlan(props, { ...PLAN, sound: { sfx: false } }).events, []);
});
