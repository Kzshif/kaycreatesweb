#!/usr/bin/env node
/**
 * Builds products/gallery.html — a browsable catalog of all 200 designs
 * (grouped by collection, with SKU + title) plus sample mockups.
 * Open it locally in any browser (the svg/ and mockups/ folders must sit next to it).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'products')

const csv = fs.readFileSync(path.join(OUT, 'catalog.csv'), 'utf8')
// tiny CSV parse (quoted fields)
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQ = false
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}
const [header, ...rows] = parseCSV(csv)
const idx = Object.fromEntries(header.map((h, i) => [h, i]))
const items = rows.filter(r => r.length === header.length)

const byColl = new Map()
for (const it of items) {
  const coll = it[idx.collection]
  if (!byColl.has(coll)) byColl.set(coll, [])
  byColl.get(coll).push(it)
}

let body = ''
for (const [coll, list] of byColl) {
  body += `<section><h2>${coll}</h2><div class="grid">`
  for (const it of list) {
    body += `<figure><img loading="lazy" src="${it[idx.art_file]}" alt="${it[idx.sku]}"><figcaption><strong>${it[idx.sku]}</strong> · £${it[idx.price_gbp]} · ${it[idx.palette]}</figcaption></figure>`
  }
  body += `</div>`
  const mock = list[0][idx.mockups].split('|')
  body += `<div class="mocks">` + mock.map(m => `<img loading="lazy" src="${m}" alt="mockup">`).join('') + `</div></section>`
}

const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KayCreates — Ancient Artefacts Collection (200 designs)</title>
<style>
  body{font-family:Georgia,serif;background:#f4efe6;color:#2b2118;margin:0;padding:2rem}
  h1{font-size:1.9rem} h2{margin-top:3rem;border-bottom:2px solid #c8b190;padding-bottom:.4rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
  figure{margin:0} img{width:100%;height:auto;border-radius:4px;box-shadow:0 2px 10px #0002}
  figcaption{font-size:.75rem;padding:.3rem 0;color:#5d4c3a}
  .mocks{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1rem}
  p.lead{max-width:60ch;color:#5d4c3a}
</style></head><body>
<h1>KayCreates — Ancient Artefacts Collection</h1>
<p class="lead">200 unique ancient-themed printable artworks across 20 collections. No faces, no humans — pure pattern, architecture, botanicals and myth. Each collection shows its 10 designs followed by sample room mockups (every SKU has bedroom + classroom + one more scene in <code>mockups/</code>).</p>
${body}
</body></html>`

fs.writeFileSync(path.join(OUT, 'gallery.html'), html)
console.log(`gallery → ${path.join(OUT, 'gallery.html')} (${items.length} items)`)
