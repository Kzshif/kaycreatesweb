#!/usr/bin/env python3
"""Voice stage.

  voice.py clean <voice.wav> <out.wav> <report.json>
      Clean a recorded voice-over: rumble filter, noise reduction, level the
      dynamics, trim the silence at both ends, shorten long pauses, and
      normalise loudness to -14 LUFS (YouTube's reference level).

  voice.py tts <spoken-text.txt> <out.wav> <report.json> [--voice V] [--lang L] [--speed S]
      Fallback only, for when no recording exists: synthesise the script with
      the Kokoro voice, then trim and normalise it the same way.

Both write 48 kHz 16-bit WAV (the voice on both channels) plus a JSON report of what was measured,
what was changed and anything the recording should be redone for.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
KOKORO_DIR = ROOT / ".models" / "kokoro"
TARGET_LUFS = -14.0
TRUE_PEAK = -1.5
MAX_PAUSE = 0.42  # seconds: longer pauses are shortened to this
HEAD = 0.05  # silence kept before the first word
TAIL = 0.16  # silence kept after the last word


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(map(str, cmd[:6]))} ...\n{p.stderr[-1500:]}")
    return p.stderr


def load_mono(path):
    """Decode anything ffmpeg understands to mono float32 at its own sample rate."""
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d) / "in.wav"
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(path), "-ac", "1", "-c:a", "pcm_f32le", str(tmp)])
        x, sr = sf.read(str(tmp), dtype="float32")
    return np.ascontiguousarray(x), sr


def frame_db(x, sr, win=0.02, hop=0.01):
    n = max(1, int(sr * win))
    h = max(1, int(sr * hop))
    if len(x) < n:
        return np.array([-120.0]), h
    count = 1 + (len(x) - n) // h
    idx = np.arange(n)[None, :] + h * np.arange(count)[:, None]
    rms = np.sqrt(np.mean(x[idx] ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms + 1e-12), h


def measure(x, sr):
    db, _ = frame_db(x, sr)
    floor = float(np.percentile(db, 8))
    speech = float(np.percentile(db, 92))
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    clipped = float(np.mean(np.abs(x) >= 0.985)) if len(x) else 0.0
    return {
        "seconds": round(len(x) / sr, 2),
        "peak_dbfs": round(20 * np.log10(peak + 1e-9), 1),
        "noise_floor_db": round(floor, 1),
        "speech_level_db": round(speech, 1),
        "snr_db": round(speech - floor, 1),
        "clipped_fraction": round(clipped, 5),
    }


def speech_segments(x, sr, floor_db, speech_db):
    """Sample ranges that contain speech, padded so word starts and tails survive."""
    db, hop = frame_db(x, sr)
    thresh = max(floor_db + 12.0, speech_db - 38.0, -52.0)
    active = db > thresh
    segs = []
    start = None
    for i, a in enumerate(active):
        if a and start is None:
            start = i
        elif not a and start is not None:
            segs.append([start, i])
            start = None
    if start is not None:
        segs.append([start, len(active)])
    pre, post = int(0.07 * sr), int(0.13 * sr)
    out = []
    for a, b in segs:
        s, e = max(0, a * hop - pre), min(len(x), b * hop + post)
        if (e - s) < int(0.06 * sr):
            continue  # a click, not a word
        if out and s - out[-1][1] < int(0.1 * sr):
            out[-1][1] = e
        else:
            out.append([s, e])
    return out


def tighten(x, sr, segs):
    """Trim head and tail, and shorten any pause longer than MAX_PAUSE."""
    if not segs:
        return x, 0.0
    fade = int(0.012 * sr)
    pieces = []
    removed = 0
    cursor = max(0, segs[0][0] - int(HEAD * sr))
    removed += cursor
    for i, (s, e) in enumerate(segs):
        nxt = segs[i + 1][0] if i + 1 < len(segs) else None
        if nxt is None:
            end = min(len(x), e + int(TAIL * sr))
            pieces.append(x[cursor:end].copy())
            removed += len(x) - end
            break
        gap = nxt - e
        limit = int(MAX_PAUSE * sr)
        if gap > limit:
            keep_a = e + limit // 2
            keep_b = nxt - (limit - limit // 2)
            pieces.append(x[cursor:keep_a].copy())
            removed += keep_b - keep_a
            cursor = keep_b
    # short equal-power crossfades at the splices, so no cut clicks
    out = pieces[0]
    for p in pieces[1:]:
        if len(out) > fade and len(p) > fade:
            t = np.linspace(0, np.pi / 2, fade, dtype=np.float32)
            out[-fade:] = out[-fade:] * np.cos(t) + p[:fade] * np.sin(t)
            out = np.concatenate([out, p[fade:]])
        else:
            out = np.concatenate([out, p])
    edge = int(0.008 * sr)
    if len(out) > 2 * edge:
        out[:edge] *= np.linspace(0, 1, edge, dtype=np.float32)
        out[-edge:] *= np.linspace(1, 0, edge, dtype=np.float32)
    return out, removed / sr


def loudnorm(src, dst, chain=""):
    """Two-pass EBU R128 normalisation to TARGET_LUFS, written as 48 kHz mono 16-bit."""
    base = f"loudnorm=I={TARGET_LUFS}:TP={TRUE_PEAK}:LRA=11"
    # The finished video carries the voice on both channels. A signal on two channels measures
    # 3 LU louder than the same signal on one, so the level is set on the stereo version.
    stereo = "pan=stereo|c0=c0|c1=c0"
    pre = f"{chain},{stereo}," if chain else f"{stereo},"
    err = run(["ffmpeg", "-y", "-hide_banner", "-i", str(src), "-af", f"{pre}{base}:print_format=json", "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S)
    if not m:
        raise RuntimeError("could not read loudness measurement")
    j = json.loads(m.group(0))
    second = (
        f"{pre}{base}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
        f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true:print_format=json"
    )
    err = run(["ffmpeg", "-y", "-hide_banner", "-i", str(src), "-af", second, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(dst)])
    m = re.search(r"\{[^{}]*\"output_i\"[^{}]*\}", err, re.S)
    out = json.loads(m.group(0)) if m else {}
    return {"lufs": float(out.get("output_i", "nan")), "true_peak_db": float(out.get("output_tp", "nan")), "input_lufs": float(j["input_i"])}


def process(x, sr, out_path, recorded):
    before = measure(x, sr)
    warnings = []
    steps = []
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        work = x
        if recorded:
            # 1. rumble filter + noise reduction, scaled to how noisy the recording is
            filters = ["highpass=f=72"]
            steps.append("high-pass 72 Hz")
            floor = before["noise_floor_db"]
            if floor > -66:
                nr = 6 if floor < -58 else 10 if floor < -48 else 14
                nf = float(np.clip(floor + 4, -80, -20))
                filters.append(f"afftdn=nr={nr}:nf={nf:.0f}:tn=1")
                steps.append(f"noise reduction {nr} dB")
            sf.write(str(d / "raw.wav"), x, sr, subtype="FLOAT")
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(d / "raw.wav"), "-af", ",".join(filters), "-c:a", "pcm_f32le", str(d / "den.wav")])
            work, sr = sf.read(str(d / "den.wav"), dtype="float32")
        # 2. trim silence at both ends, shorten long pauses
        m = measure(work, sr)
        segs = speech_segments(work, sr, m["noise_floor_db"], m["speech_level_db"])
        tight, removed = tighten(work, sr, segs)
        steps.append(f"removed {removed:.2f}s of silence")
        sf.write(str(d / "tight.wav"), tight, sr, subtype="FLOAT")
        # 3. even out the dynamics (recordings only), then loudness normalise
        chain = "acompressor=threshold=-21dB:ratio=2.2:attack=6:release=90:knee=4:makeup=1" if recorded else ""
        if recorded:
            steps.append("gentle compression 2.2:1")
        loud = loudnorm(d / "tight.wav", out_path, chain)
        steps.append(f"normalised to {loud['lufs']:.1f} LUFS, true peak {loud['true_peak_db']:.1f} dB")

    y, osr = sf.read(str(out_path), dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)
    after = measure(y, osr)
    after.update({"lufs": round(loud["lufs"], 2), "true_peak_db": round(loud["true_peak_db"], 2), "sample_rate": osr})
    if recorded:
        if before["clipped_fraction"] > 0.0005:
            warnings.append("recording is clipped (too loud at the microphone): re-record a little quieter or further away")
        if before["snr_db"] < 22:
            warnings.append(f"recording is noisy (speech only {before['snr_db']:.0f} dB above the background): a quieter room will sound better")
        if before["speech_level_db"] < -42:
            warnings.append("recording is very quiet: move closer to the microphone")
    if abs(after["lufs"] - TARGET_LUFS) > 1.0:
        warnings.append(f"loudness ended at {after['lufs']} LUFS, target {TARGET_LUFS}")
    return {"before": before, "after": after, "removed_silence_s": round(removed, 2), "steps": steps, "warnings": warnings}


def cmd_clean(a):
    x, sr = load_mono(a.input)
    rep = process(x, sr, a.output, recorded=True)
    rep["source"] = "recorded"
    Path(a.report).write_text(json.dumps(rep, indent=2) + "\n")
    print(json.dumps({"ok": True, "seconds": rep["after"]["seconds"], "lufs": rep["after"]["lufs"], "warnings": rep["warnings"]}))


def cmd_tts(a):
    from kokoro_onnx import Kokoro

    model, voices = KOKORO_DIR / "kokoro-v1.0.onnx", KOKORO_DIR / "voices-v1.0.bin"
    if not model.exists() or not voices.exists():
        sys.exit("Kokoro model files are missing: run `bash setup.sh`")
    text = Path(a.text).read_text().strip()
    # one sentence at a time gives natural, controllable pauses between them
    parts = [s.strip() for s in re.split(r"(?<=[.!?…])\s+|\n+", text) if s.strip()]
    k = Kokoro(str(model), str(voices))
    chunks = []
    sr = 24000
    for i, sent in enumerate(parts):
        samples, sr = k.create(sent, voice=a.voice, speed=a.speed, lang=a.lang)
        samples = np.asarray(samples, dtype=np.float32)
        chunks.append(samples)
        if i < len(parts) - 1:
            pause = 0.24 if re.search(r"[.!?…]$", sent) else 0.1
            chunks.append(np.zeros(int(sr * pause), dtype=np.float32))
    x = np.concatenate(chunks) if chunks else np.zeros(sr, dtype=np.float32)
    rep = process(x, sr, a.output, recorded=False)
    rep.update({"source": "tts", "voice": a.voice, "lang": a.lang, "speed": a.speed, "engine": "kokoro-onnx v1.0"})
    Path(a.report).write_text(json.dumps(rep, indent=2) + "\n")
    print(json.dumps({"ok": True, "seconds": rep["after"]["seconds"], "lufs": rep["after"]["lufs"], "warnings": rep["warnings"]}))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("clean")
    c.add_argument("input")
    c.add_argument("output")
    c.add_argument("report")
    c.set_defaults(fn=cmd_clean)
    t = sub.add_parser("tts")
    t.add_argument("text")
    t.add_argument("output")
    t.add_argument("report")
    t.add_argument("--voice", default="bm_george")
    t.add_argument("--lang", default="en-gb")
    t.add_argument("--speed", type=float, default=1.0)
    t.set_defaults(fn=cmd_tts)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
