// video.json: the storyboard. Which scenes, in which order. This file validates one storyboard,
// works out what each scene needs to draw (how many coins in a stack, where a counter stops),
// and compares it with its neighbours so that no two videos in a row share a skeleton.
import { ACCENT_ORDER, lookFor } from '../../src/shared/paper.mjs';
import { BREAKS, DECKS, PRODUCTS, RULES, SCENES, TRANSITIONS, cueCount, sceneObjects } from '../../src/shared/spec.mjs';
import { figures, norm, tokens } from './text.mjs';

const issue = (level, rule, message) => ({ level, rule, message });
const num = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 1;

/** Index of the first word of `phrase` in `words` at or after `from`, or -1. */
export function findPhrase(wordsNorm, phrase, from = 0) {
  const p = tokens(phrase).map(norm).filter(Boolean);
  if (!p.length) return -1;
  outer: for (let i = from; i <= wordsNorm.length - p.length; i++) {
    for (let k = 0; k < p.length; k++) if (wordsNorm[i + k] !== p[k]) continue outer;
    return i;
  }
  return -1;
}

/** Resolve every scene start and beat to a word index in the script. */
export function resolveAnchors(plan, scriptWords) {
  const wn = scriptWords.map(norm);
  const out = [];
  const issues = [];
  let cursor = 0;
  plan.scenes.forEach((sc, i) => {
    let at = 0;
    if (i > 0) {
      if (!sc.at) issues.push(issue('error', 'anchor', `Scene ${i + 1} (${sc.type}) needs "at": the words in the script where it starts.`));
      else {
        at = findPhrase(wn, sc.at, cursor);
        if (at < 0) {
          issues.push(issue('error', 'anchor', `Scene ${i + 1} (${sc.type}): "${sc.at}" is not in the script after scene ${i}.`));
          at = cursor;
        }
      }
    } else if (sc.at && findPhrase(wn, sc.at, 0) !== 0) {
      issues.push(issue('error', 'anchor', `Scene 1 must start on the first word of the script, not at "${sc.at}".`));
    }
    const beats = [];
    let bc = at;
    for (const b of sc.beats || []) {
      const idx = findPhrase(wn, b, bc);
      if (idx < 0) issues.push(issue('error', 'anchor', `Scene ${i + 1} (${sc.type}): beat "${b}" is not in the script after the scene starts.`));
      else {
        beats.push(idx);
        bc = idx + 1;
      }
    }
    out.push({ at, beats });
    cursor = Math.max(at + 1, bc);
  });
  // a beat must fall inside its own scene
  out.forEach((a, i) => {
    const end = i + 1 < out.length ? out[i + 1].at : scriptWords.length;
    for (const b of a.beats) if (b >= end) issues.push(issue('error', 'anchor', `Scene ${i + 1}: a beat falls after the next scene starts. Move the beat or the next scene.`));
    if (i > 0 && a.at <= out[i - 1].at) issues.push(issue('error', 'anchor', `Scene ${i + 1} does not start after scene ${i}.`));
  });
  return { anchors: out, issues };
}

// ---------------------------------------------------------- amounts
const WORD_OF = { 1e12: 'trillion', 1e9: 'billion', 1e6: 'million', 1e3: 'thousand' };
/** "$270 billion" -> { prefix: '$', number: 270, decimals: 0, word: 'billion', suffix: '', value: 2.7e11 } */
export function parseAmount(text) {
  const f = figures(String(text || '')).find((x) => x.kind === 'digit' && !x.year);
  if (!f) return null;
  const unit = f.unit || 1;
  // `tail` is the magnitude exactly as written after the digits ("M" in "90M", "bn" in "$3.2bn"),
  // for scenes that print the figure whole rather than with the word on its own line
  let tail = f.percent || f.mult ? '' : f.raw.replace(/^[$£€]?\d[\d,]*(?:\.\d+)?/, '');
  // "1,000+" keeps its plus: the figure is a floor, not a count
  const after = String(text).slice(String(text).indexOf(f.raw) + f.raw.length);
  if (after.startsWith('+')) tail += '+';
  return { prefix: f.currency || '', number: +(f.value / unit).toFixed(f.decimals || 0), decimals: f.decimals || 0, word: WORD_OF[unit] || '', suffix: f.percent ? '%' : f.mult ? 'x' : '', tail, value: f.value, raw: f.raw };
}
/** "$10.4 billion" -> "$10.4bn": the short form used where space is tight. */
export const shortAmount = (text) => String(text).replace(/\s*trillion\b/i, 'tn').replace(/\s*billion\b/i, 'bn').replace(/\s*million\b/i, 'm').replace(/\s*thousand\b/i, 'k');

