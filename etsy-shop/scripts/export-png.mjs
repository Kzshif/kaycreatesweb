#!/usr/bin/env node
/**
 * Export SVG masters/mockups to PNG.
 *
 * Examples:
 *   node scripts/export-png.mjs                                  # all art at 2400px wide (listing quality)
 *   node scripts/export-png.mjs --width 4800                     # all art at 4800x6000 (16x20" @ 300dpi)
 *   node scripts/export-png.mjs --src products/mockups           # all mockups
 *   node scripts/export-png.mjs --only AA-001 --width 4800       # everything for one SKU
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const getArg = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const srcDir = path.resolve(ROOT, getArg('src', 'products/svg'))
const outDir = path.resolve(ROOT, getArg('out', path.join('products/png', path.basename(srcDir))))
const width = parseInt(getArg('width', '2400'), 10)
const only = getArg('only', null)

fs.mkdirSync(outDir, { recursive: true })
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg') && (!only || f.includes(only)))
if (!files.length) { console.error('No matching SVG files.'); process.exit(1) }

let done = 0
for (const f of files) {
  const svg = fs.readFileSync(path.join(srcDir, f), 'utf8')
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()
  fs.writeFileSync(path.join(outDir, f.replace(/\.svg$/, '.png')), png)
  done++
  if (done % 25 === 0) console.log(`${done}/${files.length}`)
}
console.log(`Exported ${done} PNGs at ${width}px wide → ${outDir}`)
