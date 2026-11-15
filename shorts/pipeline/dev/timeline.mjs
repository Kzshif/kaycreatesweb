// Developer tool: print when each scene and each reveal step lands, using the real
// word timings if they exist.   node pipeline/dev/timeline.mjs 001
import { exists, findVideo, readJson, videoFiles } from '../lib/paths.mjs';
import { parseScript } from '../lib/script.mjs';
import { syntheticTimings } from '../lib/text.mjs';
import { buildProps } from '../lib/timing.mjs';

const v = findVideo(process.argv[2]);
const f = videoFiles(v);
const script = parseScript(f.script);
const real = exists(f.words);
const words = real ? readJson(f.words).words : syntheticTimings(script.text, script.say);
const b = buildProps({ plan: readJson(f.plan), script, words });
console.log(`${v.name}: ${b.seconds.toFixed(1)}s, ${real ? 'real voice timing' : 'estimated timing'}, longest gap ${b.worstGap}s, mean gap ${b.avgGap}s`);
let prev = 0;
for (const s of b.props.scenes) {
  const cues = s.cues.map((c) => (s.from + c) / 30);
  const gaps = cues.map((t) => {
    const g = t - prev;
    prev = t;
    return `${t.toFixed(1)}${g > 3.0 ? `(+${g.toFixed(1)}!)` : ''}`;
  });
  console.log(`  ${(s.from / 30).toFixed(1).padStart(5)}s ${(s.duration / 30).toFixed(1).padStart(4)}s  ${`${s.type}/${s.variant}`.padEnd(20)} steps at ${gaps.join(', ')}`);
}
const end = b.seconds - prev;
if (end > 3) console.log(`  last step to end: +${end.toFixed(1)}!`);
for (const i of b.issues) console.log(`  ${i.level === 'error' ? 'x' : '!'} ${i.message}`);
