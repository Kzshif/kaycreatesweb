#!/usr/bin/env node
// The pipeline's front door. Every command updates status.csv, so the work can
// stop at any point and resume later exactly where it left off.
//
//   node pipeline/cli.mjs status            table of every video and its stage
//   node pipeline/cli.mjs next              what each video needs next
//   node pipeline/cli.mjs new 004 slug      start a new video folder
//   node pipeline/cli.mjs check 001         script rules, fact file, storyboard, variety
//   node pipeline/cli.mjs voice 001         clean voice.wav (or fall back to TTS, flagged)
//   node pipeline/cli.mjs time 001          Whisper word timings, locked to the script
//   node pipeline/cli.mjs mix 001           soundtrack: voice + music bed + effects, -14 LUFS
//   node pipeline/cli.mjs render 001        render the MP4
//   node pipeline/cli.mjs qa 001            check the finished MP4
//   node pipeline/cli.mjs make 001|all      run every remaining step, stopping at the first failure
//   node pipeline/cli.mjs pack 001|all      copy the finished files to output/<id>-<company>/
//   node pipeline/cli.mjs preview 001       contact sheet of stills, to review the look by eye
//   node pipeline/cli.mjs mark 001 uploaded record that you uploaded it
//   node pipeline/cli.mjs batch pilots 001 002 003   batch report + zip of finished videos, in output/batches/
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { RULES } from '../src/shared/spec.mjs';
import { captionStats, buildCaptions, displayWord } from './lib/captions.mjs';
import { soundPlan } from '../src/shared/sound.mjs';
import { ASSETS, CHANNEL_JSON, LICENCES, OUTPUT, PYTHON, ROOT, VIDEOS, exists, findVideo, listVideos, mtime, padId, readJson, upToDate, videoFiles, writeJson } from './lib/paths.mjs';
import { checkVariety, screenFigures, signature, validatePlan } from './lib/plan.mjs';
import { pickVoice } from './lib/voices.mjs';
import { buildMetadata, buildSrt, lintPublish, publishFigures } from './lib/publish.mjs';
import { lintScript, parseScript } from './lib/script.mjs';
import { checkClaims, checkCoverage, parseSources, uncertainClaims } from './lib/sources.mjs';
import { STAGES, getRow, readStatus, setProblems, setStage, stageIndex, updateRow } from './lib/status.mjs';
import { figures, sentences, spokenForm, syntheticTimings } from './lib/text.mjs';
import { buildProps } from './lib/timing.mjs';
import { motionWindows, restingHits } from './lib/zones.mjs';

