#!/usr/bin/env node
// When every scene and reveal of a video lands, with the words being spoken at that moment.
//   node pipeline/dev/timeline.mjs 001
import fs from 'node:fs';
import { findVideo, readJson, videoFiles } from '../lib/paths.mjs';
import { parseScript } from '../lib/script.mjs';
import { syntheticTimings } from '../lib/text.mjs';
import { buildProps } from '../lib/timing.mjs';

const v = findVideo(process.argv[2] || '001');
const f = videoFiles(v);
const script = parseScript(f.script);
const plan = readJson(f.plan);
const words = fs.existsSync(f.words) ? readJson(f.words).words : syntheticTimings(script.text, script.say);
const b = buildProps({ plan, script, words, id: v.id });
const said = (t) => words.filter((w) => w.start <= t + 0.35 && w.end >= t - 0.35).map((w) => w.w).join(' ');
const events = [];
b.props.scenes.forEach((s, i) => s.cues.forEach((c, k) => events.push({ t: (s.from + c) / 30, label: `${k === 0 ? `#${i + 1} ${s.type}/${s.variant}${s.enter ? ` (${s.enter})` : ''}` : `   step ${k + 1}`}` })));
events.push({ t: b.props.patternBreak.frame / 30, label: `   BREAK ${b.props.patternBreak.kind}` });
events.sort((a, c) => a.t - c.t);
events.forEach((e, i) => {
  const gap = (i + 1 < events.length ? events[i + 1].t : b.seconds) - e.t;
  console.log(`${e.t.toFixed(2).padStart(6)}  ${e.label.padEnd(30)} ${gap > 3.05 ? `GAP ${gap.toFixed(1)}s` : '        '}  "${said(e.t)}"`);
});
console.log(`total ${b.seconds.toFixed(1)}s`);
