#!/usr/bin/env node
// Makes the Paper Money motion and sound test (identity/motion-test.mp4): about ten seconds,
// through the same stages a real video goes through. Fallback voice -> Whisper timing ->
// captions -> sound mix -> render -> the checks.
//
//   node pipeline/dev/motion.mjs            make it (skips the voice if it is already there)
//   node pipeline/dev/motion.mjs --stills   only the contact sheet of frames, no video
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { SCRIPT, motionPlan, motionSounds } from '../../src/board/motion-plan.mjs';
import { CAPTION } from '../../src/shared/paper.mjs';
import { LEVELS } from '../../src/shared/sound.mjs';
import { buildCaptions, displayWord } from '../lib/captions.mjs';
import { ASSETS, CACHE, CHANNEL_JSON, PYTHON, ROOT, exists, readJson, writeJson } from '../lib/paths.mjs';
import { findBrowser, getBundle, probeVideo, renderVideo, stageAudio } from '../lib/render.mjs';
import { spokenForm, tokens } from '../lib/text.mjs';

const FPS = 30;
const work = path.join(CACHE, 'motion');
fs.mkdirSync(work, { recursive: true });
const py = (script, args) => execFileSync(PYTHON, [path.join(ROOT, 'pipeline', script), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
const f = (seconds) => Math.round(seconds * FPS);
const stillsOnly = process.argv.includes('--stills');

// 1. voice (the fallback voice: this is a test, not an upload)
const text = SCRIPT.join('\n');
const voice = path.join(work, 'voice.clean.wav');
const spoken = path.join(work, 'spoken.txt');
if (!exists(voice) || !exists(spoken) || fs.readFileSync(spoken, 'utf8') !== spokenForm(text, {})) {
  const tts = { voice: 'bm_george', lang: 'en-gb', speed: 1.18, ...(readJson(CHANNEL_JSON, {}).tts || {}) };
  fs.writeFileSync(spoken, spokenForm(text, {}));
  py('voice.py', ['tts', spoken, voice, path.join(work, 'voice.report.json'), '--voice', tts.voice, '--lang', tts.lang, '--speed', String(tts.speed)]);
}

// 2. word timings
const scriptWords = tokens(text);
const wordsFile = path.join(work, 'words.json');
if (!exists(wordsFile) || fs.statSync(wordsFile).mtimeMs < fs.statSync(voice).mtimeMs) {
  writeJson(path.join(work, 'script-words.json'), scriptWords);
  py('transcribe.py', [voice, path.join(work, 'script-words.json'), wordsFile, '--prompt', 'Glossary: Costco.']);
}
const timing = readJson(wordsFile);
const words = timing.words;
if (words.length !== scriptWords.length) throw new Error('word timings do not line up with the script');
console.log(`voice ${readJson(path.join(work, 'voice.report.json')).after.seconds}s, ${(timing.match * 100).toFixed(0)}% of words matched`);

// 3. cues: the frames of the words the pictures hang on
const at = (word, nth = 1) => {
  let seen = 0;
  const i = scriptWords.findIndex((w) => displayWord(w).toLowerCase() === word.toLowerCase() && ++seen === nth);
  if (i < 0) throw new Error(`"${word}" is not in the script`);
  return i;
};
const start = (i) => words[i].start;
const cues = {
  billion: f(start(at('billion')) - 0.1),
  just: f(start(at('just')) - 0.1),
  walk: f(start(at('walk')) - 0.1),
  s2: f(start(at('Costco')) - 0.12),
  earned: f(start(at('earned'))),
  earnedEnd: f(words[at('billion', 2)].end),
  s3: f(start(at('The')) - 0.12),
  half: f(start(at('half')) - 0.04),
};
const total = Math.max(f(words[words.length - 1].end + 1.0), cues.half + 34);
const captions = buildCaptions(words).map((p) => ({ from: f(p.start), to: Math.max(f(p.start) + 2, f(p.end)), words: p.words.map((w) => ({ t: w.t, from: f(w.start), to: Math.max(f(w.start) + 1, f(w.end)) })) }));
const props = { durationInFrames: total, captions, cues, audio: null, probe: false };
console.log(`cues ${JSON.stringify(cues)}; ${total} frames (${(total / FPS).toFixed(1)}s); ${captions.length} caption pages; pattern break at ${(motionPlan(cues).breakAt / FPS).toFixed(1)}s`);

const serveUrl = await getBundle({ log: (m) => console.log(m) });
const common = { browserExecutable: findBrowser(), chromiumOptions: { gl: 'swangle' }, logLevel: 'error' };
const sheetOf = async (frames, name) => {
  const composition = await selectComposition({ serveUrl, id: 'Motion', inputProps: props, ...common });
  const dir = path.join(work, 'stills');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const frame of frames) {
    const output = path.join(dir, `f${String(frame).padStart(4, '0')}.png`);
    await renderStill({ composition, serveUrl, output, frame: Math.min(frame, total - 1), inputProps: props, imageFormat: 'png', scale: 0.25, ...common });
    files.push(output);
  }
  const sheet = path.join(work, name);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...files.flatMap((x) => ['-i', x]), '-filter_complex', `${files.map((_, i) => `[${i}:v]null[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % 8) * 274}_${Math.floor(i / 8) * 484}`).join('|')}:fill=0x777777`, '-frames:v', '1', sheet]);
  return sheet;
};
if (stillsOnly) {
  const p = motionPlan(cues);
  const frames = [0, 2, 5, 10, cues.billion + 4, cues.walk + 8, cues.s2 - 2, cues.s2 + 3, cues.s2 + 6, cues.s2 + 16, cues.earned + 12, p.breakAt - 4, p.breakAt + 2, p.breakAt + 12, cues.s3 + 2, cues.s3 + 4, cues.s3 + 12, p.countEnd, cues.half - 4, cues.half - 1, cues.half + 1, cues.half + 6, cues.half + 14, total - 2];
  console.log(`stills -> ${await sheetOf(frames, 'sheet.png')}`);
  process.exit(0);
}