const log = (...a) => console.log(...a);
const channel = () => readJson(CHANNEL_JSON, {});
const errorsOf = (issues) => issues.filter((i) => i.level === 'error');
const fmt = (issues) => issues.map((i) => (i.level === 'error' ? i.message : `warning: ${i.message}`));
const py = (script, args) => execFileSync(PYTHON, [path.join(ROOT, 'pipeline', script), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

function show(title, issues) {
  if (!issues.length) return log(`  ok    ${title}`);
  const errs = errorsOf(issues).length;
  log(`  ${errs ? 'FAIL' : 'warn'}  ${title}`);
  for (const i of issues) log(`          ${i.level === 'error' ? 'x' : '!'} ${i.message}`);
}

/** Storyboards of the videos around this one, for the variety rules. */
function neighbours(v) {
  const all = listVideos();
  const sigOf = (x) => {
    const f = videoFiles(x).plan;
    if (!exists(f)) return null;
    try {
      const sig = signature(readJson(f), x.id);
      const sf = videoFiles(x).script;
      if (exists(sf)) sig.hook = parseScript(sf).meta.hook || '';
      return sig;
    } catch {
      return null;
    }
  };
  const before = all.filter((x) => x.id < v.id).reverse().map(sigOf).filter(Boolean);
  const afterV = all.find((x) => x.id > v.id && sigOf(x));
  return { before, after: afterV ? sigOf(afterV) : null };
}

// ------------------------------------------------------------- check -------
function check(v, { quiet = false } = {}) {
  const f = videoFiles(v);
  if (!quiet) log(`\n${v.name}`);
  const row = getRow(v.id) || updateRow(v.id, { topic: '' });
  let reached = 'idea';
  const out = { ok: false, script: null, plan: null };

  if (!exists(f.script)) {
    setProblems(v.id, 'script', ['script.md is missing']);
    if (!quiet) log('  FAIL  script.md is missing');
    return out;
  }
  const script = parseScript(f.script);
  out.script = script;
  const lint = lintScript(script);
  const publish = lintPublish(script);
  const title = script.meta.company && script.meta.topic ? `${script.meta.company}: ${script.meta.topic}` : row.topic;
  updateRow(v.id, { topic: title });

  // facts
  let srcIssues = [{ level: 'error', message: 'sources.md is missing' }];
  let coverage = [];
  let src = null;
  if (exists(f.sources)) {
    src = parseSources(f.sources);
    srcIssues = checkClaims(src);
  }
  const plan = exists(f.plan) ? readJson(f.plan) : null;
  out.plan = plan;
  if (src) coverage = checkCoverage(src, figures(script.text, { ignore: script.names }), plan ? screenFigures(plan, script.names) : [], publishFigures(script));

  // storyboard
  let planIssues = [{ level: 'error', message: 'video.json (the storyboard) is missing' }];
  let variety = [];
  let cadence = [];
  if (plan) {
    planIssues = validatePlan(plan, script, v.id).issues;
    const n = neighbours(v);
    const sig = { ...signature(plan, v.id), hook: script.meta.hook || '' };
    variety = checkVariety(sig, n.before, n.after);
    for (const [other, label] of [[n.before[0], 'the previous video'], [n.after, 'the next video']]) {
      if (other && sig.hook && other.hook === sig.hook) variety.push({ level: 'error', rule: 'variety', message: `Same kind of hook as ${label} ("${sig.hook}"). Open this one a different way.` });
    }
    if (!errorsOf(planIssues).length) {
      const words = exists(f.words) ? readJson(f.words).words : syntheticTimings(script.text, script.say);
      if (words.length === script.words.length) cadence = buildProps({ plan, script, words, channel: channel() }).issues.filter((i) => i.rule === 'cadence' || i.rule === 'timing');
    }
  }

  const ch = channel();
  const placeholders = ['name', 'creator', 'cta'].filter((k) => !ch[k] || /^\[.*\]$/.test(String(ch[k]).trim()));
  const channelIssues = placeholders.length ? [{ level: 'warn', message: `channel.json still has placeholders (${placeholders.join(', ')}): no channel name or call to action is shown` }] : [];

  if (!quiet) {
    show(`script   ${lint.stats.words} words, ~${lint.stats.seconds}s, hook ${lint.stats.hookWords} words (~${lint.stats.hookSeconds}s)`, lint.issues);
    show('publish  3 titles under 60 characters, 3 hashtags, pinned comment', publish);
    show(`sources  ${src ? src.claims.length : 0} claims`, srcIssues);
    show('facts    every spoken and on-screen figure traced to a claim', coverage);
    const sg = plan ? signature(plan, v.id) : null;
    show(`plan     ${plan ? `${plan.scenes.length} scenes: ${sg.order}` : '-'}`, planIssues);
    show(`variety  ${plan ? `${sg.accent}${sg.inverted ? ' (inverted)' : ''}, opens ${sg.opening}, hook "${script.meta.hook || '?'}", changes ${sg.transitions}, break ${sg.breakKind}` : '-'}`, variety);
    show('cadence  something new on screen at least every 3 seconds', cadence);
    if (channelIssues.length) show('channel', channelIssues);
    log(`  loop     ${lint.loopSeam}`);
  }

  setProblems(v.id, 'sources', fmt(srcIssues));
  setProblems(v.id, 'script', fmt(lint.issues));
  setProblems(v.id, 'publish', fmt(publish));
  setProblems(v.id, 'facts', fmt(coverage));
  setProblems(v.id, 'plan', fmt([...planIssues, ...cadence]));
  setProblems(v.id, 'variety', fmt(variety));
  setProblems(v.id, 'channel', fmt(channelIssues));

  const sourcesOk = !errorsOf(srcIssues).length;
  const scriptOk = sourcesOk && !errorsOf(lint.issues).length && !errorsOf(coverage).length && !errorsOf(publish).length;
  const planOk = scriptOk && !errorsOf(planIssues).length && !errorsOf(variety).length && !errorsOf(cadence).length;
  if (sourcesOk) reached = 'sourced';
  if (scriptOk) reached = 'scripted';
  if (planOk) reached = 'planned';

  // Never claim a later stage than the checks support; never throw away later work that is still valid.
  const current = getRow(v.id).stage || 'idea';
  if (!planOk) setStage(v.id, reached, { force: true });
  else if (stageIndex(current) < stageIndex('planned')) setStage(v.id, 'planned');
  if (plan) {
    const sg = signature(plan, v.id);
    updateRow(v.id, { accent: `${sg.accent}${sg.inverted ? '/inverted' : ''}`, opening: sg.opening, scenes: sg.order });
  }
  out.ok = planOk;
  if (!quiet) log(`  -> ${planOk ? 'ready for voice' : `stops at "${reached}"`}`);
  return out;
}

// ------------------------------------------------------------- voice -------
function voice(v, { force = false } = {}) {
  const f = videoFiles(v);
  const script = parseScript(f.script);
  fs.mkdirSync(f.work, { recursive: true });
  const recorded = exists(f.voiceRaw);
  const input = recorded ? f.voiceRaw : f.script;
  const prev = exists(f.voiceReport) ? readJson(f.voiceReport) : null;
  const wantVoice = recorded ? null : pickVoice(v.id, channel(), script);
  const sameSource = prev && prev.source === (recorded ? 'recorded' : 'tts') && (recorded || (prev.voice === wantVoice.id && prev.speed === wantVoice.speed));
  if (!force && sameSource && upToDate(f.voiceClean, [input, CHANNEL_JSON])) {
    log(`  skip  voice (clean audio is up to date: ${prev.source}, ${prev.after.seconds}s)`);
  } else if (recorded) {
    log('  voice: cleaning your recording (voice.wav)');
    py('voice.py', ['clean', f.voiceRaw, f.voiceClean, f.voiceReport]);
  } else {
    const tts = pickVoice(v.id, channel(), script);
    log(`  voice: no voice.wav found, using the synthetic voice ${tts.id} (${tts.label || tts.lang})`);
    const txt = path.join(f.work, 'spoken.txt');
    fs.writeFileSync(txt, spokenForm(script.text, script.say));
    py('voice.py', ['tts', txt, f.voiceClean, f.voiceReport, '--voice', tts.id, '--lang', tts.lang, '--speed', String(tts.speed)]);
  }
  const rep = readJson(f.voiceReport);
  const secs = rep.after.seconds;
  const R = RULES.script;
  const problems = [...rep.warnings.map((w) => `warning: ${w}`)];
  if (rep.source === 'tts') problems.push(`warning: synthetic voice ${rep.voice} (tick the AI-content box at upload)`);
  // the picture runs a third of a second past the last word
  const total = secs + 0.3;
  if (total < R.minSeconds || total > R.maxSeconds) problems.push(`runs ${total.toFixed(1)}s; the brief asks for ${R.minSeconds}-${R.maxSeconds}s. ${total > R.maxSeconds ? 'Cut words or read faster' : 'Add a line or slow down'}.`);
  setProblems(v.id, 'voice', problems);
  updateRow(v.id, { voice: rep.source === 'tts' ? `tts:${rep.voice}` : 'recorded', seconds: total.toFixed(1) });
  const ok = !problems.some((p) => !p.startsWith('warning:'));
  if (ok) setStage(v.id, 'voiced');
  else setStage(v.id, 'planned', { force: true });
  log(`  ${ok ? 'ok  ' : 'FAIL'}  voice   ${rep.source}, ${secs}s, ${rep.after.lufs} LUFS${problems.length ? `\n          ${problems.join('\n          ')}` : ''}`);
  return ok;
}

// -------------------------------------------------------------- time -------
function time(v, { force = false } = {}) {
  const f = videoFiles(v);
  const script = parseScript(f.script);
  if (!force && upToDate(f.words, [f.voiceClean, f.script])) log('  skip  timing (words.json is up to date)');
  else {
    log('  timing: Whisper is listening to the voice-over');
    const wordsFile = path.join(f.work, 'script-words.json');
    writeJson(wordsFile, script.words);
    // Spelling hints only (names and capitalised terms). Never the script's own sentences:
    // Whisper treats prompt text as already said and would skip it in the audio.
    const names = new Set([script.meta.company, ...script.names].filter(Boolean));
    script.sentences.forEach((s) => s.split(/\s+/).slice(1).forEach((w) => /^[A-Z][A-Za-z'-]{2,}/.test(w) && names.add(w.replace(/[^A-Za-z'-]/g, ''))));
    const prompt = `Glossary: ${[...names].join(', ')}.`;
    py('transcribe.py', [f.voiceClean, wordsFile, f.words, '--prompt', prompt]);
  }
  const t = readJson(f.words);
  const problems = [];
  if (t.words.length !== script.words.length) problems.push('word timings do not line up with the script: re-run timing');
  if (t.match < 0.9) problems.push(`the voice matches only ${(t.match * 100).toFixed(0)}% of the script. Heard: "${t.heard.slice(0, 160)}..."`);
  // Words with nothing heard opposite them have no real timing: the line was skipped in the recording, or Whisper missed it.
  for (const m of (t.mismatches || []).filter((x) => !x.heard && x.script.split(/\s+/).length >= 3)) {
    problems.push(`nothing was heard for "${m.script}" (around ${m.at}s). If the recording skips that line, re-record it; otherwise run timing again.`);
  }
  for (const m of t.figure_mismatches || []) problems.push(`the voice says "${m.heard}" where the script says "${m.script}" (at ${m.at}s). A spoken figure must match its source: re-record that line.`);
  const soft = (t.mismatches || []).filter((m) => !(t.figure_mismatches || []).includes(m));
  if (soft.length) problems.push(`warning: ${soft.length} small wording difference(s) between voice and script, e.g. heard "${soft[0].heard}" for "${soft[0].script}"`);
  const st = captionStats(buildCaptions(t.words));
  if (st.over) problems.push(`${st.over} subtitle page(s) have more than 4 words`);
  setProblems(v.id, 'timing', problems);
  const ok = !problems.some((p) => !p.startsWith('warning:'));
  if (ok) setStage(v.id, 'timed');
  else setStage(v.id, 'voiced', { force: true });
  log(`  ${ok ? 'ok  ' : 'FAIL'}  timing  ${(t.match * 100).toFixed(0)}% of words matched, ${st.pages} subtitle pages (avg ${st.avg} words)${problems.length ? `\n          ${problems.join('\n          ')}` : ''}`);
  return ok;
}

