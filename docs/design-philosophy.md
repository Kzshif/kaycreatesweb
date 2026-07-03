# Voltage Editorial

*The design philosophy behind KayCreatesWeb — authored per the canvas-design
method, applied per theme-factory, with generative texture per algorithmic-art.*

---

## The movement

**Voltage Editorial** is what happens when a printing press falls in love with a
power grid. It is the aesthetic of controlled electricity: vast fields of near-black
silence interrupted — precisely, deliberately — by lines of living light. Nothing
glows by accident. Every luminous element is a signal, and signals are expensive;
the composition spends them the way a master typesetter spends italics.

Space is the first material. The canvas breathes in deep night — not the dead
black of an off switch but the charged dark of a studio at 2am, where the only
light comes from the work itself. Content floats on panes of glass barely
distinguishable from the dark behind them, their edges caught by a one-pixel
thread of light, as if each card were lit from a source just off-canvas. Margins
are generous to the point of extravagance. Emptiness is not absence; it is the
insulation that lets the voltage read.

Type carries two voices in deliberate tension. The primary voice is geometric and
engineered — wide-set capitals, tight tracking, the confidence of a machined
part. The second voice interrupts it: a serif italic, editorial and human,
reserved for the one word in a headline that matters most. The pairing is the
philosophy in miniature — infrastructure and craft, current and hand. Scale is
theatrical: headlines are monuments, labels are whispers, and almost nothing
lives in between.

Color behaves like charge. A single continuum of electric blue into cyan is the
system's live wire, and it appears only where energy actually flows: an active
state, a captured lead, a rising score, the stroke of a particle in flight. One
warm coral counter-tone exists so the eye has somewhere to land when the current
matters most. Everything else is achromatic discipline. Gradients are permitted
only as atmosphere — aurora light pooling behind glass — never as decoration
painted onto surfaces.

Motion is evidence of life, not garnish. Behind the work, a constellation of
nodes drifts slowly through the dark, joined by proximity into a living map — a
nervous system rendered in thread-thin light, with signals firing along its
connections as brief cyan sparks. It is seeded and deterministic: the same mind,
thinking the same way, every time. Interface motion is small and
physical: things arrive from six pixels away, numbers count up because they were
just computed, borders brighten because attention arrived. Nothing bounces.
Nothing spins. The work must feel meticulously crafted — labored over with
painstaking attention by someone at the absolute top of their field — because
restraint at this level cannot be faked, and everyone can feel it.

---

## The theme (theme-factory format)

### Voltage Editorial

A charged, editorial dark theme where electric light cuts through engineered
darkness. Built for AI products that want to feel inevitable.

**Color palette**

| Role | Name | Hex |
| --- | --- | --- |
| Base | Night | `#090b12` |
| Raised surface | Charged glass | `rgba(255,255,255,0.04)` + 1px `rgba(255,255,255,0.09)` edge |
| Primary current | Volt Blue | `#4c6ef5` |
| High signal | Live Cyan | `#22d3ee` |
| Counter-tone | Filament Coral | `#ff7847` |
| Text | Silver White | `#eef0f6` / 62% / 40% muted steps |
| App base (light context) | Paper | `#f8f7f3` with Ink `#12141d` |

**Typography**

- **Display / headers**: Space Grotesk — geometric, tight tracking, engineered
- **Editorial accent**: Instrument Serif *italic* — one emphasized word per headline
- **Body / UI**: Plus Jakarta Sans

**Rules of application**

1. The blue→cyan gradient appears only on live things: active nav, primary CTAs,
   data marks, particle strokes, focus rings.
2. Glass cards: near-invisible fill, 1px light edge, glow arrives on hover only.
3. One serif-italic accent word per headline, set in the current.
4. Coral is rationed: urgent counts, lead moments, the rare emphatic number.
5. Motion: 300–600ms ease-out entrances of ≤16px; counters count; the flow field
   is seeded and calm. Respect `prefers-reduced-motion` everywhere.
6. The app (a working surface) runs the light Paper/Ink context with the same
   type system and current colors, so marketing and product read as one brand.

**Chart palette** (dataviz-validated): `#3b5bdb` conversations · `#e8590c` leads
on light surfaces; `#5c7cfa` / `#ff7847` on night.

**Best used for**: AI platforms, developer infrastructure, products that turn
invisible work into visible results.
