#!/usr/bin/env node
// Gameplay shorts: opinion shorts cut from your own gameplay recordings.
//
//   node pipeline/gameplay.mjs footage <file.mp4>   copy a recording in and make a contact sheet to pick moments from
//   node pipeline/gameplay.mjs make <id>            voice, timing, render, loudness, subtitles
//   node pipeline/gameplay.mjs layout <id>          render three stills without footage, to check the layout
//
// A video lives in gameplay/videos/<id>-<slug>/ with script.md (front matter + one line per
// sentence) and clips.json (the moments of the recording to use, in seconds). Recordings live in
// gameplay/footage/ and never go into git. Only use footage you recorded yourself.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { common, renderVideo, getBundle } from './lib/render.mjs';
import { buildCaptions, displayWord } from './lib/captions.mjs';
import { parseScript } from './lib/script.mjs';
import { spokenForm } from './lib/text.mjs';
import { ASSETS, PYTHON, ROOT } from './lib/paths.mjs';

const G = path.join(ROOT, 'gameplay');
const FOOTAGE = path.join(G, 'footage');
const VIDEOS = path.join(G, 'videos');
// frame rate from gameplay/channel.json (60 keeps gameplay as smooth as it was recorded)
const FPS = (() => {
  try {
    return +JSON.parse(fs.readFileSync(path.join(G, 'channel.json'), 'utf8')).fps || 30;
  } catch {
    return 30;
  }
})();
const log = (...a) => console.log(...a);
const py = (script, args) => execFileSync(PYTHON, [path.join(ROOT, 'pipeline', script), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, x) => fs.writeFileSync(f, `${JSON.stringify(x, null, 2)}\n`);
const pickMusic = (list, id) => (Array.isArray(list) ? list[(Number(id) - 1) % list.length] : list);
const channel = () => (fs.existsSync(path.join(G, 'channel.json')) ? readJson(path.join(G, 'channel.json')) : {});

function findVideo(id) {
  const want = String(id).padStart(3, '0');
  const name = fs.existsSync(VIDEOS) ? fs.readdirSync(VIDEOS).find((d) => d.startsWith(`${want}-`)) : null;
  if (!name) throw new Error(`no gameplay video ${want} in ${VIDEOS}`);
  const dir = path.join(VIDEOS, name);
  return { id: want, name, dir, work: path.join(dir, 'work'), out: path.join(dir, 'out') };
}

/** Copy a file into the render bundle's public folder and return its path there. */
async function stage(file, sub) {
  const serveUrl = await getBundle({ log });
  const dir = path.join(serveUrl, 'public', sub);
  fs.mkdirSync(dir, { recursive: true });
  const name = path.basename(file);
  const dest = path.join(dir, name);
  if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(file).size) fs.copyFileSync(file, dest);
  return `${sub}/${name}`;
}

