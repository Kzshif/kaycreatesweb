# Shorts pipeline

Turns a script, a fact file and a voice recording into an upload-ready
1080x1920 YouTube Short. One company per video, one surprising fact about how
it makes money, shown with paper, coins and numbers.

Everything is tracked in `status.csv`, so work can stop at any point and pick
up later exactly where it left off. Finished steps are never redone.

## Where things are

```
shorts/
  status.csv            one row per video: id, topic, stage, problems, voice, accent, music, ...
  channel.json          channel name, your one-liner, call to action, fallback voice
  identity/
    paper-money.md      the channel's look: the idea and the rules
    board/              the style board (8 stills)
  assets/
    sfx/  music/        every sound the videos use (all original, made by code)
    licences.md         the list the mixer checks: nothing unlisted is ever used
  videos/
    001-costco-membership/
      script.md         the spoken words, plus titles, hashtags and pinned comment
      sources.md        every figure: source, exact link, year, how it was verified
      video.json        the storyboard: which scenes, in which order
      voice.wav         YOUR RECORDING goes here (see "Recording")
      words.json        Whisper word timings (made by the pipeline)
      metadata.md       the publishing pack (made by the pipeline)
      out/              the MP4, cover.png, captions.srt      (not stored in git)
      work/             intermediate files and check reports  (not stored in git)
  output/               finished videos, one folder each       (not stored in git)
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
| check | `cli.mjs check 001` | Script rules, publishing fields, fact file, storyboard, variety against neighbours | `sourced` > `scripted` > `planned` |
| voice | `cli.mjs voice 001` | Cleans `voice.wav`; if there is none, uses the fallback voice and flags it | `voiced` |
| time | `cli.mjs time 001` | Whisper finds when each word is spoken and locks that onto the script | `timed` |
| mix | `cli.mjs mix 001` | Soundtrack: voice, a quiet music bed that ducks under it, effects on the picture's cues, -14 LUFS | `mixed` |
| render | `cli.mjs render 001` | Renders the MP4 | `rendered` |
| qa | `cli.mjs qa 001` | Checks the finished MP4 (see "Checks after every render") | `ready` |
| pack | `cli.mjs pack 001` | Copies the finished files to `output/001-costco/` | |

After you upload a video: `node pipeline/cli.mjs mark 001 uploaded`.

`output/<id>-<company>/` holds `final.mp4`, `metadata.md`, `sources.md`,
`cover.png` (the frame to pick as the cover) and `captions.srt` (upload as
English subtitles).

## Recording

1. Read `script.md` aloud. One take, natural pace, a quiet room. Leave the
   last line open, exactly as written: it runs into the first line.
2. Save it as `voice.wav` in that video's folder (a real WAV export, not a
   renamed MP3 or M4A).
3. `node pipeline/cli.mjs make 001`

The pipeline removes background noise and rumble, trims the silence at both
ends, shortens long pauses, evens out the level and sets loudness. It tells
you if the recording is clipped, noisy or too quiet. Whisper then listens to
it: if you misread a figure, the step fails and names the line.

No `voice.wav`? The pipeline falls back to a synthetic voice and writes
`TTS FALLBACK VOICE` into the `problems` column of `status.csv`. Those renders
are for review, not for upload.

## The rules it enforces

**Script** (`script.md`)
- 70-110 words, 25-40 seconds on the real audio
- the first sentence is a specific claim, short enough to land in two seconds,
  naming the company or a figure; no warm-up, no question
- one idea; short sentences; plain words; no filler phrases
- explains, never advises: anything that reads as money advice fails
- the last line is left open so the first line completes it (the loop)

**Publishing pack** (front matter of `script.md`, written out as `metadata.md`)
- `titles:` exactly three options, each under 60 characters
- `tags:` exactly three hashtags
- `pinned:` the comment to pin (a question works best)
- `idea:` opens the description, followed by the call to action from
  `channel.json`, the sources and the three hashtags
- figures in titles, description and pinned comment need a source like any
  other figure
- `metadata.md` also says whether YouTube's "altered or synthetic content" box
  needs ticking: no with your own recorded voice, yes for the fallback voice

**Facts** (`sources.md`)
- every figure that is spoken, shown or published must be listed under a claim
- each claim needs: source, type (`company report`, `regulator filing` or
  `major news outlet`), the exact page link, a date, a quote, and
  - `Year:` the year the figure refers to
  - `Verified:` `search-verified` (a web search returned the quoted wording
    from that page; the page itself could not be opened) or `page-read`
  - `Agrees:` a second, independent result with the same figure
  - `Confidence:` `high` needs that second result on a different site;
    `medium` and `low` are listed for a check by hand before upload
- wikis, data aggregators, blogs and social media are refused
- `Exact:` holds the precise source value; a rounded figure is checked
  against it, and so are words like "more than" and "nearly"
- a calculated figure shows its sum (`Derived: 5323 / 10383 * 100 = 51.3`),
  the sum is recomputed, and it is only as sure as the least sure figure in it

**Sound** (`assets/`, `src/shared/sound.mjs`, `pipeline/mix.py`)
- only files listed in `assets/licences.md` can be used; all of them are
  original, synthesised by `pipeline/make_audio_assets.cjs`
- effects are placed on the same cue frames the pictures use, so a sound
  cannot drift from the thing that makes it
- the music bed sits 17 dB under the voice while someone is speaking
- music beds and effect variants rotate, so neighbouring videos differ
- the finished mix is -14 LUFS with a true peak under -1.5 dB, measured again
  on the finished MP4

## Checks after every render

`cli.mjs qa` fails the video, with the reason in `status.csv`, unless:

- the file is 1080x1920, 30 fps, h264/aac and under 60 seconds (25-40 by the brief)
- the audio measures -14 LUFS (taken with both ffprobe and ffmpeg) and peaks under -1 dB
- something visibly changes at least every 3 seconds (planned cues, then real pixels)
- no text sits in the top 11.5%, the bottom 20% or the right 15% of any sampled frame
- frame 0 already shows the claim in large type
- the subtitles are the script, word for word
- six stills cut from the finished file (`work/checks/still-N.png`, with a contact
  sheet) show no text spilling out of its paper, no text under YouTube's buttons,
  and captions that are large enough, 7:1 against their strip and inside the
  centre third
- the soundtrack used only licensed files, and script, facts and storyboard still pass

## The look: Paper Money

The channel has one fixed visual identity, described in
`identity/paper-money.md`: a hand-made collage of cut paper and banknote
engraving on a cream desk, one accent colour per video (banknote green,
vermilion, cobalt, gold, in rotation), every tenth video printed in negative.
The colours, text zones and type are data in `src/shared/paper.mjs`, tested
for contrast; the materials are in `src/paper/`.

```bash
node pipeline/dev/board.mjs          # render the 8-frame style board into identity/board/
node pipeline/dev/board.mjs --draft  # half size, for a quick look
python pipeline/make_textures.py     # remake the paper grain and stamp-wear textures
node pipeline/make_audio_assets.cjs  # remake the effects and music beds
```

**Where this stands.** The style board is waiting for approval. Until it is
approved, `render` still draws the first look (flat graphics, captions low in
the frame), and `qa` refuses to call such a render ready. Once approved, the
scene library moves to the Paper Money kit and the three pilots are rendered
again.

## Writing a storyboard

`video.json` holds a list of `scenes`.

```json
{
  "id": "001",
  "scenes": [
    { "type": "hook", "variant": "slam", "beats": ["half"],
      "props": { "kicker": "Costco", "lines": ["Membership fees", "equal half", "its profit"], "emphasis": "half" } },
    { "type": "counter", "variant": "odometer", "at": "Shoppers paid", "beats": ["just to walk"],
      "props": { "prefix": "$", "value": 5.3, "decimals": 1, "suffix": "billion", "label": "Membership fees", "sub": "paid just to walk in" } }
  ],
  "sound": { "music": "vault" }
}
```

- `at` is the words in the script where the scene starts. The first scene
  starts at the first word.
- `beats` are the words at which the scene reveals its next step. Scenes and
  steps are pinned to those words in the real recording, so pictures and
  sounds land with the voice.
- `sound` is optional: name a music bed, or `"music": "none"`, or
  `"sfx": false`.
- No two videos in a row may share scene order, colour accent or opening
  style; repeats within the last few videos are warned about.

The scene types and their options are listed in `src/shared/spec.mjs`. That
list is the first look's and is replaced when the scenes move to Paper Money.

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
- The three typefaces (Bricolage Grotesque, Fraunces, DM Mono) are
  open-licensed and bundled from npm; nothing is downloaded at render time.
- `pipeline/make_audio_assets.cjs` needs the animation-studio plugin's
  synthesiser to remake the sounds. The sounds themselves are in `assets/`,
  so the pipeline does not need it.
- Remotion is free for individuals and small teams; companies above its
  size threshold need a licence (remotion.dev/license).
