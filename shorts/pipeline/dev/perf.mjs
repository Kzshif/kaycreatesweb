#!/usr/bin/env node
// Times the render of a few frames of a video with parts of the picture switched off, to find
// what costs the most.   node pipeline/dev/perf.mjs 001 [firstFrame] [count]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderFrames, selectComposition } from '@remotion/renderer';
import { findVideo, readJson, videoFiles } from '../lib/paths.mjs';
import { bakeBackdrop, findBrowser, getBundle } from '../lib/render.mjs';
import { parseScript } from '../lib/script.mjs';
import { buildProps } from '../lib/timing.mjs';

const v = findVideo(process.argv[2] || '001');
const first = +(process.argv[3] || 600);
const count = +(process.argv[4] || 10);
const f = videoFiles(v);
const built = buildProps({ plan: readJson(f.plan), script: parseScript(f.script), words: readJson(f.words).words, channel: readJson(path.join(f.work, '..', '..', '..', 'channel.json'), {}), id: v.id });
const serveUrl = await getBundle({ log: console.log });
Object.assign(built.props, await bakeBackdrop(built.props, f.work));
const common = { browserExecutable: findBrowser(), chromiumOptions: { gl: process.env.GL || 'swangle' }, logLevel: 'error' };
const variants = (process.env.VARIANTS || 'base,noFilter,noBlend,noClip,noRotate,noCamera,noDeck,noCaptions').split(',');
for (const name of variants) {
  const inputProps = { ...built.props, audio: null, perf: name === 'base' ? {} : Object.fromEntries(name.split('+').map((k) => [k, true])) };
  const composition = await selectComposition({ serveUrl, id: 'Short', inputProps, ...common });
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-'));
  const t0 = Date.now();
  await renderFrames({ composition, serveUrl, inputProps, outputDir: out, imageFormat: 'jpeg', jpegQuality: 90, frameRange: [first, first + count - 1], concurrency: 1, onStart: () => {}, onFrameUpdate: () => {}, ...common });
  console.log(`${name.padEnd(22)} ${((Date.now() - t0) / count).toFixed(0)} ms/frame`);
  fs.rmSync(out, { recursive: true, force: true });
}