/**
 * What each scene needs worked out before it can be drawn. Returns { props, issues } where props
 * are the storyboard's own props plus the derived values (never replacing what was written).
 */
export function prepareScene(sc, i = 0) {
  const p = { ...(sc.props || {}) };
  const issues = [];
  const bad = (m) => issues.push(issue('error', 'scenes', `Scene ${i + 1} (${sc.type}): ${m}`));
  if (sc.type === 'count') {
    const a = parseAmount(p.amount);
    if (!a) bad(`"amount" must be a figure such as "$270 billion", not "${p.amount}".`);
    else p.count = a;
  }
  if (sc.type === 'stacks') {
    const unit = parseAmount(p.unit);
    if (!unit || !(unit.value > 0)) bad('"unit" must say what one coin is worth, e.g. "$500 million".');
    else {
      p.unitLabel = `1 coin = ${p.unit}`;
      p.stacks = (p.items || []).map((it) => {
        const a = parseAmount(it.amount);
        if (!a) {
          bad(`item "${it.label}" needs an "amount" such as "$10.4 billion".`);
          return { label: it.label, display: String(it.amount || ''), coins: 1, number: 0, decimals: 0, prefix: '', tail: '' };
        }
        const coins = Math.round(a.value / unit.value);
        if (coins < 1) bad(`"${it.label}" (${it.amount}) is less than half a coin of ${p.unit}: choose a smaller unit.`);
        if (coins > 26) bad(`"${it.label}" would be ${coins} coins tall: choose a larger unit than ${p.unit}.`);
        if (coins >= 1 && coins < 4) issues.push(issue('warn', 'scenes', `Scene ${i + 1} (stacks): "${it.label}" is only ${coins} coin(s), so rounding to whole coins distorts it. A smaller unit reads more honestly.`));
        const short = shortAmount(it.amount);
        return { label: it.label, display: short, coins: Math.max(1, Math.min(26, coins)), number: a.number, decimals: a.decimals, prefix: a.prefix, tail: short.replace(/^[^0-9]*[0-9.,]+/, '') };
      });
      if (p.stacks.length < 2 || p.stacks.length > 3) bad('a coin-stack chart compares 2 or 3 things.');
    }
  }
  if (sc.type === 'cut') {
    const a = parseAmount(p.share);
    if (!a || a.suffix !== '%' || !(a.number >= 5 && a.number <= 95)) bad('"share" must be a percentage between 5% and 95%, e.g. "36%".');
    else p.shareValue = a.number;
  }
  if (sc.type === 'grid') {
    if (![10, 20, 50, 100].includes(p.of)) bad('"of" must be 10, 20, 50 or 100.');
    if (!(Number.isInteger(p.filled) && p.filled >= 0 && p.filled <= p.of)) bad('"filled" must be a whole number no larger than "of".');
    const a = parseAmount(p.figure);
    if (a && a.suffix === '%' && p.of && Math.abs(a.number - (p.filled / p.of) * 100) > 0.51) bad(`the figure says ${p.figure} but the tray shows ${p.filled} of ${p.of}.`);
  }
  if (sc.type === 'stamp' && p.figure) {
    const a = parseAmount(p.figure);
    if (a) p.count = a;
  }
  if (sc.type === 'flow' && p.amount) p.amountShort = shortAmount(p.amount);
  return { props: p, issues };
}

// Keys whose strings are not printed as they stand (they are composed, or are names of things to draw).
const SKIP_KEYS = new Set(['product', 'variant', 'unit', 'figure', 'mark', 'enter', 'kind', 'deck', 'accent', 'at']);

/** Every string that ends up on screen, for the fact checker. */
export function screenStrings(plan) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if (!SKIP_KEYS.has(key)) out.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  for (const sc of plan.scenes || []) {
    const p = sc.props || {};
    walk(p, 'props');
    // a figure and its unit are read together: "$5.3" + "billion" is $5.3 billion, not $5.30
    if (typeof p.figure === 'string') out.push(p.unit && sc.type === 'slam' ? `${p.figure} ${p.unit}` : p.figure);
    // sc.source is a citation ("Fortune, 2022"), not a claim: its year is not checked as a figure
    if (sc.type === 'grid' && typeof p.filled === 'number' && p.of > 0) out.push(`${+((p.filled / p.of) * 100).toFixed(1)}%`);
  }
  return out;
}

