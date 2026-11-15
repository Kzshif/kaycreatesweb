// Shared contract between the pipeline (Node) and the animation (Remotion).
// Plain JavaScript on purpose: both sides import this one file, so the rules
// the pipeline checks are exactly the rules the renderer draws with.

export const FRAME = {
  width: 1080,
  height: 1920,
  fps: 30,
};

// YouTube Shorts draws its buttons over the right edge and its title, channel
// and progress bar over the bottom. No text may enter those zones.
//   bottom 20%  -> y >= 1536      right 15% -> x >= 918
// The top strip is a softer rule (search / camera icons) that we also respect.
export const SAFE = {
  left: 48,
  top: 150,
  right: 918, // 1080 * 0.85
  bottom: 1536, // 1920 * 0.80
};
SAFE.width = SAFE.right - SAFE.left;
SAFE.height = SAFE.bottom - SAFE.top;

// Scene art lives in STAGE; subtitles live in CAPTION. They never overlap.
// Both stop 24px short of the right-hand button zone, so a headline that
// overshoots as it springs into place still cannot touch it.
export const STAGE = { left: 70, top: 170, right: 894, bottom: 1215 };
STAGE.width = STAGE.right - STAGE.left; // 824
STAGE.height = STAGE.bottom - STAGE.top; // 1045
export const CAPTION = { left: 70, top: 1250, right: 894, bottom: 1520 };
CAPTION.width = CAPTION.right - CAPTION.left; // 824
CAPTION.height = CAPTION.bottom - CAPTION.top; // 270

// ---------------------------------------------------------------- looks ----
// `dark` is the accent as used on dark grounds, `light` on light grounds.
// `onDark` / `onLight` is the text colour that sits on top of the accent.
export const ACCENTS = {
  lime: { dark: '#C8F031', light: '#4F7A00', onDark: '#0B0D12', onLight: '#FFFFFF' },
  coral: { dark: '#FF8576', light: '#D93A26', onDark: '#0B0D12', onLight: '#FFFFFF' },
  amber: { dark: '#FFB829', light: '#B56A00', onDark: '#0B0D12', onLight: '#FFFFFF' },
  mint: { dark: '#3DE8A9', light: '#08875C', onDark: '#0B0D12', onLight: '#FFFFFF' },
  sky: { dark: '#4DBDFF', light: '#0A6FBA', onDark: '#0B0D12', onLight: '#FFFFFF' },
  violet: { dark: '#AE9FFF', light: '#5A3DDB', onDark: '#0B0D12', onLight: '#FFFFFF' },
  pink: { dark: '#FF82BA', light: '#CC2672', onDark: '#0B0D12', onLight: '#FFFFFF' },
  gold: { dark: '#F5CE55', light: '#8F6B00', onDark: '#0B0D12', onLight: '#FFFFFF' },
  tangerine: { dark: '#FF9443', light: '#C24E00', onDark: '#0B0D12', onLight: '#FFFFFF' },
  teal: { dark: '#22D3D3', light: '#087F84', onDark: '#0B0D12', onLight: '#FFFFFF' },
  red: { dark: '#FF4352', light: '#C91C2B', onDark: '#FFFFFF', onLight: '#FFFFFF' },
  cobalt: { dark: '#4C78F5', light: '#1D4BD8', onDark: '#FFFFFF', onLight: '#FFFFFF' },
};

export const GROUNDS = {
  ink: { mode: 'dark', bg: '#0B0D12', bg2: '#151924', fg: '#F4F1EA', muted: '#9097A6', line: '#272C3A', card: '#161A25', n: ['#46484F', '#65676E', '#84878E'], pattern: 'glow' },
  paper: { mode: 'light', bg: '#F3EEE4', bg2: '#E8E0D0', fg: '#14161B', muted: '#655F52', line: '#D3C8B3', card: '#FFFDF8', n: ['#A9A59C', '#848078', '#646058'], pattern: 'halftone' },
  blueprint: { mode: 'dark', bg: '#0A1F44', bg2: '#102C5E', fg: '#EAF2FF', muted: '#93ABD9', line: '#1F427F', card: '#0F2A58', n: ['#3E5379', '#5C749B', '#7E96C0'], pattern: 'grid' },
  forest: { mode: 'dark', bg: '#0D2A22', bg2: '#153C30', fg: '#F3EFE3', muted: '#97B3A6', line: '#214D3F', card: '#12362B', n: ['#425C54', '#617D73', '#83A096'], pattern: 'blobs' },
  plum: { mode: 'dark', bg: '#24102E', bg2: '#341941', fg: '#F7EEF5', muted: '#B79DC2', line: '#48255D', card: '#2E153A', n: ['#5B4766', '#7B6687', '#9D87A9'], pattern: 'stripes' },
  chalk: { mode: 'light', bg: '#FAFAF6', bg2: '#EEEEE8', fg: '#101114', muted: '#63656C', line: '#D8D8D0', card: '#FFFFFF', n: ['#ABABA5', '#868681', '#666662'], pattern: 'dots' },
  ledger: { mode: 'light', bg: '#E9F2E4', bg2: '#DBE9D5', fg: '#122016', muted: '#56695A', line: '#BBD1B8', card: '#F7FBF4', n: ['#A2A99E', '#7B8277', '#5C6358'], pattern: 'rules' },
  graphite: { mode: 'dark', bg: '#1A1B1E', bg2: '#27292E', fg: '#F2F2EE', muted: '#9C9EA6', line: '#35373E', card: '#222428', n: ['#4E5056', '#6D6F76', '#8E9097'], pattern: 'rings' },
};

