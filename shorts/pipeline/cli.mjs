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
//   node pipeline/cli.mjs render 001        render the MP4
//   node pipeline/cli.mjs qa 001            check the finished MP4
//   node pipeline/cli.mjs make 001|all      run every remaining step, stopping at the first failure
//   node pipeline/cli.mjs preview 001       contact sheet of stills, to review the look by eye
//   node pipeline/cli.mjs mark 001 uploaded record that you uploaded it
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { RULES } from '../src/shared/spec.mjs';
import { captionStats, buildCaptions } from './lib/captions.mjs';
import { CHANNEL_JSON, PYTHON, ROOT, VIDEOS, exists, findVideo, listVideos, mtime, padId, readJson, upToDate, videoFiles, writeJson } from './lib/paths.mjs';
import { checkVariety, screenFigures, signature, validatePlan } from './lib/plan.mjs';
import { lintScript, parseScript } from './lib/script.mjs';
import { checkClaims, checkCoverage, parseSources } from './lib/sources.mjs';
import { STAGES, getRow, readStatus, setProblems, setStage, stageIndex, updateRow } from './lib/status.mjs';
import { figures, spokenForm, syntheticTimings } from './lib/text.mjs';
import { buildProps } from './lib/timing.mjs';

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
      return signature(readJson(f));
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
  if (src) coverage = checkCoverage(src, figures(script.text, { ignore: script.names }), plan ? screenFigures(plan, script.names) : []);

  // storyboard
  let planIssues = [{ level: 'error', message: 'video.json (the storyboard) is missing' }];
  let variety = [];
  let cadence = [];
  if (plan) {
    planIssues = validatePlan(plan, script).issues;
    const n = neighbours(v);
    variety = checkVariety(signature(plan), n.before, n.after);
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
    show(`sources  ${src ? src.claims.length : 0} claims`, srcIssues);
    show('facts    every spoken and on-screen figure traced to a claim', coverage);
    show(`plan     ${plan ? `${plan.scenes.length} scenes: ${signature(plan).order}` : '-'}`, planIssues);
    show(`variety  ${plan ? `accent ${plan.look?.accent}, opening ${signature(plan).opening}` : '-'}`, variety);
    show('cadence  something new on screen at least every 3 seconds', cadence);
    if (channelIssues.length) show('channel', channelIssues);
    log(`  loop     ${lint.loopSeam}`);
  }

  setProblems(v.id, 'sources', fmt(srcIssues));
  setProblems(v.id, 'script', fmt(lint.issues));
  setProblems(v.id, 'facts', fmt(coverage));
  setProblems(v.id, 'plan', fmt([...planIssues, ...cadence]));
  setProblems(v.id, 'variety', fmt(variety));
  setProblems(v.id, 'channel', fmt(channelIssues));

  const sourcesOk = !errorsOf(srcIssues).length;
  const scriptOk = sourcesOk && !errorsOf(lint.issues).length && !errorsOf(coverage).length;
  const planOk = scriptOk && !errorsOf(planIssues).length && !errorsOf(variety).length && !errorsOf(cadence).length;
  if (sourcesOk) reached = 'sourced';
  if (scriptOk) reached = 'scripted';
  if (planOk) reached = 'planned';

  // Never claim a later stage than the checks support; never throw away later work that is still valid.
  const current = getRow(v.id).stage || 'idea';
  if (!planOk) setStage(v.id, reached, { force: true });
  else if (stageIndex(current) < stageIndex('planned')) setStage(v.id, 'planned');
  if (plan) updateRow(v.id, { accent: plan.look?.accent ?? '', opening: signature(plan).opening, scenes: signature(plan).order });
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
  const sameSource = prev && prev.source === (recorded ? 'recorded' : 'tts');
  if (!force && sameSource && upToDate(f.voiceClean, [input, CHANNEL_JSON])) {
    log(`  skip  voice (clean audio is up to date: ${prev.source}, ${prev.after.seconds}s)`);
  } else if (recorded) {
    log('  voice: cleaning your recording (voice.wav)');
    py('voice.py', ['clean', f.voiceRaw, f.voiceClean, f.voiceReport]);
  } else {
    const tts = { voice: 'bm_george', lang: 'en-gb', speed: 1.18, ...(channel().tts || {}) };
    log(`  voice: no voice.wav found, using the fallback voice (${tts.voice})`);
    const txt = path.join(f.work, 'spoken.txt');
    fs.writeFileSync(txt, spokenForm(script.text, script.say));
    py('voice.py', ['tts', txt, f.voiceClean, f.voiceReport, '--voice', tts.voice, '--lang', tts.lang, '--speed', String(tts.speed)]);
  }
  const rep = readJson(f.voiceReport);
  const secs = rep.after.seconds;
  const R = RULES.script;
  const problems = [...rep.warnings.map((w) => `warning: ${w}`)];
  if (rep.source === 'tts') problems.push('warning: TTS FALLBACK VOICE - record voice.wav in this folder to replace it');
  // the picture runs a third of a second past the last word
  const total = secs + 0.3;
  if (total < R.minSeconds || total > R.maxSeconds) problems.push(`runs ${total.toFixed(1)}s; the brief asks for ${R.minSeconds}-${R.maxSeconds}s. ${total > R.maxSeconds ? 'Cut words or read faster' : 'Add a line or slow down'}.`);
  setProblems(v.id, 'voice', problems);
  updateRow(v.id, { voice: rep.source, seconds: total.toFixed(1) });
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
  const { getBundle, renderVideo, stageAudio } = await import('./lib/render.mjs');
  const { f, built } = await prepare(v);
  const errs = errorsOf(built.issues);
  setProblems(v.id, 'render', fmt(built.issues));
  if (errs.length) {
    log(`  FAIL  render  ${errs.map((e) => e.message).join(' | ')}`);
    return false;
  }
  const serveUrl = await getBundle({ log: (m) => log(`  ${m}`) });
  built.props.audio = stageAudio(serveUrl, v.id, f.voiceClean);
  writeJson(f.props, built.props);
  const bundleStamp = path.join(ROOT, '.cache', 'bundle.hash');
  if (!force && upToDate(f.mp4, [f.plan, f.words, f.voiceClean, CHANNEL_JSON, bundleStamp])) {
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
  if (mtime(f.mp4) < Math.max(mtime(f.plan), mtime(f.words), mtime(f.voiceClean))) problems.push('the MP4 is older than its script, storyboard or voice: render it again');

  // 1. the file itself
  const videoReport = path.join(f.work, 'qa.video.json');
  py('qa_video.py', [f.mp4, videoReport]);
  const vr = readJson(videoReport);
  const fm = vr.format;
  if (fm.width !== 1080 || fm.height !== 1920) problems.push(`size is ${fm.width}x${fm.height}, not 1080x1920`);
  if (Math.abs(fm.fps - 30) > 0.01) problems.push(`frame rate is ${fm.fps}, not 30`);
  if (fm.video_codec !== 'h264' || fm.pix_fmt !== 'yuv420p') problems.push(`video is ${fm.video_codec}/${fm.pix_fmt}, expected h264/yuv420p`);
  if (fm.audio_codec !== 'aac') problems.push(`audio is ${fm.audio_codec}, expected aac`);
  if (fm.seconds < R.minSeconds || fm.seconds > R.maxSeconds) problems.push(`runs ${fm.seconds.toFixed(1)}s; the brief asks for ${R.minSeconds}-${R.maxSeconds}s`);
  if (vr.loudness.lufs === null || Math.abs(vr.loudness.lufs + 14) > 1.5) problems.push(`audio loudness is ${vr.loudness.lufs} LUFS; target -14`);
  if (vr.loudness.true_peak_db !== null && vr.loudness.true_peak_db > -0.5) problems.push(`audio peaks at ${vr.loudness.true_peak_db} dB: risk of clipping`);
  if (vr.flat_frames_at_s.length) problems.push(`blank frame(s) at ${vr.flat_frames_at_s.join(', ')}s`);

  // 2. a visual change every 2-3 seconds: planned cues, then the real pixels
  for (const i of built.issues) (i.level === 'error' ? problems.push(i.message) : warn(i.message));
  if (vr.visual_change.longest_static_s > RULES.cadence.maxGapSeconds + 0.35) {
    problems.push(`the picture barely changes for ${vr.visual_change.longest_static_s}s from ${vr.visual_change.longest_static_at_s}s`);
  }

  // 3. no text under YouTube's buttons, and a readable claim on frame 0
  process.stdout.write('  qa: checking every sampled frame for text in the button zones   ');
  const probe = await probeVideo(built.props, { step: 3 });
  process.stdout.write('\r');
  const hits = probe.frames.flatMap((fr) => fr.hits.map((h) => ({ ...h, frame: fr.frame })));
  const hard = hits.filter((h) => h.zone === 'right' || h.zone === 'bottom');
  const seen = new Set();
  for (const h of hard) {
    const key = `${h.zone}:${h.t}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push(`text "${h.t}" enters the ${h.zone === 'right' ? 'right 15%' : 'bottom 20%'} of the frame at ${(h.frame / 30).toFixed(1)}s`);
  }
  const top = new Set(hits.filter((h) => h.zone === 'top').map((h) => h.t));
  if (top.size) warn(`text near the very top of the frame: ${[...top].slice(0, 3).join(', ')}`);
  const first = probe.frames.find((fr) => fr.frame === 0);
  if (!first || first.n === 0 || first.area < 60000) problems.push('frame 0 has no large readable text: the hook must be on screen from the first frame');
  if (!probe.frames.length) problems.push('the safe-zone check produced no data');

  // 4. the loop
  if (vr.loop.first_last_mean_diff > 9) warn(`the last frame differs from the first (${vr.loop.first_last_mean_diff}): the loop may show a visible cut`);

  // 5. subtitles
  const st = captionStats(buildCaptions(readJson(f.words).words));
  if (st.over) problems.push(`${st.over} subtitle page(s) have more than 4 words`);
  if (st.singles / Math.max(1, st.pages) > 0.2) warn(`${st.singles} of ${st.pages} subtitle pages have a single word`);

  // 6. facts and script must still pass
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
    subtitles: st,
  };
  writeJson(f.qa, report);
  setProblems(v.id, 'qa', problems);
  if (report.passed) setStage(v.id, 'ready');
  else setStage(v.id, 'rendered', { force: true });
  log(
    `  ${report.passed ? 'ok  ' : 'FAIL'}  qa      ${fm.seconds.toFixed(1)}s, ${fm.megabytes} MB, ${vr.loudness.lufs} LUFS, ${built.events.length} visual changes (longest gap ${built.worstGap}s planned / ${vr.visual_change.longest_static_s}s measured), ` +
      `${probe.frames.length} frames probed, ${hard.length} safe-zone violations${problems.length ? `\n          ${problems.join('\n          ')}` : ''}`,
  );
  return report.passed;
}

// --------------------------------------------------------- upload.md -------
function writeUpload(v) {
  const f = videoFiles(v);
  if (exists(f.upload)) return; // never overwrite text you may have edited
  const script = parseScript(f.script);
  const src = parseSources(f.sources);
  const ch = channel();
  const filled = (s) => s && !/^\[.*\]$/.test(String(s).trim());
  const seen = new Set();
  const refs = src.claims
    .filter((c) => c.fields.url && !seen.has(c.fields.url) && seen.add(c.fields.url))
    .map((c) => `- ${c.fields.source} (${c.fields.date}): ${c.fields.url}`);
  const tags = ['#shorts', `#${(script.meta.company || '').replace(/[^A-Za-z0-9]/g, '')}`, ...(script.meta.tags || '#business #money #explained').split(/\s+/)].filter((t) => t.length > 1);
  const text = `# Upload sheet: ${v.id} ${script.meta.company}

## Title (under 100 characters)
${script.meta.title || `How ${script.meta.company} really makes money`}

## Description
${script.meta.idea || script.meta.topic}
${filled(ch.cta) ? `\n${ch.cta}\n` : ''}
Sources:
${refs.join('\n')}

This video explains how a business works. It is not financial advice.

${[...new Set(tags)].join(' ')}

## Before you upload
- [ ] Watched it once with sound, once without
- [ ] Set "Altered or synthetic content" correctly if the fallback voice was used
- [ ] Not made for kids
`;
  fs.writeFileSync(f.upload, text);
  log(`  wrote ${path.relative(ROOT, f.upload)}`);
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
  if (!(await render(v, opts))) return false;
  if (!(await qa(v))) return false;
  writeUpload(v);
  log(`  READY ${path.relative(ROOT, videoFiles(v).mp4)}`);
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
  const frames = [0, ...props.scenes.map((s) => Math.min(props.durationInFrames - 1, s.from + s.duration - 2))];
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
  fs.writeFileSync(path.join(dir, 'script.md'), `---\nid: ${id}\ncompany: ${company}\ntopic: \nidea: \ntitle: \ntags: #business #money\n---\n# One line per sentence. 70-110 words. Hook first. Leave the last line open so it loops.\n`);
  fs.writeFileSync(path.join(dir, 'sources.md'), `# Sources: ${id} ${company}\n\n## 1. \n- Figures: \n- Exact: \n- Source: \n- Type: company report | regulator filing | major news outlet\n- URL: \n- Date: \n- Quote: \n- Checked: \n`);
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
    case 'preview':
      for (const v of targets()) {
        log(`\n${v.name}`);
        await preview(v);
      }
      break;
    case 'mark': {
      const v = findVideo(arg);
      if (!STAGES.includes(rest[0])) throw new Error(`usage: mark <id> <${STAGES.join('|')}>`);
      setStage(v.id, rest[0], { force: true });
      log(`${v.id} -> ${rest[0]}`);
      break;
    }
    default:
      log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 17).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  }
} catch (e) {
  console.error(`\nerror: ${e.message}`);
  if (e.stderr) console.error(String(e.stderr).slice(-1200));
  process.exitCode = 1;
}
