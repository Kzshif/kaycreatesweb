// Remotion rendering: bundle the animation once, then render stills, probe
// passes or the final MP4 for any storyboard.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderFrames, renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { CACHE, ROOT } from './paths.mjs';

const SRC = path.join(ROOT, 'src');
const BUNDLE_DIR = path.join(CACHE, 'bundle');
const HASH_FILE = path.join(CACHE, 'bundle.hash');

function srcHash() {
  const h = crypto.createHash('sha1');
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const st = fs.statSync(full);
        h.update(`${full}:${st.size}:${st.mtimeMs}\n`);
      }
    }
  };
  walk(SRC);
  h.update(fs.readFileSync(path.join(ROOT, 'package-lock.json')));
  return h.digest('hex');
}

/** Chrome for rendering. Uses the headless shell already on this machine. */
export function findBrowser() {
  if (process.env.SHORTS_BROWSER) return process.env.SHORTS_BROWSER;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    const dirs = fs.readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse();
    for (const d of dirs) {
      const exe = path.join(base, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
      if (fs.existsSync(exe)) return exe;
    }
  }
  return undefined; // Remotion will try to download its own
}

let bundled = null;
/** Bundle src/ with webpack. Cached on disk until a source file changes. */
export async function getBundle({ log = () => {} } = {}) {
  if (bundled) return bundled;
  const hash = srcHash();
  const cached = fs.existsSync(HASH_FILE) && fs.readFileSync(HASH_FILE, 'utf8') === hash && fs.existsSync(path.join(BUNDLE_DIR, 'index.html'));
  if (!cached) {
    log('bundling animation code');
    fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
    fs.mkdirSync(CACHE, { recursive: true });
    await bundle({ entryPoint: path.join(SRC, 'index.ts'), outDir: BUNDLE_DIR, publicDir: path.join(ROOT, 'public'), enableCaching: true });
    fs.writeFileSync(HASH_FILE, hash);
  }
  bundled = BUNDLE_DIR;
  return bundled;
}

/** Make a local audio file reachable by the renderer; returns the path to put in props.audio. */
export function stageAudio(serveUrl, id, file) {
  const dir = path.join(serveUrl, 'public', 'audio');
  fs.mkdirSync(dir, { recursive: true });
  const name = `${id}-${fs.statSync(file).mtimeMs.toFixed(0)}${path.extname(file)}`;
  for (const old of fs.readdirSync(dir)) if (old.startsWith(`${id}-`) && old !== name) fs.rmSync(path.join(dir, old));
  fs.copyFileSync(file, path.join(dir, name));
  return `audio/${name}`;
}

/**
 * The desk never changes during a video, so it is drawn once (and once more in negative when the
 * pattern break flips the colours) and every frame reuses the picture. Returns the props to set.
 */
export async function bakeBackdrop(props, workDir) {
  const serveUrl = await getBundle();
  const dir = path.join(serveUrl, 'public', 'backdrop');
  fs.mkdirSync(dir, { recursive: true });
  const out = {};
  const want = [['backdrop', props.look.inverted]];
  if (props.patternBreak?.kind === 'invert') want.push(['backdropAlt', !props.look.inverted]);
  for (const [key, inverted] of want) {
    const inputProps = { ...props, look: { ...props.look, inverted }, only: 'backdrop', audio: null, probe: false, durationInFrames: 1 };
    const composition = await selectComposition({ serveUrl, id: 'Short', inputProps, ...common() });
    const name = `${props.id}-${props.look.accent}-${inverted ? 'ink' : 'cream'}.png`;
    const file = path.join(workDir, name);
    await renderStill({ composition, serveUrl, output: file, frame: 0, inputProps, imageFormat: 'png', ...common() });
    fs.copyFileSync(file, path.join(dir, name));
    out[key] = `backdrop/${name}`;
  }
  return out;
}

// 'angle' renders the same pictures as 'swangle' (only edge anti-aliasing differs) but runs the
// workers in parallel: measured 175 ms against 2,160 ms a frame on four cores.
const common = () => ({ browserExecutable: findBrowser(), chromiumOptions: { gl: process.env.SHORTS_GL || 'angle' }, logLevel: 'error' });
const cores = () => Math.max(1, Math.min(os.cpus().length, 8));

/** Render single frames as PNG. With `onProbe`, each frame also reports its safe-zone check. */
export async function renderStills(props, frames, outDir, { scale = 1, onProbe = null } = {}) {
  const serveUrl = await getBundle();
  const inputProps = onProbe ? { ...props, probe: true } : props;
  const composition = await selectComposition({ serveUrl, id: 'Short', inputProps, ...common() });
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const frame of frames) {
    const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
    await renderStill({
      composition,
      serveUrl,
      output,
      frame: Math.min(frame, composition.durationInFrames - 1),
      inputProps,
      imageFormat: 'png',
      scale,
      onBrowserLog: (l) => {
        const m = /^SAFEPROBE (.*)$/.exec(l.text);
        if (m && onProbe) onProbe(JSON.parse(m[1]));
      },
      ...common(),
    });
    files.push(output);
  }
  return files;
}

/**
 * Safe-zone pass: renders every `step`-th frame with the probe on and collects
 * what the probe reports. Returns { frames: [{frame, n, area, hits}] }.
 */
export async function probeVideo(props, { step = 6, onProgress, id = 'Short' } = {}) {
  const serveUrl = await getBundle();
  const inputProps = { ...props, probe: true, audio: null };
  const composition = await selectComposition({ serveUrl, id, inputProps, ...common() });
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'shorts-probe-'));
  const reports = new Map();
  try {
    await renderFrames({
      composition,
      serveUrl,
      inputProps,
      outputDir: out,
      imageFormat: 'jpeg',
      jpegQuality: 40,
      everyNthFrame: step,
      scale: 0.25,
      concurrency: cores(),
      onStart: () => {},
      onFrameUpdate: (n) => onProgress?.(n),
      onBrowserLog: (l) => {
        const m = /^SAFEPROBE (.*)$/.exec(l.text);
        if (m) {
          const r = JSON.parse(m[1]);
          reports.set(r.frame, r);
        }
      },
      ...common(),
    });
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
  return { frames: [...reports.values()].sort((a, b) => a.frame - b.frame) };
}

export async function renderVideo(props, output, { onProgress, id = 'Short' } = {}) {
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id, inputProps: props, ...common() });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const tmp = `${output}.rendering.mp4`;
  await renderMedia({
    composition,
    serveUrl,
    inputProps: props,
    codec: 'h264',
    outputLocation: tmp,
    crf: 17,
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    imageFormat: 'jpeg',
    jpegQuality: 96,
    audioCodec: 'aac',
    audioBitrate: '256k',
    concurrency: cores(),
    overwrite: true,
    onProgress: ({ progress }) => onProgress?.(progress),
    ...common(),
  });
  fs.renameSync(tmp, output); // a half-written file never looks finished
  return output;
}