// Which accents each ground may wear. Same-hue pairs (teal on forest) and muddy
// ones (gold on paper) are left out: every listed pair was checked for contrast.
export const GROUND_ACCENTS = {
  ink: ['lime', 'coral', 'amber', 'mint', 'sky', 'violet', 'pink', 'gold', 'tangerine', 'teal', 'red', 'cobalt'],
  graphite: ['lime', 'coral', 'amber', 'mint', 'sky', 'violet', 'pink', 'gold', 'tangerine', 'teal', 'red', 'cobalt'],
  paper: ['coral', 'red', 'cobalt', 'violet', 'pink', 'teal', 'mint', 'sky', 'tangerine'],
  chalk: ['coral', 'red', 'cobalt', 'violet', 'pink', 'teal', 'mint', 'sky', 'tangerine'],
  ledger: ['coral', 'red', 'cobalt', 'violet', 'pink', 'tangerine'],
  blueprint: ['lime', 'amber', 'gold', 'coral', 'pink', 'tangerine', 'mint', 'red'],
  forest: ['amber', 'gold', 'coral', 'pink', 'tangerine', 'sky', 'violet'],
  plum: ['lime', 'amber', 'gold', 'mint', 'teal', 'tangerine', 'coral', 'sky'],
};

// Shape language: corner radius used by cards, bars, pills and frames.
export const SHAPES = { sharp: 0, soft: 20, round: 44 };

// Type voices: a display face for headlines and figures, a text face for labels.
export const TYPE_VOICES = {
  grotesk: { display: 'Archivo Black', displayWeight: 400, text: 'Archivo', upper: true, tracking: -0.02, numeric: 'Archivo Black', label: 'Archivo', widthFactor: 0.62 },
  editorial: { display: 'DM Serif Display', displayWeight: 400, text: 'DM Sans', upper: false, tracking: -0.01, numeric: 'DM Serif Display', label: 'DM Sans', widthFactor: 0.5 },
  tech: { display: 'Space Grotesk', displayWeight: 700, text: 'Space Grotesk', upper: false, tracking: -0.03, numeric: 'Space Grotesk', label: 'JetBrains Mono', widthFactor: 0.55 },
  poster: { display: 'Anton', displayWeight: 400, text: 'Inter', upper: true, tracking: 0.005, numeric: 'Anton', label: 'Inter', widthFactor: 0.43 },
  quirky: { display: 'Bricolage Grotesque', displayWeight: 800, text: 'Bricolage Grotesque', upper: false, tracking: -0.03, numeric: 'Bricolage Grotesque', label: 'JetBrains Mono', widthFactor: 0.54 },
  soft: { display: 'Fraunces', displayWeight: 900, text: 'Inter', upper: false, tracking: -0.03, numeric: 'Fraunces', label: 'Inter', widthFactor: 0.56 },
  wide: { display: 'Syne', displayWeight: 800, text: 'Inter', upper: true, tracking: -0.01, numeric: 'Syne', label: 'JetBrains Mono', widthFactor: 0.68 },
};

// Motion feels change how everything enters, settles and cuts.
export const MOTIONS = {
  snap: { spring: { damping: 15, stiffness: 240, mass: 0.6 }, enter: 'pop', cut: 'flash', travel: 46 },
  glide: { spring: { damping: 200, stiffness: 110, mass: 0.9 }, enter: 'rise', cut: 'fade', travel: 70 },
  bounce: { spring: { damping: 9.5, stiffness: 170, mass: 0.7 }, enter: 'drop', cut: 'zoom', travel: 90 },
  tick: { spring: { damping: 26, stiffness: 320, mass: 0.5 }, enter: 'wipe', cut: 'shutter', travel: 0 },
};

export const CAPTION_STYLES = ['pop', 'box', 'underline', 'fill'];

// --------------------------------------------------------------- scenes ----
// Every scene type, its variants, and how many reveal steps ("cues") it has.
// A cue is one visible change: a bar growing, a node appearing, a figure
// landing. The pipeline uses these counts to prove something changes on
// screen at least every three seconds.
const len = (a) => (Array.isArray(a) ? a.length : 0);

