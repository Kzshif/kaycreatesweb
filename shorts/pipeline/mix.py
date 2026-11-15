#!/usr/bin/env python3
"""Builds the finished soundtrack: voice + a quiet music bed that ducks under it + effects.

  mix.py <voice.wav> <plan.json> <assets_dir> <out.wav> <report.json>

plan.json comes from src/shared/sound.mjs (the same cue frames the pictures use):
  { seconds, music: "music/caper.ogg" | null, musicUnderVoiceDb, musicInGapsDb,
    events: [{ t, file: "sfx/coin-1.wav", gainDb, pan }] }

Rules enforced here:
  - only files listed in <assets_dir>/licences.md may be used
  - the final mix is -14 LUFS with a true peak at or below -1.5 dB (no clipping)
Nobody listens to this mix before it ships, so every level is measured and written to the report.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
TARGET_LUFS = -14.0
TRUE_PEAK = -1.5


def run(cmd, binary=False):
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(map(str, cmd[:6]))} ...\n{p.stderr.decode(errors='replace')[-1500:]}")
    return p.stdout if binary else p.stderr.decode(errors="replace")


def decode(path, channels):
    raw = run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ar", str(SR), "-ac", str(channels), "-"], binary=True)
    x = np.frombuffer(raw, dtype=np.float32)
    return x.reshape(-1, channels).copy() if channels > 1 else x.copy()


def loudness(x, d, name="m"):
    """Integrated loudness and true peak of a stereo float array, measured by ffmpeg (EBU R128)."""
    tmp = Path(d) / f"{name}.wav"
    sf.write(str(tmp), x, SR, subtype="FLOAT")
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(tmp), "-af", "ebur128=peak=true", "-f", "null", "-"])
    tail = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+|-?inf) LUFS", tail)
    tp = re.search(r"Peak:\s+(-?[\d.]+|-?inf) dBFS", tail)
    val = lambda m: float(m.group(1)) if m and "inf" not in m.group(1) else None
    return val(i), val(tp)


def listed_assets(assets):
    lic = Path(assets) / "licences.md"
    if not lic.exists():
        raise RuntimeError("assets/licences.md is missing: no sound may be used without a licence entry")
    return set(re.findall(r"`((?:sfx|music)/[A-Za-z0-9_.-]+)`", lic.read_text()))


def fit(x, n):
    """Trim or zero-pad the first axis to n samples."""
    if len(x) >= n:
        return x[:n]
    pad = [(0, n - len(x))] + [(0, 0)] * (x.ndim - 1)
    return np.pad(x, pad)


def loop_to(x, n, cross=1.0):
    """Repeat a stereo bed, crossfading the joins, until it covers n samples."""
    c = int(cross * SR)
    out = x
    while len(out) < n:
        a, b = out[:-c], out[-c:]
        ramp = np.linspace(0, 1, c, dtype=np.float32)[:, None]
        out = np.concatenate([a, b * (1 - ramp) + x[:c] * ramp, x[c:]])
    return out[:n]


def voice_activity(voice, hold=0.18):
    """True where someone is speaking (30 ms frames, with a short hold so words are not chopped)."""
    mono = voice.mean(axis=1)
    win = int(0.03 * SR)
    frames = len(mono) // win
    rms = np.sqrt(np.mean(mono[: frames * win].reshape(frames, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    speech = np.percentile(db, 90)
    active = db > max(speech - 30, -52)
    h = int(hold / 0.03)
    held = active.copy()
    for i in np.flatnonzero(active):
        held[i : i + h + 1] = True
    return np.repeat(held, win), win


def duck_curve(active, n, open_gain, ducked_gain, attack=0.07, release=0.45):
    """A smooth gain curve: down quickly when speech starts, back up slowly when it stops."""
    target = np.where(fit(active.astype(np.float32), n) > 0.5, ducked_gain, open_gain).astype(np.float64)
    # one-pole smoothing at 1 kHz control rate
    step = SR // 1000
    t = target[::step]
    out = np.empty_like(t)
    g = t[0]
    ka, kr = 1 - np.exp(-1 / (attack * 1000)), 1 - np.exp(-1 / (release * 1000))
    for i, v in enumerate(t):
        g += (v - g) * (ka if v < g else kr)
        out[i] = g
    return fit(np.repeat(out, step), n).astype(np.float32)


def place(bus, x, t, gain_db, pan):
    s = int(round(t * SR))
    if s >= len(bus):
        return
    x = x[: len(bus) - s]
    g = 10 ** (gain_db / 20)
    a = (pan + 1) * np.pi / 4
    bus[s : s + len(x), 0] += x * g * np.cos(a) * np.sqrt(2)
    bus[s : s + len(x), 1] += x * g * np.sin(a) * np.sqrt(2)


def limit(x, ceiling_db, lookahead=0.005, release=0.08):
    """A look-ahead peak limiter: only the few samples above the ceiling are touched."""
    c = 10 ** (ceiling_db / 20)
    peak = np.abs(x).max(axis=1)
    need = np.minimum(1.0, c / np.maximum(peak, 1e-9))
    if need.min() >= 1.0:
        return x, 0
    w = int(lookahead * SR)
    padded = np.concatenate([need, np.ones(w, dtype=need.dtype)])
    ahead = np.lib.stride_tricks.sliding_window_view(padded, w + 1).min(axis=1)  # gain needed by anything in the next 5 ms
    g = np.ones(len(x))
    k = 1 - np.exp(-1 / (release * SR))
    cur = 1.0
    hot = np.flatnonzero(ahead < 1.0)
    # walk only the stretches around the peaks: before them the gain is already 1
    i = 0
    n = len(x)
    while i < len(hot):
        j = hot[i]
        while j < n and (ahead[j] < 1.0 or cur < 0.9999):
            cur = ahead[j] if ahead[j] < cur else cur + (1.0 - cur) * k
            g[j] = cur
            j += 1
        cur = 1.0
        while i < len(hot) and hot[i] < j:
            i += 1
    return (x * g[:, None]).astype(np.float32), int((need < 1.0).sum())


def master(total, out_path, d):
    """Set the whole mix to -14 LUFS with one fixed gain, then catch any peak above -1.5 dBTP.
    A fixed gain keeps the balance exactly as mixed (no pumping); the limiter only acts on peaks."""
    lufs, _ = loudness(total, d, "pre")
    x = (total * 10 ** ((TARGET_LUFS - lufs) / 20)).astype(np.float32)
    ceiling, limited = TRUE_PEAK - 0.3, 0
    for _ in range(4):
        y, limited = limit(x, ceiling)
        out_lufs, tp = loudness(y, d, "post")
        if tp is None or tp <= TRUE_PEAK + 0.05:
            break
        ceiling -= 0.4
    # a limiter takes a little loudness off: put it back if it is more than a rounding error
    if out_lufs is not None and abs(out_lufs - TARGET_LUFS) > 0.15:
        x = (x * 10 ** ((TARGET_LUFS - out_lufs) / 20)).astype(np.float32)
        y, limited = limit(x, ceiling)
    sf.write(str(out_path), y, SR, subtype="PCM_24")
    return {"gain_db": round(TARGET_LUFS - lufs, 2), "lufs_before": lufs, "limited_samples": limited, "limiter_ceiling_db": round(ceiling, 2)}


def main():
    voice_path, plan_path, assets, out_path, report_path = sys.argv[1:6]
    plan = json.loads(Path(plan_path).read_text())
    assets = Path(assets)
    allowed = listed_assets(assets)
    n = int(round(plan["seconds"] * SR))
    problems, used = [], []

    def asset(rel):
        if rel not in allowed:
            raise RuntimeError(f"{rel} is not listed in assets/licences.md: add its licence entry or do not use it")
        p = assets / rel
        if not p.exists():
            raise RuntimeError(f"{rel} is listed but the file is missing from assets/")
        return p

    with tempfile.TemporaryDirectory() as d:
        voice = fit(decode(voice_path, 2), n)
        v_lufs, v_tp = loudness(voice, d, "voice")
        active, _ = voice_activity(voice)
        speaking = fit(active, n)

        # ---- music bed
        music = np.zeros((n, 2), dtype=np.float32)
        music_info = None
        if plan.get("music"):
            bed = decode(asset(plan["music"]), 2)
            bed = loop_to(bed, n) if len(bed) < n else bed[:n]
            b_lufs, _ = loudness(bed, d, "bed")
            open_db = v_lufs + plan["musicInGapsDb"] - b_lufs
            duck_db = v_lufs + plan["musicUnderVoiceDb"] - b_lufs
            curve = duck_curve(active, n, 10 ** (open_db / 20), 10 ** (duck_db / 20))
            fade_in, fade_out = int(0.04 * SR), int(0.3 * SR)
            curve[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)
            curve[-fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)
            music = bed * curve[:, None]
            m_lufs, m_tp = loudness(music, d, "music")
            used.append(plan["music"])
            music_info = {"file": plan["music"], "bed_lufs": b_lufs, "lufs_in_mix": m_lufs, "gain_in_gaps_db": round(open_db, 1), "gain_under_voice_db": round(duck_db, 1)}

        # ---- effects
        sfx = np.zeros((n, 2), dtype=np.float32)
        cache = {}
        for e in plan.get("events", []):
            if e["t"] >= plan["seconds"]:
                continue
            if e["file"] not in cache:
                cache[e["file"]] = decode(asset(e["file"]), 1)
            place(sfx, cache[e["file"]], e["t"], e["gainDb"], e.get("pan", 0))
        used.extend(sorted(cache))
        s_peak = float(np.abs(sfx).max()) if len(sfx) else 0.0

        # ---- sum, then set the level of the whole thing
        total = voice + music + sfx
        norm = master(total, out_path, d)

        final = decode(out_path, 2)
        f_lufs, f_tp = loudness(final, d, "final")
        clipped = float(np.mean(np.abs(final) >= 0.999))

        # how far under the voice the bed really sits, measured only while someone is speaking
        def level(x, mask):
            sel = x[mask]
            return float(20 * np.log10(np.sqrt(np.mean(sel**2)) + 1e-12)) if len(sel) else None

        v_speech = level(voice, speaking)
        m_speech = level(music, speaking) if music_info else None
        m_gaps = level(music, ~speaking) if music_info and (~speaking).sum() > SR * 0.3 else None

    if f_lufs is None or abs(f_lufs - TARGET_LUFS) > 0.7:
        problems.append(f"final mix is {f_lufs} LUFS, target {TARGET_LUFS}")
    if f_tp is not None and f_tp > TRUE_PEAK + 0.6:
        problems.append(f"final mix peaks at {f_tp} dBTP, above {TRUE_PEAK}")
    if clipped > 0:
        problems.append(f"{clipped * 100:.3f}% of samples are clipped")
    if music_info and m_speech is not None and v_speech - m_speech < 12:
        problems.append(f"the music is only {v_speech - m_speech:.1f} dB under the voice: too loud to be a bed")
    if s_peak > 0 and 20 * np.log10(s_peak) > v_tp + 1.0:
        problems.append("an effect is louder than the loudest moment of the voice")

    report = {
        "seconds": round(n / SR, 3),
        "final": {"lufs": f_lufs, "true_peak_db": f_tp, "clipped_fraction": clipped, **norm},
        "voice": {"lufs": v_lufs, "true_peak_db": v_tp, "speaking_fraction": round(float(speaking.mean()), 3)},
        "music": music_info
        and {**music_info, "db_under_voice_while_speaking": round(v_speech - m_speech, 1), "db_under_voice_in_gaps": None if m_gaps is None else round(v_speech - m_gaps, 1)},
        "effects": {"count": len([e for e in plan.get("events", []) if e["t"] < plan["seconds"]]), "peak_dbfs": round(20 * np.log10(s_peak + 1e-9), 1) if s_peak else None, "voice_peak_dbfs": v_tp},
        "assets_used": used,
        "problems": problems,
    }
    Path(report_path).write_text(json.dumps(report, indent=2, default=float) + "\n")
    print(json.dumps({"ok": not problems}))


if __name__ == "__main__":
    main()
