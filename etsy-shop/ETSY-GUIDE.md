# Etsy Launch Playbook — Ancient Artefacts Collection

A practical, no-fluff plan for turning the 200 designs in this folder into a
running digital-product shop.

## 1. One-time setup (about an hour)

1. Open your Etsy shop (if not already): pick a name that signals the niche —
   you already own **KayCreates**; a shop section per collection keeps browsing clean.
2. Shop policies: select "Digital download — no returns". Etsy handles delivery.
3. Branding: use one of the artworks (the mosaic or rosette crops beautifully)
   as shop icon and a strip of designs as the banner.
4. Payment + billing: connect Etsy Payments before listing.

## 2. Produce the files buyers receive

Etsy allows up to 5 digital files per listing, 20 MB each. Give each listing
one high-res PNG (covers every common frame size when printed at 300 DPI):

```bash
cd etsy-shop && npm install
node scripts/export-png.mjs --width 4800 --out products/png/print   # 16x20" @300DPI
```

That single 4:5 file prints sharp at 4x5", 8x10", 11x14", 16x20", and trims to
A4/A3. (Optional upsell later: add 2x3 and 3x4 ratio exports as extra files.)

## 3. Produce the listing photos

Per listing use, in this order:
1. The artwork itself (export `products/svg` at 2000px)
2. Bedroom mockup
3. Classroom / third-scene mockup
4. A close-up crop (any image editor, or just re-export at higher width and crop)

```bash
node scripts/export-png.mjs --width 2000 --out products/png/listing
node scripts/export-png.mjs --src products/mockups --width 2400
```

## 4. Create the listings

Everything you need is pre-written:

- **`products/listings.md`** — copy-paste title, 13 tags, description, price per SKU
- **`products/catalog.csv`** — the same as a spreadsheet (works with bulk tools like Vela)

Etsy listing type: **Digital**. Category: Art & Collectibles → Prints → Digital Prints.

## 5. Pricing strategy

- Launch price: **£4.50–£6.00** per single (already set per collection in the catalog).
- Run a permanent-feeling **launch sale (25–40% off)** — Etsy's sale badge converts.
- **Bundles are where the money is.** After singles are up, add:
  - Collection bundles (10 designs): **£14.99** — zip the PNGs, still one listing
  - "Gallery wall" sets of 3 curated designs: **£9.99**
  - The full 200-design mega-bundle: **£59–£79** — anchor listing that makes
    everything else look cheap.

## 6. Launch cadence (Etsy rewards fresh listings)

Do NOT publish all 200 on day one. List **5–10 per day for 3–4 weeks**.
Each new listing gets a temporary search boost; a steady drip keeps the shop
"active" in the algorithm. Start with one design from each collection (the
`-01` SKUs) so all 20 niches are covered in week one.

## 7. SEO notes (already baked in, but keep in mind)

- Titles lead with the buyer's search phrase ("Ancient Greek Wall Art",
  "Moon Phases Print"), not the poetic name.
- All 13 tag slots are used, ≤20 characters each (Etsy's limit).
- Renew or re-photograph listings that get views but no favourites; kill
  nothing for 90 days — digital listings cost £0.16 to keep alive.

## 8. What NOT to do

- Don't claim the designs are hand-painted or antique reproductions.
- Don't use trademarked names (museum names, "Nintendo of Greece" jokes, etc.).
- Don't promise physical shipping — every listing must say *digital download*.
- The included license text is personal-use only; keep it that way (commercial
  licenses can be a separate, pricier listing later).

## 9. Growth levers once sales start

1. Etsy Ads at £1–2/day on the 10 best-clicking listings only.
2. Pinterest: the mockups are pin-ready; one pin per design, link to the listing.
3. Seasonal re-titling: "classroom decor" in August, "cozy bedroom art" in
   November, "graduation laurel print" in May (the Laurels collection).
4. Watch your Etsy stats → double down: whichever collection sells best,
   generate a "Volume II" (bump the seed in `generate-artworks.mjs` and re-run).
