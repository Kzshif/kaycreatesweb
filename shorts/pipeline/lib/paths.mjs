import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const VIDEOS = path.join(ROOT, 'videos');
export const STATUS_CSV = path.join(ROOT, 'status.csv');
export const CHANNEL_JSON = path.join(ROOT, 'channel.json');
export const MODELS = path.join(ROOT, '.models');
export const CACHE = path.join(ROOT, '.cache');
export const PYTHON = path.join(ROOT, '.venv', 'bin', 'python');

export const padId = (id) => String(id).replace(/\D/g, '').padStart(3, '0');

/** All video folders, sorted by id. Folder names look like `001-costco-membership`. */
export function listVideos() {
  if (!fs.existsSync(VIDEOS)) return [];
  return fs
    .readdirSync(VIDEOS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{3}-/.test(d.name))
    .map((d) => ({ id: d.name.slice(0, 3), slug: d.name.slice(4), dir: path.join(VIDEOS, d.name), name: d.name }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function findVideo(idOrName) {
  const id = padId(String(idOrName).split('-')[0]);
  const v = listVideos().find((x) => x.id === id);
  if (!v) throw new Error(`No video folder for id ${id} in ${VIDEOS}`);
  return v;
}

/** Every file the pipeline reads or writes for one video. */
export function videoFiles(v) {
  const work = path.join(v.dir, 'work');
  const out = path.join(v.dir, 'out');
  return {
    script: path.join(v.dir, 'script.md'),
    sources: path.join(v.dir, 'sources.md'),
    plan: path.join(v.dir, 'video.json'),
    upload: path.join(v.dir, 'upload.md'),
    voiceRaw: path.join(v.dir, 'voice.wav'),
    words: path.join(v.dir, 'words.json'),
    work,
    out,
    voiceClean: path.join(work, 'voice.clean.wav'),
    voiceReport: path.join(work, 'voice.report.json'),
    props: path.join(work, 'props.json'),
    qa: path.join(work, 'qa.json'),
    stills: path.join(work, 'stills'),
    mp4: path.join(out, `${v.name}.mp4`),
  };
}

export const readJson = (file, fallback = undefined) => {
  if (!fs.existsSync(file)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing file: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

export const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, file);
};

export const exists = (file) => fs.existsSync(file) && fs.statSync(file).size > 0;
export const mtime = (file) => (fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0);

/** True when `output` exists and is newer than every input. Used to skip finished work. */
export const upToDate = (output, inputs) => exists(output) && inputs.every((i) => mtime(i) <= mtime(output));