// 4. the soundtrack, from the same timeline
const plan = { seconds: total / FPS, music: 'music/caper.ogg', musicUnderVoiceDb: LEVELS.musicUnderVoiceDb, musicInGapsDb: LEVELS.musicInGapsDb, events: motionSounds(cues, FPS) };
writeJson(path.join(work, 'sound.plan.json'), plan);
const mix = path.join(work, 'mix.wav');
py('mix.py', [voice, path.join(work, 'sound.plan.json'), ASSETS, mix, path.join(work, 'mix.report.json')]);
const mr = readJson(path.join(work, 'mix.report.json'));
console.log(`mix ${mr.final.lufs} LUFS, peak ${mr.final.true_peak_db} dB, bed ${mr.music.db_under_voice_while_speaking} dB under the voice, ${mr.effects.count} effects${mr.problems.length ? `\n  ! ${mr.problems.join('\n  ! ')}` : ''}`);

// 5. render
const out = path.join(ROOT, 'identity', 'motion-test.mp4');
const t0 = Date.now();
await renderVideo({ ...props, audio: stageAudio(serveUrl, 'motion', mix) }, out, { id: 'Motion' });
console.log(`rendered ${(total / FPS).toFixed(1)}s in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${path.relative(ROOT, out)}`);

// 6. the checks a real video gets
py('qa_video.py', [out, path.join(work, 'qa.video.json')]);
const vr = readJson(path.join(work, 'qa.video.json'));
const probe = await probeVideo(props, { step: 3, id: 'Motion' });
// during the tear and the whip, text travels through the frame edges for a few blurred frames: not a zone problem
const moving = (frame) => (frame >= cues.s2 - 1 && frame <= cues.s2 + 12) || (frame >= cues.s3 - 1 && frame <= cues.s3 + 8);
const hits = probe.frames.filter((fr) => !moving(fr.frame)).flatMap((fr) => fr.hits.map((h) => `${(fr.frame / FPS).toFixed(1)}s "${h.t}" ${h.zone === 'cut' ? 'is cut off by the frame edge' : `in the ${h.zone} zone`}`));
const spills = probe.frames.flatMap((fr) => (fr.overflow || []).map((o) => `${(fr.frame / FPS).toFixed(1)}s "${o.t}" spills ${o.by}px`));
const caps = probe.frames.flatMap((fr) => fr.captions || []);
const capBad = caps.filter((c) => c.fontPx < 60 || c.contrast < 7 || c.top < CAPTION.thirdTop || c.bottom > CAPTION.thirdBottom).length;
const shown = captions.flatMap((p) => p.words.map((w) => w.t)).join(' ');
const expected = scriptWords.map(displayWord).join(' ');
const report = {
  format: vr.format,
  loudness: vr.loudness,
  loudness_ffprobe: vr.loudness_ffprobe,
  visual_change: vr.visual_change,
  frames_probed: probe.frames.length,
  text_in_button_zones: [...new Set(hits)],
  text_spilling: [...new Set(spills)],
  captions: { pages: captions.length, frames_with_caption: caps.length, out_of_spec: capBad, match_script: shown === expected },
  soundtrack: mr,
};
writeJson(path.join(work, 'report.json'), report);
console.log(`checks: ${vr.format.width}x${vr.format.height} ${vr.format.fps}fps ${vr.format.seconds}s ${vr.format.megabytes}MB, ${vr.loudness_ffprobe.lufs} LUFS (peak ${vr.loudness_ffprobe.true_peak_db} dB), longest still stretch ${vr.visual_change.longest_static_s}s, ${probe.frames.length} frames probed, ${report.text_in_button_zones.length} zone hits, ${report.text_spilling.length} spills, captions out of spec ${capBad}/${caps.length}, subtitles match script: ${report.captions.match_script}`);
for (const h of [...report.text_in_button_zones, ...report.text_spilling].slice(0, 12)) console.log(`  ! ${h}`);
