// Developer tool: render stills of any scene on any look, to check designs by eye.
//   node pipeline/dev/gallery.mjs <gallery.json> <outDir>
// gallery.json = [{ name, look, scene: {type, variant, props, duration?, cues?}, frames: [..] }]
import fs from 'node:fs';
import path from 'node:path';
import { cueCount } from '../../src/shared/spec.mjs';
import { renderStills } from '../lib/render.mjs';

const [, , file, outDir] = process.argv;
const items = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const it of items) {
  const duration = it.scene.duration ?? 90;
  const n = cueCount(it.scene);
  const cues = it.scene.cues ?? Array.from({ length: n }, (_, i) => Math.round((i * duration * 0.7) / Math.max(1, n)));
  const props = {
    id: it.name,
    durationInFrames: duration,
    fps: 30,
    look: it.look,
    scenes: [{ type: it.scene.type, variant: it.scene.variant, from: 0, duration, cues, props: it.scene.props }],
    captions: it.captions ?? [],
    audio: null,
    loopFrames: 0,
    handle: null,
    cta: null,
    probe: false,
  };
  const dir = path.join(outDir, it.name);
  const t0 = Date.now();
  const bad = [];
  const files = await renderStills(props, it.frames ?? [0, Math.round(duration * 0.5), duration - 1], dir, {
    scale: it.scale ?? 0.5,
    onProbe: (r) => r.hits.filter((h) => h.zone !== 'top').forEach((h) => bad.push(`f${r.frame} ${h.zone} "${h.t}" [${h.box}]`)),
  });
  console.log(`${it.name}: ${files.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)}s${bad.length ? `  SAFE-ZONE: ${[...new Set(bad)].slice(0, 4).join(' | ')}` : ''}`);
}
