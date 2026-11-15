// The publishing pack: everything that is typed into YouTube by hand at upload.
// metadata.md = 3 title options (each under 60 characters), the description with the call to
// action, 3 hashtags, a pinned comment, and whether the "altered or synthetic content" box
// needs ticking. It is generated from script.md, sources.md and channel.json: edit those.
import { figures } from './text.mjs';

export const TITLE_MAX = 59; // "under 60 characters"
const ADVICE = [/\byou should\b/i, /\bbuy (the )?(stock|shares)\b/i, /\binvest\b/i, /\bget rich\b/i, /\bfinancial advice\b/i];
const BAIT = [/you won'?t believe/i, /\bshocking\b/i, /\binsane\b/i, /\bgone wrong\b/i, /!!+/, /\bsecret(s)? they\b/i, /\bexposed\b/i];
const filled = (s) => typeof s === 'string' && s.trim() && !/^\[.*\]$/.test(s.trim());

/** The upload fields held in script.md's front matter. */
export function publishMeta(script) {
  const m = script.meta;
  const titles = String(m.titles || m.title || '')
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean);
  const tags = String(m.tags || '')
    .split(/\s+/)
    .filter((t) => t.startsWith('#') && t.length > 1);
  return { titles, tags, pinned: (m.pinned || '').trim(), idea: (m.idea || '').trim() };
}

const issue = (level, rule, message) => ({ level, rule, message });

