// Run with: npm test   (node --test tests/)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { HOOK_STYLES, SCENES, cueCount } from '../src/shared/spec.mjs';
import { buildCaptions, captionStats, displayWord } from '../pipeline/lib/captions.mjs';
import { checkVariety, findPhrase, parseAmount, prepareScene, resolveAnchors, screenFigures, signature, validatePlan } from '../pipeline/lib/plan.mjs';
import { lintScript, parseScript } from '../pipeline/lib/script.mjs';
import { EARNED, FEES, SCRIPT, motionPlan, motionSounds } from '../src/board/motion-plan.mjs';
import * as PM from '../src/shared/paper.mjs';
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
hook: contradiction
---
Costco barely makes money selling things.
Last year it sold $270 billion of goods.
After paying for the goods, the staff and the stores, little was left.
That is the plan, not a mistake.
The money is in the card.
Shoppers paid $5.3 billion in membership fees.
That is 51% of the profit the company made from running the business.
A fee costs almost nothing to collect.
Nobody has to stack it on a shelf or ship it across the country.
So Costco can sell a hot dog for $1.50 and still smile.
The low prices are the bait that keeps people renewing every year.
Most members come back and pay again.
Cheap prices bring people in.
The card is what they are there to sell, which is why
`;

test('script lint: a good script passes, bad ones fail for the right reason', () => {
  const good = lintScript(parseScript(tmp('script.md', GOOD_SCRIPT)));
  assert.deepEqual(good.issues.filter((i) => i.level === 'error'), [], JSON.stringify(good.issues, null, 1));
  assert.ok(good.stats.words >= 110 && good.stats.words <= 165, String(good.stats.words));

  const rules = (text) => lintScript(parseScript(tmp('script.md', text))).issues.filter((i) => i.level === 'error').map((i) => i.rule);
  assert.ok(rules(GOOD_SCRIPT.replace('Costco barely makes money selling things.', 'Did you know Costco barely makes money?')).includes('hook'));
  assert.ok(rules(GOOD_SCRIPT.replace('which is why', 'and that is the end.')).includes('loop'));
  assert.ok(rules(GOOD_SCRIPT.replace('The money is in the card.', 'You should buy the stock.')).includes('advice'));
  assert.ok(rules(GOOD_SCRIPT.replace('The money is in the card.', 'Basically the money is in the card.')).includes('filler'));
  assert.ok(rules(GOOD_SCRIPT.split('\n').slice(0, 12).join('\n')).includes('length'));
  // every script names how its first line earns attention, and a number hook opens on the number
  assert.ok(rules(GOOD_SCRIPT.replace('hook: contradiction\n', '')).includes('hook'));
  assert.ok(rules(GOOD_SCRIPT.replace('hook: contradiction', 'hook: clickbait')).includes('hook'));
  assert.ok(rules(GOOD_SCRIPT.replace('hook: contradiction', 'hook: number')).includes('hook'));
  assert.deepEqual(Object.keys(HOOK_STYLES).sort(), ['contradiction', 'hidden', 'number', 'reframe', 'stakes']);
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
  scenes: [
    { type: 'slam', variant: 'stamp', beats: ['selling things'], props: { lines: ['Costco barely', 'makes money', 'selling things'], stamp: ['Barely'] } },
    { type: 'count', variant: 'rain', at: 'Last year it sold', beats: ['of goods'], props: { amount: '$270 billion', line: 'of goods sold' } },
    { type: 'receipt', variant: 'roll', at: 'After paying', props: { title: 'Costco', rows: [{ label: 'Sales', value: '$270bn' }, { label: 'Left over', value: 'little', mark: true }] } },
    { type: 'words', variant: 'stack', at: 'That is the plan', props: { lines: ['The plan,', 'not a mistake'], mark: 'plan' } },
    { type: 'product', variant: 'hero', at: 'The money is in the card', props: { product: 'card', text: 'MEMBER', callouts: ['The real product'] } },
    { type: 'count', variant: 'pile', at: 'Shoppers paid', beats: ['in membership fees'], props: { amount: '$5.3 billion', line: 'in membership fees' } },
    { type: 'grid', variant: 'tray', at: 'That is 51%', props: { of: 100, filled: 51, figure: '51%', label: 'of the profit' } },
    { type: 'stamp', variant: 'under', at: 'A fee costs', props: { lines: ['Costs almost', 'nothing'], stamp: ['Pure fee'] } },
    { type: 'tag', variant: 'pin', at: 'So Costco can sell', props: { label: 'Hot dog', price: '$1.50' } },
    { type: 'split', variant: 'cards', at: 'The low prices', props: { a: { tag: 'The bait', figure: '$1.50', line: 'hot dog' }, b: { tag: 'The catch', figure: 'Card', line: 'renewed each year' } } },
    { type: 'words', variant: 'ladder', at: 'Cheap prices', props: { lines: ['Cheap prices', 'bring people in'] } },
  ],
  break: { at: 'Nobody has to' },
};

test('storyboard: valid plan, anchors, on-screen figures', () => {
  const script = parseScript(tmp('script.md', GOOD_SCRIPT));
  const v = validatePlan(PLAN, script);
  assert.deepEqual(v.issues.filter((i) => i.level === 'error'), [], JSON.stringify(v.issues, null, 1));
  assert.equal(v.anchors[0].at, 0);
  assert.ok(v.anchors[5].beats.length === 1);
  assert.ok(findPhrase(script.words.map(norm), '$5.3 billion') > 0);
  const shown = screenFigures(PLAN).map((f) => f.key);
  assert.ok(shown.includes('$270000000000') && shown.includes('$5300000000') && shown.includes('51%') && shown.includes('$1.5'), shown.join(','));

  const broken = structuredClone(PLAN);
  broken.scenes[2].at = 'words that are not there';
  broken.look = { accent: 'beige' };
  const rules = validatePlan(broken, script).issues.map((i) => i.rule);
  assert.ok(rules.includes('anchor') && rules.includes('look'));
  // a drawing must agree with its figure: 51% is 51 coins in a tray of 100
  const mismatch = structuredClone(PLAN);
  mismatch.scenes[6].props.filled = 30;
  assert.ok(validatePlan(mismatch, script).issues.some((i) => /tray shows/.test(i.message)));
  // the opening hit comes first, and there are enough scenes for a 40-55 second video
  const noSlam = structuredClone(PLAN);
  noSlam.scenes[0] = { type: 'words', variant: 'stack', props: { lines: ['Costco'] } };
  assert.ok(validatePlan(noSlam, script).issues.some((i) => /slam/.test(i.message)));
  assert.ok(validatePlan({ ...PLAN, scenes: PLAN.scenes.slice(0, 4) }, script).issues.some((i) => /at least/.test(i.message)));
  // the pattern break belongs near the middle
  assert.ok(validatePlan({ ...PLAN, break: { at: 'Costco barely' } }, script).issues.some((i) => i.rule === 'break'));
  assert.ok(validatePlan({ ...PLAN, break: undefined }, script).issues.some((i) => i.rule === 'break'));
});

test('storyboard: coin stacks are whole coins, worked out from the figures', () => {
  const sc = { type: 'stacks', variant: 'side', props: { unit: '$500 million', items: [{ label: 'Rent', amount: '$10.4 billion' }, { label: 'Royalties', amount: '$6 billion' }] } };
  const { props, issues } = prepareScene(sc, 0);
  assert.deepEqual(issues.filter((i) => i.level === 'error'), []);
  assert.deepEqual(props.stacks.map((s) => s.coins), [21, 12]);
  assert.deepEqual(props.stacks.map((s) => s.display), ['$10.4bn', '$6bn']);
  assert.equal(props.unitLabel, '1 coin = $500 million');
  const tooTall = prepareScene({ ...sc, props: { ...sc.props, unit: '$100 million' } }, 0).issues;
  assert.ok(tooTall.some((i) => i.level === 'error' && /coins tall/.test(i.message)));
  assert.equal(parseAmount('$5.3 billion').number, 5.3);
  assert.equal(parseAmount('$5.3 billion').word, 'billion');
  assert.equal(parseAmount('36%').suffix, '%');
});

test('variety: neighbours must differ in order, accent, opening, objects and scene changes', () => {
  const a = signature(PLAN, '001');
  assert.equal(a.opening, 'slam/stamp');
  assert.equal(a.accent, 'green');
  assert.equal(checkVariety(a, [a]).filter((i) => i.level === 'error').length, 5);
  const other = structuredClone(PLAN);
  other.look = { accent: 'vermilion' };
  other.scenes[0] = { type: 'slam', variant: 'number', props: { figure: '$5.3', unit: 'billion' } };
  other.scenes = [other.scenes[0], ...other.scenes.slice(1).reverse()].filter((sc) => sc.type !== 'tag');
  other.scenes.forEach((sc, i) => i && (sc.enter = 'fold'));
  assert.deepEqual(checkVariety(signature(other, '002'), [a]).filter((i) => i.level === 'error'), []);
  // the look rotates with the video number unless the storyboard names one
  assert.equal(signature(PLAN, '002').accent, 'vermilion');
  assert.equal(signature(PLAN, '010').inverted, true);
});

test('timing: scenes follow the words, cadence is checked, the break lands on its words', () => {
  const script = parseScript(tmp('script.md', GOOD_SCRIPT));
  const words = syntheticTimings(script.text);
  const built = buildProps({ plan: PLAN, script, words });
  assert.deepEqual(built.issues.filter((i) => i.rule !== 'cadence' && i.level === 'error'), []);
  const p = built.props;
  assert.equal(p.scenes[0].from, 0);
  assert.equal(p.scenes[0].enter, null);
  for (let i = 1; i < p.scenes.length; i++) {
    assert.equal(p.scenes[i].from, p.scenes[i - 1].from + p.scenes[i - 1].duration);
    assert.ok(['tear', 'whip', 'fold'].includes(p.scenes[i].enter));
  }
  assert.equal(p.scenes.at(-1).from + p.scenes.at(-1).duration, p.durationInFrames);
  for (const s of p.scenes) {
    assert.equal(s.cues.length, cueCount({ type: s.type, variant: s.variant, props: s.props }));
    for (let i = 1; i < s.cues.length; i++) assert.ok(s.cues[i] > s.cues[i - 1], `${s.type} cues ascend`);
    assert.ok(s.cues.at(-1) < s.duration, `${s.type} last cue inside scene`);
  }
  const at = findPhrase(script.words.map(norm), 'Nobody has to');
  assert.ok(Math.abs(p.patternBreak.frame - Math.round(words[at].start * 30)) <= 3);
  assert.ok(['invert', 'zoom', 'freeze'].includes(p.patternBreak.kind));
  assert.deepEqual(p.look, { accent: 'green', inverted: false });
  assert.ok(p.captions.every((c) => c.words.length >= 1 && c.words.length <= 4));
  assert.equal(p.handle, null); // placeholders in channel.json never reach the screen
  assert.equal(buildProps({ plan: PLAN, script, words, channel: { handle: '[channel name]', cta: '[e.g. follow]' } }).props.cta, null);
  assert.equal(buildProps({ plan: PLAN, script, words, channel: { handle: '@digitalfinancekay', cta: 'Follow for more' } }).props.handle, '@digitalfinancekay');

  // a storyboard with too few scenes leaves the screen static, and that is an error
  const sparse = { ...PLAN, scenes: [PLAN.scenes[0], { ...PLAN.scenes[10], at: 'Cheap prices' }] };
  assert.ok(buildProps({ plan: sparse, script, words }).issues.some((i) => i.rule === 'cadence' && i.level === 'error'));
});

test('scene library: twelve kinds of scene, and every step of every scene makes a sound', () => {
  assert.ok(Object.keys(SCENES).length >= 12);
  for (const [type, spec] of Object.entries(SCENES)) {
    for (const variant of spec.variants) {
      const props = { lines: ['a', 'b'], items: [{}, {}], rows: [{ mark: true }, {}], callouts: ['x', 'y'], unit: 'u', tag: { label: 'l' }, sub: 's', note: 'n', line: 'l', label: 'l', verdict: 'v', figure: '1', mark: ['b'] };
      const n = spec.cues(props, variant);
      const sounds = spec.sounds(props, variant);
      assert.equal(sounds.length, n, `${type}/${variant}: ${sounds.length} sounds for ${n} steps`);
    }
  }
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
  assert.ok(sp.events[0].t <= 0.2, 'the opening hit is heard in the first fifth of a second');
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

// ------------------------------------------------------------- Paper Money
test('paper money: the palette is the one in the brief', () => {
  assert.equal(PM.CREAM, '#F4EBDD');
  assert.equal(PM.INK, '#15130F');
  assert.deepEqual(Object.fromEntries(Object.entries(PM.ACCENTS).map(([k, v]) => [k, v.hex])), { green: '#1F6F54', vermilion: '#E8452C', cobalt: '#2B4EFF', gold: '#D9A441' });
  assert.deepEqual(PM.ACCENT_ORDER, ['green', 'vermilion', 'cobalt', 'gold']);
});

test('paper money: every accent, on both desks, keeps everything readable', () => {
  for (const accent of PM.ACCENT_ORDER) {
    for (const inverted of [false, true]) {
      const t = PM.tokens(accent, inverted);
      const tag = `${accent}${inverted ? ' inverted' : ''}`;
      assert.ok(PM.contrast(t.type, t.ground) >= 12, `${tag}: type on desk`);
      assert.ok(PM.contrast(PM.INK, t.hl) >= 7, `${tag}: ink on the highlighter is ${PM.contrast(PM.INK, t.hl).toFixed(2)}:1`);
      assert.ok(PM.contrast(PM.INK, PM.BRIGHT) >= 15, 'ink on the caption strip');
      assert.ok(PM.contrast(t.onAccent, t.accent) >= 4.5, `${tag}: text on accent paper is ${PM.contrast(t.onAccent, t.accent).toFixed(2)}:1`);
      assert.ok(PM.contrast(t.numeral, t.ground) >= 3, `${tag}: numerals`);
      assert.ok(PM.contrast(t.stamp, t.ground) >= 3, `${tag}: stamp ink`);
      assert.equal(t.accent, PM.ACCENTS[accent].hex);
    }
  }
  // gold cannot carry numerals on cream, so they stay ink; on the ink desk it can
  assert.equal(PM.tokens('gold', false).numeral, PM.INK);
  assert.equal(PM.tokens('gold', true).numeral, '#D9A441');
  assert.throws(() => PM.tokens('teal'));
});

test('paper money: text zones match YouTube\'s buttons and captions sit in the centre third', () => {
  const { width: W, height: H } = PM.FRAME;
  assert.equal(PM.SAFE.right, Math.round(W * 0.85)); // right 15%
  assert.equal(PM.SAFE.bottom, Math.round(H * 0.8)); // bottom 20%
  assert.ok(PM.SAFE.top >= H * 0.115);
  assert.ok(PM.CAPTION.top >= H / 3 && PM.CAPTION.bottom <= (H * 2) / 3, 'caption strip inside the centre third');
  assert.ok(PM.CAPTION.thirdTop === 640 && PM.CAPTION.thirdBottom === 1280);
  for (const zone of [PM.STAGE, PM.DECK]) assert.ok(zone.left >= PM.SAFE.left && zone.right <= PM.SAFE.right && zone.top >= PM.SAFE.top && zone.bottom <= PM.SAFE.bottom);
  assert.ok(PM.CAPTION.left >= PM.SAFE.left && PM.CAPTION.right <= PM.SAFE.right);
  assert.ok(PM.STAGE.bottom <= PM.CAPTION.top && PM.CAPTION.bottom <= PM.DECK.top, 'stage, captions and deck do not overlap');
});

test('paper money: accents rotate, neighbours differ, every tenth video is inverted', () => {
  for (let n = 1; n <= 100; n++) {
    assert.notEqual(PM.lookFor(n).accent, PM.lookFor(n + 1).accent);
    assert.equal(PM.lookFor(n).inverted, n % 10 === 0);
  }
  const used = new Set(Array.from({ length: 100 }, (_, i) => PM.lookFor(i + 1).accent));
  assert.equal(used.size, 4);
  assert.equal(Array.from({ length: 100 }, (_, i) => PM.lookFor(i + 1)).filter((l) => l.inverted).length, 10);
});

test('paper money: three typefaces, none of the forbidden ones', () => {
  assert.equal(PM.TYPE.headline.family, 'Bricolage Grotesque Variable');
  assert.equal(PM.TYPE.numeral.family, 'Fraunces Variable');
  assert.equal(PM.TYPE.label.family, 'DM Mono');
  assert.equal(PM.TYPE.headline.weight, 800);
  assert.equal(PM.TYPE.numeral.weight, 900);
  assert.ok(PM.TYPE.numeral.soft === 100 && PM.TYPE.numeral.wonk === 1);
  assert.ok(PM.TYPE.captionMin >= 60);
  const src = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
  for (const dir of ['paper', 'board']) {
    for (const f of fs.readdirSync(path.join(src, dir))) {
      const text = fs.readFileSync(path.join(src, dir, f), 'utf8');
      for (const font of PM.FORBIDDEN_FONTS) assert.ok(!new RegExp(`['"\`]${font}['"\`]|fontsource/${font.toLowerCase()}`).test(text), `${dir}/${f} uses ${font}`);
    }
  }
  assert.deepEqual(PM.FORBIDDEN_FONTS, ['Inter', 'Roboto', 'Arial', 'Montserrat', 'Poppins']);
});

