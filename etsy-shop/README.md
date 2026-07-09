# KayCreates — Ancient Artefacts Collection

200 unique, ancient-themed printable artworks for Etsy digital downloads.
No faces, no humans — pottery, temples, pyramids, mosaics, star charts, moon
phases, spirals, scripts and sacred emblems across 20 collections × 10 designs.

## What's here

```
products/
  svg/          200 artwork masters (SVG, 4:5 ratio, scales to any print size)
  mockups/      600 lifestyle scenes (3 per design: bedroom + classroom + one more)
  catalog.csv   full listing data: SKU, title, price, 13 tags, description, files
  listings.md   the same as copy-paste blocks for manual Etsy entry
  gallery.html  open in a browser to flip through everything
scripts/
  generate-artworks.mjs   regenerates all art + mockups + catalog (deterministic)
  export-png.mjs          converts SVG → PNG at any resolution
  build-gallery.mjs       rebuilds gallery.html from catalog.csv
ETSY-GUIDE.md   step-by-step launch playbook (pricing, SEO, listing order)
```

## Quick start

```bash
cd etsy-shop
npm install

# The buyer file: print-quality PNG (4800x6000 = 16x20" at 300 DPI)
node scripts/export-png.mjs --width 4800 --out products/png/print

# Etsy listing photos: mockups at 2400px wide
node scripts/export-png.mjs --src products/mockups --width 2400

# Everything for a single SKU
node scripts/export-png.mjs --only AA-001 --width 4800
```

PNG output lands in `products/png/` (git-ignored — regenerate any time).

## The 20 collections

Amphorae of the Aegean · Pillars of Antiquity · Nile Botanicals · Giza Horizons ·
Roman Mosaics · Standing Stones · Clay & Rune Scripts · Laurels of Victory ·
Attic Patterns · Labyrinths of Crete · Ziggurats of Sumer · Ancient Skies ·
Arches of Rome · Sacred Scarabs · Obelisks at Dawn · Temples of Marble ·
Aegean Voyages · Emblems of Egypt · Lunar Rites · Rosettes of Assyria

Every design is procedurally drawn from a fixed seed, so `npm run generate`
reproduces the exact same 200 artworks. Editing a collection function in
`scripts/generate-artworks.mjs` and re-running refreshes the whole line.