export const screenFigures = (plan, ignore = []) => screenStrings(plan).flatMap((s) => figures(s, { ignore }));

/** The look of video n: its accent and whether it is the inverted version, unless the storyboard says otherwise. */
export function resolveLook(id, plan = {}) {
  const auto = lookFor(num(id));
  return { accent: plan.look?.accent || auto.accent, inverted: plan.look?.inverted ?? auto.inverted };
}
/** Scene changes, in order: what the storyboard asks for, otherwise a rotation that starts differently for every video. */
export function resolveTransitions(id, plan) {
  const n = num(id);
  return (plan.scenes || []).map((sc, i) => (i === 0 ? null : sc.enter || TRANSITIONS[(n + i) % TRANSITIONS.length]));
}
export const resolveDeck = (id, plan = {}) => plan.deck || DECKS[(num(id) - 1) % DECKS.length];
export const resolveBreakKind = (id, plan = {}) => plan.break?.kind || BREAKS[(num(id) - 1) % BREAKS.length];

export function validatePlan(plan, script, id = plan.id) {
  const out = [];
  const L = plan.look || {};
  if (L.accent && !ACCENT_ORDER.includes(L.accent)) out.push(issue('error', 'look', `look.accent must be one of: ${ACCENT_ORDER.join(', ')}.`));
  if (plan.deck && !DECKS.includes(plan.deck)) out.push(issue('error', 'look', `deck must be one of: ${DECKS.join(', ')}.`));
  if (plan.break?.kind && !BREAKS.includes(plan.break.kind)) out.push(issue('error', 'break', `break.kind must be one of: ${BREAKS.join(', ')}.`));

  const scenes = plan.scenes || [];
  if (!Array.isArray(plan.scenes) || scenes.length < RULES.minScenes) out.push(issue('error', 'scenes', `A storyboard needs at least ${RULES.minScenes} scenes (it has ${scenes.length}): at 40-55 seconds, fewer leaves the picture still for too long.`));
  if (scenes[0] && scenes[0].type !== 'slam') out.push(issue('error', 'scenes', 'Scene 1 must be a "slam": the key number or object lands in the first half second.'));
  scenes.forEach((sc, i) => {
    const spec = SCENES[sc.type];
    if (!spec) return out.push(issue('error', 'scenes', `Scene ${i + 1}: unknown type "${sc.type}". Types: ${Object.keys(SCENES).join(', ')}.`));
    if (!spec.variants.includes(sc.variant)) out.push(issue('error', 'scenes', `Scene ${i + 1} (${sc.type}): variant must be one of: ${spec.variants.join(', ')}.`));
    for (const key of spec.required(sc.variant)) if (sc.props?.[key] === undefined) out.push(issue('error', 'scenes', `Scene ${i + 1} (${sc.type}/${sc.variant}): missing props.${key}.`));
    const need = cueCount(sc);
    if ((sc.beats || []).length > need - 1) out.push(issue('error', 'scenes', `Scene ${i + 1} (${sc.type}/${sc.variant}) has ${need} steps, so at most ${need - 1} beats; it has ${(sc.beats || []).length}.`));
    if (sc.enter && !TRANSITIONS.includes(sc.enter)) out.push(issue('error', 'scenes', `Scene ${i + 1}: enter must be one of: ${TRANSITIONS.join(', ')}.`));
    const p = sc.props || {};
    for (const prod of [p.product, p.from?.product, p.to?.product]) if (prod && !PRODUCTS.includes(prod)) out.push(issue('error', 'scenes', `Scene ${i + 1}: unknown product "${prod}". Products: ${PRODUCTS.join(', ')}.`));
    out.push(...prepareScene(sc, i).issues);
    // long lines shrink to fit, and small type is hard to read on a phone
    for (const line of [...(p.lines || []), ...(p.stamp || [])]) if (typeof line === 'string' && line.length > 24) out.push(issue('warn', 'scenes', `Scene ${i + 1}: "${line}" is ${line.length} characters; headline lines read best under 22.`));
    for (const c of p.callouts || []) if (String(c).length > 30) out.push(issue('warn', 'scenes', `Scene ${i + 1}: label "${c}" is long; keep labels under 30 characters.`));
  });

  // No logos or mascots: plain text names and the pipeline's own drawings only.
  for (const s of screenStrings(plan)) if (/[™®©]/.test(s)) out.push(issue('error', 'brand', `On-screen text "${s}" carries a trademark symbol. Plain text names only.`));
  const walkKeys = (v) => {
    if (Array.isArray(v)) v.forEach(walkKeys);
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) {
        if (/logo|mascot|image|img|src|url/i.test(k)) out.push(issue('error', 'brand', `Storyboard key "${k}" is not allowed: no logos, mascots or outside images.`));
        walkKeys(x);
      }
  };
  scenes.forEach((sc) => walkKeys(sc.props || {}));

  // Back-to-back scenes of the same type look like a template.
  for (let i = 1; i < scenes.length; i++) {
    if (scenes[i].type === scenes[i - 1].type) out.push(issue('warn', 'scenes', `Scenes ${i} and ${i + 1} are both "${scenes[i].type}". Vary the type.`));
  }
  const distinct = new Set(scenes.map((s) => s.type));
  if (scenes.length >= RULES.minScenes && distinct.size < 6) out.push(issue('warn', 'scenes', `Only ${distinct.size} different scene types in ${scenes.length} scenes.`));

  const { anchors, issues } = script ? resolveAnchors(plan, script.words) : { anchors: [], issues: [] };
  out.push(...issues);

  // the pattern break: named by the words it lands on, somewhere near the middle
  if (script) {
    if (!plan.break?.at) out.push(issue('error', 'break', 'The storyboard needs "break": { "at": "words from the script" } for the mid-video pattern break.'));
    else {
      const idx = findPhrase(script.words.map(norm), plan.break.at, 0);
      const [lo, hi] = RULES.breakWindow;
      if (idx < 0) out.push(issue('error', 'break', `break.at "${plan.break.at}" is not in the script.`));
      else if (idx / script.words.length < lo || idx / script.words.length > hi) out.push(issue('error', 'break', `The pattern break lands ${Math.round((idx / script.words.length) * 100)}% of the way through; it belongs near the middle (${lo * 100}-${hi * 100}%).`));
    }
  }
  return { issues: out, anchors, id };
}

