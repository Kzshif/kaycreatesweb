// Shared contract between the pipeline (Node) and the animation (Remotion): the scene types a
// storyboard can use, what each one needs, how many reveal steps it has and what each step
// sounds like. Plain JavaScript on purpose: both sides read this one file. The look itself
// (colours, zones, type) is in paper.mjs.
export { CAPTION, DECK, FRAME, SAFE, STAGE } from './paper.mjs';

const len = (a) => (Array.isArray(a) ? a.length : 0);

// ---------------------------------------------------------------- rules
export const RULES = {
  // 40-55 seconds: long enough for the hook, the mechanism and a turn, still well under a minute.
  script: { minWords: 110, maxWords: 165, minSeconds: 40, maxSeconds: 55, hardMaxSeconds: 59, hookMaxWords: 9, maxSentenceWords: 18, avgSentenceWords: 12 },
  // "A visual change every 2-3 seconds": no stretch longer than this without a cue.
  cadence: { maxGapSeconds: 3.0, targetGapSeconds: 2.5 },
  // How far back the variety check looks beyond the hard "previous video" rule.
  variety: { openingWindow: 3, hookWindow: 2 },
  // The pattern break lands near the middle of the video.
  breakWindow: [0.35, 0.68],
  minScenes: 8,
};

/** How a hook earns the first two seconds. Each script names its style; neighbours must differ. */
export const HOOK_STYLES = {
  number: 'opens on the figure itself',
  contradiction: 'says the opposite of what people assume',
  reframe: 'the company is really a different kind of business',
  stakes: 'what it takes from, or pays to, one person',
  hidden: 'something in plain sight that nobody notices',
};

/** Scene changes are physical: a page tears away, the camera whips across the desk, the page folds over. */
export const TRANSITIONS = ['tear', 'whip', 'fold'];
export const TRANSITION_FRAMES = { tear: 11, whip: 7, fold: 9 };
/** One pattern break near the middle: the desk flips to negative, the camera punches in, or everything holds still. */
export const BREAKS = ['invert', 'zoom', 'freeze'];
export const BREAK_FRAMES = { invert: 8, zoom: 14, freeze: 10 };
/** Cut-paper products a storyboard can put on the desk (all original, no logos). */
export const PRODUCTS = ['card', 'trolley', 'box', 'store', 'fries', 'burger', 'plot', 'phone', 'controller', 'bar', 'ticket', 'record', 'tradingcard', 'sprout', 'can', 'rocket'];
/** What lies in the lower part of the desk, under the captions. */
export const DECKS = ['pencil', 'coins', 'inkpad', 'scissors', 'clips'];

