#!/usr/bin/env node
// Where every piece of text sits on chosen frames, as the QA probe sees it.
//   node pipeline/dev/probe.mjs 001 0 81 468      (frames)
//   node pipeline/dev/probe.mjs 001 @2.7 @15.6    (seconds)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CHANNEL_JSON, findVideo, readJson, videoFiles } from '../lib/paths.mjs';
import { renderStills } from '../lib/render.mjs';
import { parseScript } from '../lib/script.mjs';
import { syntheticTimings } from '../lib/text.mjs';
import { buildProps } from '../lib/timing.mjs';
import { SAFE } from '../../src/shared/paper.mjs';

const [id, ...args] = process.argv.slice(2);
const v = findVideo(id || '001');
const f = videoFiles(v);
const script = parseScript(f.script);
const plan = readJson(f.plan);
const words = fs.existsSync(f.words) ? readJson(f.words).words : syntheticTimings(script.text, script.say);
const { props } = buildProps({ plan, script, words, channel: readJson(CHANNEL_JSON, {}), id: v.id });
const frames = (args.length ? args : ['0']).map((a) => (a.startsWith('@') ? Math.round(parseFloat(a.slice(1)) * 30) : parseInt(a, 10)));
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
const reports = [];
await renderStills({ ...props, audio: null }, frames, out, { scale: 0.5, onProbe: (r) => reports.push(r) });
for (const r of reports) {
  console.log(`frame ${r.frame} (${(r.frame / 30).toFixed(2)}s): ${r.n} text boxes`);
  for (const h of r.hits) console.log(`   ${h.zone.padEnd(6)} [${h.box.join(', ')}]  "${h.t}"  (safe right ${SAFE.right}, bottom ${SAFE.bottom}, top ${SAFE.top})`);
  for (const o of r.overflow) console.log(`   spill  ${o.by}px  "${o.t}"`);
}
console.log(`stills in ${out}`);
