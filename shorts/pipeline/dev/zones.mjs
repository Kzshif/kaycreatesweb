#!/usr/bin/env node
// The button-zone pass of QA on its own, without rendering the MP4: which text rests under
// YouTube's buttons or the subtitle strip, and which only passes through.
//   node pipeline/dev/zones.mjs 001 [002 ...]
import fs from 'node:fs';
import { CHANNEL_JSON, findVideo, readJson, videoFiles } from '../lib/paths.mjs';
import { probeVideo } from '../lib/render.mjs';
import { parseScript } from '../lib/script.mjs';
import { syntheticTimings } from '../lib/text.mjs';
import { buildProps } from '../lib/timing.mjs';
import { motionWindows, restingHits } from '../lib/zones.mjs';

for (const id of process.argv.slice(2).length ? process.argv.slice(2) : ['001']) {
  const v = findVideo(id);
  const f = videoFiles(v);
  const script = parseScript(f.script);
  const plan = readJson(f.plan);
  const words = fs.existsSync(f.words) ? readJson(f.words).words : syntheticTimings(script.text, script.say);
  const { props } = buildProps({ plan, script, words, channel: readJson(CHANNEL_JSON, {}), id: v.id });
  const step = 3;
  const t0 = Date.now();
  const probe = await probeVideo(props, { step });
  const hits = probe.frames.flatMap((fr) => fr.hits.map((h) => ({ ...h, frame: fr.frame })));
  const motion = motionWindows(props);
  console.log(`${v.id}: ${probe.frames.length} frames probed in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  for (const zone of ['right', 'bottom', 'caption', 'top', 'cut']) {
    const r = restingHits(hits.filter((h) => h.zone === zone), motion, { step });
    for (const h of r.resting) console.log(`   rests  ${zone.padEnd(6)} ${(h.frame / 30).toFixed(1).padStart(5)}s [${h.box.join(', ')}]  "${h.t}"`);
    if (r.passing) console.log(`   passes ${zone.padEnd(6)} ${r.passing} text(s) only while moving`);
  }
  const spills = probe.frames.flatMap((fr) => (fr.overflow || []).map((o) => ({ ...o, frame: fr.frame })));
  const seen = new Set();
  for (const o of spills) if (!seen.has(o.t)) seen.add(o.t) && console.log(`   spill  ${(o.frame / 30).toFixed(1).padStart(5)}s ${o.by}px  "${o.t}"`);
}