// --------------------------------------------------------------- scenes
// cues(p, v): how many reveal steps the scene has. sounds(p, v): the sound of each step, in order.
// 'count' is a run of ticks ending in a struck tone; 'coins' is a rising run of clinks.
export const SCENES = {
  slam: {
    label: 'the opening hit: the key number or object lands before the first word is out',
    variants: ['number', 'object', 'stamp'],
    cues: (p, v) => (v === 'number' ? 2 + (p.unit ? 1 : 0) + (len(p.lines) ? 1 : 0) : v === 'object' ? 1 + (len(p.lines) > 1 ? 1 : 0) + (p.tag ? 1 : 0) : 2 + (p.sub ? 1 : 0)),
    required: (v) => (v === 'number' ? ['figure'] : v === 'object' ? ['product', 'lines'] : ['lines', 'stamp']),
    sounds: (p, v) => (v === 'number' ? ['slam', ...(p.unit ? ['land'] : []), ...(len(p.lines) ? ['fwip'] : []), 'coin'] : v === 'object' ? ['slam', ...(len(p.lines) > 1 ? ['fwip'] : []), ...(p.tag ? ['pop'] : [])] : ['slam', 'stamp', ...(p.sub ? ['pop'] : [])]),
  },
  count: {
    label: 'a figure counting up',
    variants: ['rain', 'pile'],
    cues: (p) => 1 + (p.line ? 1 : 0) + (p.sub ? 1 : 0),
    required: () => ['amount'],
    sounds: (p) => ['count', ...(p.line ? ['fwip'] : []), ...(p.sub ? ['pop'] : [])],
  },
  stacks: {
    label: 'coin-stack chart: the channel\'s bar chart',
    variants: ['side', 'trio'],
    cues: (p) => len(p.items) + (p.note ? 1 : 0),
    required: () => ['unit', 'items'],
    sounds: (p) => [...Array.from({ length: len(p.items) }, () => 'coins'), ...(p.note ? ['pop'] : [])],
  },
  cut: {
    label: 'a note cut with scissors: the channel\'s pie chart',
    variants: ['right', 'left'],
    cues: (p) => 2 + (p.note ? 1 : 0),
    required: () => ['title', 'share', 'label'],
    sounds: (p) => ['land', 'snip', ...(p.note ? ['pop'] : [])],
  },
  receipt: {
    label: 'a receipt that prints its lines',
    variants: ['roll', 'clip'],
    cues: (p) => 1 + len(p.rows) + (len(p.rows) && p.rows.some((r) => r.mark) ? 1 : 0),
    required: () => ['title', 'rows'],
    sounds: (p) => ['printer', ...Array.from({ length: len(p.rows) }, () => 'tick'), ...(len(p.rows) && p.rows.some((r) => r.mark) ? ['swipe'] : [])],
  },
  tag: {
    label: 'a price tag that swings in',
    variants: ['pin', 'tape'],
    cues: (p) => 1 + (len(p.lines) ? 1 : 0) + (p.note ? 1 : 0),
    required: () => ['label', 'price'],
    sounds: (p) => ['fwip', ...(len(p.lines) ? ['land'] : []), ...(p.note ? ['pop'] : [])],
  },
  product: {
    label: 'a cut-paper product with labels',
    variants: ['hero', 'pair'],
    cues: (p) => 1 + len(p.callouts),
    required: () => ['product'],
    sounds: (p) => ['land', ...Array.from({ length: len(p.callouts) }, () => 'pop')],
  },
  stamp: {
    label: 'a verdict: a figure or line, then the stamp comes down',
    variants: ['over', 'under'],
    cues: (p) => 2 + (p.sub ? 1 : 0),
    required: () => ['stamp'],
    sounds: (p) => [p.figure ? 'count' : 'land', ...(p.sub ? ['pop'] : []), 'stamp'],
  },
  flow: {
    label: 'money moving from one name to another',
    variants: ['arc', 'drop'],
    cues: (p) => 2 + (p.note ? 1 : 0),
    required: () => ['from', 'to'],
    sounds: (p) => ['land', 'coins', ...(p.note ? ['pop'] : [])],
  },
  split: {
    label: 'two cards side by side',
    variants: ['cards', 'tilt'],
    cues: (p) => 2 + (p.verdict ? 1 : 0),
    required: () => ['a', 'b'],
    sounds: (p) => ['land', 'land', ...(p.verdict ? ['ding'] : [])],
  },
  words: {
    label: 'headline lines, one at a time, with a marker pen',
    variants: ['stack', 'ladder'],
    cues: (p) => Math.max(1, len(p.lines)),
    required: () => ['lines'],
    sounds: (p) => Array.from({ length: Math.max(1, len(p.lines)) }, (_, i) => (len(p.mark) && i === len(p.lines) - 1 ? 'swipe' : 'fwip')),
  },
  grid: {
    label: 'so many out of so many, as a tray of coins',
    variants: ['tray', 'rows'],
    cues: (p) => 2 + (p.label ? 1 : 0),
    required: () => ['of', 'filled', 'figure'],
    sounds: (p) => ['fwip', 'coins', ...(p.label ? ['pop'] : [])],
  },
};

export const SCENE_TYPES = Object.keys(SCENES);

export const cueCount = (scene) => {
  const spec = SCENES[scene.type];
  if (!spec) return 1;
  return Math.max(1, spec.cues(scene.props || {}, scene.variant));
};

/** The objects a scene puts on the desk, for the "featured objects must differ" rule. */
export const sceneObjects = (scene) => {
  const p = scene.props || {};
  const out = [];
  const own = { stacks: 'coin stacks', cut: 'cut note', receipt: 'receipt', tag: 'price tag', stamp: 'stamp', grid: 'coin tray', flow: 'coin flow' }[scene.type];
  if (own) out.push(own);
  if (scene.type === 'slam' && scene.variant === 'stamp') out.push('stamp');
  for (const x of [p.product, p.from?.product, p.to?.product]) if (x) out.push(x);
  if (p.tag) out.push('price tag');
  return out;
};
