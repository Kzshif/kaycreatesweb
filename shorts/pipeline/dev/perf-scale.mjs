#!/usr/bin/env node
// Wall time for a run of frames at different worker counts and GL backends.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderFrames, selectComposition } from '@remotion/renderer';
import { findVideo, readJson, videoFiles } from '../lib/paths.mjs';
import { bakeBackdrop, findBrowser, getBundle } from '../lib/render.mjs';
import { parseScript } from '../lib/script.mjs';
import { buildProps } from '../lib/timing.mjs';

const v = findVideo('001');
const f = videoFiles(v);
const built = buildProps({ plan: readJson(f.plan), script: parseScript(f.script), words: readJson(f.words).words, id: v.id });
const serveUrl = await getBundle();
Object.assign(built.props, await bakeBackdrop(built.props, f.work));
const N = +(process.env.N || 32);
for (const spec of (process.env.RUNS || 'swangle:1,swangle:2,swangle:4').split(',')) {
  const [gl, conc] = spec.split(':');
  const common = { browserExecutable: findBrowser(), chromiumOptions: { gl }, logLevel: 'error' };
  const inputProps = { ...built.props, audio: null };
  const composition = await selectComposition({ serveUrl, id: 'Short', inputProps, ...common });
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-'));
  const t0 = Date.now();
  try {
    await renderFrames({ composition, serveUrl, inputProps, outputDir: out, imageFormat: 'jpeg', jpegQuality: 90, frameRange: [600, 600 + N - 1], concurrency: +conc, onStart: () => {}, onFrameUpdate: () => {}, ...common });
    console.log(`${gl.padEnd(12)} x${conc}  ${((Date.now() - t0) / N).toFixed(0)} ms per frame (wall)`);
  } catch (e) {
    console.log(`${gl} x${conc} failed: ${String(e.message).slice(0, 120)}`);
  }
  fs.rmSync(out, { recursive: true, force: true });
}
