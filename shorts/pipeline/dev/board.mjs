#!/usr/bin/env node
// Renders the Paper Money style board: eight stills from src/board/Board.tsx.
//
//   node pipeline/dev/board.mjs                all eight, full size, into identity/board/
//   node pipeline/dev/board.mjs 3 5            only pages 3 and 5
//   node pipeline/dev/board.mjs --draft        half size into .cache/board/ (for a quick look)
//
// Every page is rendered with the text probe on, and the script reports any text under YouTube's
// buttons, any text spilling out of its paper, and the caption's size, contrast and position.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { CAPTION } from '../../src/shared/paper.mjs';
import { CACHE, ROOT } from '../lib/paths.mjs';
import { findBrowser, getBundle } from '../lib/render.mjs';

const NAMES = ['palette', 'type', 'product', 'coin-stack-chart', 'stamp', 'caption-highlight', 'note-cut', 'inverted'];
const args = process.argv.slice(2);
const draft = args.includes('--draft');
const frameArg = args.find((a) => a.startsWith('--frame='));
const frame = frameArg ? +frameArg.split('=')[1] : 48;
const pages = args.filter((a) => /^\d+$/.test(a)).map(Number);
const want = pages.length ? pages : NAMES.map((_, i) => i + 1);
const outDir = draft ? path.join(CACHE, 'board') : path.join(ROOT, 'identity', 'board');
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await getBundle({ log: (m) => console.log(m) });
const common = { browserExecutable: findBrowser(), chromiumOptions: { gl: process.env.SHORTS_GL || 'angle' }, logLevel: 'error' };
let bad = 0;
const files = [];
for (const page of want) {
  const inputProps = { page, probe: true };
  const composition = await selectComposition({ serveUrl, id: 'Board', inputProps, ...common });
  const output = path.join(outDir, `${String(page).padStart(2, '0')}-${NAMES[page - 1]}.png`);
  let probe = null;
  await renderStill({
    composition,
    serveUrl,
    output,
    frame,
    inputProps,
    imageFormat: 'png',
    scale: draft ? 0.5 : 1,
    onBrowserLog: (l) => {
      const m = /^SAFEPROBE (.*)$/.exec(l.text);
      if (m) probe = JSON.parse(m[1]);
      else if (l.type === 'error') console.log(`   browser: ${l.text.slice(0, 300)}`);
    },
    ...common,
  });
  files.push(output);
  const notes = [];
  if (!probe) notes.push('no probe report');
  else {
    for (const h of probe.hits) notes.push(`text "${h.t}" in the ${h.zone} zone at [${h.box.join(', ')}]`);
    for (const o of probe.overflow) notes.push(`text "${o.t}" spills ${o.by}px out of its paper`);
    for (const c of probe.captions) {
      if (c.fontPx < 60) notes.push(`caption is ${c.fontPx}px`);
      if (c.contrast < 7) notes.push(`caption contrast ${c.contrast}:1`);
      if (c.top < CAPTION.thirdTop || c.bottom > CAPTION.thirdBottom) notes.push(`caption at ${Math.round(c.top)}-${Math.round(c.bottom)}, outside the centre third`);
    }
  }
  bad += notes.length;
  const cap = probe?.captions?.[0];
  console.log(`${String(page).padStart(2)} ${NAMES[page - 1].padEnd(18)} ${probe ? `${probe.n} text boxes` : ''}${cap ? `, caption ${cap.fontPx}px ${cap.contrast}:1 at y ${Math.round(cap.top)}-${Math.round(cap.bottom)}` : ''}${notes.length ? `\n     ! ${notes.join('\n     ! ')}` : '   ok'}`);
}
if (files.length > 1) {
  const sheet = path.join(outDir, 'sheet.jpg'); // the one board file kept in git; the full-size PNGs are not
  const cols = Math.min(4, files.length);
  const rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]scale=540:-1[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 552}_${Math.floor(i / cols) * 972}`).join('|')}:fill=0x777777`, '-frames:v', '1', '-q:v', '3', sheet]);
  console.log(`sheet -> ${path.relative(ROOT, sheet)} (${cols}x${rows})`);
}
console.log(bad ? `${bad} problem(s) found` : 'no text problems found');
process.exitCode = bad ? 1 : 0;