// --------------------------------------------------------------- mix -------
const SOUND_CODE = [path.join(ROOT, 'src', 'shared', 'sound.mjs'), path.join(ROOT, 'pipeline', 'mix.py'), LICENCES];

function sound(v, { force = false } = {}) {
  const f = videoFiles(v);
  const script = parseScript(f.script);
  const plan = readJson(f.plan);
  const built = buildProps({ plan, script, words: readJson(f.words).words, channel: channel(), id: v.id });
  const sp = soundPlan(built.props, plan);
  // rewrite the plan only when it really changed, so an unchanged video is not mixed again
  if (!exists(f.soundPlan) || JSON.stringify(readJson(f.soundPlan)) !== JSON.stringify(sp)) writeJson(f.soundPlan, sp);
  if (!force && upToDate(f.mix, [f.voiceClean, f.soundPlan, ...SOUND_CODE]) && exists(f.mixReport)) {
    log('  skip  mix (soundtrack is up to date)');
  } else {
    py('mix.py', [f.voiceClean, f.soundPlan, ASSETS, f.mix, f.mixReport]);
  }
  const r = readJson(f.mixReport);
  const problems = [...r.problems];
  // neighbours must not share a music bed
  const rows = readStatus();
  const idx = rows.findIndex((x) => x.id === v.id);
  for (const other of [rows[idx - 1], rows[idx + 1]]) {
    if (other && sp.musicName && other.music === sp.musicName) problems.push(`same music bed as video ${other.id} (${sp.musicName}): neighbouring videos must differ`);
  }
  setProblems(v.id, 'sound', problems);
  updateRow(v.id, { music: sp.musicName || 'none' });
  const ok = !problems.length;
  if (ok) setStage(v.id, 'mixed');
  else setStage(v.id, 'timed', { force: true });
  const m = r.music;
  log(
    `  ${ok ? 'ok  ' : 'FAIL'}  mix     ${r.final.lufs} LUFS, peak ${r.final.true_peak_db} dB, ` +
      `${m ? `bed "${sp.musicName}" ${m.db_under_voice_while_speaking} dB under the voice` : 'no music'}, ${r.effects.count} effects` +
      `${problems.length ? `\n          ${problems.join('\n          ')}` : ''}`,
  );
  return ok;
}

// ------------------------------------------------------------ render -------
async function prepare(v) {
  const f = videoFiles(v);
  const script = parseScript(f.script);
  const plan = readJson(f.plan);
  const words = readJson(f.words).words;
  const built = buildProps({ plan, script, words, channel: channel(), id: v.id });
  return { f, built, script, plan };
}

