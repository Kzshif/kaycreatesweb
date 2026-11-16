// The motion test's timeline, worked out once from the spoken words and read by both the
// animation (src/board/Motion.tsx) and the sound mix (pipeline/dev/motion.mjs), so the two
// cannot drift apart.
import { LEVELS, SFX } from '../shared/sound.mjs';

export const SCRIPT = ['Shoppers paid $5.3 billion in fees just to walk in.', 'Costco earned $10.4 billion from running the business.', 'The fees alone are about half of that.'];
export const STEP = 2.5; // frames: paper moves 12 times a second
// one coin = $0.5 billion, rounded to whole coins: fees $5.323bn -> 11, operating income $10.383bn -> 21
export const FEES = { coins: 11, value: 5.3 };
export const EARNED = { coins: 21, value: 10.4 };

/** cues: frames of the spoken words { billion, just, walk, s2, earned, earnedEnd, s3, half } */
export function motionPlan(c) {
  // the fees stack is already standing when the page tears away (the hook has just said the figure);
  // only what Costco earned is counted out with the voice
  const left = { start: c.s2 - 60, n: FEES.coins, every: STEP };
  const rightStart = c.earned - 3;
  const right = { start: rightStart, n: EARNED.coins, every: Math.max(STEP, (c.earnedEnd - rightStart) / EARNED.coins) };
  return {
    slamAt: 4,
    slipAt: 8,
    hookCoins: [0, 1, 2, 3].map((k) => c.walk + 1 + k * 5),
    tearAt: c.s2,
    left,
    right,
    breakAt: Math.round(right.start + right.n * right.every) + 2,
    whipAt: c.s3,
    countFrom: c.s3 + 7,
    countEnd: c.s3 + 23,
    stampAt: c.half,
  };
}

/** Sound events for the mixer: [{ t, file, gainDb, pan }] */
export function motionSounds(c, fps = 30) {
  const p = motionPlan(c);
  const ev = [];
  const add = (frame, family, variant, gain = 0, pan = 0) => ev.push({ t: +(Math.max(0, frame) / fps).toFixed(3), file: `sfx/${family}-${((variant - 1) % SFX[family]) + 1}.wav`, gainDb: LEVELS.sfx[family] + gain, pan });
  add(p.slamAt, 'slam', 2);
  add(p.slipAt + 4, 'land', 1, -2, -0.3);
  p.hookCoins.forEach((f, k) => add(f + 5, 'coin', k + 1, 0, k % 2 ? 0.3 : -0.3));
  add(p.tearAt, 'tear', 2);
  // a rising run of clinks as each stack grows: every second coin, so it is a rhythm and not a rattle
  for (const [s, pan] of [[p.right, 0.3]]) for (let i = 0; i < s.n; i += 2) add(s.start + i * s.every + 4, 'coin', 1 + Math.min(4, Math.floor((i / s.n) * 5)), -2, pan);
  add(p.breakAt - 16, 'riser', 1);
  add(p.breakAt, 'boom', 1);
  add(p.whipAt, 'whip', 1);
  add(p.countEnd, 'ding', 2);
  add(p.stampAt, 'stamp', 2);
  return ev.sort((a, b) => a.t - b.t);
}
