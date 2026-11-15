# Sound licences

Every sound the pipeline may use is listed here. The mixer (`pipeline/mix.py`) reads this file and
refuses any file that is not on it, and a test fails if a file sits in `assets/` without an entry.

## Where these sounds come from

All files below are **original**. They were synthesised from code by
`pipeline/make_audio_assets.cjs`, written for this channel: the effect recipes, the chord
progressions, the bass lines, the drum patterns and the melodies are all in that file. Nothing
was recorded, sampled, downloaded or taken from a sound library, and no third party holds rights
in them.

- **Owner:** the channel owner.
- **Licence:** original work, owned outright. No attribution needed, no Content ID claim possible
  from a library, safe for monetised use.
- **Tool used:** the synthesiser engine of the animation-studio plugin (oscillators, filters and a
  few instrument models). It is a tool, like a keyboard: it ships no audio, and what it renders
  here is new.
- **Made:** 2026-11-15. Re-running the script reproduces the files exactly.

Levels were set by measurement, not by ear (see "What has not been checked" below).

## Effects (`assets/sfx`, mono WAV, 48 kHz, 16-bit, peak -3 dBFS)

| File | What it is |
|---|---|
| `sfx/slam-1.wav` | the opening hit: the key number or object landing |
| `sfx/slam-2.wav` | the opening hit: the key number or object landing |
| `sfx/slam-3.wav` | the opening hit: the key number or object landing |
| `sfx/land-1.wav` | a paper object settling on the desk |
| `sfx/land-2.wav` | a paper object settling on the desk |
| `sfx/land-3.wav` | a paper object settling on the desk |
| `sfx/land-4.wav` | a paper object settling on the desk |
| `sfx/fwip-1.wav` | paper sliding in |
| `sfx/fwip-2.wav` | paper sliding in |
| `sfx/fwip-3.wav` | paper sliding in |
| `sfx/fwip-4.wav` | paper sliding in |
| `sfx/coin-1.wav` | one coin touching another (five rising pitches for a growing stack) |
| `sfx/coin-2.wav` | one coin touching another (five rising pitches for a growing stack) |
| `sfx/coin-3.wav` | one coin touching another (five rising pitches for a growing stack) |
| `sfx/coin-4.wav` | one coin touching another (five rising pitches for a growing stack) |
| `sfx/coin-5.wav` | one coin touching another (five rising pitches for a growing stack) |
| `sfx/tick-1.wav` | a counter stepping |
| `sfx/tick-2.wav` | a counter stepping |
| `sfx/tick-3.wav` | a counter stepping |
| `sfx/ding-1.wav` | a figure arriving: one soft struck tone |
| `sfx/ding-2.wav` | a figure arriving: one soft struck tone |
| `sfx/ding-3.wav` | a figure arriving: one soft struck tone |
| `sfx/whip-1.wav` | the camera whipping across the desk |
| `sfx/whip-2.wav` | the camera whipping across the desk |
| `sfx/whip-3.wav` | the camera whipping across the desk |
| `sfx/tear-1.wav` | a page tearing away |
| `sfx/tear-2.wav` | a page tearing away |
| `sfx/tear-3.wav` | a page tearing away |
| `sfx/fold-1.wav` | paper folding |
| `sfx/fold-2.wav` | paper folding |
| `sfx/snip-1.wav` | scissors closing |
| `sfx/snip-2.wav` | scissors closing |
| `sfx/snip-3.wav` | scissors closing |
| `sfx/stamp-1.wav` | a rubber stamp coming down |
| `sfx/stamp-2.wav` | a rubber stamp coming down |
| `sfx/stamp-3.wav` | a rubber stamp coming down |
| `sfx/pop-1.wav` | a label or tag appearing |
| `sfx/pop-2.wav` | a label or tag appearing |
| `sfx/pop-3.wav` | a label or tag appearing |
| `sfx/swipe-1.wav` | a marker pen swiping |
| `sfx/swipe-2.wav` | a marker pen swiping |
| `sfx/tape-1.wav` | tape pulled off the roll |
| `sfx/tape-2.wav` | tape pulled off the roll |
| `sfx/boom-1.wav` | the low hit at the mid-video pattern break |
| `sfx/boom-2.wav` | the low hit at the mid-video pattern break |
| `sfx/riser-1.wav` | a short rise that stops at the pattern break |
| `sfx/riser-2.wav` | a short rise that stops at the pattern break |
| `sfx/printer-1.wav` | a receipt printing |
| `sfx/printer-2.wav` | a receipt printing |
| `sfx/ching-1.wav` | a till: drawer click and two small bells |
| `sfx/ching-2.wav` | a till: drawer click and two small bells |

## Music beds (`assets/music`, stereo Opus in Ogg, 48 kHz, 56 s, -18 LUFS)

| File | What it is |
|---|---|
| `music/caper.ogg` | plucked strings, walking bass, 96 bpm, D minor |
| `music/ledger.ogg` | lo-fi electric piano with a music-box figure, 78 bpm, F major |
| `music/market.ogg` | log drum and muted guitar, 104 bpm, E minor |
| `music/stoop.ogg` | head-nod drums and electric piano, 88 bpm, A minor |
| `music/counting.ogg` | marimba pattern, 104 bpm, G major |
| `music/vault.ogg` | slow lo-fi with a music-box line, 84 bpm, D minor |

## How they are used

- **Rotation.** The music bed follows the video number (`caper`, `ledger`, `market`, `stoop`,
  `counting`, `vault`, then round again), so two videos in a row never share one. Each effect
  family has several variants; every video starts at a different one and no file plays twice in
  a row. A storyboard can name a bed with `"sound": { "music": "vault" }` or switch it off with
  `"music": "none"`.
- **Levels.** The bed sits 17 dB under the voice while someone is speaking and rises to 11 dB
  under it in pauses. Effects play 8-21 dB below their own full level. The finished mix is set to
  -14 LUFS with a true peak no higher than -1.5 dB, and both numbers are measured again on the
  finished MP4.

## Adding a sound from somewhere else

Only CC0 or properly licensed files. Put the file in `assets/sfx` or `assets/music`, then add a
row to a new table here with: the file in backticks, what it is, the page it came from (full
URL), its author, its licence (with the licence URL), and the date you downloaded it. Keep a
copy of the licence text or a screenshot of the page next to the file. Without the row, the
mixer will not use it.

## What has not been checked

These sounds have been measured (level, length, where their energy sits, loudness of the final
mix) but **never listened to**: they were made by a model that cannot hear. Before the first
upload, listen to one finished video on a phone speaker and on headphones. If the bed is too
present or an effect is harsh, change the numbers in `src/shared/sound.mjs` (`LEVELS`) or swap
the file; everything else follows.