async function render(v, { force = false } = {}) {
  const { bakeBackdrop, getBundle, renderVideo, stageAudio } = await import('./lib/render.mjs');
  const { f, built } = await prepare(v);
  const errs = errorsOf(built.issues);
  setProblems(v.id, 'render', fmt(built.issues));
  if (errs.length) {
    log(`  FAIL  render  ${errs.map((e) => e.message).join(' | ')}`);
    return false;
  }
  const serveUrl = await getBundle({ log: (m) => log(`  ${m}`) });
  built.props.audio = stageAudio(serveUrl, v.id, f.mix);
  Object.assign(built.props, await bakeBackdrop(built.props, f.work));
  writeJson(f.props, built.props);
  const bundleStamp = path.join(ROOT, '.cache', 'bundle.hash');
  if (!force && upToDate(f.mp4, [f.plan, f.words, f.mix, CHANNEL_JSON, bundleStamp])) {
    log('  skip  render (MP4 is up to date)');
  } else {
    const t0 = Date.now();
    let last = -1;
    await renderVideo(built.props, f.mp4, {
      onProgress: (p) => {
        const pct = Math.floor(p * 10) * 10;
        if (pct !== last) {
          last = pct;
          process.stdout.write(`\r  render  ${pct}%   `);
        }
      },
    });
    process.stdout.write('\r');
    log(`  ok    render  ${built.seconds.toFixed(1)}s video in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${path.relative(ROOT, f.mp4)}`);
  }
  setStage(v.id, 'rendered');
  updateRow(v.id, { seconds: built.seconds.toFixed(1) });
  return true;
}

// ---------------------------------------------------------------- qa -------
function parseCheckedSources(f) {
  const src = parseSources(f.sources);
  checkClaims(src); // fills in each claim's confidence
  return src;
}

/** Every subtitle word, in order, must be the script's word (edge punctuation aside). */
function matchCaptions(script, pages) {
  const shown = pages.flatMap((p) => p.words.map((w) => w.t));
  const expected = script.words.map(displayWord).filter(Boolean);
  const mismatches = [];
  for (let i = 0; i < Math.min(shown.length, expected.length); i++) if (shown[i] !== expected[i]) mismatches.push({ index: i, shown: shown[i], script: expected[i] });
  return { shown: shown.length, expected: expected.length, mismatches };
}

/**
 * Six frames cut from the finished MP4, spread across the video, each on a subtitle page.
 * The same frames are judged from the page itself (the probe): text outside its box,
 * text under YouTube's buttons, and captions that are too small, too faint or out of place.
 */
function exportStills(f, props, probe, motion = []) {
  const pages = props.captions;
  const picks = [...Array(6)].map((_, k) => pages[Math.min(pages.length - 1, Math.floor(((k + 0.5) * pages.length) / 6))]).filter(Boolean);
  const probed = new Map(probe.frames.map((fr) => [fr.frame, fr]));
  // a still shows the picture at rest: never a frame in the middle of a transition or the zoom break
  const still = [...probed.keys()].filter((x) => !motion.some(([a, b]) => x >= a && x < b));
  const keys = still.length ? still : [...probed.keys()];
  const nearest = (frame) => keys.reduce((best, x) => (Math.abs(x - frame) < Math.abs(best - frame) ? x : best), keys[0] ?? 0);
  const frames = [...new Set(picks.map((p) => nearest(Math.round((p.from + p.to) / 2))))];
  fs.rmSync(f.checks, { recursive: true, force: true });
  fs.mkdirSync(f.checks, { recursive: true });
  const items = frames.map((frame, i) => {
    const file = path.join(f.checks, `still-${i + 1}.png`);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', (frame / props.fps).toFixed(3), '-i', f.mp4, '-frames:v', '1', file]);
    const pr = probed.get(frame) || { hits: [] };
    const problems = [];
    for (const h of pr.hits.filter((x) => x.zone === 'right' || x.zone === 'bottom')) problems.push(`"${h.t}" sits in the ${h.zone === 'right' ? 'right 15%' : 'bottom 20%'} button zone`);
    for (const o of pr.overflow || []) problems.push(`"${o.t}" spills out of its box`);
    const caps = pr.captions || [];
    if (pr.captions && !caps.length) problems.push('no subtitle on screen');
    for (const c of caps) {
      if (c.fontPx < 56) problems.push(`subtitle is ${Math.round(c.fontPx)}px tall: too small to read on a phone`);
      if (c.contrast < 7) problems.push(`subtitle contrast is ${c.contrast.toFixed(1)}:1 (needs 7:1)`);
      if (c.top < 640 || c.bottom > 1280) problems.push(`subtitle sits at ${Math.round(c.top)}-${Math.round(c.bottom)}px, outside the centre third (640-1280)`);
    }
    return { n: i + 1, frame, seconds: +(frame / props.fps).toFixed(2), file: path.relative(ROOT, file), text_boxes: pr.n ?? null, problems };
  });
  const sheet = path.join(f.checks, 'sheet.png');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...items.flatMap((x) => ['-i', path.join(ROOT, x.file)]), '-filter_complex', `${items.map((_, i) => `[${i}:v]scale=360:-1[s${i}]`).join(';')};${items.map((_, i) => `[s${i}]`).join('')}hstack=inputs=${items.length}`, '-frames:v', '1', sheet]);
  return { sheet, items };
}

