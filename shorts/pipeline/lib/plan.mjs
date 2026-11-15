// video.json: the storyboard. Which scenes, in which order, with which look.
// This file validates one storyboard and compares it with its neighbours so
// that no two videos in a row look alike.
import { ACCENTS, CAPTION_STYLES, GROUNDS, GROUND_ACCENTS, ICONS, MOTIONS, RULES, SCENES, SHAPES, TYPE_VOICES, cueCount } from '../../src/shared/spec.mjs';
import { figures, norm, tokens } from './text.mjs';

const issue = (level, rule, message) => ({ level, rule, message });

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

const SKIP_KEYS = new Set(['icon', 'tone', 'at', 'region', 'object', 'align', 'kind', 'id', 'from', 'to', 'lat', 'lon', 'highlight', 'value', 'total', 'filled', 'max', 'joiner', 'variant', 'prefix', 'suffix', 'accent']);

/** Every string that ends up on screen, for the fact checker. */
export function screenStrings(plan) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if (!SKIP_KEYS.has(key)) out.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  for (const sc of plan.scenes) {
    walk(sc.props || {}, 'props');
    const p = sc.props || {};
    if (sc.type === 'counter' && typeof p.value === 'number') {
      out.push(`${p.prefix || ''}${p.value.toFixed(p.decimals ?? 0)}${p.suffix ? ` ${p.suffix}` : ''}`);
    }
    if (sc.type === 'ratio' && typeof p.filled === 'number' && p.total > 0) out.push(`${+((p.filled / p.total) * 100).toFixed(1)}%`);
  }
  return out;
}

export const screenFigures = (plan, ignore = []) => screenStrings(plan).flatMap((s) => figures(s, { ignore }));

