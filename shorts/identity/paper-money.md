# Paper Money

The visual identity of the channel. One fixed look; a different structure every day.

## The idea

Money is usually shown as something that is not there: a glowing number, a line going up. Here it
is a thing on a desk. Every video is a collage built by hand from cut paper and banknote
engraving, photographed from above, one frame at a time. A fee is a coin you can count. A share
of revenue is a strip cut off a note with scissors. A verdict is a rubber stamp that leaves ink.
If a figure cannot be picked up, stacked, torn, cut or stamped, it has not been designed yet.

The desk is warm cream paper with real tooth: grain you can see, light that falls unevenly from
the upper left, a corner that sits a little darker than the rest. On it lie objects cut from the
same few sheets. Edges are scissor-cut where a hand would cut and torn where a hand would tear,
the torn ones showing their white core. Nothing is flush: every piece floats a few millimetres
above the one below and says so with a soft, warm shadow that tightens when the piece lands. Tape
and paper clips hold things in place, slightly crooked, because somebody put them there. The
craft has to survive a pause on any frame: each still should look like it took an afternoon at a
cutting mat, not a second in a template.

Colour is rationed like a print job. Cream is the ground and ink is the line; one accent per
video does all the talking. Banknote green, vermilion, cobalt and gold take turns, and about one
video in ten is printed in negative, cream type on an ink desk. The accent is paper and ink, never
decoration: it is the coin, the note, the stamp, the highlighter. Type and outlines stay ink.
Tints and shades are mixed only from these colours, so every frame, in any video, could have come
out of the same drawer.

Three typefaces carry three jobs and never swap. Headlines are Bricolage Grotesque, extra bold,
set tight and very large, the voice of the video. Numbers are Fraunces at its blackest, with the
soft and wonky settings turned up and an engraver's hatched shade behind them, so a figure looks
like the numeral on a banknote and can be read from across a room. Small labels and sources are
DM Mono in capitals, widely spaced, the voice of the ledger. Words are few. The picture explains;
the type names and counts.

Motion has two speeds, and the gap between them is the signature. Paper moves on twos, twelve
steps a second with a slight wobble, the way stop-motion does when a hand nudges it between
exposures. Type and numbers glide at the full thirty. Everything that arrives has weight: it
overshoots, settles, its shadow closes up, and a sound lands with it. The key number or object
hits the desk in the first half second, before the first word is out. Scenes change physically: a
page tears away, a note folds into the next object, the camera whips across the desk. The camera
never quite stops drifting, and the layers slide at different speeds so the desk has depth. Once,
near the middle, the pattern breaks: the colours flip, or the camera dives in, or everything
freezes for a beat.

The identity is fixed so that the channel is recognisable in a quarter of a second. Everything
else is free. Scene order, accent, opening move, featured objects and transitions change from one
video to the next, so that no two neighbours share a skeleton. Recognition comes from the
materials and the hand, never from a layout. Each video is made as if it were the only one:
meticulously, by someone who has done this for years and still checks every edge.

## The system

### Colour

| Role | Name | Hex | Used for |
|---|---|---|---|
| Ground | Paper cream | `#F4EBDD` | the desk; type on the inverted version |
| Line | Ink | `#15130F` | type, outlines, engraving; the desk on the inverted version |
| Accent | Banknote green | `#1F6F54` | one per video, in rotation |
| Accent | Vermilion | `#E8452C` | |
| Accent | Cobalt | `#2B4EFF` | |
| Accent | Gold | `#D9A441` | |

Papers are cream's own hue, lighter or deeper, so no new colour enters the drawer: bright paper
`#FBF8F1` (receipts, caption strips, the core of a torn edge), card, manila and kraft. Each
accent also has a deep shade (for engraving lines on accent paper), a light wash and a
highlighter tint. All of them are computed in `src/shared/paper.mjs` and tested for contrast.

Rules that keep it readable:
- Type is ink on cream, cream on ink. An accent is used for large numerals only where it reaches
  3:1 against the ground (gold never does on cream, so gold videos keep their numerals ink).
- Text on accent paper takes whichever of ink or cream reads better.
- The highlighter tint is as strong as it can be while ink on top of it still reaches 7:1.
- Shadows are warm brown, never black, and are multiplied onto the paper.

### Type

| Job | Typeface | Setting |
|---|---|---|
| Headlines, captions | Bricolage Grotesque | weight 800, width 87, tracking -0.035em, line height 0.92 |
| Numbers | Fraunces | weight 900, optical size 144, SOFT 100, WONK 1, hatched shade |
| Labels, sources | DM Mono | weight 500, capitals, tracking 0.14em |

All three are open-licensed (SIL OFL) and bundled from npm, so nothing is fetched at render time.

### The drawer (all original, drawn in code, no logos)

Cut-paper products · engraved coins and coin stacks · banknotes with guilloche line work that
draws itself on · notes cut by scissors (the channel's pie chart) · receipts that unroll · price
tags that swing · rubber stamps that slam down and leave worn ink · tape, paper clips, labels.

### Frame

1080 x 1920, 30 fps. Text never enters the top 11.5%, the bottom 20% or the right 15% (YouTube's
buttons). Paper may run off any edge. Captions sit in the centre third on their own strip of
bright paper, two to four words at a time, with a highlighter swipe in the accent colour drawing
on behind the word being spoken.

### Charts, said in paper

- A count or a comparison is a stack of coins. The key under the stack says what one coin is
  worth, and stacks are rounded to whole coins, never stretched.
- A share is a note cut with scissors: the piece that leaves is the share.
- A running total is a numeral counting up at full frame rate.
- A list of amounts is a receipt.
- A single price is a tag.
- A verdict is a stamp.