// -------------------------------------------------------------- motion test
test('motion test: whole coins that match the sourced figures, sounds on the picture cues', () => {
  // one coin = $0.5 billion; fees $5.323bn and operating income $10.383bn (pilot 001 sources)
  assert.equal(FEES.coins, Math.round(5.323 / 0.5));
  assert.equal(EARNED.coins, Math.round(10.383 / 0.5));
  // its narration only uses figures the Costco fact file carries
  const src = parseSources(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'videos', '001-costco-membership', 'sources.md'));
  assert.deepEqual(checkCoverage(src, figures(SCRIPT.join('\n'))).filter((i) => i.level === 'error'), []);

  const cues = { billion: 41, just: 77, walk: 97, s2: 125, earned: 133, earnedEnd: 182, s3: 208, half: 280 };
  const p = motionPlan(cues);
  assert.ok(p.slamAt <= PM.MOTION.hookImpactBy, 'the opening number is down within half a second');
  assert.ok(Math.abs(p.right.start + p.right.n * p.right.every - cues.earnedEnd) < 2, 'the stack is complete as the figure finishes being spoken');
  assert.ok(p.left.start + p.left.n * p.left.every < cues.s2, 'the fees stack is standing before the scene opens');
  const ev = motionSounds(cues);
  const at = (family) => ev.filter((e) => e.file.startsWith(`sfx/${family}-`)).map((e) => e.t);
  assert.deepEqual(at('tear'), [+(cues.s2 / 30).toFixed(3)]);
  assert.deepEqual(at('whip'), [+(cues.s3 / 30).toFixed(3)]);
  assert.deepEqual(at('stamp'), [+(cues.half / 30).toFixed(3)]);
  assert.deepEqual(at('boom'), [+(p.breakAt / 30).toFixed(3)]);
  assert.equal(at('slam')[0], +(p.slamAt / 30).toFixed(3));
  for (let i = 1; i < ev.length; i++) assert.ok(ev[i].t >= ev[i - 1].t);
  for (const e of ev) assert.ok(fs.existsSync(path.join(ASSETS_DIR, e.file)), e.file);
});
