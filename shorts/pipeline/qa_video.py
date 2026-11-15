#!/usr/bin/env python3
"""Checks on the finished MP4 itself (what the viewer actually gets).

  qa_video.py <video.mp4> <out.json>

Measures, from the rendered pixels and audio:
  - format: codec, size, frame rate, duration
  - loudness of the audio track
  - visual change: the longest stretch in which the picture barely changes
    (the brief asks for a visual change every 2-3 seconds)
  - blank frames: any frame that is a single flat colour
  - the loop: how closely the last frame matches the first
"""
import json
import re
import subprocess
import sys

import numpy as np

W, H, FPS = 108, 192, 6  # analysis size and rate
CAPTION_TOP = int(H * 1235 / 1920)  # ignore the subtitle band: words changing is not a visual change
CAPTION_BOTTOM = int(H * 1536 / 1920)


def run(cmd, binary=False):
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.decode(errors="replace")[-800:])
    return p.stdout if binary else p.stderr.decode(errors="replace")


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels,nb_frames:format=duration,size,bit_rate", "-of", "json", path],
        capture_output=True,
        text=True,
    )
    j = json.loads(out.stdout)
    v = next((s for s in j["streams"] if s["codec_type"] == "video"), {})
    a = next((s for s in j["streams"] if s["codec_type"] == "audio"), {})
    num, den = (v.get("r_frame_rate", "0/1").split("/") + ["1"])[:2]
    return {
        "video_codec": v.get("codec_name"),
        "width": v.get("width"),
        "height": v.get("height"),
        "fps": round(float(num) / float(den or 1), 3),
        "pix_fmt": v.get("pix_fmt"),
        "frames": int(v.get("nb_frames") or 0),
        "audio_codec": a.get("codec_name"),
        "audio_rate": int(a.get("sample_rate") or 0),
        "audio_channels": a.get("channels"),
        "seconds": round(float(j["format"]["duration"]), 3),
        "megabytes": round(int(j["format"]["size"]) / 1e6, 2),
        "kbps": round(int(j["format"].get("bit_rate") or 0) / 1000),
    }


def loudness(path):
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"])
    tail = err[err.rfind("Summary:") :]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", tail)
    tp = re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail)
    return {"lufs": float(i.group(1)) if i else None, "true_peak_db": float(tp.group(1)) if tp else None}


def loudness_ffprobe(path):
    """The same measurement taken with ffprobe (EBU R128 through its lavfi input)."""
    esc = path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-f", "lavfi", "-i", f"amovie='{esc}',ebur128=metadata=1:peak=true",
         "-show_entries", "frame_tags=lavfi.r128.I,lavfi.r128.true_peaks_ch0,lavfi.r128.true_peaks_ch1", "-of", "json"],
        capture_output=True, text=True,
    )
    try:
        tags = [f.get("tags", {}) for f in json.loads(out.stdout).get("frames", [])]
        last = next(t for t in reversed(tags) if "lavfi.r128.I" in t)
        peaks = [float(t[k]) for t in tags for k in ("lavfi.r128.true_peaks_ch0", "lavfi.r128.true_peaks_ch1") if k in t]
        peak = max(peaks) if peaks else None
        return {"lufs": round(float(last["lavfi.r128.I"]), 1), "true_peak_db": round(20 * float(np.log10(peak)), 1) if peak and peak > 0 else None}
    except Exception as e:  # noqa: BLE001 - reported, never fatal: the ffmpeg measurement is still there
        return {"lufs": None, "true_peak_db": None, "error": str(e)[:200]}


def frames(path):
    raw = run(["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"fps={FPS},scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-"], binary=True)
    return np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.int16)


def exact_frame(path, which):
    """First or last frame at analysis size, colour."""
    sel = ["-frames:v", "1"] if which == "first" else ["-update", "1"]
    pre = [] if which == "first" else ["-sseof", "-0.08"]
    raw = run(["ffmpeg", "-loglevel", "error", *pre, "-i", path, "-vf", f"scale={W}:{H}:flags=area,format=rgb24", *sel, "-f", "rawvideo", "-"], binary=True)
    n = W * H * 3
    return np.frombuffer(raw[-n:], dtype=np.uint8).reshape(H, W, 3).astype(np.int16)


def main():
    path, out = sys.argv[1], sys.argv[2]
    info = probe(path)
    loud = loudness(path)
    loud_probe = loudness_ffprobe(path)
    f = frames(path)
    mask = np.ones((H, W), dtype=bool)
    mask[CAPTION_TOP:CAPTION_BOTTOM, :] = False

    # A "visual change" = at least 1.5% of the picture (outside the subtitle band) clearly
    # different from half a second earlier. Half a second covers a whole entrance animation,
    # so a reveal counts once rather than being split into slivers that each look like nothing.
    k = FPS // 2
    changed = (np.abs(f[k:] - f[:-k]) > 28)[:, mask].mean(axis=1) if len(f) > k else np.zeros(0)
    events = [0.0] + [round((i + k) / FPS, 2) for i, c in enumerate(changed) if c > 0.015]
    events.append(round(len(f) / FPS, 2))
    gaps = [(round(b - a, 2), a) for a, b in zip(events, events[1:])]
    worst = max(gaps) if gaps else (0, 0)

    flat = [round(i / FPS, 2) for i, fr in enumerate(f) if fr[mask].std() < 1.5]
    first, last = exact_frame(path, "first"), exact_frame(path, "last")
    loop_diff = float(np.abs(first - last)[mask].mean())

    report = {
        "format": info,
        "loudness": loud,
        "loudness_ffprobe": loud_probe,
        "visual_change": {"events": len(events) - 2, "longest_static_s": worst[0], "longest_static_at_s": worst[1], "mean_gap_s": round(float(np.mean([g for g, _ in gaps])), 2) if gaps else 0},
        "flat_frames_at_s": flat[:10],
        "loop": {"first_last_mean_diff": round(loop_diff, 2)},
    }
    with open(out, "w") as fh:
        json.dump(report, fh, indent=2)
        fh.write("\n")
    print(json.dumps({"ok": True}))


if __name__ == "__main__":
    main()
