#!/usr/bin/env node
/* Makes every sound the channel uses, from code. No samples, no recordings, nothing downloaded.

     node pipeline/make_audio_assets.cjs            all effects and all music beds
     node pipeline/make_audio_assets.cjs sfx        effects only
     node pipeline/make_audio_assets.cjs music      music beds only

   Effects go to assets/sfx/<family>-<n>.wav (mono, 48 kHz, 16-bit, peak -3 dBFS).
   Music beds go to assets/music/<name>.ogg (stereo, 48 kHz, Opus), all mastered to the same
   loudness so the mixer can treat them alike.

   The synthesis primitives (oscillators, filters, a few instruments, the genre patterns) come from
   the animation-studio plugin's engine, which is a synthesiser: its output here is new audio that
   belongs to this channel. Every arrangement and every effect recipe below was written for this
   channel. The engine is only needed to MAKE the files; the pipeline itself just reads assets/.
   Set SHORTS_SYNTH_ENGINE to the engine folder if it is not found automatically. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_SFX = path.join(ROOT, 'assets', 'sfx');
const OUT_MUSIC = path.join(ROOT, 'assets', 'music');

function findEngine() {
  if (process.env.SHORTS_SYNTH_ENGINE) return process.env.SHORTS_SYNTH_ENGINE;
  const base = path.join(process.env.HOME || '/root', '.claude', 'plugins');
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const p = path.join(dir, e.name);
      if (e.name === 'animation-studio' && fs.existsSync(path.join(p, 'engine', 'audio', 'dsp.js'))) return path.join(p, 'engine');
      if (p.split(path.sep).length - base.split(path.sep).length < 6) stack.push(p);
    }
  }
  throw new Error('animation-studio engine not found: set SHORTS_SYNTH_ENGINE to its engine/ folder');
}

const ENGINE = findEngine();
const { SR, TAU, Bus, rng, Pink, SVF, OnePole, reverb } = require(path.join(ENGINE, 'audio', 'dsp.js'));
const I = require(path.join(ENGINE, 'audio', 'instruments.js'));
const MIX = require(path.join(ENGINE, 'audio', 'mix.js'));
const Genre = require(path.join(ENGINE, 'audio', 'genres.js'));
const MUSIC = require(path.join(ENGINE, 'music.js'));
const { m } = MUSIC;

// ---------------------------------------------------------------- helpers
const buf = (sec) => new Float32Array(Math.max(1, Math.ceil(sec * SR)));
function add(out, src, t = 0, gain = 1) {
  const s = Math.round(t * SR);
  for (let i = 0; i < src.length && s + i < out.length; i++) if (s + i >= 0) out[s + i] += src[i] * gain;
  return out;
}
function env(out, fn) { for (let i = 0; i < out.length; i++) out[i] *= fn(i / SR, i / out.length); return out; }
function fade(out, a = 0.002, r = 0.01) {
  const na = Math.round(a * SR), nr = Math.round(r * SR);
  for (let i = 0; i < na && i < out.length; i++) out[i] *= i / na;
  for (let i = 0; i < nr && i < out.length; i++) out[out.length - 1 - i] *= i / nr;
  return out;
}
// every layer of an impact is brought to the same peak first, so the gains below are real balances
function peak(out) { let p = 0; for (const v of out) p = Math.max(p, Math.abs(v)); return p; }
function norm(out, to = 0.708) { const p = peak(out) || 1; for (let i = 0; i < out.length; i++) out[i] *= to / p; return out; }
// every layer of an impact is brought to the same peak first, so the gains below are real balances
const N = (x) => norm(x, 1);
function trimTail(out, floor = 0.0008) {
  let end = out.length - 1;
  while (end > 0 && Math.abs(out[end]) < floor) end--;
  return out.slice(0, Math.min(out.length, end + Math.round(0.01 * SR)));
}
function sine(freq, decay, len = decay * 5, gain = 1, attack = 0.001) {
  const o = buf(len);
  for (let i = 0; i < o.length; i++) { const t = i / SR; o[i] = Math.sin(TAU * freq * t) * Math.exp(-t / decay) * Math.min(1, t / attack) * gain; }
  return o;
}
// a pitched knock that glides down: the body of an impact, placed where a phone speaker can play it
function knock(f0, f1, decay, glide = 0.03) {
  const o = buf(decay * 5);
  let ph = 0;
  for (let i = 0; i < o.length; i++) { const t = i / SR; ph += (f1 + (f0 - f1) * Math.exp(-t / glide)) / SR; o[i] = Math.sin(TAU * ph) * Math.exp(-t / decay) * Math.min(1, t / 0.0008); }
  return o;
}
// filtered noise burst: kind 'lp' | 'hp' | 'bp'
function burst(len, { kind = 'bp', f = 2000, f1 = null, q = 1, decay = 0.02, seed = 1, attack = 0.0008, pink = false } = {}) {
  const o = buf(len), w = rng(seed), p = new Pink(seed), sv = new SVF(), op = new OnePole();
  for (let i = 0; i < o.length; i++) {
    const t = i / SR, x = i / o.length;
    const fc = f1 ? f * Math.pow(f1 / f, x) : f;
    const n = pink ? p.next() * 3 : w();
    const y = kind === 'lp' ? op.lp(n, fc) : kind === 'hp' ? sv.hp(n, fc, q) : sv.bp(n, fc, q);
    o[i] = y * Math.exp(-t / decay) * Math.min(1, t / attack);
  }
  return o;
}
function partials(base, ratios, decays, gains, len) {
  const o = buf(len);
  for (let k = 0; k < ratios.length; k++) add(o, sine(base * ratios[k], decays[k], len, gains[k], 0.0012));
  return o;
}
function writeWav16(file, mono) {
  const n = mono.length, data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(mono[i] * 32767))), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

// ---------------------------------------------------------------- effects
// Each family lists the variants the mixer rotates through. Everything is dry and short: these
// sit under a voice, so they are felt more than heard.
const SFX = {
  // the opening hit: the key number or object landing on the desk. Phone speakers play almost
  // nothing below 200 Hz, so the hit is built in three layers: a mid knock and a paper slap that a
  // phone can play, and a low body under them for headphones.
  slam: [[430, 300], [480, 335], [390, 270]].map(([a, b], k) => () => {
    const o = buf(0.42);
    add(o, N(knock(a, b, 0.034, 0.02)), 0, 0.8);
    add(o, N(knock(a * 0.55, b * 0.5, 0.06)), 0, 0.6);
    add(o, N(knock(a * 0.28, b * 0.24, 0.085)), 0, 0.3);
    add(o, N(burst(0.2, { kind: 'lp', f: 900, decay: 0.04, seed: 30 + k })), 0, 0.55);
    add(o, N(burst(0.1, { kind: 'hp', f: 1000, q: 0.7, decay: 0.018, seed: 40 + k })), 0, 0.5);
    add(o, N(burst(0.07, { kind: 'bp', f: 2400, q: 0.8, decay: 0.012, seed: 45 + k })), 0, 0.4);
    return o;
  }),
  // a paper object settling: soft, close, no ring
  land: [[330, 240], [370, 265], [410, 295], [300, 220]].map(([a, b], k) => () => {
    const o = buf(0.2);
    add(o, N(knock(a, b, 0.018, 0.012)), 0, 0.5);
    add(o, N(burst(0.05, { kind: 'lp', f: 2400, decay: 0.009, seed: 60 + k })), 0, 0.7);
    add(o, N(burst(0.04, { kind: 'bp', f: 1600, q: 1, decay: 0.007, seed: 65 + k })), 0, 0.5);
    add(o, N(I.paperFwip(0.7 + k * 0.08, 70 + k)), 0.012, 0.1);
    return o;
  }),
  // paper sliding in
  fwip: [0.78, 0.96, 1.16, 1.36].map((p, k) => () => I.paperFwip(p, 22 + k)),
  // a coin touching another coin: bright, very short, inharmonic
  coin: [2350, 2640, 2960, 3320, 3720].map((f, k) => () => {
    const o = partials(f, [1, 1.39, 2.27, 3.41], [0.085, 0.06, 0.04, 0.022], [1, 0.55, 0.3, 0.16], 0.4);
    add(o, burst(0.012, { kind: 'hp', f: 5200, q: 0.8, decay: 0.002, seed: 80 + k }), 0, 0.5);
    return o;
  }),
  // a counter stepping
  tick: [0.82, 1.0, 1.24].map((p) => () => I.woodTick(p)),
  // a figure arriving: one soft struck tone
  ding: [1174.66, 1318.51, 1567.98].map((f) => () => partials(f, [1, 2.0, 3.01, 4.2], [0.42, 0.24, 0.14, 0.08], [1, 0.32, 0.14, 0.06], 1.3)),
  // the camera whipping across the desk
  whip: [[380, 4200], [3800, 420], [600, 5200]].map(([a, b], k) => () => I.noiseSweep(0.3 + k * 0.03, a, b, { q: 0.9, pink: true, seed: 20 + k, shape: (x) => Math.pow(Math.sin(Math.PI * x), 1.5) })),
  // a page tearing away: bright grainy noise that opens up, with a low rip under it
  tear: [1, 2, 3].map((k) => () => {
    const len = 0.34 + k * 0.03, o = buf(len), w = rng(100 + k), g = rng(200 + k), sv = new SVF(), lp = new OnePole(), sm = new OnePole();
    for (let i = 0; i < o.length; i++) {
      const t = i / SR, x = i / o.length;
      const grain = sm.lp(Math.abs(g()) > 0.72 ? 1 : 0.18, 900);
      const f = 2100 * Math.pow(2.6, x);
      const e = Math.min(1, t / 0.012) * Math.pow(1 - x, 0.7);
      o[i] = (sv.bp(w(), f, 0.8) * grain * 1.6 + lp.lp(w(), 520) * 0.5 * grain) * e;
    }
    return o;
  }),
  // paper folding: two soft flaps
  fold: [1, 2].map((k) => () => {
    const o = buf(0.26);
    add(o, burst(0.07, { kind: 'lp', f: 1500, decay: 0.018, seed: 110 + k, attack: 0.004 }), 0, 1);
    add(o, burst(0.07, { kind: 'lp', f: 1150, decay: 0.016, seed: 120 + k, attack: 0.004 }), 0.085 + k * 0.01, 0.7);
    add(o, burst(0.01, { kind: 'hp', f: 3800, decay: 0.002, seed: 130 + k }), 0.09 + k * 0.01, 0.25);
    return o;
  }),
  // scissors: the blades sliding, then closing
  snip: [5200, 5900, 4700].map((f, k) => () => {
    const o = buf(0.24);
    add(o, env(burst(0.075, { kind: 'hp', f: 3000, q: 0.7, decay: 1, seed: 140 + k, attack: 0.03 }), (t, x) => x * x), 0, 0.45);
    add(o, partials(f, [1, 1.42], [0.012, 0.008], [1, 0.6], 0.08), 0.072, 1);
    add(o, burst(0.01, { kind: 'hp', f: 6000, decay: 0.002, seed: 150 + k }), 0.072, 0.7);
    return o;
  }),
  // a rubber stamp coming down: wood, rubber, paper, desk
  stamp: [[520, 360], [580, 400], [470, 325]].map(([a, b], k) => () => {
    const o = buf(0.3);
    add(o, N(knock(a, b, 0.024, 0.014)), 0, 0.75);
    add(o, N(knock(a * 0.5, b * 0.48, 0.045)), 0, 0.55);
    add(o, N(knock(a * 0.26, b * 0.24, 0.06)), 0, 0.25);
    add(o, N(burst(0.1, { kind: 'bp', f: 800, q: 1.5, decay: 0.022, seed: 165 + k })), 0, 0.5);
    add(o, N(burst(0.06, { kind: 'lp', f: 2800, decay: 0.011, seed: 170 + k })), 0, 0.5);
    add(o, N(burst(0.05, { kind: 'bp', f: 3400, q: 1.2, decay: 0.006, seed: 180 + k })), 0.001, 0.35);
    return o;
  }),
  // a label or tag appearing
  pop: [1400, 1800, 2300].map((p, k) => () => I.pop(p, 28 + k)),
  // a marker pen swiping
  swipe: [0.2, 0.27].map((len, k) => () => {
    const o = I.scribble(len, 31 + k), lp = new OnePole();
    for (let i = 0; i < o.length; i++) o[i] = lp.lp(o[i], 4200);
    return fade(o, 0.01, 0.04);
  }),
  // tape being pulled off the roll
  tape: [1, 2].map((k) => () => {
    const len = 0.19 + k * 0.03, o = buf(len), w = rng(190 + k), sv = new SVF();
    let ph = 0;
    for (let i = 0; i < o.length; i++) {
      const x = i / o.length;
      ph += (90 + 85 * x) / SR;
      const zip = 0.25 + 0.75 * Math.pow(1 - (ph % 1), 3);
      o[i] = sv.bp(w(), 1700 + 1900 * x, 1.1) * zip * Math.sin(Math.PI * Math.min(1, x * 1.25)) * 1.3;
    }
    return o;
  }),
  // the pattern break: a low hit with a body phone speakers can still play
  boom: [[330, 170], [370, 190]].map(([a, b], k) => () => {
    const o = buf(1.0);
    add(o, N(I.subBoom(0.95, 60, 32)), 0, 0.2);
    add(o, N(knock(a, b, 0.12, 0.05)), 0, 0.7);
    add(o, N(knock(a * 0.52, b * 0.5, 0.16, 0.06)), 0, 0.55);
    add(o, N(burst(0.7, { kind: 'bp', f: 620, f1: 240, q: 0.9, decay: 0.2, seed: 210 + k })), 0, 0.6);
    add(o, N(burst(0.8, { kind: 'bp', f: 1300, q: 0.7, decay: 0.26, seed: 215 + k, pink: true })), 0, 0.3);
    add(o, N(burst(0.05, { kind: 'hp', f: 1500, q: 0.7, decay: 0.01, seed: 218 + k })), 0, 0.35);
    return o;
  }),
  // a short rise that stops dead at the pattern break
  riser: [[500, 5200], [700, 6400]].map(([a, b], k) => () => fade(I.noiseSweep(0.52 + k * 0.06, a, b, { q: 1.4, seed: 220 + k, shape: (x) => x * x * x }), 0.02, 0.004)),
  // a receipt printing
  printer: [1, 2].map((k) => () => {
    const len = 0.5 + k * 0.08, o = buf(len), n = 13 + k * 2;
    for (let j = 0; j < n; j++) add(o, burst(0.02, { kind: 'bp', f: 2400 + (j % 3) * 260, q: 2.2, decay: 0.004, seed: 230 + j + k * 20 }), (j / n) * (len - 0.05), 0.8 - 0.2 * (j % 2));
    const hum = buf(len), lp = new OnePole();
    let ph = 0;
    for (let i = 0; i < hum.length; i++) { ph += 118 / SR; hum[i] = lp.lp(2 * (ph % 1) - 1, 420) * 0.035 * Math.sin(Math.PI * (i / hum.length)); }
    return add(o, hum);
  }),
  // a till: the drawer click, then two small bells
  ching: [[2093, 2637], [2349, 2794]].map(([a, b], k) => () => {
    const o = buf(1.0);
    add(o, I.thud(180, 0.018, 241 + k), 0, 0.6);
    add(o, burst(0.02, { kind: 'bp', f: 2600, q: 2, decay: 0.004, seed: 250 + k }), 0, 0.5);
    add(o, partials(a, [1, 2.76, 5.4], [0.3, 0.12, 0.05], [1, 0.3, 0.12], 0.9), 0.03, 0.9);
    add(o, partials(b, [1, 2.76, 5.4], [0.26, 0.1, 0.04], [1, 0.3, 0.12], 0.8), 0.115, 0.7);
    return o;
  }),
};

function makeSfx() {
  fs.mkdirSync(OUT_SFX, { recursive: true });
  for (const f of fs.readdirSync(OUT_SFX)) if (f.endsWith('.wav')) fs.unlinkSync(path.join(OUT_SFX, f));
  const made = [];
  for (const [family, variants] of Object.entries(SFX)) {
    variants.forEach((fn, k) => {
      const o = fade(trimTail(norm(fn())), 0.0006, 0.012);
      const name = `${family}-${k + 1}.wav`;
      writeWav16(path.join(OUT_SFX, name), o);
      made.push({ file: `sfx/${name}`, family, seconds: +(o.length / SR).toFixed(3) });
    });
  }
  return made;
}

// ---------------------------------------------------------------- music beds
// Quiet beds for under a voice: steady, warm, no drops, nothing that asks for attention.
// Balance is set by measurement (see pipeline/README notes in licences.md): the weight sits in the
// 250 Hz - 4 kHz range a phone can play, the low end is kept light so it never muddies the voice,
// and parts are spread left and right so the centre stays clear for speech.
const SECONDS = 56;
const VEL = { X: 1, x: 0.7, o: 0.4 };

function newBuses(n, names) { const o = {}; for (const k of names) o[k] = new Bus(n); return o; }
// one bar-long 16-step pattern, repeated; swing delays the off 16ths
function seq(bus, clock, bars, pattern, sample, gain, pan = 0, swing = 0.5) {
  const step = clock.BAR / 16;
  for (let b = 0; b < bars; b++) for (let s = 0; s < 16; s++) {
    const v = VEL[pattern[s]];
    if (!v) continue;
    bus.addMono(sample, clock.T(b) + s * step + (s % 2 ? (swing - 0.5) * 2 * step : 0), gain * v, pan);
  }
}
// chords: table {name: [notes...]}, order of names per bar, steps at which the chord is struck
function comp(bus, clock, bars, table, order, steps, play, gain, swing = 0.5) {
  const step = clock.BAR / 16;
  for (let b = 0; b < bars; b++) for (const s of steps) {
    const t = clock.T(b) + s * step + (s % 2 ? (swing - 0.5) * 2 * step : 0);
    table[order[b % order.length]].forEach((note, k, all) => {
      const x = play(m(note), k);
      bus.addMono(x, t + k * 0.006, gain, all.length > 1 ? (k / (all.length - 1)) * 1.1 - 0.55 : 0);
    });
  }
}
// bass: per bar a list of [step, note, lengthInSteps]
function line(bus, clock, bars, rows, play, gain) {
  const step = clock.BAR / 16;
  for (let b = 0; b < bars; b++) for (const [s, note, len] of rows[b % rows.length]) bus.addMono(play(m(note), len * step), clock.T(b) + s * step, gain);
}
function setup(bpm) {
  const clock = MUSIC.makeClock({ bpm, offset: 0 });
  return { clock, bars: Math.ceil(SECONDS / clock.BAR) + 1, n: Math.ceil((SECONDS + 2) * SR) };
}
const softBass = (midi, d) => I.bass(midi, d * 0.9, { bright: 0.55, sub: 0.35 });

const BEDS = {
  // lo-fi keys, dusty: the default "reading the accounts" bed
  ledger: () => {
    const { clock, bars, n } = setup(78), sw = 0.58;
    const B = newBuses(n, ['kick', 'perc', 'bass', 'keys', 'bells']);
    seq(B.kick, clock, bars, 'X......x..x.....', I.kick({ tail: 0.16, punch: 0.5 }), 1, 0, sw);
    seq(B.perc, clock, bars, '....X.......X...', I.snare({ tone: 0.5, snap: 0.4, decay: 0.12 }), 0.5, 0.1, sw);
    seq(B.perc, clock, bars, 'x.o.x.o.x.o.x.ox', I.hat(false, 5), 0.3, 0.45, sw);
    seq(B.perc, clock, bars, '..........o.....', I.rim(0.8, 3), 0.35, -0.4, sw);
    line(B.bass, clock, bars, [[[0, 'F2', 6], [6, 'F2', 4], [10, 'C3', 6]], [[0, 'D2', 6], [6, 'D2', 4], [10, 'A2', 6]], [[0, 'Bb1', 6], [6, 'Bb1', 4], [10, 'F2', 6]], [[0, 'C2', 6], [6, 'C2', 4], [10, 'G2', 6]]], softBass, 1);
    comp(B.keys, clock, bars, { F: ['A3', 'C4', 'E4', 'G4'], Dm: ['A3', 'C4', 'D4', 'F4'], Bb: ['A3', 'Bb3', 'D4', 'F4'], C: ['G3', 'Bb3', 'C4', 'E4'] }, ['F', 'Dm', 'Bb', 'C'], [0, 8, 14], (midi) => I.epiano(midi, clock.BEAT * 1.4, { index: 1.7 }), 1, sw);
    const motif = [['A5', 0], ['C6', 3], ['F5', 6], ['G5', 11], ['E5', 14]];
    for (let b = 1; b < bars; b += 2) for (const [note, s] of motif) B.bells.addMono(I.musicBox(m(note), { decay: 0.9 }), clock.T(b) + (s * clock.BAR) / 16, 1, (s % 4) / 5 - 0.3);
    const mix = MIX.mixdown(B, { kick: 0.2, perc: 0.9, bass: 0.22, keys: 0.5, bells: 0.5 });
    reverb(B.keys, { room: 0.76 }).mixInto(mix, 0.3);
    reverb(B.bells, { room: 0.82 }).mixInto(mix, 0.3);
    const dust = I.vinyl(SECONDS + 2);
    for (let i = 0; i < mix.n && i < dust.length; i++) { mix.L[i] += dust[i] * 0.2; mix.R[i] += dust[(i + 811) % dust.length] * 0.2; }
    MIX.lofi(mix, { wow: 0.8, flutter: 0.6, lowpass: 8500, sat: 1.1 });
    return mix;
  },
  // plucked strings and a walking bass: a quiet caper
  caper: () => {
    const { clock, bars, n } = setup(96);
    const B = newBuses(n, ['kick', 'perc', 'bass', 'pizz', 'hook']);
    seq(B.kick, clock, bars, 'X.......x.......', I.kick({ punch: 0.4, tail: 0.14 }), 1);
    seq(B.perc, clock, bars, '....x.......x...', I.rim(0.9, 3), 0.6, 0.3);
    seq(B.perc, clock, bars, 'x.o.x.o.x.o.x.o.', I.shaker(0.8, 8), 0.35, -0.45);
    line(B.bass, clock, bars, [
      [[0, 'D2', 4], [4, 'A2', 4], [8, 'D3', 4], [12, 'C3', 4]], [[0, 'Bb1', 4], [4, 'F2', 4], [8, 'Bb2', 4], [12, 'A2', 4]],
      [[0, 'G2', 4], [4, 'D3', 4], [8, 'G2', 4], [12, 'F2', 4]], [[0, 'A1', 4], [4, 'E2', 4], [8, 'A2', 4], [12, 'C#3', 4]],
    ], softBass, 1);
    comp(B.pizz, clock, bars, { Dm: ['F4', 'A4', 'D5'], Bb: ['F4', 'Bb4', 'D5'], Gm: ['G4', 'Bb4', 'D5'], A: ['E4', 'A4', 'C#5'] }, ['Dm', 'Bb', 'Gm', 'A'], [2, 6, 10, 14], (midi, k) => I.pizz(midi, { seed: 3 + k }), 1);
    const hooks = [['D5', 'F5', 'A5'], ['Bb4', 'D5', 'F5'], ['G4', 'Bb4', 'D5'], ['A4', 'C#5', 'E5']];
    for (let b = 1; b < bars; b += 2) hooks[b % 4].forEach((note, k) => B.hook.addMono(I.marimba(m(note), { decay: 0.3, thock: 0.2 }), clock.T(b) + (2 + k * 0.75) * clock.BEAT, 1, 0.35 - k * 0.2));
    const mix = MIX.mixdown(B, { kick: 0.2, perc: 0.5, bass: 0.26, pizz: 0.75, hook: 0.45 });
    reverb(B.pizz, { room: 0.74 }).mixInto(mix, 0.4);
    reverb(B.hook, { room: 0.8 }).mixInto(mix, 0.3);
    return mix;
  },
  // a marimba pattern counting quietly to itself
  counting: () => {
    const { clock, bars, n } = setup(104);
    const B = newBuses(n, ['kick', 'perc', 'bass', 'mar', 'top']);
    seq(B.kick, clock, bars, 'X.....x.X.......', I.kick({ punch: 0.35, tail: 0.13 }), 1);
    seq(B.perc, clock, bars, '....x.......x...', I.rim(1.1, 5), 0.55, 0.35);
    seq(B.perc, clock, bars, 'xoxoXoxoxoxoXoxo', I.shaker(0.8, 8), 0.3, -0.45);
    line(B.bass, clock, bars, [[[0, 'G2', 9], [10, 'D3', 5]], [[0, 'E2', 9], [10, 'B2', 5]], [[0, 'C2', 9], [10, 'G2', 5]], [[0, 'D2', 9], [10, 'A2', 5]]], softBass, 1);
    const arps = [['G3', 'D4', 'G4', 'D4', 'B3', 'D4', 'G4', 'D4'], ['E3', 'B3', 'E4', 'B3', 'G3', 'B3', 'E4', 'B3'], ['C3', 'G3', 'C4', 'G3', 'E3', 'G3', 'C4', 'G3'], ['D3', 'A3', 'D4', 'A3', 'F#3', 'A3', 'D4', 'A3']];
    for (let b = 0; b < bars; b++) arps[b % 4].forEach((note, k) => B.mar.addMono(I.marimba(m(note) + 12, { decay: 0.34, thock: 0.4 }), clock.T(b) + (k * clock.BEAT) / 2, k % 4 === 0 ? 1 : 0.7, ((k % 4) - 1.5) * 0.3));
    for (let b = 3; b < bars; b += 4) ['A5', 'B5', 'D6'].forEach((note, k) => B.top.addMono(I.musicBox(m(note), { decay: 0.7 }), clock.T(b) + (2 + k * 0.5) * clock.BEAT, 1, 0.4));
    const mix = MIX.mixdown(B, { kick: 0.2, perc: 0.95, bass: 0.22, mar: 0.6, top: 0.5 });
    reverb(B.mar, { room: 0.72 }).mixInto(mix, 0.35);
    reverb(B.top, { room: 0.82 }).mixInto(mix, 0.3);
    return mix;
  },
  // head-nod drums and electric piano
  stoop: () => {
    const { clock, bars, n } = setup(88), sw = 0.6;
    const B = newBuses(n, ['kick', 'perc', 'bass', 'keys', 'lead']);
    seq(B.kick, clock, bars, 'X.....x...x.....', I.kick({ tail: 0.2, punch: 0.8 }), 1, 0, sw);
    seq(B.perc, clock, bars, '....X.......X...', I.snare({ tone: 0.7, snap: 0.8 }), 0.55, 0.1, sw);
    seq(B.perc, clock, bars, 'x.x.x.x.x.x.x.xo', I.hat(false, 6), 0.3, 0.45, sw);
    line(B.bass, clock, bars, [[[0, 'A1', 6], [6, 'A1', 4], [10, 'E2', 6]], [[0, 'F1', 6], [6, 'F1', 4], [10, 'C2', 6]], [[0, 'D2', 6], [6, 'D2', 4], [10, 'A2', 6]], [[0, 'E2', 6], [6, 'E2', 4], [10, 'B2', 6]]], (midi, d) => softBass(midi + 12, d), 1);
    comp(B.keys, clock, bars, { Am: ['A3', 'C4', 'E4', 'G4'], F: ['A3', 'C4', 'E4', 'F4'], Dm: ['A3', 'C4', 'D4', 'F4'], E: ['G#3', 'B3', 'D4', 'E4'] }, ['Am', 'F', 'Dm', 'E'], [0, 10], (midi) => I.epiano(midi, clock.BEAT * 2.4, { index: 2.0 }), 1, sw);
    const lick = [['E5', 4], ['D5', 6], ['C5', 7], ['A4', 10]];
    for (let b = 2; b < bars; b += 4) for (const [note, s] of lick) B.lead.addMono(I.pluck(m(note), { decay: 0.2, cutoff: 2600 }), clock.T(b) + (s * clock.BAR) / 16, 1, 0.35);
    const mix = MIX.mixdown(B, { kick: 0.2, perc: 0.85, bass: 0.22, keys: 0.5, lead: 0.6 });
    reverb(B.keys, { room: 0.76 }).mixInto(mix, 0.35);
    reverb(B.lead, { room: 0.8 }).mixInto(mix, 0.3);
    MIX.lofi(mix, { wow: 0.5, flutter: 0.4, lowpass: 9000, sat: 1.05 });
    return mix;
  },
  // light, forward-moving: log drum and muted guitar
  market: () => {
    const { clock, bars, n } = setup(104), sw = 0.54;
    const B = newBuses(n, ['kick', 'perc', 'bass', 'gtr']);
    seq(B.kick, clock, bars, 'X..x..x.X..x..x.', I.kick({ tail: 0.14, punch: 0.5 }), 1, 0, sw);
    seq(B.perc, clock, bars, '..x..x....x..x..', I.rim(1, 4), 0.5, 0.4, sw);
    seq(B.perc, clock, bars, '....x.......x...', I.clap({ spread: 0.8 }), 0.4, -0.1, sw);
    seq(B.perc, clock, bars, 'xoxoxoxoxoxoxoxo', I.shaker(1, 8), 0.32, -0.5, sw);
    line(B.bass, clock, bars, [
      [[0, 'E2', 3], [3, 'E2', 3], [6, 'B2', 2], [8, 'E2', 3], [11, 'E3', 3], [14, 'B2', 2]], [[0, 'C2', 3], [3, 'C2', 3], [6, 'G2', 2], [8, 'C2', 3], [11, 'C3', 3], [14, 'G2', 2]],
      [[0, 'G2', 3], [3, 'G2', 3], [6, 'D3', 2], [8, 'G2', 3], [11, 'G3', 3], [14, 'D3', 2]], [[0, 'D2', 3], [3, 'D2', 3], [6, 'A2', 2], [8, 'D2', 3], [11, 'D3', 3], [14, 'A2', 2]],
    ], (midi) => I.logDrum(midi + 12, { decay: 0.26 }), 1);
    comp(B.gtr, clock, bars, { Em: ['G4', 'B4', 'E5'], C: ['G4', 'C5', 'E5'], G: ['G4', 'B4', 'D5'], D: ['F#4', 'A4', 'D5'] }, ['Em', 'C', 'G', 'D'], [2, 6, 10, 12], (midi) => I.guitar(midi, 0.22, { bright: 0.6, sustain: 0.99 }), 1, sw);
    const mix = MIX.mixdown(B, { kick: 0.2, perc: 0.45, bass: 0.24, gtr: 0.7 });
    reverb(B.gtr, { room: 0.72 }).mixInto(mix, 0.35);
    return mix;
  },
  // slower lo-fi in a minor key, with a music-box line: for the darker stories
  vault: () => {
    const { clock, bars, n } = setup(84), sw = 0.57;
    const B = newBuses(n, ['kick', 'perc', 'bass', 'keys', 'bells']);
    seq(B.kick, clock, bars, 'X.........x.....', I.kick({ tail: 0.18, punch: 0.45 }), 1, 0, sw);
    seq(B.perc, clock, bars, '....X.......X..o', I.rim(0.75, 7), 0.6, 0.2, sw);
    seq(B.perc, clock, bars, 'o.x.o.x.o.x.o.x.', I.hat(false, 9), 0.28, 0.5, sw);
    line(B.bass, clock, bars, [[[0, 'D2', 10], [10, 'A2', 6]], [[0, 'Bb1', 10], [10, 'F2', 6]], [[0, 'F2', 10], [10, 'C3', 6]], [[0, 'C2', 10], [10, 'G2', 6]]], softBass, 1);
    comp(B.keys, clock, bars, { Dm: ['A3', 'C4', 'D4', 'F4'], Bb: ['A3', 'Bb3', 'D4', 'F4'], F: ['A3', 'C4', 'E4', 'F4'], C: ['G3', 'B3', 'C4', 'E4'] }, ['Dm', 'Bb', 'F', 'C'], [0, 6, 12], (midi) => I.epiano(midi, clock.BEAT * 1.6, { index: 1.8 }), 1, sw);
    const melody = [['D5', 0], ['F5', 4], ['A5', 8], ['G5', 12]];
    for (let b = 0; b < bars; b += 2) for (const [note, s] of melody) B.bells.addMono(I.musicBox(m(note), { decay: 1.1 }), clock.T(b) + (s * clock.BAR) / 16, 1, s / 20 - 0.3);
    const mix = MIX.mixdown(B, { kick: 0.2, perc: 0.9, bass: 0.22, keys: 0.5, bells: 0.5 });
    reverb(B.keys, { room: 0.78 }).mixInto(mix, 0.35);
    reverb(B.bells, { room: 0.85 }).mixInto(mix, 0.35);
    const dust = I.vinyl(SECONDS + 2, { crackle: 0.7 });
    for (let i = 0; i < mix.n && i < dust.length; i++) { mix.L[i] += dust[i] * 0.16; mix.R[i] += dust[(i + 977) % dust.length] * 0.16; }
    MIX.lofi(mix, { wow: 0.9, flutter: 0.6, lowpass: 8000, sat: 1.1 });
    return mix;
  },
};

function makeMusic() {
  fs.mkdirSync(OUT_MUSIC, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'beds-'));
  const made = [];
  for (const [name, build] of Object.entries(BEDS)) {
    const full = build();
    const n = Math.round(SECONDS * SR), mix = new Bus(n);
    mix.L.set(full.L.subarray(0, n)); mix.R.set(full.R.subarray(0, n));
    MIX.highpass(mix, 45);
    MIX.fadeOut(mix, SECONDS - 1.5, SECONDS);
    const res = MIX.master(mix, 0.8, 0.84, { lufs: -18 });
    const wav = path.join(tmp, `${name}.wav`), out = path.join(OUT_MUSIC, `${name}.ogg`);
    MIX.writeWav(wav, mix);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '112k', '-vbr', 'on', out]);
    made.push({ file: `music/${name}.ogg`, seconds: SECONDS, lufs: +res.lufs.toFixed(2) });
    process.stdout.write(`  ${name}: ${res.lufs.toFixed(2)} LUFS (engine meter)\n`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return made;
}

const what = process.argv[2] || 'all';
if (what === 'all' || what === 'sfx') console.log(`effects: ${makeSfx().length} files in assets/sfx`);
if (what === 'all' || what === 'music') { console.log('music beds:'); makeMusic(); }
console.log('If files were added or removed, update assets/licences.md: the mixer refuses anything not listed there.');
