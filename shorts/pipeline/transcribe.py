#!/usr/bin/env python3
"""Subtitle timing stage.

  transcribe.py <clean.wav> <script-words.json> <words.json> [--prompt "..."]

Runs Whisper on the cleaned voice-over to get a start and end time for every
spoken word, then locks those timings onto the words of the script. The
subtitles therefore show the script's exact spelling and figures, timed to the
real voice. If the voice says something different from the script (a misread
number, a skipped line) that is reported, because a spoken figure that differs
from the sourced one is a factual error.

script-words.json: ["Costco", "barely", ...]  - the script's words, in order
words.json:        { words: [{ w, start, end, matched }], heard, match, mismatches, ... }
"""
import argparse
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / ".models" / "faster-whisper-small.en"

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
NUMWORD = {w: i for i, w in enumerate(ONES)}
NUMWORD.update({w: i * 10 for i, w in enumerate(TENS) if w != "_"})


def norm(tok):
    """Comparable form of a word: lower case, no punctuation, small number words as digits."""
    t = tok.lower().replace("’", "'")
    t = re.sub(r"^[^\w$£€]+|[^\w%]+$", "", t)
    t = t.replace(",", "").lstrip("$£€")  # "$270" is said, and often heard, as "270 ... dollars"
    t = {"percent": "%", "per": "per", "bn": "billion", "mn": "million", "tn": "trillion", "&": "and"}.get(t, t)
    if t in NUMWORD:
        t = str(NUMWORD[t])
    return t


def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return max(1, len(re.sub(r"\D", "", word)))  # a figure: roughly one beat per digit
    groups = re.findall(r"[aeiouy]+", re.sub(r"(?:es|ed|e)$", "", w)) or ["a"]
    return max(1, len(groups))


def align(script, heard):
    """
    script: [str]; heard: [{word,start,end}]
    Returns one {w,start,end,matched} per script word. Words Whisper heard
    identically keep its exact timing; anything in between shares the time span
    of whatever Whisper heard there, in proportion to its length.
    """
    a = [norm(w) for w in script]
    b = [norm(h["word"]) for h in heard]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    out = [None] * len(script)
    mism = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                h = heard[j1 + k]
                out[i1 + k] = {"w": script[i1 + k], "start": h["start"], "end": h["end"], "matched": True}
            continue
        # the stretch of time this unmatched run has to share
        t0 = heard[j1]["start"] if j1 < j2 else (heard[j1 - 1]["end"] if j1 > 0 else 0.0)
        t1 = heard[j2 - 1]["end"] if j1 < j2 else (heard[j2]["start"] if j2 < len(heard) else t0)
        said = " ".join(h["word"] for h in heard[j1:j2])
        wrote = " ".join(script[i1:i2])
        if i1 < i2:
            weights = [syllables(w) for w in script[i1:i2]]
            total = float(sum(weights)) or 1.0
            span = max(t1 - t0, 0.0)
            t = t0
            for k, w in enumerate(script[i1:i2]):
                d = span * weights[k] / total
                out[i1 + k] = {"w": w, "start": t, "end": t + d, "matched": False}
                t += d
        # A currency word with nothing opposite it is just the "$" being read out, not a difference.
        if not wrote and re.fullmatch(r"(dollars?|pounds?|euros?|cents?|pence)[.,]?", said.lower()):
            continue
        mism.append({"script": wrote, "heard": said, "at": round(t0, 2)})
    return out, mism


def digits(s):
    return re.findall(r"\d+(?:\.\d+)?", s.replace(",", ""))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("script_words")
    ap.add_argument("out")
    ap.add_argument("--prompt", default="")
    a = ap.parse_args()

    if not (MODEL_DIR / "model.bin").exists():
        sys.exit("Whisper model is missing: run `bash setup.sh`")
    from faster_whisper import WhisperModel

    script = json.loads(Path(a.script_words).read_text())
    model = WhisperModel(str(MODEL_DIR), device="cpu", compute_type="int8", cpu_threads=4)
    # Decode with ffmpeg ourselves (16 kHz mono float), so timing does not depend on
    # whichever audio-decoding library version happens to be installed.
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", a.audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    audio = np.frombuffer(raw, dtype=np.float32)
    segments, info = model.transcribe(
        audio,
        language="en",
        beam_size=5,
        word_timestamps=True,
        condition_on_previous_text=False,
        initial_prompt=a.prompt or None,
        vad_filter=False,
    )
    heard = []
    for seg in segments:
        first = True
        for w in seg.words or []:
            text = w.word.strip()
            if not text:
                continue
            # Whisper marks a new word with a leading space. A piece without one ("$5" + ".3",
            # "51" + "%") belongs to the word before it, so the two are joined back together.
            glued = not w.word.startswith(" ") and not first and heard
            if glued and (re.match(r"^[.,]?\d|^%|^'", text) or not re.search(r"\w", text)):
                heard[-1]["word"] += text
                heard[-1]["end"] = float(w.end)
                heard[-1]["p"] = min(heard[-1]["p"], round(float(w.probability), 3))
            else:
                heard.append({"word": text, "start": float(w.start), "end": float(w.end), "p": round(float(w.probability), 3)})
            first = False

    words, mism = align(script, heard)
    duration = float(info.duration)
    # tidy: in order, no overlaps, every word at least 40 ms, nothing past the end of the audio
    prev = 0.0
    for w in words:
        w["start"] = max(prev, min(w["start"], duration))
        w["end"] = min(max(w["end"], w["start"] + 0.04), duration)
        prev = w["start"]
        w["start"], w["end"] = round(w["start"], 3), round(w["end"], 3)
    matched = sum(1 for w in words if w["matched"])
    # a difference that involves a figure is the kind that makes a video untrue
    figure_mismatches = [m for m in mism if digits(m["script"]) != digits(m["heard"])]
    Path(a.out).write_text(
        json.dumps(
            {
                "engine": "faster-whisper small.en (word_timestamps)",
                "duration": round(duration, 3),
                "match": round(matched / max(1, len(words)), 4),
                "heard": " ".join(h["word"] for h in heard),
                "mismatches": mism,
                "figure_mismatches": figure_mismatches,
                "low_confidence": [h["word"] for h in heard if h["p"] < 0.35],
                "words": words,
            },
            indent=1,
        )
        + "\n"
    )
    print(json.dumps({"ok": True, "words": len(words), "match": round(matched / max(1, len(words)), 3), "mismatches": len(mism), "figure_mismatches": len(figure_mismatches)}))


if __name__ == "__main__":
    main()