/** What makes one video look different from another. */
export function signature(plan, id = plan.id) {
  const first = plan.scenes?.[0] || {};
  const look = resolveLook(id, plan);
  return {
    order: (plan.scenes || []).map((s) => s.type).join('>'),
    detail: (plan.scenes || []).map((s) => `${s.type}/${s.variant}`).join('>'),
    accent: look.accent,
    inverted: look.inverted,
    opening: `${first.type}/${first.variant}`,
    transitions: resolveTransitions(id, plan).filter(Boolean).join('>'),
    objects: [...new Set((plan.scenes || []).flatMap(sceneObjects))].sort().join('+'),
    deck: resolveDeck(id, plan),
    breakKind: resolveBreakKind(id, plan),
  };
}

/**
 * `before` = signatures of earlier videos, nearest first. `after` = the next video, if it exists.
 * The identity is fixed; the structure is not. Neighbouring videos must differ in scene order,
 * accent, opening move, featured objects and transitions.
 */
export function checkVariety(sig, before = [], after = null) {
  const out = [];
  const V = RULES.variety;
  const hard = (other, label) => {
    if (!other) return;
    if (other.order === sig.order) out.push(issue('error', 'variety', `Same scene order as ${label} (${sig.order}).`));
    if (other.accent === sig.accent) out.push(issue('error', 'variety', `Same colour accent as ${label} (${sig.accent}).`));
    if (other.opening === sig.opening) out.push(issue('error', 'variety', `Same opening move as ${label} (${sig.opening}).`));
    if (other.transitions === sig.transitions) out.push(issue('error', 'variety', `Same run of scene changes as ${label} (${sig.transitions}).`));
    if (other.objects === sig.objects) out.push(issue('error', 'variety', `Same featured objects as ${label} (${sig.objects}).`));
    if (other.deck === sig.deck) out.push(issue('warn', 'variety', `Same desk furniture as ${label} (${sig.deck}).`));
    if (other.breakKind === sig.breakKind) out.push(issue('warn', 'variety', `Same pattern break as ${label} (${sig.breakKind}).`));
  };
  hard(before[0], 'the previous video');
  hard(after, 'the next video');
  before.slice(1, V.openingWindow).forEach((o, k) => {
    if (o.order === sig.order) out.push(issue('warn', 'variety', `The same scene order was used ${k + 2} videos ago.`));
  });
  return out;
}
