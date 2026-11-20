// Paper Money: the channel's fixed visual identity, as data. Read by the animation, the pipeline
// and the tests, so the colours and zones cannot drift apart. See identity/paper-money.md.

export const FRAME = { width: 1080, height: 1920, fps: 30 };

// ------------------------------------------------------------------ colour
export const CREAM = '#F4EBDD';
export const INK = '#15130F';
export const ACCENTS = {
  green: { hex: '#1F6F54', name: 'Banknote green' },
  vermilion: { hex: '#E8452C', name: 'Vermilion' },
  cobalt: { hex: '#2B4EFF', name: 'Cobalt' },
  gold: { hex: '#D9A441', name: 'Gold' },
};
/** One accent per video, in this order. */
export const ACCENT_ORDER = ['green', 'vermilion', 'cobalt', 'gold'];
/** Every tenth video or so is printed in negative: ink desk, cream type. */
export const INVERT_EVERY = 10;

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
/** `a` mixed into `b`: amount 1 is all `a`. */
export const mix = (a, b, amount) => hex(rgb(a).map((v, i) => v * amount + rgb(b)[i] * (1 - amount)));
export const rgba = (h, alpha) => `rgba(${rgb(h).join(', ')}, ${alpha})`;
export function luminance(h) {
  const [r, g, b] = rgb(h).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Papers. All of them are cream's own hue, lighter or deeper: no new colour enters the drawer.
export const UMBER = '#8A6A2E'; // cream, deepened: only ever mixed into the papers below and into shadows
export const BRIGHT = '#FBF8F1'; // receipts, caption strips, the core of a torn edge
export const CARD = mix(UMBER, CREAM, 0.09); // a sheet slightly deeper than the desk
export const MANILA = mix(UMBER, CREAM, 0.2); // backing sheets, tape
export const KRAFT = mix(UMBER, CREAM, 0.42); // the deepest paper: wood, potato, cardboard
export const INK_DESK = '#191612'; // the ink desk of the inverted version, a breath lighter than type ink
export const SHADOW = '#2E200E'; // warm, multiplied

const HL_MIN = 7.5; // ink on the highlighter tint must stay this readable

/**
 * Every colour a video needs, from its accent and whether it is the inverted version.
 * ground / type are the desk and what is written on it; papers stay light in both versions.
 */
export function tokens(accent = 'green', inverted = false, pattern = '', motion = '') {
  const a = ACCENTS[accent];
  if (!a) throw new Error(`unknown accent "${accent}" (${ACCENT_ORDER.join(', ')})`);
  const ground = inverted ? INK_DESK : CREAM;
  const type = inverted ? CREAM : INK;
  // the strongest highlighter that keeps ink readable on top of it
  let hl = mix(a.hex, BRIGHT, 0.3);
  for (let amount = 0.92; amount >= 0.3; amount -= 0.02) {
    const c = mix(a.hex, BRIGHT, amount);
    if (contrast(INK, c) >= HL_MIN) {
      hl = c;
      break;
    }
  }
  const onAccent = contrast(INK, a.hex) >= contrast(CREAM, a.hex) ? INK : CREAM;
  return {
    name: accent,
    inverted,
    ground,
    type,
    typeSoft: inverted ? mix(CREAM, INK_DESK, 0.72) : mix(INK, CREAM, 0.72),
    ink: INK,
    cream: CREAM,
    bright: BRIGHT,
    card: CARD,
    manila: MANILA,
    accent: a.hex,
    accentDeep: mix(INK, a.hex, 0.42),
    accentWash: mix(a.hex, CREAM, 0.2),
    hl,
    onAccent,
    /** large numerals may be set in the accent only where it reads against the desk */
    numeral: contrast(a.hex, ground) >= 3 ? a.hex : type,
    /** stamp ink: the accent where it reads, otherwise the type colour */
    stamp: contrast(a.hex, ground) >= 3 ? a.hex : type,
    shadow: SHADOW,
    /** what is printed faintly on the desk: grid, ledger, blueprint, grooves, snow, studs, stripes, rings, pitch, pixels */
    pattern: String(pattern || ''),
    /** how lines of type arrive: rise, slide, pop, drop, wipe */
    motion: String(motion || ''),
  };
}

/** The accent and version of video number n (1-based), unless the storyboard says otherwise. */
export function lookFor(n) {
  const i = Math.max(1, n) - 1;
  return { accent: ACCENT_ORDER[i % ACCENT_ORDER.length], inverted: Math.max(1, n) % INVERT_EVERY === 0 };
}

// ------------------------------------------------------------------- frame
/** Text stays inside SAFE: YouTube draws over the top 11.5%, the bottom 20% and the right 15%. */
export const SAFE = { left: 64, top: 222, right: 918, bottom: 1536 };
/**
 * The right-hand limit for text as laid out. The camera drifts up to 16px and zooms up to 2.8% about
 * the centre, which can carry text at x=890 out to 918, the edge of YouTube's buttons.
 */
export const TEXT_RIGHT = 890;
/** The hero area. Paper may bleed past it; text may not. */
export const STAGE = { left: 76, top: 236, right: 906, bottom: 1000 };
/** Captions: one strip of bright paper inside the centre third (640-1280). */
export const CAPTION = { left: 96, right: 886, centre: 1152, top: 1030, bottom: 1274, thirdTop: 640, thirdBottom: 1280 };
/** Below the captions: source slips and small props. */
export const DECK = { left: 76, top: 1300, right: 906, bottom: 1524 };

// -------------------------------------------------------------------- type
export const TYPE = {
  headline: { family: 'Bricolage Grotesque Variable', weight: 800, width: 87, opsz: 96, tracking: -0.035, leading: 0.92 },
  numeral: { family: 'Fraunces Variable', weight: 900, opsz: 144, soft: 100, wonk: 1, tracking: -0.02 },
  label: { family: 'DM Mono', weight: 500, tracking: 0.14 },
  captionSize: 84, // px at 1080 wide; shrinks to fit, never below captionMin
  captionMin: 60,
  labelMin: 24,
};
export const FORBIDDEN_FONTS = ['Inter', 'Roboto', 'Arial', 'Montserrat', 'Poppins'];

// ------------------------------------------------------------------ motion
export const MOTION = {
  /** paper moves on twos: 12 steps a second */
  stepsPerSecond: 12,
  /** frames from the start of an arrival to the moment it touches down (the sound lands here) */
  impact: 5,
  /** the opening hit must be down within half a second */
  hookImpactBy: 12,
};
