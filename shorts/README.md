# Shorts pipeline

Turns a script, a fact file and a voice recording into an upload-ready
1080x1920 YouTube Short. One company per video, one surprising fact about how
it makes money, shown with animated numbers.

Everything is tracked in `status.csv`, so work can stop at any point and pick
up later exactly where it left off. Finished steps are never redone.

## Where things are

```
shorts/
  status.csv            one row per video: id, topic, stage, problems, ...
  channel.json          channel name, your one-liner, call to action, fallback voice
  videos/
    001-costco-membership/
      script.md         the spoken words
      sources.md        every figure, with its source, URL, date and quote
      video.json        the storyboard: which scenes, in which order, which look
      voice.wav         YOUR RECORDING goes here (see "Recording")
      words.json        Whisper word timings (made by the pipeline)
      upload.md         title, description, sources and hashtags for YouTube
      out/*.mp4         the finished video          (not stored in git)
      work/             intermediate files, QA report (not stored in git)
  pipeline/             the tools (cli.mjs is the front door)
  src/                  the Remotion animation code
```

## Every day use

```bash
cd shorts
bash setup.sh                       # once per fresh machine or session
node pipeline/cli.mjs status        # where every video is
node pipeline/cli.mjs next          # what each video needs next
node pipeline/cli.mjs make all      # run every remaining step for every video
```

`make` runs, in order, and stops a video at the first step that fails:

| Step | Command | What it does | Stage reached |
|---|---|---|---|
| check | `cli.mjs check 001` | Script rules, fact file, storyboard, variety against neighbours | `sourced` > `scripted` > `planned` |
| voice | `cli.mjs voice 001` | Cleans `voice.wav`; if there is none, uses the fallback voice and flags it | `voiced` |
| time | `cli.mjs time 001` | Whisper finds when each word is spoken and locks that onto the script | `timed` |
| render | `cli.mjs render 001` | Renders the MP4 | `rendered` |
| qa | `cli.mjs qa 001` | Checks the finished MP4 | `ready` |

After you upload a video: `node pipeline/cli.mjs mark 001 uploaded`.

Other tools: `cli.mjs preview 001` makes a contact sheet of stills
(`work/preview.png`) to judge the look before rendering.
`node pipeline/dev/timeline.mjs 001` prints when every scene and reveal lands.

## Recording

1. Read `script.md` aloud. One take, natural pace, a quiet room. Leave the
   last line open, exactly as written: it runs into the first line.
2. Save it as `voice.wav` in that video's folder (any normal WAV, MP3 or M4A
   renamed is not enough: export WAV).
3. `node pipeline/cli.mjs make 001`

The pipeline removes background noise and rumble, trims the silence at both
ends, shortens long pauses, evens out the level and sets loudness to -14 LUFS.
It tells you if the recording is clipped, noisy or too quiet.

Whisper then listens to it. If you misread a figure, the step fails and names
the line: a spoken number that differs from its source would make the video
untrue.

No `voice.wav`? The pipeline falls back to a synthetic voice (Kokoro) and
writes `TTS FALLBACK VOICE` into the `problems` column of `status.csv`.
Videos with the fallback voice are for review, not for upload.

## The rules it enforces

**Script** (`script.md`)
- 70-110 words, 25-40 seconds on the real audio
- the first sentence is a specific claim, short enough to land in two seconds,
  naming the company or a figure; no warm-up, no question
- one idea; short sentences; plain words; no filler phrases
- explains, never advises: anything that reads as money advice fails
- the last line is left open so the first line completes it (the loop)

**Facts** (`sources.md`)
- every figure that is spoken or shown must be listed under a claim
- each claim needs: source, type (`company report`, `regulator filing` or
  `major news outlet`), a full https URL, a date, a quote, and the date checked
- wikis, data aggregators, blogs and social media are refused
- `Exact:` holds the precise source value; a rounded figure is checked
  against it, and so are words like "more than" and "nearly"
- a calculated figure shows its sum (`Derived: 5323 / 10383 * 100 = 51.3`)
  and the sum is recomputed

**Look** (`video.json`)
- no two videos in a row may share scene order, colour accent, opening style
  or overall look (hard failures); repeats within the last few videos are
  warned about
