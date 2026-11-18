// What every video sounds like, decided from the same cue frames the pictures use, so a sound
// can never drift away from the thing that makes it. The mixer (pipeline/mix.py) only places
// what this module tells it to.
//
// Sound files are named <family>-<n>.wav in assets/sfx and <name>.ogg in assets/music, and every
// one of them has to be listed in assets/licences.md or the mixer refuses to use it.
import { MOTION } from './paper.mjs';
import { SCENES } from './spec.mjs';

/** How many variants each effect family has on disk (checked by the tests). */
export const SFX = {
  slam: 3, land: 4, fwip: 4, coin: 5, tick: 3, ding: 3, whip: 3, tear: 3, fold: 2, snip: 3,
  stamp: 3, pop: 3, swipe: 2, tape: 2, boom: 2, riser: 2, printer: 2, ching: 2,
};

/** Music beds, in rotation order. Neighbouring videos never share one. */
export const MUSIC = ['caper', 'ledger', 'market', 'stoop', 'counting', 'vault'];

/**
 * Levels, in dB. Effects are "felt more than heard": each sits well under the voice.
 * gain = how far below its own full level (-3 dBFS peak) an effect is played.
 * The mix is judged by measurement only, so these are deliberately conservative.
 */
export const LEVELS = {
  musicUnderVoiceDb: -17, // bed level relative to the voice while someone is speaking
  musicInGapsDb: -11, // bed level relative to the voice in pauses
  sfx: {
    slam: -8, boom: -9, stamp: -10, ching: -13, land: -14, snip: -13, whip: -15, tear: -15, fold: -14,
    ding: -17, coin: -16, fwip: -17, tape: -17, riser: -17, printer: -19, pop: -19, swipe: -20, tick: -21,
  },
};

// when two sounds want the same instant, the one earlier in this list wins
const PRIORITY = ['slam', 'boom', 'stamp', 'ching', 'ding', 'snip', 'tear', 'whip', 'fold', 'coin', 'land', 'printer', 'riser', 'tape', 'fwip', 'pop', 'swipe', 'tick'];
const MIN_GAP = 0.11; // seconds between two effects
/** A scene's first piece starts moving this many frames after the scene change, once the transition is under way. */
export const FIRST_CUE_DELAY = 3;

const num = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;

/** The music bed for a video: rotates with the video number unless the storyboard names one. */
export function pickMusic(id, plan = {}) {
  const want = plan.sound?.music;
  if (want === 'none') return null;
  if (want) {
    if (!MUSIC.includes(want)) throw new Error(`unknown music bed "${want}" (${MUSIC.join(', ')})`);
    return want;
  }
  return MUSIC[(Math.max(1, num(id)) - 1) % MUSIC.length];
}

/**
 * props: the Remotion input (scenes with absolute `from`, relative `cues`, `enter`, in frames).
 * Returns { music, events: [{ t, family, file, gainDb, pan }], seconds }.
 */
export function soundPlan(props, plan = {}) {
  const fps = props.fps || 30;
  const n = num(props.id);
  const raw = [];
  const push = (frame, family, extra = {}) => raw.push({ t: Math.max(0, frame) / fps, family, ...extra });

  props.scenes.forEach((sc, i) => {
    const spec = SCENES[sc.type];
    const families = spec ? spec.sounds(sc.props || {}, sc.variant) : [];
    if (i > 0 && sc.enter) push(sc.from, sc.enter);
    sc.cues.forEach((c, k) => {
      const family = families[k] || 'pop';
      // the sound belongs to the moment the piece touches down, not the moment it starts moving
      const frame = sc.from + c + (i > 0 && k === 0 ? FIRST_CUE_DELAY : 0) + MOTION.impact - 1;
      const next = k + 1 < sc.cues.length ? sc.cues[k + 1] : sc.duration;
      if (family === 'count') {
        // a counter running: ticks that thin out, then the figure lands
        for (let j = 0; j < 8; j++) push(frame + Math.round(j * 2 + (j * j) / 5), 'tick', { gainOffset: -j * 0.7, run: true });
        push(frame + 22, 'ding');
      } else if (family === 'coins') {
        // coins arriving one after another: a rising run of clinks, every other coin, never a rattle
        const span = Math.min(52, Math.max(14, next - c - 6));
        const count = Math.min(7, Math.max(3, Math.round(span / 7)));
        for (let j = 0; j < count; j++) push(frame + (j * span) / count, 'coin', { step: Math.min(4, Math.floor((j / count) * 5)), gainOffset: -2, run: true });
      } else if (family === 'snip') {
        push(frame + 1, 'snip');
        push(frame + 8, 'snip', { gainOffset: -2 });
      } else if (family === 'coin') push(frame, 'coin', { step: k });
      else push(frame, family);
    });
  });
  if (props.patternBreak) {
    push(props.patternBreak.frame - Math.round(0.52 * fps), 'riser');
    push(props.patternBreak.frame, 'boom');
  }

  // one sound at a time: keep the more important of any two that collide
  raw.sort((a, b) => a.t - b.t || PRIORITY.indexOf(a.family) - PRIORITY.indexOf(b.family));
  const kept = [];
  for (const e of raw) {
    const prev = kept[kept.length - 1];
    if (prev && e.t - prev.t < MIN_GAP && !(e.run && prev.run)) {
      if (PRIORITY.indexOf(e.family) < PRIORITY.indexOf(prev.family)) kept[kept.length - 1] = e;
      continue;
    }
    kept.push(e);
  }

  // rotate the variants: each video starts somewhere different, and no family repeats a file back to back
  const used = {};
  const events = kept.map((e, idx) => {
    const count = SFX[e.family];
    if (!count) throw new Error(`no effect family "${e.family}"`);
    const k = used[e.family] ?? 0;
    used[e.family] = k + 1;
    const variant = e.family === 'coin' ? Math.min(count - 1, e.step ?? k) : (n + k) % count;
    const centred = ['slam', 'boom', 'stamp', 'ding', 'ching'].includes(e.family);
    return {
      t: +e.t.toFixed(3),
      family: e.family,
      file: `sfx/${e.family}-${variant + 1}.wav`,
      gainDb: LEVELS.sfx[e.family] + (e.gainOffset || 0) + (plan.sound?.sfxGainDb || 0),
      pan: centred ? 0 : +(((idx % 2) * 2 - 1) * 0.28).toFixed(2),
    };
  });

  const music = pickMusic(props.id, plan);
  return {
    seconds: props.durationInFrames / fps,
    music: music ? `music/${music}.ogg` : null,
    musicName: music,
    musicUnderVoiceDb: LEVELS.musicUnderVoiceDb + (plan.sound?.musicGainDb || 0),
    musicInGapsDb: LEVELS.musicInGapsDb + (plan.sound?.musicGainDb || 0),
    events: plan.sound?.sfx === false ? [] : events.filter((e) => e.t < props.durationInFrames / fps),
  };
}
