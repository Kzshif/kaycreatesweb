// Which probe hits matter. YouTube draws its buttons over the right 15% and the bottom 20% of a
// Short, so text must not rest there. Text in motion may cross those zones on its way somewhere
// else: during a transition, the zoom break, or a card dropping in. Nobody can read words that
// are passing through, and the buttons only hide what stays put.
import { TRANSITION_FRAMES } from '../../src/shared/spec.mjs';

/** Frames where everything on screen is moving at once, as [start, end) pairs. */
export function motionWindows(props) {
  const windows = [];
  props.scenes.forEach((s, i) => {
    if (i > 0 && s.enter && TRANSITION_FRAMES[s.enter]) windows.push([s.from, s.from + TRANSITION_FRAMES[s.enter]]);
  });
  const pb = props.patternBreak;
  // the zoom break punches the camera in, then settles over the break and six more frames
  if (pb && pb.kind === 'zoom') windows.push([pb.frame, pb.frame + pb.frames + 6]);
  return windows;
}

/**
 * Split probe hits into the ones that rest in a zone and the ones that only pass through.
 * A text rests in a zone when it is there, outside a motion window, for `dwell` frames
 * of some `span`-frame stretch. Hits are sampled every `step` frames, so each one stands for `step` frames.
 * Returns { resting: first hit of each resting text, passing: number of texts that only passed through }.
 */
export function restingHits(hits, windows, { step = 3, dwell = 9, span = 30 } = {}) {
  const moving = (f) => windows.some(([a, b]) => f >= a && f < b);
  const groups = new Map();
  for (const h of hits) {
    const k = `${h.zone}:${h.t}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(h);
  }
  const need = Math.max(1, Math.ceil(dwell / step));
  const resting = [];
  let passing = 0;
  for (const list of groups.values()) {
    const still = list.filter((h) => !moving(h.frame)).sort((a, b) => a.frame - b.frame);
    let found = null;
    for (let i = 0; i + need - 1 < still.length && !found; i++) {
      if (still[i + need - 1].frame - still[i].frame < span) found = still[i];
    }
    if (found) resting.push(found);
    else passing++;
  }
  return { resting: resting.sort((a, b) => a.frame - b.frame), passing };
}