export function lintPublish(script) {
  const out = [];
  const p = publishMeta(script);
  if (p.titles.length !== 3) out.push(issue('error', 'titles', `Front matter needs \`titles:\` with exactly 3 options separated by " | " (found ${p.titles.length}).`));
  p.titles.forEach((t, i) => {
    if (t.length > TITLE_MAX) out.push(issue('error', 'titles', `Title ${i + 1} is ${t.length} characters; the limit is under 60: "${t}"`));
    if (t.length < 12) out.push(issue('warn', 'titles', `Title ${i + 1} is very short: "${t}"`));
    if (t === t.toUpperCase() && /[A-Z]{6,}/.test(t)) out.push(issue('error', 'titles', `Title ${i + 1} is all capitals.`));
    for (const re of [...ADVICE, ...BAIT]) if (re.test(t)) out.push(issue('error', 'titles', `Title ${i + 1} reads as ${ADVICE.includes(re) ? 'advice' : 'bait'} ("${t.match(re)[0]}").`));
    if (/#/.test(t)) out.push(issue('error', 'titles', `Title ${i + 1} contains a hashtag; hashtags go in \`tags:\`.`));
  });
  if (new Set(p.titles.map((t) => t.toLowerCase())).size !== p.titles.length) out.push(issue('error', 'titles', 'Two title options are the same.'));
  const starts = p.titles.map((t) => t.toLowerCase().split(/\s+/).slice(0, 2).join(' '));
  if (p.titles.length === 3 && new Set(starts).size === 1) out.push(issue('warn', 'titles', 'All three titles open with the same two words: make the options really different.'));

  if (p.tags.length !== 3) out.push(issue('error', 'hashtags', `Front matter needs \`tags:\` with exactly 3 hashtags (found ${p.tags.length}).`));
  for (const t of p.tags) if (!/^#[A-Za-z][A-Za-z0-9]{1,29}$/.test(t)) out.push(issue('error', 'hashtags', `"${t}" is not a usable hashtag (letters and digits only, no spaces).`));
  if (new Set(p.tags.map((t) => t.toLowerCase())).size !== p.tags.length) out.push(issue('error', 'hashtags', 'Two hashtags are the same.'));

  if (!p.pinned) out.push(issue('error', 'pinned', 'Front matter needs `pinned:` - the comment to pin under the video.'));
  else {
    if (p.pinned.length > 280) out.push(issue('warn', 'pinned', `Pinned comment is ${p.pinned.length} characters; keep it short.`));
    if (!/\?/.test(p.pinned)) out.push(issue('warn', 'pinned', 'Pinned comment asks no question. A question gives people something to answer.'));
    for (const re of ADVICE) if (re.test(p.pinned)) out.push(issue('error', 'pinned', `Pinned comment reads as advice ("${p.pinned.match(re)[0]}").`));
  }
  if (!p.idea) out.push(issue('error', 'description', 'Front matter needs `idea:` - it opens the description.'));
  return out;
}

/** Figures used in titles, description and pinned comment: they need a source like any other. */
export function publishFigures(script) {
  const p = publishMeta(script);
  return figures([...p.titles, p.idea, p.pinned].join('\n'), { ignore: script.names });
}

/** Does YouTube's "altered or synthetic content" box need ticking? */
export function disclosure(voiceSource) {
  if (voiceSource === 'recorded') {
    return {
      tick: false,
      line: 'No. Leave it unticked.',
      why: 'The narration is your own recorded voice, and the pictures are paper-style animation that nobody could mistake for real footage. YouTube asks for the label only when realistic content has been altered or generated; animation and production help (scripts, captions, sound clean-up) are exempt.',
    };
  }
  return {
    tick: true,
    line: 'Yes, tick it for this file.',
    why: 'The narration in this render is the synthetic fallback voice, not yours. YouTube\'s rule covers realistic altered or synthetic content; its help page does not spell out a synthetic narrator reading true facts, so disclosing is the safe choice. Better: record voice.wav and run the pipeline again, and the answer becomes No.',
  };
}

export function buildMetadata({ id, script, src, channel = {}, voiceSource = 'tts', files = {} }) {
  const p = publishMeta(script);
  const d = disclosure(voiceSource);
  const seen = new Set();
  const refs = src.claims
    .filter((c) => c.fields.url && !seen.has(c.fields.url) && seen.add(c.fields.url))
    .map((c) => `- ${c.fields.source.replace(/\s*\([^)]*\)\s*$/, '')} (${(c.fields.year || c.fields.date || '').replace(/\s*\(.*$/, '')}): ${c.fields.url}`);
  const cta = filled(channel.cta) ? channel.cta.trim() : null;
  const description = [p.idea, '', cta || '[YOUR CALL TO ACTION: fill in "cta" in channel.json]', '', 'Sources:', ...refs, '', 'This video explains how a business works. It is not financial advice.', '', p.tags.join(' ')].join('\n');
  const todo = [];
  if (!cta) todo.push('The call to action is still a placeholder: fill in `cta` in `channel.json` and run the pipeline again.');
  if (d.tick) todo.push('This render uses the fallback voice. Record `voice.wav` before uploading.');

  return `# ${id} ${script.meta.company}: publishing pack

${todo.length ? `> **Not ready to upload yet**\n${todo.map((t) => `> - ${t}`).join('\n')}\n\n` : ''}## Titles (pick one; each is under 60 characters)
${p.titles.map((t, i) => `${i + 1}. ${t}  \`${t.length}\``).join('\n')}

## Description
\`\`\`
${description}
\`\`\`

## Hashtags
${p.tags.join(' ')}

## Pinned comment
${p.pinned}

## AI-content disclosure ("Altered or synthetic content")
**${d.line}** ${d.why}

Reference: https://support.google.com/youtube/answer/14328491

## At upload
- Audience: **not** made for kids
- Cover: choose the frame saved as \`${files.cover || 'cover.png'}\` (the claim, fully landed)
- Subtitles: upload \`${files.srt || 'captions.srt'}\` as English captions, so the words are searchable and readable with sound off
- After posting: pin the comment above, then \`node pipeline/cli.mjs mark ${id} uploaded\`

<sub>Generated from script.md, sources.md and channel.json. Edit those, not this file.</sub>
`;
}

const stamp = (seconds) => {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};

/** Subtitles for YouTube: one cue per spoken sentence, timed from the word timings. */
export function buildSrt(script, words) {
  const cues = [];
  let i = 0;
  for (const sentence of script.sentences) {
    const count = sentence.split(/\s+/).filter(Boolean).length;
    const slice = words.slice(i, i + count);
    i += count;
    if (!slice.length) continue;
    // long sentences are split in two so no cue is more than two short lines
    const parts = count > 9 ? [slice.slice(0, Math.ceil(count / 2)), slice.slice(Math.ceil(count / 2))] : [slice];
    for (const part of parts) cues.push({ start: part[0].start, end: part[part.length - 1].end, text: part.map((w) => w.w).join(' ') });
  }
  for (let k = 0; k < cues.length - 1; k++) cues[k].end = Math.min(Math.max(cues[k].end, cues[k].start + 0.6), cues[k + 1].start - 0.02);
  return cues.map((c, k) => `${k + 1}\n${stamp(c.start)} --> ${stamp(Math.max(c.end, c.start + 0.3))}\n${c.text}\n`).join('\n');
}