// ---------------------------------------------------------------- footage
function footage(file) {
  if (!file || !fs.existsSync(file)) throw new Error(`no such file: ${file}`);
  fs.mkdirSync(FOOTAGE, { recursive: true });
  const dest = path.join(FOOTAGE, path.basename(file).replace(/[^\w.-]+/g, '-'));
  if (path.resolve(file) !== dest) fs.copyFileSync(file, dest);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', dest], { encoding: 'utf8' }));
  const dur = +probe.format.duration;
  const v = probe.streams.find((s) => s.codec_type === 'video') || {};
  // scene changes: where the picture jumps
  let cuts = [];
  try {
    cuts = [...String(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${dest}" -vf "select='gt(scene,0.32)',showinfo" -an -f null - 2>&1 | grep -o 'pts_time:[0-9.]*' | cut -d: -f2`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })).split('\n')].filter(Boolean).map(Number);
  } catch {
    /* no cuts found */
  }
  // loud moments: one-second loudness, the top 12 peaks at least 3s apart
  let loud = [];
  try {
    const txt = String(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${dest}" -af ebur128=peak=none -f null - 2>&1 | grep -o 't: *[0-9.]* .*M: *-*[0-9.]*' | sed -E 's/t: *([0-9.]+).*M: *(-?[0-9.]+)/\\1 \\2/'`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }));
    const rows = txt.split('\n').filter(Boolean).map((l) => l.split(' ').map(Number)).filter((r) => r.length === 2 && Number.isFinite(r[1]));
    const sorted = [...rows].sort((a, b) => b[1] - a[1]);
    for (const [t, m] of sorted) if (loud.length < 12 && loud.every((x) => Math.abs(x.t - t) > 3)) loud.push({ t: +t.toFixed(1), lufs: m });
    loud = loud.sort((a, b) => a.t - b.t);
  } catch {
    /* silent footage */
  }
  // contact sheet: one frame every few seconds with its time, to choose moments by eye
  const every = Math.max(2, Math.round(dur / 48));
  const sheet = dest.replace(/\.[^.]+$/, '.sheet.jpg');
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', dest, '-vf', `fps=1/${every},scale=480:-1,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x8`, '-frames:v', '1', sheet]);
  const info = { file: path.basename(dest), seconds: +dur.toFixed(2), width: v.width, height: v.height, fps: v.r_frame_rate, sheetEvery: every, cuts: cuts.map((c) => +c.toFixed(2)), loud };
  writeJson(dest.replace(/\.[^.]+$/, '.json'), info);
  log(`  footage  ${info.file}: ${info.seconds}s ${info.width}x${info.height}, ${cuts.length} scene changes, sheet -> ${path.relative(ROOT, sheet)} (a frame every ${every}s)`);
  return info;
}


// ------------------------------------------------------------------- cut
// moments.json: { "source": "<file in gameplay/footage>", "shots": [{ "at": 614, "len": 2.1, "note": "...", "zoom": 1.1 }] }
// Cuts each moment out of the long recording (starting a beat before `at`), joins them into one
// small file for this video and writes clips.json to match, so the render never touches the
// full recording.
function cut(id) {
  const v = findVideo(id);
  const spec = readJson(path.join(v.dir, 'moments.json'));
  const src = path.join(FOOTAGE, spec.source);
  if (!fs.existsSync(src)) throw new Error(`footage ${spec.source} is not in gameplay/footage/`);
  const tmp = path.join(v.work, 'shots');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const clips = [];
  const list = [];
  let frames = 0;
  const L = +(channel().lead ?? 1);
  const shots = spec.shots.map((s, i) => (i === 0 && L ? { ...s, len: s.len + L, lead: (s.lead ?? 0.4) + L } : s));
  shots.forEach((s, i) => {
    const out = path.join(tmp, `s${String(i).padStart(2, '0')}.mp4`);
    const start = Math.max(0, s.at - (s.lead ?? 0.4));
    const n = Math.round((s.len + 0.2) * FPS);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', start.toFixed(3), '-i', src, '-frames:v', String(n), '-t', (n / FPS).toFixed(3), '-vf', `scale=1920:1080,fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-af', 'apad', '-shortest', out]);
    list.push(`file '${out}'`);
    const at = frames / FPS;
    clips.push({ start: +at.toFixed(3), end: +(at + s.len).toFixed(3), zoom: s.zoom ?? spec.zoom ?? 1, fx: s.fx ?? spec.fx ?? 0.5, fy: s.fy ?? spec.fy ?? 0.5 });
    frames += n;
  });
  fs.writeFileSync(path.join(tmp, 'list.txt'), `${list.join('\n')}\n`);
  const name = `${v.id}-selects.mp4`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', path.join(FOOTAGE, name)]);
  writeJson(path.join(v.dir, 'clips.json'), clips);
  const sf = path.join(v.dir, 'script.md');
  fs.writeFileSync(sf, fs.readFileSync(sf, 'utf8').replace(/^footage:.*$/m, `footage: ${name}`));
  // a strip of the first, middle and last frame of every shot, to check the picks by eye
  const sheet = path.join(v.work, 'shots.jpg');
  try {
    execFileSync('bash', ['-c', `cd "${tmp}" && rm -f t_*.jpg && i=0; for c in $(seq 0 ${clips.length - 1}); do for k in 0.15 0.5 0.85; do t=$(python3 -c "print(${JSON.stringify(clips)}[$c]['start'] + (${JSON.stringify(clips)}[$c]['end']-${JSON.stringify(clips)}[$c]['start'])*$k)"); ffmpeg -v error -y -ss $t -i "${path.join(FOOTAGE, name)}" -frames:v 1 -vf scale=320:-1 t_$(printf %03d $i).jpg; i=$((i+1)); done; done; ffmpeg -v error -y -pattern_type glob -i 't_*.jpg' -vf tile=3x${clips.length}:padding=4 -frames:v 1 "${sheet}"`]);
  } catch {
    /* the check sheet is a convenience; the cut itself is done */
  }
  log(`  cut      ${clips.length} shots -> gameplay/footage/${name}, sheet -> ${path.relative(ROOT, sheet)}`);
}

// ------------------------------------------------------------------ thumb
// One vertical thumbnail per video: a bright frame from the recording (front matter `thumb:`
// gives its time in the recording, otherwise the first shot), the hook huge, the verdict stamped.
async function thumb(id) {
  const v = findVideo(id);
  const script = parseScript(path.join(v.dir, 'script.md'));
  const m = script.meta;
  const spec = readJson(path.join(v.dir, 'moments.json'));
  const at = +(m.thumb || spec.shots[0].at + 0.5);
  fs.mkdirSync(v.work, { recursive: true });
  fs.mkdirSync(v.out, { recursive: true });
  const still = path.join(v.work, `thumb-${v.id}.png`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(at), '-i', path.join(FOOTAGE, spec.source), '-frames:v', '1', still]);
  const ch = channel();
  const lines = String(m.thumbTitle || m.title || '').split('|').map((x) => x.trim()).filter(Boolean);
  const props = { image: await stage(still, 'thumbs'), lines, hl: m.thumbHl || m.hl || null, stamp: m.stamp ? String(m.stamp).split('@')[0].trim() : null, watermark: ch.watermark || null, fx: spec.fx ?? 0.45, fy: 0.3, zoom: 1.2 };
  const { renderStill, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await getBundle({ log });
  const composition = await selectComposition({ serveUrl, id: 'GameplayThumb', inputProps: props, ...common() });
  const out = path.join(v.out, 'thumbnail.png');
  await renderStill({ composition, serveUrl, output: out, frame: 0, inputProps: props, imageFormat: 'png', ...common() });
  log(`  thumb    ${path.relative(ROOT, out)}`);
}

// ------------------------------------------------------------------- make
async function make(id, { layoutOnly = false, voiceOnly = false, pagesOnly = false } = {}) {
  const v = findVideo(id);
  fs.mkdirSync(v.work, { recursive: true });
  fs.mkdirSync(v.out, { recursive: true });
  const scriptFile = path.join(v.dir, 'script.md');
  const script = parseScript(scriptFile);
  const m = script.meta;
  const ch = channel();
  const vid = m.voice || ch.voice?.id || 'am_fenrir';
  // British voices (b...) read in en-gb, American ones (a...) in en-us
  const voice = { id: vid, lang: m.lang || (vid.startsWith('b') ? 'en-gb' : 'en-us'), speed: +(m.speed || ch.voice?.speed || 1.05) };

  // voice-over
  const wav = path.join(v.work, 'voice.wav');
  const rep = path.join(v.work, 'voice.report.json');
  const spoken = path.join(v.work, 'spoken.txt');
  const text = spokenForm(script.text, script.say);
  const stale = !fs.existsSync(wav) || !fs.existsSync(spoken) || fs.readFileSync(spoken, 'utf8') !== text || readJson(rep).voice !== voice.id;
  if (stale) {
    fs.writeFileSync(spoken, text);
    py('voice.py', ['tts', spoken, wav, rep, '--voice', voice.id, '--lang', voice.lang, '--speed', String(voice.speed)]);
    fs.rmSync(path.join(v.dir, 'words.json'), { force: true });
  }
  const secs = readJson(rep).after.seconds;
  log(`  voice    ${voice.id}, ${secs}s`);

  // word timings
  const words = path.join(v.dir, 'words.json');
  if (!fs.existsSync(words)) {
    const sw = path.join(v.work, 'script-words.json');
    writeJson(sw, script.words);
    py('transcribe.py', [wav, sw, words, '--prompt', `Glossary: GTA, Rockstar, ${[...script.names].join(', ')}.`]);
  }
  const t = readJson(words);
  log(`  timing   ${(t.match * 100).toFixed(0)}% of words matched`);
  if (voiceOnly) return;
  const f = (s) => Math.round(s * FPS);
  // a beat of picture and music before the first word, so nobody swipes in on a half-heard line
  const lead = Math.round(+(m.lead ?? ch.lead ?? 1) * FPS);
  const total = f(secs + 0.6) + lead;
  // Subtitle pages: at most three words (four when a pair must stay together), broken at full
  // stops and commas, never straight after a word that leans on the next ("GTA | 6", "to | Vice")
  // and never between a number and its unit ("90 | million").
  const leans = (w) => /^(gta|a|an|the|of|to|and|for|in|on|my|your|is|its|it's|than|over|just)$/i.test(String(w).replace(/[^A-Za-z']/g, ''));
  const unit = (w) => /^(million|billion|thousand|years?|dollars?|percent|of)$/i.test(String(w || '').replace(/[^A-Za-z]/g, ''));
  // pairs that read as one thing and stay on the same page
  const KEEP = /^(gta \d|download code|physical copy|vice city|ultimate edition|standard edition|driving simulator|marketing campaign|bad news|big games|bonus cars|extra shops|fake florida|first trailer|three reasons|most overhyped|game ever|ten dollars|change my|my mind|boxed copy|a disc|a box|a game|the map|a remix|thirteen years|came out|it came|out of|a lot|lot of|of it|all of|6 fan|their life|life story|60 fps|30 fps|frame rate|same frame|30 frames|frames per|per second)$/i;
  const norm = (w) => String(w || '').toLowerCase().replace(/[^a-z0-9$-]/g, '');
  // best split of a clause into pages of 1-4 words: short pages, no break inside a pair, few singles
  const chunk = (ws) => {
    const n = ws.length;
    const bad = (c) => leans(ws[c - 1].w) || (/\d/.test(ws[c - 1].w) && unit(ws[c].w)) || KEEP.test(`${norm(ws[c - 1].w)} ${norm(ws[c].w)}`);
    const pageCost = (a, b) => {
      const len = b - a;
      const chars = ws.slice(a, b).map((x) => x.w).join(' ').length;
      if (len === 1) return n === 1 ? 0 : 4;
      if (len <= 3) return chars > 24 ? 1.5 : 0;
      if (len === 4) return chars > 22 ? 2.5 : 0.8;
      if (len === 5 && chars <= 16) return 1.5;
      return Infinity;
    };
    const best = [0];
    const from = [0];
    for (let j = 1; j <= n; j++) {
      best[j] = Infinity;
      for (let L = 1; L <= 5 && L <= j; L++) {
        const a = j - L;
        const c = best[a] + pageCost(a, j) + (a > 0 && bad(a) ? 10 : 0) + 0.3;
        if (c < best[j]) {
          best[j] = c;
          from[j] = a;
        }
      }
    }
    const out = [];
    for (let j = n; j > 0; j = from[j]) out.unshift(ws.slice(from[j], j));
    return out;
  };
  const pagesFor = (words) => {
    const clauses = [];
    let cur = [];
    for (const w of words) {
      cur.push(w);
      if (/[.!?,;:]["')\]]*$/.test(w.w)) {
        clauses.push(cur);
        cur = [];
      }
    }
    if (cur.length) clauses.push(cur);
    // a one-word clause ("guns,") joins the next one so nothing flashes up alone
    const merged = [];
    for (let k = 0; k < clauses.length; k++) {
      if (clauses[k].length === 1 && k + 1 < clauses.length && !/[.!?]$/.test(clauses[k][0].w)) clauses[k + 1] = [...clauses[k], ...clauses[k + 1]];
      else merged.push(clauses[k]);
    }
    const out = merged.flatMap(chunk).map((ws) => ({ start: ws[0].start, end: ws[ws.length - 1].end, words: ws.map((x) => ({ t: displayWord(x.w), start: x.start, end: x.end })).filter((x) => x.t) }));
    // hold each page until the next begins when the gap is short, so captions never flicker
    for (let k = 0; k < out.length; k++) {
      const nx = out[k + 1];
      if (nx) {
        const gap = nx.start - out[k].end;
        out[k].end = gap < 0.45 ? nx.start : out[k].end + 0.22;
      } else out[k].end += 0.3;
    }
    return out.filter((p) => p.words.length);
  };
  const pages = pagesFor(t.words).map((p) => ({ from: lead + f(p.start), to: lead + Math.max(f(p.start) + 2, f(p.end)), words: p.words.map((w) => ({ t: w.t, from: lead + f(w.start), to: lead + Math.max(f(w.start) + 1, f(w.end)) })) }));

  if (pagesOnly) {
    log(`  pages    ${pages.map((p) => p.words.map((w) => w.t).join(' ')).join(' / ')}`);
    return;
  }
  // the stamp lands on a word: "Overrated @ overrated"
  let stamp = null;
  if (m.stamp) {
    const [label, at] = String(m.stamp).split('@').map((s) => s.trim());
    // "30 #4" lands on the fourth "30"
    const [word, nth] = String(at || label).split('#').map((s) => s.trim());
    const key = word.toLowerCase().replace(/[^a-z0-9$]/g, '');
    const hits = t.words.filter((w) => String(w.w ?? w.t).toLowerCase().replace(/[^a-z0-9$]/g, '') === key);
    const hit = hits[Math.max(0, (Number(nth) || 1) - 1)];
    if (hit) stamp = { frame: lead + f(hit.start), text: label };
  }

  // the moments of the recording to use
  const clipsFile = path.join(v.dir, 'clips.json');
  const clips = fs.existsSync(clipsFile) ? readJson(clipsFile) : [{ start: 0, end: 2.5 }, { start: 3, end: 5.5, zoom: 1.25 }, { start: 6, end: 8.5 }];
  const src = !layoutOnly && m.footage ? path.join(FOOTAGE, m.footage) : null;
  if (src && !fs.existsSync(src)) throw new Error(`footage ${m.footage} is not in gameplay/footage/ (run: node pipeline/gameplay.mjs footage <file>)`);

  const sfx = [];
  const sfxFile = async (name) => stage(path.join(ASSETS, 'sfx', name), 'sfx');
  if (!layoutOnly) {
    if (stamp) {
      sfx.push({ src: await sfxFile('stamp-1.wav'), frame: stamp.frame, volume: 0.9 });
      sfx.push({ src: await sfxFile('boom-1.wav'), frame: stamp.frame, volume: 0.6 });
    }
    let at = 0;
    for (const c of clips.slice(0, -1)) {
      at += Math.round((c.end - c.start) * FPS);
      if (at < total - 6) sfx.push({ src: await sfxFile('whip-1.wav'), frame: Math.max(0, at - 3), volume: 0.22 });
    }
  }
  const title = String(m.title || '').split('|').map((s) => s.trim()).filter(Boolean);
  const props = {
    id: v.id,
    durationInFrames: total,
    fps: FPS,
    footage: src ? await stage(src, 'footage') : null,
    clips,
    layout: m.layout === 'full' ? 'full' : 'band',
    title,
    hl: m.hl || null,
    captions: pages,
    stamp,
    audio: layoutOnly ? null : await stage(wav, `voice-${v.id}`),
    gameVolume: +(m.game ?? ch.gameVolume ?? 0.14),
    sfx,
    handle: ch.handle || null,
    accent: '#E8202A',
    lead,
    watermark: ch.watermark || null,
    tag: m.tag || (ch.series ? `${ch.series} #${Number(v.id)}` : null),
    music: !layoutOnly && (m.music || ch.music) && (m.music || ch.music) !== 'none' ? await stage(path.join(ASSETS, 'music', `${m.music || pickMusic(ch.music, v.id)}.ogg`), 'music') : null,
    musicVolume: +(m.musicVolume ?? ch.musicVolume ?? 0.16),
  };
  writeJson(path.join(v.work, 'props.json'), props);

  if (layoutOnly) {
    const frames = [12, stamp ? stamp.frame + 10 : Math.round(total / 2), total - 15];
    await renderStillsFor(props, frames, path.join(v.work, 'layout'));
    log(`  layout   stills -> ${path.relative(ROOT, path.join(v.work, 'layout'))}`);
    return;
  }
  const raw = path.join(v.work, 'render.mp4');
  await renderVideo(props, raw, { id: 'Gameplay' });
  const final = path.join(v.out, `${v.name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.82:level=disabled', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', final]);
  // subtitles file for upload
  const srt = pages.map((p, i) => `${i + 1}\n${ts(p.from / FPS)} --> ${ts(p.to / FPS)}\n${p.words.map((w) => w.t).join(' ')}\n`).join('\n');
  fs.writeFileSync(path.join(v.out, 'captions.srt'), srt);
  log(`  render   ${path.relative(ROOT, final)} (${(total / FPS).toFixed(1)}s, loudness -14 LUFS)`);
}

const ts = (s) => {
  const ms = Math.round(s * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const mi = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const se = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${mi}:${se},${String(ms % 1000).padStart(3, '0')}`;
};

async function renderStillsFor(props, frames, dir) {
  // renderStills renders the main composition; render the gameplay one frame by frame instead
  const { renderStill, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await getBundle({ log });
  const composition = await selectComposition({ serveUrl, id: 'Gameplay', inputProps: props, ...common() });
  fs.mkdirSync(dir, { recursive: true });
  for (const frame of frames) await renderStill({ composition, serveUrl, output: path.join(dir, `f${String(frame).padStart(4, '0')}.png`), frame: Math.min(frame, composition.durationInFrames - 1), inputProps: props, imageFormat: 'png', scale: 0.5, ...common() });
}

const [cmd, arg] = process.argv.slice(2);
try {
  if (cmd === 'footage') footage(arg);
  else if (cmd === 'cut') cut(arg);
  else if (cmd === 'make') await make(arg);
  else if (cmd === 'voice') await make(arg, { voiceOnly: true });
  else if (cmd === 'thumb') await thumb(arg);
  else if (cmd === 'pages') await make(arg, { pagesOnly: true });
  else if (cmd === 'layout') await make(arg, { layoutOnly: true });
  else log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 11).join('\n'));
} catch (e) {
  console.error(`  FAIL  ${e.message}`);
  process.exit(1);
}
