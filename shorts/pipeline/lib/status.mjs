// status.csv: one row per video. The single source of truth for where each
// video is, so work can resume in a new session exactly where it stopped.
import fs from 'node:fs';
import { STATUS_CSV } from './paths.mjs';

export const COLUMNS = ['id', 'topic', 'stage', 'problems', 'voice', 'accent', 'opening', 'scenes', 'music', 'seconds', 'updated'];

// The order a video moves through. A video only advances when its step passes.
export const STAGES = [
  'idea', //      topic chosen, nothing checked yet
  'sourced', //   sources.md is complete: every claim has a URL and a date
  'scripted', //  script.md passes every script rule and every number is sourced
  'planned', //   video.json (the storyboard) is valid and differs from its neighbours
  'voiced', //    clean audio exists (recorded, or TTS fallback - see `voice` column)
  'timed', //     Whisper word timings exist and match the script
  'mixed', //     the soundtrack is mixed: voice + music bed + effects at -14 LUFS
  'rendered', //  the MP4 exists
  'ready', //     the MP4 passed every QA check: upload-ready
  'uploaded', //  you uploaded it (set by hand: `cli.mjs mark 001 uploaded`)
];

export const stageIndex = (s) => STAGES.indexOf(s);

// ------------------------------------------------------------- CSV ---------
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows) => rows.map((r) => r.map(esc).join(',')).join('\n') + '\n';

// ----------------------------------------------------------- rows ----------
export function readStatus() {
  if (!fs.existsSync(STATUS_CSV)) return [];
  const [header, ...body] = parseCsv(fs.readFileSync(STATUS_CSV, 'utf8'));
  if (!header) return [];
  return body.map((r) => Object.fromEntries(COLUMNS.map((c) => [c, r[header.indexOf(c)] ?? ''])));
}

export function writeStatus(rows) {
  const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const text = toCsv([COLUMNS, ...sorted.map((r) => COLUMNS.map((c) => r[c] ?? ''))]);
  const tmp = `${STATUS_CSV}.tmp`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, STATUS_CSV); // atomic: a crash never leaves a half-written file
}

export const getRow = (id) => readStatus().find((r) => r.id === id);

/** Create or update one row. Always stamps `updated`. */
export function updateRow(id, patch) {
  const rows = readStatus();
  let row = rows.find((r) => r.id === id);
  if (!row) {
    row = Object.fromEntries(COLUMNS.map((c) => [c, '']));
    row.id = id;
    row.stage = 'idea';
    rows.push(row);
  }
  Object.assign(row, patch);
  row.updated = new Date().toISOString().slice(0, 16).replace('T', ' ');
  writeStatus(rows);
  return row;
}

// Problems are stored as "[area] text; [area] text". Each step owns one area
// and replaces only its own entries, so fixing the script clears script
// problems without touching, say, a voice flag.
export const parseProblems = (s) =>
  String(s || '')
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean);

export function setProblems(id, area, messages) {
  const row = getRow(id) || { problems: '' };
  const kept = parseProblems(row.problems).filter((p) => !p.startsWith(`[${area}]`));
  const added = messages.map((m) => `[${area}] ${String(m).replace(/;/g, ',')}`);
  return updateRow(id, { problems: [...kept, ...added].join('; ') });
}

/** Move a video to `stage`, never backwards unless `force` (e.g. the script changed). */
export function setStage(id, stage, { force = false } = {}) {
  if (!STAGES.includes(stage)) throw new Error(`Unknown stage: ${stage}`);
  const row = getRow(id);
  if (row && !force && stageIndex(row.stage) > stageIndex(stage)) return row;
  return updateRow(id, { stage });
}