async function qa(v) {
  const { probeVideo } = await import('./lib/render.mjs');
  const { f, built } = await prepare(v);
  const R = RULES.script;
  const problems = [];
  const warn = (m) => problems.push(`warning: ${m}`);
  if (!exists(f.mp4)) {
    setProblems(v.id, 'qa', ['no MP4 to check: run render']);
    return false;
  }
  if (mtime(f.mp4) < Math.max(mtime(f.plan), mtime(f.words), mtime(f.mix))) problems.push('the MP4 is older than its script, storyboard or soundtrack: render it again');

  // 1. the file itself
  const videoReport = path.join(f.work, 'qa.video.json');
  py('qa_video.py', [f.mp4, videoReport]);
  const vr = readJson(videoReport);
  const fm = vr.format;
  if (fm.width !== 1080 || fm.height !== 1920) problems.push(`size is ${fm.width}x${fm.height}, not 1080x1920`);
  if (Math.abs(fm.fps - 30) > 0.01) problems.push(`frame rate is ${fm.fps}, not 30`);
  if (fm.video_codec !== 'h264' || fm.pix_fmt !== 'yuv420p') problems.push(`video is ${fm.video_codec}/${fm.pix_fmt}, expected h264/yuv420p`);
  if (fm.audio_codec !== 'aac') problems.push(`audio is ${fm.audio_codec}, expected aac`);
  if (fm.seconds >= 60) problems.push(`runs ${fm.seconds.toFixed(1)}s: a Short must be under 60 seconds`);
  else if (fm.seconds < R.minSeconds || fm.seconds > R.maxSeconds) problems.push(`runs ${fm.seconds.toFixed(1)}s; the brief asks for ${R.minSeconds}-${R.maxSeconds}s`);
  // audio level, measured twice (ffprobe and ffmpeg) on the finished file
  const lp = vr.loudness_ffprobe || {};
  const lufs = lp.lufs ?? vr.loudness.lufs;
  const peak = Math.max(lp.true_peak_db ?? -99, vr.loudness.true_peak_db ?? -99);
  if (lufs === null || lufs === undefined || Math.abs(lufs + 14) > 1.0) problems.push(`audio loudness is ${lufs} LUFS; target -14`);
  if (lp.lufs !== null && lp.lufs !== undefined && vr.loudness.lufs !== null && Math.abs(lp.lufs - vr.loudness.lufs) > 0.5) warn(`two loudness measurements disagree (${lp.lufs} and ${vr.loudness.lufs} LUFS)`);
  if (peak > -1.0) problems.push(`audio peaks at ${peak} dB: too close to clipping (limit -1.0)`);
  if (fm.audio_rate !== 48000 || fm.audio_channels !== 2) warn(`audio is ${fm.audio_rate} Hz, ${fm.audio_channels} channel(s); expected 48000 Hz stereo`);
  // the soundtrack: mixed from licensed files only, bed quiet under the voice
  if (!exists(f.mixReport)) problems.push('no soundtrack report: run mix');
  else {
    const mr = readJson(f.mixReport);
    for (const m of mr.problems) problems.push(`soundtrack: ${m}`);
    const listed = new Set([...fs.readFileSync(LICENCES, 'utf8').matchAll(/`((?:sfx|music)\/[A-Za-z0-9_.-]+)`/g)].map((m) => m[1]));
    for (const a of mr.assets_used) if (!listed.has(a)) problems.push(`soundtrack uses ${a}, which has no entry in assets/licences.md`);
  }
  if (vr.flat_frames_at_s.length) problems.push(`blank frame(s) at ${vr.flat_frames_at_s.join(', ')}s`);

  // 2. a visual change every 2-3 seconds: planned cues, then the real pixels
  for (const i of built.issues) (i.level === 'error' ? problems.push(i.message) : warn(i.message));
  if (vr.visual_change.longest_static_s > RULES.cadence.maxGapSeconds + 0.35) {
    problems.push(`the picture barely changes for ${vr.visual_change.longest_static_s}s from ${vr.visual_change.longest_static_at_s}s`);
  }

  // 3. no text resting under YouTube's buttons, and a readable claim on frame 0. Text in motion
  // (a transition, the zoom break, a card dropping in) may pass through a zone; text may not stay there.
  process.stdout.write('  qa: checking every sampled frame for text in the button zones   ');
  const STEP = 3;
  const probe = await probeVideo(built.props, { step: STEP });
  process.stdout.write('\r');
  const hits = probe.frames.flatMap((fr) => fr.hits.map((h) => ({ ...h, frame: fr.frame })));
  const motion = motionWindows(built.props);
  const zone = (z) => restingHits(hits.filter((h) => h.zone === z), motion, { step: STEP });
  const right = zone('right');
  const bottom = zone('bottom');
  const hard = [...right.resting, ...bottom.resting].sort((a, b) => a.frame - b.frame);
  for (const h of hard) problems.push(`text "${h.t}" rests in the ${h.zone === 'right' ? 'right 15%' : 'bottom 20%'} of the frame from ${(h.frame / 30).toFixed(1)}s`);
  const passing = right.passing + bottom.passing;
  if (passing) log(`          note: ${passing} text(s) cross a button zone only while moving (allowed)`);
  const cut = zone('cut').resting.map((h) => h.t);
  if (cut.length) warn(`text cut off by the left edge of the frame: ${cut.slice(0, 3).join(', ')}`);
  const top = zone('top').resting.map((h) => h.t);
  if (top.length) warn(`text near the very top of the frame: ${top.slice(0, 3).join(', ')}`);
  const first = probe.frames.find((fr) => fr.frame === 0);
  if (!first || first.n === 0 || first.area < 60000) problems.push('frame 0 has no large readable text: the hook must be on screen from the first frame');
  if (!probe.frames.length) problems.push('the safe-zone check produced no data');
  // the look these pilots were first rendered in has captions low in the frame and no caption report
  if (probe.frames.length && !probe.frames.some((fr) => Array.isArray(fr.captions))) problems.push('rendered in the old look: captions are not in the centre third. Re-render in the Paper Money identity.');

  // 4. the loop
  if (vr.loop.first_last_mean_diff > 9) warn(`the last frame differs from the first (${vr.loop.first_last_mean_diff}): the loop may show a visible cut`);

  // 5. subtitles: sized 2-4 words, and spelled exactly as the script spells them
  const st = captionStats(buildCaptions(readJson(f.words).words));
  if (st.over) problems.push(`${st.over} subtitle page(s) have more than 4 words`);
  if (st.singles / Math.max(1, st.pages) > 0.2) warn(`${st.singles} of ${st.pages} subtitle pages have a single word`);
  const script = parseScript(f.script);
  const spelling = matchCaptions(script, built.props.captions);
  for (const m of spelling.mismatches.slice(0, 5)) problems.push(`subtitle word ${m.index + 1} is "${m.shown}" but the script says "${m.script}"`);
  if (spelling.shown !== spelling.expected) problems.push(`subtitles show ${spelling.shown} words; the script has ${spelling.expected}`);

  // 6. six stills from the finished file, each checked for overflow, button zones and caption legibility
  const stills = exportStills(f, built.props, probe, motion);
  for (const s of stills.items) for (const m of s.problems) problems.push(`still ${s.n} (${s.seconds}s): ${m}`);

  // 7. facts and script must still pass
  const c = check(v, { quiet: true });
  if (!c.ok) problems.push('script, sources or storyboard no longer pass: run check');

  const report = {
    checked: new Date().toISOString(),
    passed: !problems.some((p) => !p.startsWith('warning:')),
    problems,
    format: fm,
    loudness: vr.loudness,
    visual_change: { ...vr.visual_change, planned_events: built.events.length, planned_worst_gap_s: built.worstGap, planned_mean_gap_s: built.avgGap },
    safe_zones: { frames_checked: probe.frames.length, violations: hard.length, text_boxes_on_frame_0: first?.n ?? 0 },
    loop: vr.loop,
    subtitles: { ...st, words_shown: spelling.shown, words_in_script: spelling.expected, spelling_mismatches: spelling.mismatches.length },
    stills: { sheet: path.relative(ROOT, stills.sheet), items: stills.items },
    soundtrack: exists(f.mixReport) ? readJson(f.mixReport) : null,
    hand_checks: uncertainClaims(parseCheckedSources(f)),
  };
  writeJson(f.qa, report);
  setProblems(v.id, 'qa', problems);
  if (report.passed) setStage(v.id, 'ready');
  else setStage(v.id, 'rendered', { force: true });
  log(
    `  ${report.passed ? 'ok  ' : 'FAIL'}  qa      ${fm.seconds.toFixed(1)}s, ${fm.megabytes} MB, ${lufs} LUFS (peak ${peak} dB), subtitles ${spelling.shown}/${spelling.expected} words match, 6 stills -> ${path.relative(ROOT, stills.sheet)}, ${built.events.length} visual changes (longest gap ${built.worstGap}s planned / ${vr.visual_change.longest_static_s}s measured), ` +
      `${probe.frames.length} frames probed, ${hard.length} safe-zone violations${problems.length ? `\n          ${problems.join('\n          ')}` : ''}`,
  );
  return report.passed;
}

