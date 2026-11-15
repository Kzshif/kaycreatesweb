// What every video sounds like, decided from the same cue frames the pictures use, so a sound
// can never drift away from the thing that makes it. The mixer (pipeline/mix.py) only places
// what this module tells it to.
//
// Sound files are named <family>-<n>.wav in assets/sfx and <name>.ogg in assets/music, and every
// one of them has to be listed in assets/licences.md or the mixer refuses to use it.

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

// Which sound each reveal step of a scene makes. `cues` names steps in order; `each` covers the
// rest; `last` replaces the final step. 'count' is a run of ticks ending in a soft struck tone.
export const SCENE_SOUNDS = {
  hook: { cues: ['slam', 'stamp', 'pop'] },
  kinetic: { each: 'fwip' },
  counter: { cues: ['count', 'pop', 'pop'] },
  chart: { each: 'coin', last: 'ding' },
  flow: { each: 'fwip', last: 'coin' },
  breakdown: { each: 'land', last: 'ching' },
  split: { cues: ['land', 'land', 'stamp'] },
  map: { cues: ['fwip', 'pop', 'ding'] },
  timeline: { each: 'tick' },
  mockup: { cues: ['land'], each: 'pop' },
  icons: { each: 'pop', last: 'ding' },
  ratio: { cues: ['fwip', 'coin', 'pop'] },
  versus: { cues: ['land', 'land', 'stamp'] },
};

/** The sound of each kind of scene change. */
export const TRANSITION_SOUNDS = { whip: 'whip', tear: 'tear', fold: 'fold' };
const TRANSITION_ORDER = ['whip', 'tear', 'fold'];

// when two sounds want the same instant, the one earlier in this list wins
const PRIORITY = ['slam', 'boom', 'stamp', 'ching', 'ding', 'snip', 'tear', 'whip', 'fold', 'coin', 'land', 'printer', 'riser', 'tape', 'fwip', 'pop', 'swipe', 'tick'];
const MIN_GAP = 0.11; // seconds between two effects
const FIRST_CUE_DELAY = 5; // frames: a scene's first object lands just after the transition into it

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
 * props: the Remotion input (scenes with absolute `from` and relative `cues`, in frames).
 * Returns { music, events: [{ t, family, variant, file, gainDb, pan }], seconds }.
 */
export function soundPlan(props, plan = {}) {
  const fps = props.fps || 30;
  const n = num(props.id);
  const raw = [];
  const push = (frame, family, extra = {}) => raw.push({ t: Math.max(0, frame) / fps, family, ...extra });

  props.scenes.forEach((sc, i) => {
    const map = sc.sounds || SCENE_SOUNDS[sc.type] || { each: 'pop' };
    if (i > 0) push(sc.from, TRANSITION_SOUNDS[sc.transition] || TRANSITION_ORDER[(n + i) % TRANSITION_ORDER.length], { transition: true });
    sc.cues.forEach((c, k) => {
      const isLast = k === sc.cues.length - 1 && sc.cues.length > 1;
      const family = (map.cues && map.cues[k]) || (isLast && map.last) || map.each || 'pop';
      const frame = sc.from + c + (i > 0 && k === 0 ? FIRST_CUE_DELAY : 0);
      if (family === 'count') {
        // a counter running: ticks that thin out, then the figure lands
        for (let j = 0; j < 8; j++) push(frame + Math.round(j * 2 + (j * j) / 5), 'tick', { gainOffset: -j * 0.7, run: true });
        push(frame + 24, 'ding');
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

  const music = plan.sound?.sfx === false ? pickMusic(props.id, plan) : pickMusic(props.id, plan);
  return {
    seconds: props.durationInFrames / fps,
    music: music ? `music/${music}.ogg` : null,
    musicName: music,
    musicUnderVoiceDb: LEVELS.musicUnderVoiceDb + (plan.sound?.musicGainDb || 0),
    musicInGapsDb: LEVELS.musicInGapsDb + (plan.sound?.musicGainDb || 0),
    events: plan.sound?.sfx === false ? [] : events,
  };
}