export const SCENES = {
  hook: {
    label: 'kinetic hook text',
    variants: ['slam', 'stamp', 'stack', 'highlighter', 'redacted', 'spotlight'],
    // step 0: the claim, on frame 0. step 1: the "punch" on the key word, timed to the voice. step 2: the sub-line.
    cues: (p) => 2 + (p.sub ? 1 : 0),
    required: ['lines'],
  },
  kinetic: {
    label: 'kinetic text',
    variants: ['cascade', 'mask', 'scale', 'ticker'],
    cues: (p) => Math.max(1, len(p.lines)),
    required: ['lines'],
  },
  flow: {
    label: 'money-flow diagram',
    variants: ['river', 'chain'],
    cues: (p, v) => (v === 'river' ? 1 + len(p.splits) : len(p.nodes)),
    required: [],
  },
  chart: {
    label: 'animated chart',
    // No donut on purpose: for part-to-whole a segmented bar reads faster and
    // compares more honestly (data-viz skill, "choosing a form").
    variants: ['bars', 'hbars', 'line', 'segmented', 'meter'],
    cues: (p, v) => (v === 'line' ? 2 : v === 'meter' ? 2 + (p.note ? 1 : 0) : Math.max(1, len(p.series))),
    required: ['series'],
  },
  counter: {
    label: 'counter',
    variants: ['odometer', 'countup', 'slot'],
    cues: (p) => 1 + (p.sub ? 1 : 0) + (p.also ? 1 : 0),
    required: ['value', 'label'],
  },
  breakdown: {
    label: 'price breakdown',
    variants: ['stack', 'receipt', 'coins'],
    cues: (p) => len(p.items) + (p.total ? 1 : 0),
    required: ['items'],
  },
  split: {
    label: 'before / after split',
    variants: ['halves', 'cards', 'slider'],
    cues: (p) => 2 + (p.verdict ? 1 : 0),
    required: ['a', 'b'],
  },
  map: {
    label: 'map',
    variants: ['dots', 'outline'],
    cues: (p) => 1 + (len(p.pins) || len(p.highlight) ? 1 : 0) + (p.stat ? 1 : 0),
    required: ['region'],
  },
  timeline: {
    label: 'timeline',
    variants: ['rail', 'steps'],
    cues: (p) => Math.max(1, len(p.events)),
    required: ['events'],
  },
  mockup: {
    label: 'product mockup',
    variants: ['card', 'phone', 'receipt', 'storefront', 'box', 'tag'],
    cues: (p) => 1 + len(p.callouts),
    required: [],
  },
  icons: {
    label: 'icon story',
    variants: ['chain', 'equation', 'grid'],
    cues: (p) => len(p.items) + (p.result ? 1 : 0),
    required: ['items'],
  },
  ratio: {
    label: 'unit chart',
    variants: ['grid', 'row'],
    cues: (p) => 2 + (p.note ? 1 : 0),
    required: ['total', 'filled', 'label'],
  },
  versus: {
    label: 'size comparison',
    variants: ['circles', 'towers'],
    cues: (p) => 2 + (p.note ? 1 : 0),
    required: ['a', 'b'],
  },
};

export const SCENE_TYPES = Object.keys(SCENES);

export const cueCount = (scene) => {
  const spec = SCENES[scene.type];
  if (!spec) return 1;
  return Math.max(1, spec.cues(scene.props || {}, scene.variant));
};

// Original icon names the scenes can draw (see src/icons). No brand marks.
export const ICONS = [
  'cart', 'card', 'coin', 'cash', 'warehouse', 'store', 'burger', 'fries', 'house', 'key',
  'phone', 'search', 'cloud', 'server', 'box', 'cup', 'gift', 'person', 'people', 'bank',
  'tag', 'receipt', 'truck', 'factory', 'globe', 'chart', 'percent', 'clock', 'lock', 'bolt',
  'plane', 'car', 'film', 'music', 'gamepad', 'printer', 'drop', 'ticket', 'crown', 'handshake',
  'building', 'wallet', 'safe', 'megaphone', 'eye', 'bottle', 'shirt', 'pill', 'wifi', 'star',
];

// --------------------------------------------------------------- rules -----
export const RULES = {
  script: { minWords: 70, maxWords: 110, minSeconds: 25, maxSeconds: 40, hookMaxWords: 9, maxSentenceWords: 18, avgSentenceWords: 12 },
  // "A visual change every 2-3 seconds": no stretch longer than this without a cue.
  cadence: { maxGapSeconds: 3.0, targetGapSeconds: 2.5 },
  // How far back the variety check looks beyond the hard "previous video" rule.
  variety: { openingWindow: 4, accentWindow: 2, lookWindow: 3 },
};