// ------------------------------------------------------ publishing pack ----
const slug = (s) => String(s).toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const outputDir = (v, script) => path.join(OUTPUT, `${v.id}-${slug(script.meta.company || v.slug)}`);

/** metadata.md, captions.srt and cover.png: everything typed or chosen by hand at upload. */
function publish(v) {
  const f = videoFiles(v);
  const script = parseScript(f.script);
  const src = parseSources(f.sources);
  checkClaims(src);
  const vr = exists(f.voiceReport) ? readJson(f.voiceReport) : {};
  const text = buildMetadata({ id: v.id, script, src, channel: channel(), voiceSource: vr.source || 'tts', voice: vr.voice || '', files: { cover: 'cover.png', srt: 'captions.srt' } });
  if (!exists(f.metadata) || fs.readFileSync(f.metadata, 'utf8') !== text) fs.writeFileSync(f.metadata, text);
  if (exists(f.words)) {
    fs.mkdirSync(f.out, { recursive: true });
    fs.writeFileSync(f.srt, buildSrt(script, readJson(f.words).words));
  }
  if (exists(f.mp4) && exists(f.props)) {
    // the cover: the hook scene with everything landed
    const props = readJson(f.props);
    const first = props.scenes[0];
    const frame = Math.max(0, Math.min(first.duration - 3, Math.round(first.duration * 0.9)));
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', (frame / props.fps).toFixed(3), '-i', f.mp4, '-frames:v', '1', f.cover]);
  }
  return { script, src };
}

/** output/<id>-<company>/ with final.mp4, metadata.md, sources.md (+ cover and subtitles). */
function pack(v) {
  const f = videoFiles(v);
  const row = getRow(v.id);
  if (!['ready', 'uploaded'].includes(row?.stage)) {
    log(`  skip  pack (${v.id} is "${row?.stage}", not ready)`);
    return null;
  }
  const { script } = publish(v);
  const dir = outputDir(v, script);
  fs.mkdirSync(dir, { recursive: true });
  const copies = [[f.mp4, 'final.mp4'], [f.metadata, 'metadata.md'], [f.sources, 'sources.md'], [f.cover, 'cover.png'], [f.srt, 'captions.srt']];
  for (const [from, name] of copies) {
    if (!exists(from)) continue;
    const to = path.join(dir, name);
    if (!exists(to) || mtime(to) < mtime(from)) fs.copyFileSync(from, to);
  }
  log(`  packed ${path.relative(ROOT, dir)}/`);
  return dir;
}

// --------------------------------------------------------------- make ------
async function make(v, opts = {}) {
  log(`\n${v.name}`);
  const row = getRow(v.id);
  if (row?.stage === 'uploaded') return log('  already uploaded: nothing to do');
  const c = check(v, { quiet: true });
  if (!c.ok) {
    check(v);
    return false;
  }
  log('  ok    script, sources, storyboard and variety');
  if (!voice(v, opts)) return false;
  if (!time(v, opts)) return false;
  if (!sound(v, opts)) return false;
  if (!(await render(v, opts))) return false;
  if (!(await qa(v))) return false;
  const dir = pack(v);
  log(`  READY ${path.relative(ROOT, dir || videoFiles(v).mp4)}`);
  return true;
}