function collectIcons(v, out = []) {
  if (Array.isArray(v)) v.forEach((x) => collectIcons(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) (k === 'icon' && typeof x === 'string' ? out.push(x) : collectIcons(x, out));
  return out;
}

// A chart's geometry must agree with the numbers printed on it.
function checkSeries(sc, i, out) {
  const series = sc.props?.series;
  if (!Array.isArray(series)) return;
  const pairs = [];
  for (const s of series) {
    if (typeof s.value !== 'number' || !(s.value >= 0)) out.push(issue('error', 'chart', `Scene ${i + 1}: every series item needs a numeric "value".`));
    if (!s.label) out.push(issue('error', 'chart', `Scene ${i + 1}: every series item needs a "label".`));
    const f = s.display ? figures(s.display).find((x) => x.kind === 'digit') : null;
    if (f) pairs.push([s.value, f.value]);
  }
  for (let a = 1; a < pairs.length; a++) {
    const [v0, d0] = pairs[0];
    const [v1, d1] = pairs[a];
    if (v0 > 0 && d0 > 0 && Math.abs(v1 / v0 - d1 / d0) > 0.02 * Math.max(1, d1 / d0)) {
      out.push(issue('error', 'chart', `Scene ${i + 1}: bar sizes (${v0} vs ${v1}) do not match the printed figures. The drawing would mislead.`));
      break;
    }
  }
}

export function validatePlan(plan, script) {
  const out = [];
  const L = plan.look || {};
  if (!ACCENTS[L.accent]) out.push(issue('error', 'look', `look.accent must be one of: ${Object.keys(ACCENTS).join(', ')}.`));
  if (!GROUNDS[L.ground]) out.push(issue('error', 'look', `look.ground must be one of: ${Object.keys(GROUNDS).join(', ')}.`));
  if (ACCENTS[L.accent] && GROUNDS[L.ground] && !GROUND_ACCENTS[L.ground].includes(L.accent)) {
    out.push(issue('error', 'look', `Accent "${L.accent}" is not approved on ground "${L.ground}". Approved: ${GROUND_ACCENTS[L.ground].join(', ')}.`));
  }
  if (!TYPE_VOICES[L.type]) out.push(issue('error', 'look', `look.type must be one of: ${Object.keys(TYPE_VOICES).join(', ')}.`));
  if (!MOTIONS[L.motion]) out.push(issue('error', 'look', `look.motion must be one of: ${Object.keys(MOTIONS).join(', ')}.`));
  if (!CAPTION_STYLES.includes(L.captions)) out.push(issue('error', 'look', `look.captions must be one of: ${CAPTION_STYLES.join(', ')}.`));
  if (!(L.shape in SHAPES)) out.push(issue('error', 'look', `look.shape must be one of: ${Object.keys(SHAPES).join(', ')}.`));

  if (!Array.isArray(plan.scenes) || plan.scenes.length < 4) out.push(issue('error', 'scenes', 'A storyboard needs at least 4 scenes.'));
  const scenes = plan.scenes || [];
  scenes.forEach((sc, i) => {
    const spec = SCENES[sc.type];
    if (!spec) return out.push(issue('error', 'scenes', `Scene ${i + 1}: unknown type "${sc.type}". Types: ${Object.keys(SCENES).join(', ')}.`));
    if (!spec.variants.includes(sc.variant)) out.push(issue('error', 'scenes', `Scene ${i + 1} (${sc.type}): variant must be one of: ${spec.variants.join(', ')}.`));
    for (const key of spec.required) if (sc.props?.[key] === undefined) out.push(issue('error', 'scenes', `Scene ${i + 1} (${sc.type}): missing props.${key}.`));
    const need = cueCount(sc);
    if ((sc.beats || []).length > need - 1) out.push(issue('error', 'scenes', `Scene ${i + 1} (${sc.type}/${sc.variant}) has ${need} steps, so at most ${need - 1} beats; it has ${(sc.beats || []).length}.`));
    for (const ic of collectIcons(sc.props || {})) if (!ICONS.includes(ic)) out.push(issue('error', 'icons', `Scene ${i + 1}: unknown icon "${ic}".`));
    checkSeries(sc, i, out);
  });

  // No logos or mascots: plain text names and original icons only.
  const strings = screenStrings(plan);
  for (const s of strings) if (/[™®©]/.test(s)) out.push(issue('error', 'brand', `On-screen text "${s}" carries a trademark symbol. Plain text names only.`));
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
  if (scenes.length >= 5 && distinct.size < 4) out.push(issue('warn', 'scenes', `Only ${distinct.size} different scene types in ${scenes.length} scenes.`));

  const { anchors, issues } = script ? resolveAnchors(plan, script.words) : { anchors: [], issues: [] };
  out.push(...issues);
  return { issues: out, anchors };
}

/** What makes one video look different from another. */
export function signature(plan) {
  const L = plan.look || {};
  const first = plan.scenes?.[0] || {};
  return {
    order: (plan.scenes || []).map((s) => s.type).join('>'),
    detail: (plan.scenes || []).map((s) => `${s.type}/${s.variant}`).join('>'),
    accent: L.accent,
    opening: `${first.type}/${first.variant}`,
    ground: L.ground,
    look: [L.ground, L.type, L.motion, L.captions, L.shape].join('/'),
  };
}

/**
 * `before` = signatures of earlier videos, nearest first. `after` = the next video, if it exists.
 * Hard rules come from the brief: no two videos in a row share scene order,
 * colour accent or opening style. The windows add a margin of safety.
 */
export function checkVariety(sig, before = [], after = null) {
  const out = [];
  const V = RULES.variety;
  const hard = (other, label) => {
    if (!other) return;
    if (other.order === sig.order) out.push(issue('error', 'variety', `Same scene order as ${label} (${sig.order}).`));
    if (other.accent === sig.accent) out.push(issue('error', 'variety', `Same colour accent as ${label} (${sig.accent}).`));
    if (other.opening === sig.opening) out.push(issue('error', 'variety', `Same opening style as ${label} (${sig.opening}).`));
    if (other.look === sig.look) out.push(issue('error', 'variety', `Same overall look as ${label} (${sig.look}).`));
    if (other.ground === sig.ground) out.push(issue('warn', 'variety', `Same background as ${label} (${sig.ground}).`));
  };
  hard(before[0], 'the previous video');
  hard(after, 'the next video');
  before.slice(1, V.openingWindow).forEach((o, k) => {
    if (o.opening === sig.opening) out.push(issue('warn', 'variety', `Opening "${sig.opening}" was used ${k + 2} videos ago. Leave at least ${V.openingWindow} between repeats.`));
  });
  before.slice(1, V.accentWindow + 1).forEach((o, k) => {
    if (o.accent === sig.accent) out.push(issue('warn', 'variety', `Accent "${sig.accent}" was used ${k + 2} videos ago.`));
  });
  before.slice(1, V.lookWindow + 1).forEach((o, k) => {
    if (o.look === sig.look) out.push(issue('warn', 'variety', `The same look (${sig.look}) was used ${k + 2} videos ago.`));
    if (o.order === sig.order) out.push(issue('warn', 'variety', `The same scene order was used ${k + 2} videos ago.`));
  });
  return out;
}
