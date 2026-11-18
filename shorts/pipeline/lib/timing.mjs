// Turns a storyboard + word timings into the exact frame numbers the renderer
// uses. Scenes and their reveal steps are pinned to spoken words, so pictures
// land with the narration instead of drifting.
import { BREAK_FRAMES, FRAME, RULES, TRANSITION_FRAMES, cueCount } from '../../src/shared/spec.mjs';
import { buildCaptions } from './captions.mjs';
import { findPhrase, prepareScene, resolveAnchors, resolveBreakKind, resolveDeck, resolveLook, resolveTransitions } from './plan.mjs';
import { norm } from './text.mjs';

const FPS = FRAME.fps;
const SCENE_LEAD = 0.12; // a scene cuts in just before its word, so it has landed when the word is heard
const BEAT_LEAD = 0.1;
const TAIL = 0.3; // air after the last word before the loop restarts
const MIN_SCENE = 1.0;
export const LOOP_FRAMES = 9; // the last frames blend back into frame 0 so the loop is seamless

const f = (seconds) => Math.round(seconds * FPS);
const issue = (level, rule, message) => ({ level, rule, message });
const filled = (s) => typeof s === 'string' && s.trim() && !/^\[.*\]$/.test(s.trim());

/**
 * words: [{ w, start, end }] one per script word, in order.
 * Returns { props, issues, events } where props is the Remotion input.
 */
export function buildProps({ plan, script, words, channel = {}, audio = null, id = plan.id }) {
  const issues = [];
  if (words.length !== script.words.length) {
    issues.push(issue('error', 'timing', `words.json has ${words.length} words but the script has ${script.words.length}. Re-run timing.`));
  }
  const { anchors, issues: anchorIssues } = resolveAnchors(plan, script.words);
  issues.push(...anchorIssues);

  const endSec = (words[words.length - 1]?.end || 0) + TAIL;
  const total = Math.max(f(endSec), 1);
  const at = (idx) => words[Math.min(idx, words.length - 1)]?.start ?? 0;

  // scene starts
  const starts = [];
  anchors.forEach((a, i) => {
    let s = i === 0 ? 0 : at(a.at) - SCENE_LEAD;
    if (i > 0) s = Math.max(s, starts[i - 1] + MIN_SCENE);
    starts.push(Math.max(0, s));
  });

  const enters = resolveTransitions(id, plan);
  const scenes = plan.scenes.map((sc, i) => {
    const from = f(starts[i]);
    const to = i + 1 < plan.scenes.length ? f(starts[i + 1]) : total;
    const duration = Math.max(1, to - from);
    const need = cueCount(sc);
    const cues = [0];
    for (const b of anchors[i]?.beats || []) {
      const c = f(at(b) - BEAT_LEAD) - from;
      cues.push(Math.max(cues[cues.length - 1] + 5, Math.min(c, duration - 6)));
    }
    // steps without a beat are spread evenly through the time that is left
    const missing = need - cues.length;
    if (missing > 0) {
      const last = cues[cues.length - 1];
      const hold = Math.min(20, Math.round(duration * 0.22));
      const room = duration - hold - last;
      const gap = room / (missing + 0.15);
      if (gap < 8) issues.push(issue('warn', 'timing', `Scene ${i + 1} (${sc.type}) has ${need} steps in ${(duration / FPS).toFixed(1)}s: too fast to read. Give it more words or fewer steps.`));
      for (let k = 1; k <= missing; k++) cues.push(Math.round(last + Math.max(5, gap) * k));
    }
    if (duration < f(MIN_SCENE) - 1) issues.push(issue('warn', 'timing', `Scene ${i + 1} (${sc.type}) lasts only ${(duration / FPS).toFixed(1)}s.`));
    const lead = enters[i] ? TRANSITION_FRAMES[enters[i]] : 0;
    if (lead && duration < lead + 12) issues.push(issue('warn', 'timing', `Scene ${i + 1} (${sc.type}) is barely longer than the ${enters[i]} that brings it in.`));
    return { type: sc.type, variant: sc.variant, from, duration, cues, props: prepareScene(sc, i).props, enter: enters[i], source: sc.source || null };
  });

  // the pattern break: lands on the words the storyboard names, otherwise on the cue nearest the middle
  let breakFrame = null;
  if (plan.break?.at) {
    const idx = findPhrase(script.words.map(norm), plan.break.at, 0);
    if (idx >= 0) breakFrame = f(at(idx) - 0.05);
  }
  if (breakFrame === null) {
    const all = scenes.flatMap((s) => s.cues.map((c) => s.from + c));
    breakFrame = all.reduce((best, x) => (Math.abs(x - total / 2) < Math.abs(best - total / 2) ? x : best), Math.round(total / 2));
  }
  const kind = resolveBreakKind(id, plan);
  const patternBreak = { frame: breakFrame, kind, frames: BREAK_FRAMES[kind] };
  // a break in the middle of a scene change would be lost in it
  for (const s of scenes) if (s.enter && breakFrame >= s.from - 2 && breakFrame < s.from + TRANSITION_FRAMES[s.enter]) issues.push(issue('warn', 'break', `The pattern break lands inside the ${s.enter} into scene ${scenes.indexOf(s) + 1}: move "break.at" a few words.`));

  // every visible change, as absolute frames
  const events = [...new Set([...scenes.flatMap((s) => s.cues.map((c) => s.from + c)), breakFrame])].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 0; i < events.length; i++) {
    const next = i + 1 < events.length ? events[i + 1] : total;
    gaps.push({ at: events[i] / FPS, gap: (next - events[i]) / FPS });
  }
  const worst = gaps.reduce((m, g) => (g.gap > m.gap ? g : m), { gap: 0, at: 0 });
  if (worst.gap > RULES.cadence.maxGapSeconds + 0.05) {
    issues.push(issue('error', 'cadence', `Nothing new appears for ${worst.gap.toFixed(1)}s from ${worst.at.toFixed(1)}s. The brief asks for a visual change every 2-3 seconds: add a beat or a scene there.`));
  }
  const avgGap = total / FPS / Math.max(1, events.length);
  if (avgGap > RULES.cadence.targetGapSeconds + 0.3) issues.push(issue('warn', 'cadence', `Average ${avgGap.toFixed(1)}s between visual changes; aim for about ${RULES.cadence.targetGapSeconds}s.`));

  const pages = buildCaptions(words).map((p) => ({
    from: f(p.start),
    to: Math.max(f(p.start) + 2, f(p.end)),
    words: p.words.map((w) => ({ t: w.t, from: f(w.start), to: Math.max(f(w.start) + 1, f(w.end)) })),
  }));

  const props = {
    id,
    durationInFrames: total,
    fps: FPS,
    look: resolveLook(id, plan),
    deck: resolveDeck(id, plan),
    scenes,
    captions: pages,
    audio,
    loopFrames: LOOP_FRAMES,
    patternBreak,
    // the channel's name sits in the corner of every video; nothing is shown while it is a placeholder
    handle: filled(channel.handle) ? channel.handle.trim() : null,
    cta: filled(channel.cta) && channel.ctaOnScreen !== false ? channel.cta.trim() : null,
    // the desk, drawn once per video and reused on every frame (set by the render step)
    backdrop: null,
    backdropAlt: null,
    probe: false,
  };
  return { props, issues, events: events.map((e) => +(e / FPS).toFixed(2)), seconds: total / FPS, worstGap: +worst.gap.toFixed(2), avgGap: +avgGap.toFixed(2) };
}
