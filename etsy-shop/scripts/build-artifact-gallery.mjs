#!/usr/bin/env node
/**
 * Builds a fully self-contained gallery page (all 200 SVGs inlined)
 * for publishing as a Claude Artifact. Output goes to the path given as argv[2].
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = process.argv[2]
if (!OUT) { console.error('usage: build-artifact-gallery.mjs <out.html>'); process.exit(1) }

const csv = fs.readFileSync(path.join(ROOT, 'products/catalog.csv'), 'utf8')
function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++ } else if (c === '"') inQ = false; else field += c }
    else if (c === '"') inQ = true
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

const inlineSvg = (file, cls) =>
  fs.readFileSync(path.join(ROOT, 'products', file), 'utf8')
    .replace(/^<svg([^>]*?) width="\d+" height="\d+"/, `<svg$1 class="${cls}"`)

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX']
const BLURBS = {
  'Amphorae of the Aegean': 'Black-figure and red-figure vases with meander, wave and palmette bands.',
  'Pillars of Antiquity': 'Doric, Ionic and Corinthian columns against a rising sun.',
  'Nile Botanicals': 'Lotus, bud and papyrus registers set like a temple wall frieze.',
  'Giza Horizons': 'Minimalist desert horizons — pyramids, dunes and a heavy sun.',
  'Roman Mosaics': 'Radial medallions laid tessera by tessera.',
  'Standing Stones': 'Megaliths carved with triple spirals and chevrons.',
  'Clay & Rune Scripts': 'Invented glyphs pressed into clay and cut into runestones.',
  'Laurels of Victory': 'The victor’s crown around suns, stars and crescents.',
  'Attic Patterns': 'Classical ornament bands unrolled into stacked samplers.',
  'Labyrinths of Crete': 'Concentric walls and hidden gates — the Knossos myth as geometry.',
  'Ziggurats of Sumer': 'Stepped temples rising under crescent night skies.',
  'Ancient Skies': 'Degree-ringed star charts with invented constellations.',
  'Arches of Rome': 'Twin-tier aqueducts striding past cypress trees.',
  'Sacred Scarabs': 'The winged scarab bearing the sun disk.',
  'Obelisks at Dawn': 'Gilded-tip monoliths catching first light.',
  'Temples of Marble': 'Full facades — steps, flutes, triglyphs, starred pediments.',
  'Aegean Voyages': 'Triremes under sail on seas of running spirals.',
  'Emblems of Egypt': 'Ankh, djed pillar, lotus standard and winged sun.',
  'Lunar Rites': 'The moon’s cycle stacked as a ritual column.',
  'Rosettes of Assyria': 'Palace rosettes — rings of petals and rays.',
}

const byColl = new Map()
for (const it of items) {
  const c = it[idx.collection]
  if (!byColl.has(c)) byColl.set(c, [])
  byColl.get(c).push(it)
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

let chips = '', sections = '', ci = 0
for (const [coll, list] of byColl) {
  const id = slug(coll)
  chips += `<a class="chip" href="#${id}">${coll.replace(/ of .*| at .*/, m => m)}</a>`
  let cards = ''
  for (const it of list) {
    cards += `<figure class="card" tabindex="0" data-title="${it[idx.sku]} · ${coll} · ${it[idx.palette]}">` +
      inlineSvg(it[idx.art_file], 'art') +
      `<figcaption><span class="sku">${it[idx.sku]}</span><span class="pal">${it[idx.palette]}</span><span class="price">£${it[idx.price_gbp]}</span></figcaption></figure>`
  }
  sections += `<section id="${id}"><header class="sec-head"><span class="numeral">${roman[ci]}</span><div><h2>${coll}</h2><p>${BLURBS[coll] || ''} <span class="muted">Ten designs.</span></p></div></header><div class="grid">${cards}</div></section>`
  ci++
}

const mockFiles = ['mockups/AA-001-bedroom.svg', 'mockups/AA-041-classroom.svg', 'mockups/AA-112-living-room.svg', 'mockups/AA-155-study.svg', 'mockups/AA-198-hallway.svg']
const mockLabels = ['Bedroom', 'Classroom', 'Living room', 'Study', 'Hallway']
const mocks = mockFiles.map((m, i) => `<figure class="mock">${inlineSvg(m, 'mockart')}<figcaption>${mockLabels[i]}</figcaption></figure>`).join('')

const html = `<title>Ancient Artefacts — 200-Design Print Collection</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{
  --ground:#eae7e0; --panel:#f2f0ea; --ink:#26221a; --ink-2:#6b6353;
  --line:#d6d1c4; --accent:#2c4661; --accent-ink:#f4f1e8;
  --display:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;
  --ui:system-ui,-apple-system,'Segoe UI',sans-serif;
  --mono:ui-monospace,'SF Mono',Menlo,Consolas,monospace;
}
@media (prefers-color-scheme: dark){:root{
  --ground:#161719; --panel:#1e2023; --ink:#e9e4d8; --ink-2:#9c937f;
  --line:#33352f; --accent:#c9a227; --accent-ink:#191507;
}}
:root[data-theme="dark"]{
  --ground:#161719; --panel:#1e2023; --ink:#e9e4d8; --ink-2:#9c937f;
  --line:#33352f; --accent:#c9a227; --accent-ink:#191507;
}
:root[data-theme="light"]{
  --ground:#eae7e0; --panel:#f2f0ea; --ink:#26221a; --ink-2:#6b6353;
  --line:#d6d1c4; --accent:#2c4661; --accent-ink:#f4f1e8;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--ui);line-height:1.5}
.masthead{max-width:1180px;margin:0 auto;padding:56px 24px 8px}
.eyebrow{font-family:var(--ui);font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-2)}
h1{font-family:var(--display);font-weight:500;font-size:clamp(2rem,5vw,3.2rem);line-height:1.08;margin:.35rem 0 .6rem;text-wrap:balance}
.lede{max-width:62ch;color:var(--ink-2);font-size:1.02rem;margin:0}
.stats{display:flex;gap:28px;margin:26px 0 0;font-variant-numeric:tabular-nums}
.stats div{border-left:2px solid var(--accent);padding-left:12px}
.stats b{display:block;font-family:var(--display);font-size:1.5rem;font-weight:500}
.stats span{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
nav{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--ground) 88%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);margin-top:32px}
.chips{max-width:1180px;margin:0 auto;padding:10px 24px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin}
.chip{flex:0 0 auto;font-size:.78rem;padding:.38em .85em;border:1px solid var(--line);border-radius:999px;color:var(--ink);text-decoration:none;background:var(--panel);white-space:nowrap}
.chip:hover,.chip:focus-visible{border-color:var(--accent);color:var(--accent);outline:none}
main{max-width:1180px;margin:0 auto;padding:12px 24px 90px}
.mockrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:30px 0 8px}
.mock{margin:0}
.mock figcaption{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-2);padding-top:6px}
svg.mockart{width:100%;height:auto;display:block;border-radius:6px;border:1px solid var(--line)}
section{margin-top:64px;scroll-margin-top:70px}
.sec-head{display:flex;gap:18px;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:20px}
.numeral{font-family:var(--display);font-size:1.6rem;color:var(--accent);min-width:2.2ch}
h2{font-family:var(--display);font-weight:500;font-size:1.55rem;margin:0}
.sec-head p{margin:.2rem 0 0;color:var(--ink-2);font-size:.92rem;max-width:70ch}
.muted{opacity:.65}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
.card{margin:0;content-visibility:auto;contain-intrinsic-size:180px 280px;cursor:zoom-in;border-radius:4px}
.card:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
svg.art{width:100%;height:auto;display:block;border-radius:3px;box-shadow:0 1px 2px rgb(0 0 0/.18),0 6px 18px rgb(0 0 0/.10)}
figcaption{display:flex;gap:8px;align-items:baseline;padding:7px 2px 0;font-size:.72rem;color:var(--ink-2)}
.sku{font-family:var(--mono);color:var(--ink)}
.pal{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.price{font-variant-numeric:tabular-nums}
dialog{border:none;border-radius:8px;padding:0;background:var(--panel);color:var(--ink);max-width:min(92vw,560px);width:100%;box-shadow:0 24px 80px rgb(0 0 0/.45)}
dialog::backdrop{background:rgb(10 9 7/.72)}
dialog .dwrap{padding:14px}
dialog svg{width:100%;height:auto;display:block;border-radius:4px}
dialog p{margin:.6rem 2px 0;font-size:.8rem;color:var(--ink-2);font-family:var(--mono)}
footer{border-top:1px solid var(--line);margin-top:80px;padding:22px 24px;text-align:center;font-size:.78rem;color:var(--ink-2)}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
</style>
<div class="masthead">
  <p class="eyebrow">KayCreates · Etsy digital prints</p>
  <h1>The Ancient Artefacts Collection</h1>
  <p class="lede">Two hundred one-of-a-kind printable artworks drawn from the ancient world — pottery, temples, star charts, scripts and sacred emblems. No faces, no figures; pure pattern and myth. Tap any piece to view it large.</p>
  <div class="stats">
    <div><b>200</b><span>designs</span></div>
    <div><b>20</b><span>collections</span></div>
    <div><b>600</b><span>room mockups</span></div>
    <div><b>4:5</b><span>print ratio</span></div>
  </div>
  <div class="mockrow">${mocks}</div>
</div>
<nav><div class="chips">${chips}</div></nav>
<main>${sections}</main>
<footer>Every listing ships with 3 room mockups and print-ready files · full listing copy in the shop repo</footer>
<dialog id="zoom"><div class="dwrap"></div></dialog>
<script>
const dlg=document.getElementById('zoom'),dw=dlg.querySelector('.dwrap');
function open(card){dw.innerHTML='';dw.appendChild(card.querySelector('svg').cloneNode(true));
const p=document.createElement('p');p.textContent=card.dataset.title;dw.appendChild(p);dlg.showModal()}
document.querySelectorAll('.card').forEach(c=>{c.addEventListener('click',()=>open(c));
c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(c)}})});
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
</script>`

fs.writeFileSync(OUT, html)
console.log(`artifact gallery → ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB, ${items.length} designs)`)