// ------------------------------------------------------------ preview ------
async function preview(v) {
  const { renderStills } = await import('./lib/render.mjs');
  const f = videoFiles(v);
  const script = parseScript(f.script);
  const plan = readJson(f.plan);
  const words = exists(f.words) ? readJson(f.words).words : syntheticTimings(script.text, script.say);
  const built = buildProps({ plan, script, words, channel: channel(), id: v.id });
  const props = { ...built.props, audio: null };
  // frame 0, then each scene just before it ends (everything revealed)
  const frames = [0, 6, ...props.scenes.map((s) => Math.min(props.durationInFrames - 1, s.from + s.duration - 2))];
  fs.rmSync(f.stills, { recursive: true, force: true });
  const files = await renderStills(props, [...new Set(frames)], f.stills, { scale: 0.5 });
  const sheet = path.join(f.work, 'preview.png');
  const cols = Math.min(5, files.length);
  const rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...files.flatMap((x) => ['-i', x]), '-filter_complex', `concat=n=${files.length}:v=1:a=0,tile=${cols}x${rows}:padding=6:color=0x808080`, '-frames:v', '1', sheet]);
  log(`  preview -> ${sheet}  (${files.length} stills${exists(f.words) ? '' : ', estimated timing'})`);
  for (const i of built.issues) log(`  ${i.level === 'error' ? 'x' : '!'} ${i.message}`);
}

// ---------------------------------------------------------------- new ------
function create(id, slug, rest) {
  id = padId(id);
  if (!slug) throw new Error('usage: new <id> <slug>   e.g. new 004 netflix-ads');
  if (listVideos().some((x) => x.id === id)) throw new Error(`video ${id} already exists`);
  const dir = path.join(VIDEOS, `${id}-${slug}`);
  fs.mkdirSync(dir, { recursive: true });
  const company = rest.join(' ') || slug.split('-')[0];
  fs.writeFileSync(path.join(dir, 'script.md'), `---\nid: ${id}\ncompany: ${company}\ntopic: \nidea: \ntitles:  |  | \ntags: #${company.replace(/[^A-Za-z0-9]/g, '')} #business #money\npinned: \n---\n# One line per sentence. 70-110 words. Hook first. Leave the last line open so it loops.\n`);
  fs.writeFileSync(path.join(dir, 'sources.md'), `# Sources: ${id} ${company}\n\n## 1. \n- Figures: \n- Exact: \n- Source: \n- Type: company report | regulator filing | major news outlet\n- URL: \n- Date: \n- Quote: \n- Year: \n- Verified: search-verified\n- Agrees: \n- Confidence: high | medium | low\n- Checked: \n`);
  updateRow(id, { topic: company, stage: 'idea' });
  log(`created ${path.relative(ROOT, dir)}`);
}

// ------------------------------------------------------------- status ------
function status() {
  const rows = readStatus();
  if (!rows.length) return log('No videos yet. Start one with: node pipeline/cli.mjs new 001 costco-membership');
  const counts = Object.fromEntries(STAGES.map((s) => [s, rows.filter((r) => r.stage === s).length]));
  log(`${rows.length} videos: ${STAGES.filter((s) => counts[s]).map((s) => `${counts[s]} ${s}`).join(', ')}\n`);
  for (const r of rows) {
    const probs = r.problems ? r.problems.split('; ') : [];
    const errs = probs.filter((p) => !/\] warning:/.test(p));
    log(`${r.id}  ${r.stage.padEnd(9)} ${(r.voice || '-').padEnd(9)} ${(r.seconds ? `${r.seconds}s` : '').padEnd(6)} ${(r.accent || '').padEnd(10)} ${r.topic}`);
    for (const p of errs) log(`       x ${p}`);
    const w = probs.length - errs.length;
    if (w) log(`       ! ${w} warning${w > 1 ? 's' : ''}`);
  }
}

function next() {
  const rows = new Map(readStatus().map((r) => [r.id, r]));
  for (const v of listVideos()) {
    const r = rows.get(v.id);
    const f = videoFiles(v);
    const stage = r?.stage || 'idea';
    let todo;
    if (stage === 'uploaded') todo = 'done';
    else if (stage === 'ready') todo = `upload ${path.relative(ROOT, f.mp4)} then: cli.mjs mark ${v.id} uploaded`;
    else if (stageIndex(stage) < stageIndex('planned')) todo = `fix script / sources / storyboard: cli.mjs check ${v.id}`;
    else if (!exists(f.voiceRaw) && stageIndex(stage) < stageIndex('rendered')) todo = `record voice.wav into ${path.relative(ROOT, v.dir)}/ (or run make to use the fallback voice)`;
    else todo = `cli.mjs make ${v.id}`;
    log(`${v.id}  ${stage.padEnd(9)} ${todo}`);
  }
}

// ------------------------------------------------------------ batches -----
/**
 * A batch: the finished videos' folders, a report that leads with every figure to check by hand,
 * and one zip of the lot in output/batches/, ready to send. Videos never go into git.
 */