- something new must appear on screen at least every 3 seconds, checked
  against the planned reveals and then against the rendered pixels
- no text in the bottom 20% or right 15% of the frame: every sampled frame of
  the finished video is probed for the position of all visible text
- frame 0 must already show the claim in large type
- no logos, mascots or outside images: plain text names and the pipeline's
  own icons only

## Writing a storyboard

`video.json` holds a `look` and a list of `scenes`.

```json
{
  "id": "001",
  "look": { "accent": "lime", "ground": "ink", "type": "grotesk", "motion": "snap", "captions": "pop", "shape": "sharp" },
  "scenes": [
    { "type": "hook", "variant": "slam", "beats": ["half"],
      "props": { "kicker": "Costco", "lines": ["Membership fees", "equal half", "its profit"], "emphasis": "half" } },
    { "type": "counter", "variant": "odometer", "at": "Shoppers paid", "beats": ["just to walk"],
      "props": { "prefix": "$", "value": 5.3, "decimals": 1, "suffix": "billion", "label": "Membership fees", "sub": "paid just to walk in" } }
  ]
}
```

- `at` is the words in the script where the scene starts. The first scene
  starts at the first word.
- `beats` are the words at which the scene reveals its next step. Scenes and
  steps are pinned to those words in the real recording, so pictures land with
  the voice.
- Any scene accepts `"source": "Costco results, fiscal 2025"` for a small
  on-screen credit.

Look options (`src/shared/spec.mjs` is the single list everything reads):

| Choice | Options |
|---|---|
| `ground` | ink, graphite, paper, chalk, ledger, blueprint, forest, plum |
| `accent` | lime, coral, amber, mint, sky, violet, pink, gold, tangerine, teal, red, cobalt (each ground allows a checked subset) |
| `type` | grotesk, editorial, tech, poster, quirky, soft, wide |
| `motion` | snap, glide, bounce, tick |
| `captions` | pop, box, underline, fill |
| `shape` | sharp, soft, round |

Scene types and variants:

| Type | Variants | Steps (cues) |
|---|---|---|
| `hook` | slam, stamp, stack, highlighter, redacted, spotlight | claim, punch on the key word, optional sub-line |
| `kinetic` | cascade, mask, scale, ticker | one per line |
| `counter` | odometer, countup, slot | number, optional `sub`, optional `also` |
| `chart` | bars, hbars, line, segmented, meter | one per item (line: 2; meter: 2-3) |
| `flow` | river, chain | river: source + one per split; chain: one per node |
| `breakdown` | stack, receipt, coins | one per item, plus total |
| `split` | halves, cards, slider | before, after, optional verdict |
| `map` | dots, outline | map, marks, optional stat (`region`: world, usa, uk, europe) |
| `timeline` | rail, steps | one per event |
| `mockup` | card, phone, receipt, storefront, box, tag | object, then one per callout |
| `icons` | chain, equation, grid | one per item, plus result |
| `ratio` | grid, row | grid, fill, optional note |
| `versus` | circles, towers | first, second, optional note |

Charts follow one rule set: one accent for the series that matters and
neutrals for the rest, part-to-whole as a segmented bar (never a pie), one
axis, labels in text colour. Bar sizes are checked against the printed
figures, so a drawing cannot disagree with its numbers.

## Starting a new video

```bash
node pipeline/cli.mjs new 004 netflix-ads Netflix
```

Then fill in `script.md`, `sources.md` and `video.json`, and run
`cli.mjs check 004` until it passes.

## Setup notes

- `setup.sh` installs the Node packages, a Python environment, the Whisper
  model (`faster-whisper small.en`, checksum-verified) and the fallback voice.
- Network hosts needed beyond npm and PyPI: `huggingface.co`,
  `us.aws.cdn.hf.co` (Whisper weights) and GitHub release downloads (fallback
  voice). The `kaycreatesweb` cloud environment already allows these.
- Rendering uses the Chrome headless shell already on the machine; set
  `SHORTS_BROWSER` to point at another one.
- `npm test` runs the pipeline's own tests. `npm run studio` opens Remotion
  Studio.
- Remotion is free for individuals and small teams; companies above its
  size threshold need a licence (remotion.dev/license).