function batch(name, ids) {
  if (!name || !ids.length) throw new Error('usage: batch <name> <id> [<id> ...]');
  const vids = ids.map((id) => findVideo(id));
  const rows = [];
  const hand = [];
  const notReady = [];
  for (const v of vids) {
    const f = videoFiles(v);
    const script = parseScript(f.script);
    const dir = outputDir(v, script);
    const q = exists(f.qa) ? readJson(f.qa) : null;
    const vr = exists(f.voiceReport) ? readJson(f.voiceReport) : {};
    if (!q?.passed || !exists(path.join(dir, 'final.mp4'))) notReady.push(`${v.id}: ${!q ? 'not checked' : !q.passed ? 'failed QA' : 'not packed'}`);
    for (const c of q?.hand_checks || uncertainClaims(parseCheckedSources(f))) hand.push({ id: v.id, company: script.meta.company, ...c });
    rows.push({ v, script, dir, q, vr, hook: sentences(script.text)[0] || '' });
  }
  if (notReady.length) throw new Error(`not every video is finished: ${notReady.join('; ')}. Run make first.`);

  const sec = (x) => `${Math.round(x)}s`;
  const lines = [`# Batch "${name}": ${rows.length} video${rows.length > 1 ? 's' : ''} (${rows.map((r) => r.v.id).join(', ')})`, ''];
  lines.push(`Made ${new Date().toISOString().slice(0, 10)}. Each folder holds final.mp4, metadata.md (titles, description, hashtags, pinned comment, AI-content answer), sources.md, captions.srt and cover.png.`, '');
  lines.push('## Check these figures by hand before upload', '');
  if (!hand.length) lines.push('None. Every figure on screen and in the descriptions has two independent sources.', '');
  for (const h of hand) lines.push(`- **${h.id} ${h.company}, claim ${h.n}** (${h.confidence}): ${h.title}. Shown as: ${h.figures || 'derived'}. Why: ${h.why.replace(/[.\s]+$/, '')}.${h.url ? ` Source: ${h.url}` : ''}`);
  if (hand.length) lines.push('');
  lines.push('## The videos', '', '| No. | Company | Length | Voice | Hook | Loudness | Subtitles | Text under buttons |', '|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    const q = r.q;
    lines.push(`| ${r.v.id} | ${r.script.meta.company} | ${sec(q.format.seconds)} | ${r.vr.voice || r.vr.source || '?'} | ${r.hook.replace(/\|/g, '/')} | ${q.loudness?.lufs ?? '?'} LUFS | ${q.subtitles.words_shown}/${q.subtitles.words_in_script} words | ${q.safe_zones.violations} |`);
  }
  lines.push('', '## At upload, every video', '');
  lines.push('- Tick "Altered or synthetic content": the narrator is a synthetic voice (each metadata.md says so and why).');
  lines.push('- Not made for kids. Upload captions.srt as English subtitles. Use cover.png as the thumbnail frame.');
  lines.push('- Pin the comment from metadata.md, then: `node pipeline/cli.mjs mark <id> uploaded`.');
  lines.push('- One a day, in number order: neighbours were planned not to share an opening, a colour or a voice.');
  const warnings = rows.flatMap((r) => (r.q.problems || []).filter((p) => p.startsWith('warning:')).map((p) => `${r.v.id}: ${p.replace(/^warning:\s*/, '')}`));
  if (warnings.length) lines.push('', '## Warnings from the checks (none of them block upload)', '', ...warnings.map((w) => `- ${w}`));
  const dirOut = path.join(OUTPUT, 'batches');
  fs.mkdirSync(dirOut, { recursive: true });
  const report = path.join(dirOut, `${name}-report.md`);
  fs.writeFileSync(report, `${lines.join('\n')}\n`);
  const zip = path.join(dirOut, `${name}.zip`);
  fs.rmSync(zip, { force: true });
  // stored, not deflated: the MP4s are already compressed
  execFileSync('zip', ['-q', '-0', '-r', '-j', zip, report], { cwd: OUTPUT });
  execFileSync('zip', ['-q', '-0', '-r', zip, ...rows.map((r) => path.relative(OUTPUT, r.dir))], { cwd: OUTPUT });
  const mb = (fs.statSync(zip).size / 1048576).toFixed(1);
  log(`  batch  ${path.relative(ROOT, report)}\n  zip    ${path.relative(ROOT, zip)} (${mb} MB, ${rows.length} videos, ${hand.length} figure(s) to check by hand)`);
  return { report, zip };
}

// --------------------------------------------------------------- main ------
const [cmd, arg, ...rest] = process.argv.slice(2);
const flags = { force: rest.includes('--force') || arg === '--force' };
const targets = () => (arg === 'all' || !arg || arg.startsWith('--') ? listVideos() : [findVideo(arg)]);

try {
  switch (cmd) {
    case 'status':
      status();
      break;
    case 'next':
      next();
      break;
    case 'new':
      create(arg, rest[0], rest.slice(1));
      break;
    case 'check': {
      let ok = true;
      for (const v of targets()) ok = check(v).ok && ok;
      process.exitCode = ok ? 0 : 1;
      break;
    }
    case 'voice':
      for (const v of targets()) {
        log(`\n${v.name}`);
        voice(v, flags);
      }
      break;
    case 'time':
      for (const v of targets()) {
        log(`\n${v.name}`);
        time(v, flags);
      }
      break;
    case 'mix':
      for (const v of targets()) {
        log(`\n${v.name}`);
        sound(v, flags);
      }
      break;
    case 'render':
      for (const v of targets()) {
        log(`\n${v.name}`);
        await render(v, flags);
      }
      break;
    case 'qa':
      for (const v of targets()) {
        log(`\n${v.name}`);
        await qa(v);
      }
      break;
    case 'make': {
      let ok = true;
      for (const v of targets()) ok = (await make(v, flags)) && ok;
      process.exitCode = ok ? 0 : 1;
      break;
    }
    case 'pack':
      for (const v of targets()) {
        log(`\n${v.name}`);
        publish(v);
        pack(v);
      }
      break;
    case 'preview':
      for (const v of targets()) {
        log(`\n${v.name}`);
        await preview(v);
      }
      break;
    case 'batch':
      batch(arg, rest);
      break;
    case 'mark': {
      const v = findVideo(arg);
      if (!STAGES.includes(rest[0])) throw new Error(`usage: mark <id> <${STAGES.join('|')}>`);
      setStage(v.id, rest[0], { force: true });
      log(`${v.id} -> ${rest[0]}`);
      break;
    }
    default:
      log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 18).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  }
} catch (e) {
  console.error(`\nerror: ${e.message}`);
  if (e.stderr) console.error(String(e.stderr).slice(-1200));
  process.exitCode = 1;
}
