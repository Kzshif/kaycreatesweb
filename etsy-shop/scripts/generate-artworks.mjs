#!/usr/bin/env node
/**
 * KayCreates — Ancient Artefacts Collection generator
 * Generates 200 unique ancient-themed printable artworks (SVG masters, 4:5 ratio),
 * lifestyle mockup scenes (bedroom / classroom / living room / study / hallway),
 * an Etsy listing catalog (CSV + markdown) and a preview gallery.
 *
 * No faces, no humans — architecture, pottery, botanicals, geometry, celestial motifs.
 *
 * Usage: node scripts/generate-artworks.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'products')
const SVG_DIR = path.join(OUT, 'svg')
const MOCK_DIR = path.join(OUT, 'mockups')

const W = 2400, H = 3000 // 4:5 — prints cleanly at 4x5, 8x10, 16x20 inches

// ---------- utilities ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = (r, a, b) => a + r() * (b - a)
const ri = (r, a, b) => Math.floor(rnd(r, a, b + 1))
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
const f1 = n => Number(n.toFixed(1))
const deg = a => (a * Math.PI) / 180

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// ---------- media palettes ----------
// Four "real media" treatments inspired by physical artworks:
// fresco (pigment on cracked plaster), oil (canvas), engraving (sepia ink on
// foxed paper), papyrus (gouache + gold on papyrus fiber).
const MEDIA_PALETTES = {
  fresco: [
    { name: 'Pompeii Terracotta', bg: '#e3d7c0', fg: '#8a4a2c', accent: '#b3702f', soft: '#c9b795' },
    { name: 'Burnt Sienna', bg: '#ddcfb2', fg: '#6d3a22', accent: '#a4552c', soft: '#c2ac83' },
    { name: 'Faded Lapis', bg: '#dcd3c2', fg: '#41586a', accent: '#a2542f', soft: '#b6ab95' },
    { name: 'Olive Plaster', bg: '#e5dcc8', fg: '#5c5c38', accent: '#a8703a', soft: '#c8bda0' },
    { name: 'Etruscan Red', bg: '#dfcfb1', fg: '#7c3a26', accent: '#4f6273', soft: '#bfa77c' },
    { name: 'Raw Umber', bg: '#e0d6c5', fg: '#4a4034', accent: '#a65e33', soft: '#bcae97' },
    { name: 'Ochre Wash', bg: '#e7dbbe', fg: '#875a28', accent: '#b3502f', soft: '#cbb488' },
    { name: 'Verdigris Fresco', bg: '#e2dbc9', fg: '#4c6b5c', accent: '#a8713c', soft: '#bdb49c' },
  ],
  oil: [
    { name: 'Golden Hour', bg: '#d9b078', fg: '#4a3527', accent: '#c96f35', soft: '#a8865c' },
    { name: 'Amber Dusk', bg: '#c39468', fg: '#3d2f22', accent: '#dd9a48', soft: '#8f6f4e' },
    { name: 'Aegean Noon', bg: '#c2b795', fg: '#3f4d51', accent: '#c08348', soft: '#969172' },
    { name: 'Umber Evening', bg: '#a97f57', fg: '#332822', accent: '#e0a44f', soft: '#7c5f42' },
    { name: 'Storm Light', bg: '#b0a488', fg: '#3a3a33', accent: '#c9803e', soft: '#847a60' },
    { name: 'Venetian Rose', bg: '#c9a183', fg: '#4a3129', accent: '#b3502f', soft: '#977257' },
    { name: 'Twilight Bronze', bg: '#8f7a5e', fg: '#2c2620', accent: '#d9a24f', soft: '#6b5a44' },
    { name: 'Honeyed Stone', bg: '#d3b487', fg: '#453425', accent: '#bd6b33', soft: '#a48a62' },
  ],
  engraving: [
    { name: 'Sepia Plate', bg: '#ece2cb', fg: '#453521', accent: '#8a5a33', soft: '#b8a483' },
    { name: 'Bistre Ink', bg: '#e8dcc0', fg: '#3d2f1c', accent: '#96603a', soft: '#b09a75' },
    { name: 'Iron Gall', bg: '#e5dbc6', fg: '#38322a', accent: '#7c5636', soft: '#a99878' },
    { name: 'Faded Folio', bg: '#efe6d0', fg: '#524026', accent: '#a06b3d', soft: '#c0ab87' },
    { name: 'Umber Wash', bg: '#e2d4b4', fg: '#433320', accent: '#8a5a33', soft: '#ab946c' },
    { name: 'Antique Buff', bg: '#eadfc4', fg: '#493a24', accent: '#935f34', soft: '#b6a17b' },
    { name: 'Smoked Vellum', bg: '#e0d5bd', fg: '#3a2e1e', accent: '#875732', soft: '#a6926e' },
    { name: 'Chestnut Line', bg: '#ede3ca', fg: '#4e3b22', accent: '#a4652f', soft: '#bfa87f' },
  ],
  papyrus: [
    { name: 'Nile Lapis', bg: '#d7c096', fg: '#2e2a22', accent: '#2f5575', soft: '#b39d70' },
    { name: 'Karnak Gold', bg: '#d3ba8c', fg: '#332d23', accent: '#a8792c', soft: '#b09a6c' },
    { name: 'Terracotta Reed', bg: '#d9c49a', fg: '#2c2820', accent: '#a8502f', soft: '#b8a276' },
    { name: 'Malachite Reed', bg: '#d5bf94', fg: '#302b22', accent: '#4a7457', soft: '#b19b6e' },
    { name: 'Sandstone Dawn', bg: '#dcc8a0', fg: '#37301f', accent: '#b3672f', soft: '#bfa87c' },
    { name: 'Delta Blue', bg: '#d2bd92', fg: '#2b2720', accent: '#3a6483', soft: '#ad976a' },
    { name: 'Gilded Dusk', bg: '#cfb684', fg: '#2e2818', accent: '#9c7426', soft: '#a99060' },
    { name: 'Oxide Red', bg: '#d8c298', fg: '#312a1e', accent: '#96422a', soft: '#b49d72' },
  ],
}

// ---------- aged-media texture engine ----------
// Every artwork is rendered as one of four physical media. The recipe:
//   1. ground: base color + broad tonal drift (+ fiber strips for papyrus)
//   2. artwork content warped through turbulence displacement so no edge
//      stays vector-perfect — reads as hand-painted / hand-printed
//   3. overlays: multiply grain, large-scale mottling, screen "faded pigment"
//      patches, stains, then medium extras (cracks & chips / canvas weave /
//      engraving line texture & foxing / fiber sheen & edge shadow)

function textureDefs(uid, seed, medium) {
  const warpScale = { fresco: 12, oil: 9, engraving: 7, papyrus: 11 }[medium]
  return `<filter id="${uid}-warp" x="-4%" y="-4%" width="108%" height="108%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.0105" numOctaves="2" seed="${seed}" result="w"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="w" scale="${warpScale}" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>` +
    `<filter id="${uid}-grain" x="0%" y="0%" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="${seed + 7}"/>` +
    `<feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0.62  0.33 0.33 0.33 0 0.62  0.33 0.33 0.33 0 0.62  0 0 0 0 1"/>` +
    `</filter>` +
    `<filter id="${uid}-mottle" x="0%" y="0%" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="3" seed="${seed + 13}"/>` +
    `<feColorMatrix type="matrix" values="0.2 0.2 0.2 0 0.78  0.2 0.2 0.2 0 0.78  0.2 0.2 0.2 0 0.78  0 0 0 0 1"/>` +
    `</filter>` +
    `<filter id="${uid}-fade" x="0%" y="0%" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="2" seed="${seed + 29}"/>` +
    `<feColorMatrix type="matrix" values="0.3 0.3 0.3 0 -0.08  0.3 0.3 0.3 0 -0.08  0.3 0.3 0.3 0 -0.1  0 0 0 0 1"/>` +
    `</filter>` +
    `<filter id="${uid}-blur9"><feGaussianBlur stdDeviation="9"/></filter>` +
    `<radialGradient id="${uid}-vig" cx="50%" cy="44%" r="78%">` +
    `<stop offset="52%" stop-color="#241a10" stop-opacity="0"/>` +
    `<stop offset="100%" stop-color="#241a10" stop-opacity="${medium === 'oil' ? 0.26 : 0.17}"/></radialGradient>` +
    `<radialGradient id="${uid}-warm" cx="${30 + (seed % 40)}%" cy="30%" r="85%">` +
    `<stop offset="0%" stop-color="#e8c890" stop-opacity="0.14"/>` +
    `<stop offset="70%" stop-color="#e8c890" stop-opacity="0"/></radialGradient>`
}

function ground(uid, P, r, medium) {
  let s = `<rect width="${W}" height="${H}" fill="${P.bg}"/>`
  s += `<rect width="${W}" height="${H}" fill="url(#${uid}-warm)"/>`
  if (medium === 'oil') {
    // luminous sky wash toward the horizon band
    s += `<linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#2e2416" stop-opacity="0.18"/>` +
      `<stop offset="0.42" stop-color="#fff3d6" stop-opacity="0.22"/>` +
      `<stop offset="0.62" stop-color="#ffdfa0" stop-opacity="0.3"/>` +
      `<stop offset="0.8" stop-color="#a86a3a" stop-opacity="0.12"/>` +
      `<stop offset="1" stop-color="#2e2416" stop-opacity="0.2"/></linearGradient>` +
      `<rect width="${W}" height="${H}" fill="url(#${uid}-sky)"/>`
  }
  if (medium === 'papyrus') {
    // horizontal + vertical reed strips
    let x = 0
    while (x < W) {
      const w = rnd(r, 26, 60)
      s += `<rect x="${f1(x)}" width="${f1(w * 0.72)}" height="${H}" fill="#6b4e26" opacity="${rnd(r, 0.03, 0.1).toFixed(3)}"/>`
      x += w
    }
    let y = 0
    while (y < H) {
      const h = rnd(r, 20, 48)
      s += `<rect y="${f1(y)}" width="${W}" height="${f1(h * 0.6)}" fill="#7c5c30" opacity="${rnd(r, 0.02, 0.06).toFixed(3)}"/>`
      y += h
    }
  }
  if (medium === 'fresco') {
    // broad plaster trowel sweeps
    for (let i = 0; i < 7; i++) {
      const y = rnd(r, 0, H), hh = rnd(r, 120, 420)
      s += `<rect y="${f1(y)}" width="${W}" height="${f1(hh)}" fill="${i % 2 ? '#ffffff' : '#8a6a40'}" opacity="${rnd(r, 0.02, 0.05).toFixed(3)}" transform="rotate(${f1(rnd(r, -2, 2))} ${W / 2} ${f1(y)})"/>`
    }
  }
  return s
}

function stainBlobs(uid, r, n) {
  let s = ''
  for (let i = 0; i < n; i++) {
    const cx = rnd(r, 150, W - 150), cy = rnd(r, 150, H - 150)
    const rx = rnd(r, 90, 340), ry = rx * rnd(r, 0.55, 1.1)
    s += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#6b4a22" opacity="${rnd(r, 0.025, 0.07).toFixed(3)}" filter="url(#${uid}-blur9)"/>`
  }
  return s
}

function crackLines(r, n) {
  let s = ''
  for (let i = 0; i < n; i++) {
    let x = rnd(r, 200, W - 200), y = rnd(r, 200, H - 200)
    let a = rnd(r, 0, Math.PI * 2)
    let pts = `${f1(x)},${f1(y)}`
    const segs = ri(r, 5, 12)
    for (let k = 0; k < segs; k++) {
      a += rnd(r, -0.9, 0.9)
      const step = rnd(r, 50, 150)
      x += Math.cos(a) * step; y += Math.sin(a) * step
      pts += ` ${f1(x)},${f1(y)}`
    }
    const wgt = rnd(r, 2, 4.5)
    s += `<polyline points="${pts}" fill="none" stroke="#2e2116" stroke-width="${f1(wgt)}" opacity="${rnd(r, 0.14, 0.3).toFixed(2)}" stroke-linejoin="round"/>`
    s += `<polyline points="${pts}" fill="none" stroke="#fff8ea" stroke-width="${f1(wgt * 0.7)}" opacity="${rnd(r, 0.08, 0.16).toFixed(2)}" transform="translate(2.5 2.5)" stroke-linejoin="round"/>`
  }
  return s
}

function foxing(r, n) {
  let s = ''
  for (let i = 0; i < n; i++) {
    s += `<circle cx="${f1(rnd(r, 80, W - 80))}" cy="${f1(rnd(r, 80, H - 80))}" r="${f1(rnd(r, 3, 16))}" fill="#8a5a2e" opacity="${rnd(r, 0.04, 0.13).toFixed(3)}"/>`
  }
  return s
}

function mediumOverlays(uid, P, r, medium) {
  let s = ''
  // universal aging
  s += `<rect width="${W}" height="${H}" filter="url(#${uid}-mottle)" style="mix-blend-mode:multiply" opacity="0.5"/>`
  s += `<rect width="${W}" height="${H}" filter="url(#${uid}-fade)" style="mix-blend-mode:screen" opacity="${medium === 'oil' ? 0.3 : 0.55}"/>`
  s += `<rect width="${W}" height="${H}" filter="url(#${uid}-grain)" style="mix-blend-mode:multiply" opacity="0.32"/>`
  s += stainBlobs(uid, r, medium === 'oil' ? 3 : ri(r, 3, 6))
  if (medium === 'fresco') {
    s += crackLines(r, ri(r, 6, 10))
    // chipped plaster patches
    for (let i = 0; i < ri(r, 3, 7); i++) {
      s += `<path d="${blobPath(r, rnd(r, 250, W - 250), rnd(r, 250, H - 250), rnd(r, 26, 110), rnd(r, 20, 80), 0.35, 7)}" fill="${P.bg}" opacity="${rnd(r, 0.75, 0.95).toFixed(2)}"/>`
    }
  } else if (medium === 'oil') {
    // canvas weave
    let weave = ''
    for (let y = 0; y < H; y += 7) weave += `<rect y="${y}" width="${W}" height="1.6" fill="#2c2013"/>`
    s += `<g opacity="0.05">${weave}</g>`
    let weft = ''
    for (let x = 0; x < W; x += 7) weft += `<rect x="${x}" width="1.6" height="${H}" fill="#fff6e0"/>`
    s += `<g opacity="0.045">${weft}</g>`
  } else if (medium === 'engraving') {
    // engraved line texture + plate mark + foxing
    let lines = ''
    for (let y = 3; y < H; y += 8) lines += `<rect y="${y}" width="${W}" height="2" fill="${P.bg}"/>`
    s += `<g opacity="0.3">${lines}</g>`
    s += `<rect x="88" y="88" width="${W - 176}" height="${H - 176}" fill="none" stroke="#3a2c1a" stroke-width="4" opacity="0.2"/>`
    s += `<rect x="94" y="94" width="${W - 188}" height="${H - 188}" fill="none" stroke="#fff6e0" stroke-width="2" opacity="0.25"/>`
    s += foxing(r, ri(r, 16, 30))
  } else if (medium === 'papyrus') {
    // fiber sheen over the paint + frayed edge shadow
    let x = 0
    while (x < W) {
      const w = rnd(r, 30, 70)
      s += `<rect x="${f1(x)}" width="${f1(w * 0.5)}" height="${H}" fill="#fff2d0" opacity="${rnd(r, 0.015, 0.045).toFixed(3)}"/>`
      x += w
    }
    for (const [gx, gy, gw, gh, dir] of [[0, 0, 90, H, 'r'], [W - 90, 0, 90, H, 'l'], [0, 0, W, 90, 'd'], [0, H - 90, W, 90, 'u']]) {
      const gid = `${uid}-e${dir}`
      const coords = dir === 'r' ? 'x1="0" x2="1" y1="0" y2="0"' : dir === 'l' ? 'x1="1" x2="0" y1="0" y2="0"' : dir === 'd' ? 'x1="0" x2="0" y1="0" y2="1"' : 'x1="0" x2="0" y1="1" y2="0"'
      s += `<linearGradient id="${gid}" ${coords}><stop offset="0" stop-color="#3a2a12" stop-opacity="0.22"/><stop offset="1" stop-color="#3a2a12" stop-opacity="0"/></linearGradient>`
      s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="url(#${gid})"/>`
    }
    s += foxing(r, ri(r, 8, 16))
  }
  s += `<rect width="${W}" height="${H}" fill="url(#${uid}-vig)"/>`
  return s
}

function frame(P, medium = 'fresco') {
  if (medium === 'oil') return '' // full-bleed canvas
  if (medium === 'engraving') {
    return `<rect x="130" y="130" width="${W - 260}" height="${H - 260}" fill="none" stroke="${P.fg}" stroke-width="5"/>` +
      `<rect x="152" y="152" width="${W - 304}" height="${H - 304}" fill="none" stroke="${P.fg}" stroke-width="2.5" opacity="0.8"/>`
  }
  if (medium === 'papyrus') {
    return `<rect x="120" y="120" width="${W - 240}" height="${H - 240}" fill="none" stroke="${P.fg}" stroke-width="6" opacity="0.85"/>`
  }
  // fresco: painted pigment band
  return `<rect x="104" y="104" width="${W - 208}" height="${H - 208}" fill="none" stroke="${P.fg}" stroke-width="16" opacity="0.85"/>` +
    `<rect x="150" y="150" width="${W - 300}" height="${H - 300}" fill="none" stroke="${P.fg}" stroke-width="4" opacity="0.55"/>`
}

// --- ornament bands (x, y = top, w, h, color) ---
function greekKeyBand(x, y, w, h, c) {
  const s = h, n = Math.max(1, Math.floor(w / s)), ox = x + (w - n * s) / 2
  let d = ''
  const U = [[0.08, 0.92], [0.92, 0.92], [0.92, 0.08], [0.26, 0.08], [0.26, 0.6], [0.6, 0.6], [0.6, 0.34]]
  for (let i = 0; i < n; i++) {
    const x0 = ox + i * s
    d += 'M' + U.map(p => `${f1(x0 + p[0] * s)},${f1(y + p[1] * s)}`).join(' L ') + ' '
  }
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f1(s * 0.13)}"/>`
}

function spiralPts(cx, cy, rm, turns, dir = 1, phase = 0) {
  const steps = Math.max(24, Math.round(turns * 26))
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const rad = rm * (0.06 + 0.94 * t)
    const a = phase + dir * turns * Math.PI * 2 * t
    pts.push(`${f1(cx + rad * Math.cos(a))},${f1(cy + rad * Math.sin(a))}`)
  }
  return pts.join(' ')
}
const spiral = (cx, cy, rm, turns, c, sw, dir = 1, phase = 0) =>
  `<polyline points="${spiralPts(cx, cy, rm, turns, dir, phase)}" fill="none" stroke="${c}" stroke-width="${f1(sw)}" stroke-linecap="round" stroke-linejoin="round"/>`

function waveBand(x, y, w, h, c) {
  const s = h, n = Math.max(1, Math.floor(w / s)), ox = x + (w - n * s) / 2
  let out = `<line x1="${x}" y1="${f1(y + h)}" x2="${x + w}" y2="${f1(y + h)}" stroke="${c}" stroke-width="${f1(h * 0.08)}"/>`
  for (let i = 0; i < n; i++) {
    out += spiral(ox + i * s + s * 0.52, y + h * 0.52, s * 0.36, 2.0, c, h * 0.09, -1, Math.PI)
  }
  return out
}

function zigzagBand(x, y, w, h, c) {
  const s = h, n = Math.max(2, Math.round(w / s))
  let pts = ''
  for (let i = 0; i <= n; i++) pts += `${f1(x + (i * w) / n)},${i % 2 === 0 ? f1(y + h) : f1(y)} `
  return `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${f1(h * 0.18)}" stroke-linejoin="miter"/>`
}

function triangleBand(x, y, w, h, c, up = true) {
  const s = h * 0.9, n = Math.max(2, Math.floor(w / s)), ox = x + (w - n * s) / 2
  let d = ''
  for (let i = 0; i < n; i++) {
    const x0 = ox + i * s
    d += up
      ? `M${f1(x0)},${f1(y + h)} L${f1(x0 + s / 2)},${f1(y)} L${f1(x0 + s)},${f1(y + h)} Z `
      : `M${f1(x0)},${f1(y)} L${f1(x0 + s / 2)},${f1(y + h)} L${f1(x0 + s)},${f1(y)} Z `
  }
  return `<path d="${d}" fill="${c}"/>`
}

function checkerBand(x, y, w, h, c) {
  const s = h / 2, n = Math.floor(w / s)
  let out = ''
  for (let i = 0; i < n; i++)
    for (let j = 0; j < 2; j++)
      if ((i + j) % 2 === 0) out += `<rect x="${f1(x + i * s)}" y="${f1(y + j * s)}" width="${f1(s)}" height="${f1(s)}" fill="${c}"/>`
  return out
}

function dotBand(x, y, w, h, c) {
  const s = h, n = Math.floor(w / s), ox = x + (w - n * s) / 2
  let out = ''
  for (let i = 0; i < n; i++) out += `<circle cx="${f1(ox + i * s + s / 2)}" cy="${f1(y + h / 2)}" r="${f1(h * 0.26)}" fill="${c}"/>`
  return out
}

function chevronBand(x, y, w, h, c) {
  const s = h * 1.1, n = Math.floor(w / s), ox = x + (w - n * s) / 2
  let out = ''
  for (let i = 0; i < n; i++) {
    const x0 = ox + i * s
    out += `<polyline points="${f1(x0 + s * 0.15)},${f1(y + h)} ${f1(x0 + s / 2)},${f1(y + h * 0.15)} ${f1(x0 + s * 0.85)},${f1(y + h)}" fill="none" stroke="${c}" stroke-width="${f1(h * 0.14)}"/>`
  }
  return out
}

const leaf = (x, y, len, wid, ang, c, op = 1) =>
  `<path d="M0 0 Q ${f1(wid)} ${f1(-len * 0.38)} 0 ${f1(-len)} Q ${f1(-wid)} ${f1(-len * 0.38)} 0 0 Z" fill="${c}" opacity="${op}" transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"/>`

function palmetteBand(x, y, w, h, c) {
  const s = h * 1.35, n = Math.floor(w / s), ox = x + (w - n * s) / 2
  let out = `<line x1="${x}" y1="${f1(y + h)}" x2="${x + w}" y2="${f1(y + h)}" stroke="${c}" stroke-width="${f1(h * 0.06)}"/>`
  for (let i = 0; i < n; i++) {
    const cx = ox + i * s + s / 2, by = y + h * 0.95
    for (let k = -3; k <= 3; k++) {
      const a = k * 19
      const L = h * (0.85 - Math.abs(k) * 0.11)
      out += `<line x1="${f1(cx)}" y1="${f1(by)}" x2="${f1(cx + L * Math.sin(deg(a)))}" y2="${f1(by - L * Math.cos(deg(a)))}" stroke="${c}" stroke-width="${f1(h * 0.1)}" stroke-linecap="round"/>`
    }
  }
  return out
}

function stripeBandEgy(x, y, w, h, P) {
  // classic layered Egyptian stripes
  const cols = [P.fg, P.accent, P.fg, P.soft, P.fg]
  const hh = h / cols.length
  return cols.map((c, i) => `<rect x="${x}" y="${f1(y + i * hh)}" width="${w}" height="${f1(hh + 0.5)}" fill="${c}"/>`).join('')
}

function starN(cx, cy, r, c, points = 8, inner = 0.42) {
  let pts = ''
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner
    const a = (i * Math.PI) / points - Math.PI / 2
    pts += `${f1(cx + rad * Math.cos(a))},${f1(cy + rad * Math.sin(a))} `
  }
  return `<polygon points="${pts}" fill="${c}"/>`
}

const sparkle = (cx, cy, r, c) =>
  `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy - r * 0.18)} ${f1(cx + r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.18)} ${f1(cx - r)},${f1(cy)} Z M${f1(cx)},${f1(cy - r)} Q${f1(cx + r * 0.18)},${f1(cy)} ${f1(cx)},${f1(cy + r)} Q${f1(cx - r * 0.18)},${f1(cy)} ${f1(cx)},${f1(cy - r)} Z" fill="${c}"/>`

const crescent = (cx, cy, r, c, bg) =>
  `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${c}"/><circle cx="${f1(cx + r * 0.42)}" cy="${f1(cy - r * 0.18)}" r="${f1(r * 0.88)}" fill="${bg}"/>`

function arcPath(cx, cy, r, a1, a2) {
  const x1 = cx + r * Math.cos(deg(a1)), y1 = cy + r * Math.sin(deg(a1))
  const x2 = cx + r * Math.cos(deg(a2)), y2 = cy + r * Math.sin(deg(a2))
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0
  return `M${f1(x1)},${f1(y1)} A${f1(r)},${f1(r)} 0 ${large} 1 ${f1(x2)},${f1(y2)}`
}

function blobPath(r, cx, cy, rx, ry, jitter = 0.12, points = 10) {
  const pts = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const jx = 1 + rnd(r, -jitter, jitter), jy = 1 + rnd(r, -jitter, jitter)
    pts.push([cx + rx * jx * Math.cos(a), cy + ry * jy * Math.sin(a)])
  }
  let d = ''
  for (let i = 0; i < points; i++) {
    const p = pts[i], q = pts[(i + 1) % points]
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2
    if (i === 0) d += `M${f1(mx)},${f1(my)} `
    const n2 = pts[(i + 1) % points], m2 = pts[(i + 2) % points]
    d += `Q${f1(q[0])},${f1(q[1])} ${f1((n2[0] + m2[0]) / 2)},${f1((n2[1] + m2[1]) / 2)} `
  }
  return d + 'Z'
}

// ---------- archetypes ----------

function artAmphora(r, P, uid) {
  const cx = W / 2
  const topY = rnd(r, 540, 620)
  const mouthW = rnd(r, 320, 430)
  const neckW = rnd(r, 160, 215)
  const bodyR = rnd(r, 440, 545)
  const bodyCy = rnd(r, 1660, 1780)
  const footW = rnd(r, 190, 250)
  const footY = 2470
  const L = v => f1(cx - v), R2 = v => f1(cx + v)
  const vase =
    `M${L(neckW / 2)},${f1(topY + 70)}` +
    ` C${L(neckW / 2 + 40)},${f1(topY + 470)} ${L(bodyR * 1.0)},${f1(bodyCy - bodyR * 0.95)} ${L(bodyR)},${f1(bodyCy)}` +
    ` C${L(bodyR)},${f1(bodyCy + bodyR * 0.75)} ${L(footW / 2 + 30)},${f1(footY - 260)} ${L(footW / 2)},${f1(footY)}` +
    ` L${L(footW * 0.85)},${f1(footY + 60)} L${L(footW * 0.85)},${f1(footY + 90)} L${R2(footW * 0.85)},${f1(footY + 90)} L${R2(footW * 0.85)},${f1(footY + 60)} L${R2(footW / 2)},${f1(footY)}` +
    ` C${R2(footW / 2 + 30)},${f1(footY - 260)} ${R2(bodyR)},${f1(bodyCy + bodyR * 0.75)} ${R2(bodyR)},${f1(bodyCy)}` +
    ` C${R2(bodyR * 1.0)},${f1(bodyCy - bodyR * 0.95)} ${R2(neckW / 2 + 40)},${f1(topY + 470)} ${R2(neckW / 2)},${f1(topY + 70)} Z`
  let s = ''
  s += greekKeyBand(240, 190, W - 480, 88, P.fg)
  s += waveBand(240, H - 300, W - 480, 96, P.fg)
  // plinth
  s += `<rect x="${cx - 560}" y="${footY + 90}" width="1120" height="34" fill="${P.fg}"/>`
  s += `<rect x="${cx - 660}" y="${footY + 124}" width="1320" height="26" fill="${P.fg}" opacity="0.75"/>`
  // handles behind
  const hy1 = topY + 170, hx2 = bodyR * 0.82, hy2 = bodyCy - bodyR * 0.62
  for (const d of [-1, 1]) {
    s += `<path d="M${f1(cx + d * neckW / 2)},${f1(hy1)} C${f1(cx + d * (neckW / 2 + 260))},${f1(hy1 - 60)} ${f1(cx + d * (hx2 + 170))},${f1(hy2 - 160)} ${f1(cx + d * hx2)},${f1(hy2)}" fill="none" stroke="${P.fg}" stroke-width="52" stroke-linecap="round"/>`
  }
  // body
  s += `<path d="${vase}" fill="${P.fg}"/>`
  // rim
  s += `<rect x="${L(mouthW / 2)}" y="${f1(topY)}" width="${f1(mouthW)}" height="72" rx="22" fill="${P.fg}"/>`
  // decor clipped to vase
  s += `<clipPath id="${uid}-vase"><path d="${vase}"/></clipPath><g clip-path="url(#${uid}-vase)">`
  const shoulderY = bodyCy - bodyR * 0.62
  s += greekKeyBand(cx - bodyR, shoulderY, bodyR * 2, 92, P.bg)
  s += `<line x1="${L(bodyR)}" y1="${f1(shoulderY + 130)}" x2="${R2(bodyR)}" y2="${f1(shoulderY + 130)}" stroke="${P.bg}" stroke-width="10"/>`
  const midPat = pick(r, ['wave', 'palmette', 'chevron'])
  const midY = bodyCy + 40
  if (midPat === 'wave') s += waveBand(cx - bodyR, midY, bodyR * 2, 110, P.bg)
  else if (midPat === 'palmette') s += palmetteBand(cx - bodyR, midY, bodyR * 2, 120, P.bg)
  else s += chevronBand(cx - bodyR, midY, bodyR * 2, 110, P.bg)
  s += `<line x1="${L(bodyR)}" y1="${f1(midY + 170)}" x2="${R2(bodyR)}" y2="${f1(midY + 170)}" stroke="${P.bg}" stroke-width="10"/>`
  s += triangleBand(cx - bodyR, footY - 330, bodyR * 2, 150, P.bg, true)
  // neck decor
  s += zigzagBand(cx - neckW / 2 + 14, topY + 210, neckW - 28, 54, P.bg)
  s += `</g>`
  return s
}

function artColumns(r, P, uid) {
  const cols = pick(r, [1, 2, 3])
  let s = ''
  const sunY = rnd(r, 900, 1120), sunR = rnd(r, 360, 470)
  s += `<circle cx="${W / 2}" cy="${f1(sunY)}" r="${f1(sunR)}" fill="${P.accent}" opacity="0.92"/>`
  s += `<circle cx="${W / 2}" cy="${f1(sunY)}" r="${f1(sunR + 70)}" fill="none" stroke="${P.accent}" stroke-width="7" stroke-dasharray="4 30" stroke-linecap="round"/>`
  const groundY = 2450
  s += `<rect x="330" y="${groundY}" width="1740" height="52" fill="${P.fg}"/>`
  s += `<rect x="240" y="${groundY + 52}" width="1920" height="52" fill="${P.fg}" opacity="0.85"/>`
  s += `<rect x="150" y="${groundY + 104}" width="2100" height="52" fill="${P.fg}" opacity="0.7"/>`
  const style = pick(r, ['doric', 'ionic', 'corinthian'])
  const xs = cols === 1 ? [W / 2] : cols === 2 ? [W / 2 - 380, W / 2 + 380] : [W / 2 - 620, W / 2, W / 2 + 620]
  xs.forEach((cx, idx) => {
    const wBot = cols === 1 ? 330 : 270
    const wTop = wBot * 0.8
    let capY = rnd(r, 800, 900)
    const broken = cols > 1 && idx === cols - 1 && r() < 0.35
    if (broken) capY = rnd(r, 1450, 1700)
    // shaft
    s += `<path d="M${f1(cx - wBot / 2)},${groundY} L${f1(cx - wTop / 2)},${f1(capY)} L${f1(cx + wTop / 2)},${f1(capY)} L${f1(cx + wBot / 2)},${groundY} Z" fill="${P.fg}"/>`
    // flutes
    for (let k = -2; k <= 2; k++) {
      s += `<line x1="${f1(cx + k * wTop / 6)}" y1="${f1(capY + 30)}" x2="${f1(cx + k * wBot / 6)}" y2="${groundY - 10}" stroke="${P.bg}" stroke-width="9" opacity="0.55"/>`
    }
    if (broken) {
      s += `<polyline points="${f1(cx - wTop / 2)},${f1(capY)} ${f1(cx - wTop / 6)},${f1(capY - 46)} ${f1(cx + wTop / 8)},${f1(capY + 8)} ${f1(cx + wTop / 2)},${f1(capY - 30)}" fill="${P.bg}" stroke="none"/>`
      return
    }
    // capital
    if (style === 'doric') {
      s += `<path d="M${f1(cx - wTop / 2 - 34)},${f1(capY)} L${f1(cx - wTop / 2)},${f1(capY - 64)} L${f1(cx + wTop / 2)},${f1(capY - 64)} L${f1(cx + wTop / 2 + 34)},${f1(capY)} Z" fill="${P.fg}"/>`
      s += `<rect x="${f1(cx - wTop / 2 - 58)}" y="${f1(capY - 122)}" width="${f1(wTop + 116)}" height="58" fill="${P.fg}"/>`
    } else if (style === 'ionic') {
      s += `<rect x="${f1(cx - wTop / 2 - 30)}" y="${f1(capY - 52)}" width="${f1(wTop + 60)}" height="52" fill="${P.fg}"/>`
      s += `<rect x="${f1(cx - wTop / 2 - 66)}" y="${f1(capY - 112)}" width="${f1(wTop + 132)}" height="40" fill="${P.fg}"/>`
      s += spiral(cx - wTop / 2 - 34, capY - 40, 62, 2.2, P.fg, 20, -1, Math.PI / 2)
      s += spiral(cx + wTop / 2 + 34, capY - 40, 62, 2.2, P.fg, 20, 1, Math.PI / 2)
    } else {
      for (let row = 0; row < 2; row++) {
        for (let k = -2; k <= 2; k++) {
          s += leaf(cx + k * wTop / 4.4, capY - row * 52, 96 + row * 26, 26, k * 16, P.fg)
        }
      }
      s += `<rect x="${f1(cx - wTop / 2 - 60)}" y="${f1(capY - 158)}" width="${f1(wTop + 120)}" height="44" fill="${P.fg}"/>`
    }
    // base
    s += `<rect x="${f1(cx - wBot / 2 - 26)}" y="${groundY - 44}" width="${f1(wBot + 52)}" height="44" fill="${P.fg}"/>`
  })
  s += greekKeyBand(240, 210, W - 480, 86, P.fg)
  return s
}

function lotusMotif(cx, by, sz, P, r) {
  let s = ''
  const petals = ri(r, 5, 7)
  for (let k = 0; k < petals; k++) {
    const a = -58 + (116 * k) / (petals - 1)
    const c = k % 2 === 0 ? P.fg : P.accent
    s += leaf(cx, by, sz * (1 - Math.abs(a) / 220), sz * 0.18, a, c)
  }
  s += `<path d="M${f1(cx - sz * 0.3)},${f1(by)} Q${f1(cx)},${f1(by + sz * 0.34)} ${f1(cx + sz * 0.3)},${f1(by)} Z" fill="${P.fg}"/>`
  return s
}
function papyrusMotif(cx, by, sz, P) {
  let s = `<line x1="${f1(cx)}" y1="${f1(by)}" x2="${f1(cx)}" y2="${f1(by - sz * 0.55)}" stroke="${P.fg}" stroke-width="${f1(sz * 0.06)}"/>`
  for (let k = -4; k <= 4; k++) {
    const a = k * 16
    const L = sz * (0.62 - Math.abs(k) * 0.045)
    const tx = cx + L * Math.sin(deg(a)), ty = by - sz * 0.55 - L * Math.cos(deg(a))
    s += `<line x1="${f1(cx)}" y1="${f1(by - sz * 0.55)}" x2="${f1(tx)}" y2="${f1(ty)}" stroke="${P.fg}" stroke-width="${f1(sz * 0.045)}" stroke-linecap="round"/>`
    s += `<circle cx="${f1(tx)}" cy="${f1(ty)}" r="${f1(sz * 0.045)}" fill="${P.accent}"/>`
  }
  return s
}
function artNileFrieze(r, P, uid) {
  let s = ''
  const rows = 4
  const y0 = 330, rowH = (H - 660) / rows
  for (let row = 0; row <= rows; row++) {
    s += stripeBandEgy(210, y0 + row * rowH - 30, W - 420, 42, P)
  }
  for (let row = 0; row < rows; row++) {
    const by = y0 + row * rowH + rowH * 0.82
    const kind = row % 2 === 0 ? 'lotus' : 'papyrus'
    const n = ri(r, 4, 5)
    for (let i = 0; i < n; i++) {
      const cx = 210 + ((W - 420) * (i + 0.5)) / n
      const sz = rowH * rnd(r, 0.62, 0.72)
      if (kind === 'lotus') {
        if (i % 2 === 0) s += lotusMotif(cx, by, sz, P, r)
        else { s += leaf(cx, by, sz * 0.8, sz * 0.16, 0, P.accent); s += `<line x1="${f1(cx)}" y1="${f1(by)}" x2="${f1(cx)}" y2="${f1(by + rowH * 0.08)}" stroke="${P.fg}" stroke-width="${f1(sz * 0.05)}"/>` }
      } else {
        s += papyrusMotif(cx, by, sz, P)
      }
    }
  }
  return s
}

function artGiza(r, P, uid) {
  let s = `<clipPath id="${uid}-gz"><rect x="150" y="150" width="${W - 300}" height="${H - 300}"/></clipPath><g clip-path="url(#${uid}-gz)">`
  const sunR = rnd(r, 300, 420)
  s += `<circle cx="${f1(rnd(r, 900, 1500))}" cy="${f1(rnd(r, 760, 950))}" r="${f1(sunR)}" fill="${P.accent}"/>`
  // dunes
  const duneY = [2050, 2270, 2520]
  duneY.forEach((dy, i) => {
    const amp = rnd(r, 60, 140)
    s += `<path d="M150,${f1(dy)} C 700,${f1(dy - amp)} 1100,${f1(dy + amp)} 1600,${f1(dy - amp * 0.6)} S 2200,${f1(dy + amp * 0.4)} 2250,${f1(dy - 20)} L2250,2850 L150,2850 Z" fill="${i === 1 ? P.soft : P.fg}" opacity="${i === 0 ? 0.35 : i === 1 ? 0.9 : 1}"/>`
  })
  // pyramids
  const n = ri(r, 2, 3)
  const baseY = 2130
  for (let i = 0; i < n; i++) {
    const px = 680 + i * rnd(r, 500, 620) + rnd(r, -40, 40)
    const hgt = rnd(r, 620, 980) * (i === 0 ? 1 : 0.72)
    let half = hgt * rnd(r, 0.72, 0.85)
    half = Math.min(half, px - 220, W - 220 - px)
    const split = px + half * rnd(r, 0.12, 0.3)
    s += `<polygon points="${f1(px)},${f1(baseY - hgt)} ${f1(px - half)},${baseY} ${f1(split)},${baseY}" fill="${P.fg}"/>`
    s += `<polygon points="${f1(px)},${f1(baseY - hgt)} ${f1(split)},${baseY} ${f1(px + half)},${baseY}" fill="${P.fg}" opacity="0.6"/>`
  }
  // birds
  for (let i = 0; i < ri(r, 2, 4); i++) {
    const bx = rnd(r, 400, 1900), by = rnd(r, 500, 1100)
    s += `<path d="M${f1(bx)},${f1(by)} q 26,-24 52,0 q 26,-24 52,0" fill="none" stroke="${P.fg}" stroke-width="8" stroke-linecap="round"/>`
  }
  s += `</g>`
  s += zigzagBand(240, H - 260, W - 480, 60, P.fg)
  return s
}

function artMosaic(r, P, uid) {
  let s = ''
  const cx = W / 2, cy = 1370
  const colsets = [[P.fg, P.accent], [P.accent, P.soft], [P.fg, P.soft]]
  const maxR = 900
  for (let rad = 210; rad <= maxR; rad += 64) {
    const ringIdx = Math.round((rad - 210) / 64)
    const ts = 54
    const n = Math.max(8, Math.round((2 * Math.PI * rad) / ts))
    const scheme = ringIdx % 3 === 2 ? [P.soft] : pick(r, colsets)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + rnd(r, -2, 2)
      const x = cx + rad * Math.cos(deg(a)), y = cy + rad * Math.sin(deg(a))
      const c = scheme[i % scheme.length]
      s += `<rect x="${f1(x - ts * 0.34)}" y="${f1(y - 22)}" width="${f1(ts * 0.68)}" height="44" fill="${c}" opacity="0.95" transform="rotate(${f1(a + 90 + rnd(r, -6, 6))} ${f1(x)} ${f1(y)})"/>`
    }
  }
  // center rosette
  s += `<circle cx="${cx}" cy="${cy}" r="176" fill="${P.fg}"/>`
  for (let k = 0; k < 8; k++) s += leaf(cx, cy, 150, 40, k * 45, P.bg, 0.95)
  s += `<circle cx="${cx}" cy="${cy}" r="42" fill="${P.accent}"/>`
  // tessera rows top/bottom
  for (const yy of [200, H - 244]) {
    for (let x = 250; x < W - 250; x += 56) {
      s += `<rect x="${f1(x)}" y="${f1(yy + rnd(r, -3, 3))}" width="40" height="40" fill="${pick(r, [P.fg, P.accent, P.soft])}" transform="rotate(${f1(rnd(r, -5, 5))} ${f1(x + 20)} ${f1(yy + 20)})"/>`
    }
  }
  return s
}

function artSpiralStone(r, P, uid) {
  let s = ''
  const d = blobPath(r, W / 2, 1520, 880, 1080, 0.09, 10)
  s += `<path d="${d}" fill="${P.soft}" stroke="${P.fg}" stroke-width="10"/>`
  s += `<clipPath id="${uid}-st"><path d="${d}"/></clipPath><g clip-path="url(#${uid}-st)">`
  // triple spiral
  const tc = [W / 2, 1330], R3 = 230
  for (let k = 0; k < 3; k++) {
    const a = deg(90 + k * 120)
    s += spiral(tc[0] + R3 * Math.cos(a), tc[1] + R3 * Math.sin(a), 205, 2.6, P.fg, 22, k % 2 ? 1 : -1, a)
  }
  // scattered small spirals
  for (let i = 0; i < ri(r, 5, 8); i++) {
    const a = rnd(r, 0, Math.PI * 2), rr = rnd(r, 420, 760)
    const x = W / 2 + rr * Math.cos(a) * 0.9, y = 1520 + rr * Math.sin(a) * 1.05
    if (Math.abs(y - 1330) < 460 && Math.abs(x - W / 2) < 460) continue
    s += spiral(x, y, rnd(r, 60, 120), 2.2, P.fg, 14, r() < 0.5 ? 1 : -1, rnd(r, 0, 6))
  }
  s += chevronBand(W / 2 - 700, 2360, 1400, 90, P.fg)
  s += `</g>`
  s += dotBand(340, 170, W - 680, 60, P.fg)
  s += dotBand(340, H - 230, W - 680, 60, P.fg)
  return s
}

function artScript(r, P, uid) {
  let s = ''
  const rune = uid.charCodeAt(uid.length - 1) % 2 === 1
  if (!rune) {
    // clay tablet with cuneiform-inspired marks
    const d = blobPath(r, W / 2, H / 2, 760, 1120, 0.035, 12)
    s += `<path d="${d}" fill="${P.soft}" stroke="${P.fg}" stroke-width="9"/>`
    s += `<clipPath id="${uid}-tb"><path d="${blobPath(mulberry32(1), W / 2, H / 2, 690, 1040, 0, 12)}"/></clipPath><g clip-path="url(#${uid}-tb)">`
    const rows = ri(r, 9, 11)
    const y0 = 560, rh = (H - 1120) / rows
    for (let row = 0; row < rows; row++) {
      const y = y0 + row * rh + rh / 2
      s += `<line x1="560" y1="${f1(y0 + row * rh)}" x2="${W - 560}" y2="${f1(y0 + row * rh)}" stroke="${P.fg}" stroke-width="4" opacity="0.35"/>`
      let x = 600
      while (x < W - 640) {
        const g = ri(r, 0, 3), sz = rh * 0.52
        if (g === 0) { // vertical wedge
          s += `<path d="M${f1(x)},${f1(y - sz / 2)} l ${f1(sz * 0.16)},${f1(sz * 0.22)} l ${f1(-sz * 0.08)},0 L${f1(x + sz * 0.02)},${f1(y + sz / 2)} l -8,0 Z" fill="${P.fg}"/>`
        } else if (g === 1) { // horizontal wedge
          s += `<path d="M${f1(x)},${f1(y)} l ${f1(sz * 0.22)},${f1(-sz * 0.14)} l 0,${f1(sz * 0.1)} l ${f1(sz * 0.5)},0 l 0,8 L${f1(x + sz * 0.2)},${f1(y + 6)} Z" fill="${P.fg}"/>`
        } else if (g === 2) { // corner hook
          s += `<path d="M${f1(x)},${f1(y - sz * 0.3)} L${f1(x + sz * 0.3)},${f1(y)} L${f1(x)},${f1(y + sz * 0.3)} l -8,-6 L${f1(x + sz * 0.16)},${f1(y)} l ${f1(-sz * 0.24)},${f1(-sz * 0.22)} Z" fill="${P.fg}"/>`
        } else { // double vertical
          s += `<rect x="${f1(x)}" y="${f1(y - sz * 0.4)}" width="10" height="${f1(sz * 0.8)}" fill="${P.fg}"/><rect x="${f1(x + 22)}" y="${f1(y - sz * 0.4)}" width="10" height="${f1(sz * 0.8)}" fill="${P.fg}"/>`
        }
        x += sz + ri(r, 14, 44)
      }
    }
    s += `</g>`
  } else {
    // runestone
    const d = blobPath(r, W / 2, 1580, 700, 1150, 0.06, 9)
    s += `<path d="${d}" fill="${P.soft}" stroke="${P.fg}" stroke-width="10"/>`
    s += `<clipPath id="${uid}-rs"><path d="${d}"/></clipPath><g clip-path="url(#${uid}-rs)">`
    // serpentine band with runes
    s += `<path d="M${W / 2 - 460},2560 C ${W / 2 - 620},1900 ${W / 2 - 300},1500 ${W / 2},1400 C ${W / 2 + 300},1300 ${W / 2 + 560},1000 ${W / 2 + 300},640" fill="none" stroke="${P.fg}" stroke-width="150" opacity="0.25"/>`
    const runes = 16
    for (let i = 0; i < runes; i++) {
      const t = i / (runes - 1)
      // sample along the same cubic chain roughly
      const x = W / 2 - 460 + (760 * t) + Math.sin(t * Math.PI) * -140
      const y = 2560 - 1900 * t + Math.sin(t * 6) * 30
      const sz = 84
      s += `<line x1="${f1(x)}" y1="${f1(y - sz / 2)}" x2="${f1(x)}" y2="${f1(y + sz / 2)}" stroke="${P.fg}" stroke-width="14" stroke-linecap="round"/>`
      const branches = ri(r, 1, 2)
      for (let b = 0; b < branches; b++) {
        const dy = rnd(r, -sz / 2 + 10, 0), dir = r() < 0.5 ? 1 : -1
        s += `<line x1="${f1(x)}" y1="${f1(y + dy)}" x2="${f1(x + dir * sz * 0.42)}" y2="${f1(y + dy + sz * 0.36)}" stroke="${P.fg}" stroke-width="12" stroke-linecap="round"/>`
      }
    }
    // spiral head/tail ornaments (knot-style curls, not animals)
    s += spiral(W / 2 + 300, 640, 110, 2.3, P.fg, 18, 1, 0)
    s += spiral(W / 2 - 460, 2560, 110, 2.3, P.fg, 18, -1, Math.PI)
    s += `</g>`
  }
  return s
}

function arcPolyline(cx, cy, R, a1, a2, c, swid) {
  const n = 48
  let pts = ''
  for (let i = 0; i <= n; i++) {
    const a = deg(a1 + ((a2 - a1) * i) / n)
    pts += `${f1(cx + R * Math.cos(a))},${f1(cy + R * Math.sin(a))} `
  }
  return `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${f1(swid)}" stroke-linecap="round"/>`
}

function artWreath(r, P, uid) {
  let s = ''
  const cx = W / 2, cy = 1430, R = rnd(r, 620, 700)
  // stems: from bottom (90°) up each side toward the top opening
  s += arcPolyline(cx, cy, R, 96, 254, P.fg, 14)
  s += arcPolyline(cx, cy, R, 84, -74, P.fg, 14)
  // leaves along arcs
  const nL = 15
  for (const dir of [-1, 1]) {
    for (let i = 0; i < nL; i++) {
      const a = 100 + i * (150 / (nL - 1)) // arc position from bottom going up
      const ang = 90 + dir * (a - 90) // left side sweeps 100..250, right side 80..-70
      const x = cx + R * Math.cos(deg(ang)), y = cy + R * Math.sin(deg(ang))
      const taper = 1 - (i / nL) * 0.45
      const rot = (dir === -1 ? ang - 180 : ang) + (i % 2 ? 30 : -30) * dir
      s += leaf(x, y, 175 * taper, 36 * taper, rot, P.fg)
      if (i % 3 === 1) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="15" fill="${P.accent}"/>`
    }
  }
  // ribbon at bottom
  s += `<path d="M${cx - 30},${f1(cy + R - 24)} l -120,150 l 60,10 l 80,-110 Z" fill="${P.accent}"/>`
  s += `<path d="M${cx + 30},${f1(cy + R - 24)} l 120,150 l -60,10 l -80,-110 Z" fill="${P.accent}"/>`
  // center emblem
  const emblem = pick(r, ['sunburst', 'star', 'crescent', 'rings'])
  if (emblem === 'sunburst') {
    for (let k = 0; k < 24; k++) {
      const a = k * 15
      s += `<line x1="${f1(cx + 130 * Math.cos(deg(a)))}" y1="${f1(cy + 130 * Math.sin(deg(a)))}" x2="${f1(cx + (k % 2 ? 240 : 300) * Math.cos(deg(a)))}" y2="${f1(cy + (k % 2 ? 240 : 300) * Math.sin(deg(a)))}" stroke="${P.accent}" stroke-width="16" stroke-linecap="round"/>`
    }
    s += `<circle cx="${cx}" cy="${cy}" r="96" fill="${P.accent}"/>`
  } else if (emblem === 'star') {
    s += starN(cx, cy, 260, P.accent, 8)
    s += `<circle cx="${cx}" cy="${cy}" r="52" fill="${P.bg}"/>`
  } else if (emblem === 'crescent') {
    s += crescent(cx, cy, 220, P.accent, P.bg)
  } else {
    for (const rr of [260, 190, 120]) s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${P.accent}" stroke-width="20"/>`
    s += `<circle cx="${cx}" cy="${cy}" r="44" fill="${P.accent}"/>`
  }
  s += greekKeyBand(280, 200, W - 560, 80, P.fg)
  s += waveBand(280, H - 280, W - 560, 86, P.fg)
  return s
}

const BAND_POOL = ['key', 'wave', 'zig', 'tri', 'check', 'dot', 'chev', 'palm', 'lotus']
function drawBand(kind, x, y, w, h, c, P, r) {
  switch (kind) {
    case 'key': return greekKeyBand(x, y + h * 0.1, w, h * 0.8, c)
    case 'wave': return waveBand(x, y + h * 0.12, w, h * 0.76, c)
    case 'zig': return zigzagBand(x, y + h * 0.2, w, h * 0.6, c)
    case 'tri': return triangleBand(x, y + h * 0.15, w, h * 0.7, c, r() < 0.5)
    case 'check': return checkerBand(x, y + h * 0.14, w, h * 0.72, c)
    case 'dot': return dotBand(x, y + h * 0.15, w, h * 0.7, c)
    case 'chev': return chevronBand(x, y + h * 0.18, w, h * 0.64, c)
    case 'palm': return palmetteBand(x, y + h * 0.14, w, h * 0.74, c)
    case 'lotus': {
      let out = ''
      const n = Math.floor(w / (h * 1.1))
      for (let i = 0; i < n; i++) out += lotusMotif(x + (w * (i + 0.5)) / n, y + h * 0.9, h * 0.72, { fg: c, accent: c }, r)
      return out
    }
  }
  return ''
}
function artSampler(r, P, uid) {
  let s = ''
  const x = 250, w = W - 500
  const nB = ri(r, 8, 10)
  const weights = Array.from({ length: nB }, () => rnd(r, 0.7, 1.6))
  const totW = weights.reduce((a, b) => a + b, 0)
  let y = 260
  const avail = H - 520
  let last = ''
  for (let i = 0; i < nB; i++) {
    const h = (weights[i] / totW) * avail
    let kind = pick(r, BAND_POOL)
    while (kind === last) kind = pick(r, BAND_POOL)
    last = kind
    const inverted = i % 3 === 1
    if (inverted) {
      s += `<rect x="${x}" y="${f1(y)}" width="${w}" height="${f1(h)}" fill="${P.fg}"/>`
      s += drawBand(kind, x + 30, y + h * 0.08, w - 60, h * 0.84, P.bg, P, r)
    } else {
      s += drawBand(kind, x + 30, y + h * 0.08, w - 60, h * 0.84, i % 2 ? P.accent : P.fg, P, r)
    }
    y += h
    s += `<line x1="${x}" y1="${f1(y)}" x2="${x + w}" y2="${f1(y)}" stroke="${P.fg}" stroke-width="6"/>`
  }
  s += `<line x1="${x}" y1="260" x2="${x + w}" y2="260" stroke="${P.fg}" stroke-width="6"/>`
  return s
}

function artLabyrinth(r, P, uid) {
  let s = ''
  const cx = W / 2, cy = 1450
  const rings = ri(r, 7, 9)
  const r0 = 130, step = (1000 - r0) / rings
  for (let i = 0; i < rings; i++) {
    const rad = r0 + i * step
    const gapA = (i % 2 === 0 ? 90 : 270) + rnd(r, -14, 14)
    const half = 165
    s += `<path d="${arcPath(cx, cy, rad, gapA + (180 - half), gapA + (180 + half) + 360 - 360)}" fill="none" stroke="${P.fg}" stroke-width="${f1(step * 0.42)}" stroke-linecap="round"/>`
    // radial connector at gap
    if (i < rings - 1) {
      const wallA = gapA + (i % 2 === 0 ? 24 : -24)
      s += `<line x1="${f1(cx + rad * Math.cos(deg(wallA)))}" y1="${f1(cy + rad * Math.sin(deg(wallA)))}" x2="${f1(cx + (rad + step) * Math.cos(deg(wallA)))}" y2="${f1(cy + (rad + step) * Math.sin(deg(wallA)))}" stroke="${P.fg}" stroke-width="${f1(step * 0.42)}" stroke-linecap="round"/>`
    }
  }
  s += `<circle cx="${cx}" cy="${cy}" r="56" fill="${P.accent}"/>`
  s += greekKeyBand(280, 210, W - 560, 84, P.fg)
  s += greekKeyBand(280, H - 300, W - 560, 84, P.fg)
  return s
}

function artZiggurat(r, P, uid) {
  let s = ''
  // sky
  const moon = r() < 0.5
  if (moon) s += crescent(rnd(r, 1550, 1850), rnd(r, 620, 800), rnd(r, 120, 170), P.accent, P.bg)
  else s += starN(rnd(r, 1550, 1850), rnd(r, 600, 800), rnd(r, 130, 180), P.accent, 8)
  for (let i = 0; i < ri(r, 10, 18); i++) {
    s += `<circle cx="${f1(rnd(r, 260, W - 260))}" cy="${f1(rnd(r, 380, 1300))}" r="${f1(rnd(r, 4, 9))}" fill="${P.accent}" opacity="${rnd(r, 0.5, 1).toFixed(2)}"/>`
  }
  // tiers
  const tiers = ri(r, 4, 6)
  const baseY = 2480, tierH = rnd(r, 200, 250)
  let wTier = rnd(r, 1750, 1950)
  for (let i = 0; i < tiers; i++) {
    const y = baseY - (i + 1) * tierH
    const slope = 34
    s += `<path d="M${f1(W / 2 - wTier / 2)},${f1(y + tierH)} L${f1(W / 2 - wTier / 2 + slope)},${f1(y)} L${f1(W / 2 + wTier / 2 - slope)},${f1(y)} L${f1(W / 2 + wTier / 2)},${f1(y + tierH)} Z" fill="${P.fg}"/>`
    s += `<line x1="${f1(W / 2 - wTier / 2 + slope)}" y1="${f1(y + 3)}" x2="${f1(W / 2 + wTier / 2 - slope)}" y2="${f1(y + 3)}" stroke="${P.accent}" stroke-width="8" opacity="0.8"/>`
    wTier *= rnd(r, 0.72, 0.8)
  }
  // stair
  const stTop = baseY - tiers * tierH
  s += `<rect x="${W / 2 - 80}" y="${f1(stTop)}" width="160" height="${f1(baseY - stTop)}" fill="${P.fg}"/>`
  for (let y = stTop + 24; y < baseY; y += 34) {
    s += `<line x1="${W / 2 - 62}" y1="${f1(y)}" x2="${W / 2 + 62}" y2="${f1(y)}" stroke="${P.bg}" stroke-width="7" opacity="0.7"/>`
  }
  // shrine on top
  s += `<rect x="${W / 2 - 110}" y="${f1(stTop - 130)}" width="220" height="130" fill="${P.fg}"/>`
  s += `<rect x="${W / 2 - 34}" y="${f1(stTop - 92)}" width="68" height="92" fill="${P.bg}" opacity="0.85"/>`
  // ground
  s += `<rect x="150" y="${baseY}" width="${W - 300}" height="30" fill="${P.fg}"/>`
  s += zigzagBand(240, 190, W - 480, 62, P.fg)
  s += zigzagBand(240, H - 260, W - 480, 62, P.fg)
  return s
}

function artStarChart(r, P, uid) {
  let s = ''
  const cx = W / 2, cy = 1400, R = 1010
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${P.fg}" stroke-width="10"/>`
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 46}" fill="none" stroke="${P.fg}" stroke-width="4" opacity="0.7"/>`
  for (let i = 0; i < 72; i++) {
    const a = i * 5, long = i % 6 === 0
    const r1 = R - (long ? 40 : 24)
    s += `<line x1="${f1(cx + r1 * Math.cos(deg(a)))}" y1="${f1(cy + r1 * Math.sin(deg(a)))}" x2="${f1(cx + R * Math.cos(deg(a)))}" y2="${f1(cy + R * Math.sin(deg(a)))}" stroke="${P.fg}" stroke-width="${long ? 10 : 5}"/>`
  }
  for (const rr of [280, 530, 780]) {
    s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${P.fg}" stroke-width="3" opacity="0.28" stroke-dasharray="3 26"/>`
  }
  // stars
  for (let i = 0; i < ri(r, 60, 90); i++) {
    const a = rnd(r, 0, Math.PI * 2), rr = Math.sqrt(r()) * (R - 90)
    s += `<circle cx="${f1(cx + rr * Math.cos(a))}" cy="${f1(cy + rr * Math.sin(a))}" r="${f1(rnd(r, 3, 8))}" fill="${P.fg}" opacity="${rnd(r, 0.45, 1).toFixed(2)}"/>`
  }
  for (let i = 0; i < ri(r, 5, 8); i++) {
    const a = rnd(r, 0, Math.PI * 2), rr = Math.sqrt(r()) * (R - 160)
    s += sparkle(cx + rr * Math.cos(a), cy + rr * Math.sin(a), rnd(r, 34, 62), P.fg)
  }
  // constellations
  for (let c = 0; c < ri(r, 2, 3); c++) {
    const a0 = rnd(r, 0, Math.PI * 2), r0 = rnd(r, 200, 620)
    let px = cx + r0 * Math.cos(a0), py = cy + r0 * Math.sin(a0)
    let pts = `${f1(px)},${f1(py)} `
    let nodes = `<circle cx="${f1(px)}" cy="${f1(py)}" r="12" fill="${P.fg}"/>`
    for (let i = 0; i < ri(r, 4, 6); i++) {
      px += rnd(r, -220, 220); py += rnd(r, -200, 200)
      const dd = Math.hypot(px - cx, py - cy)
      if (dd > R - 130) { px = cx + (px - cx) * 0.6; py = cy + (py - cy) * 0.6 }
      pts += `${f1(px)},${f1(py)} `
      nodes += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(rnd(r, 8, 14))}" fill="${P.fg}"/>`
    }
    s += `<polyline points="${pts}" fill="none" stroke="${P.fg}" stroke-width="4" opacity="0.55"/>` + nodes
  }
  // moon
  const ma = rnd(r, 0, Math.PI * 2)
  s += crescent(cx + 640 * Math.cos(ma), cy + 640 * Math.sin(ma), 88, P.fg, P.bg)
  s += greekKeyBand(360, H - 250, W - 720, 76, P.fg)
  return s
}

function artAqueduct(r, P, uid) {
  let s = ''
  s += `<circle cx="${f1(rnd(r, 800, 1600))}" cy="${f1(rnd(r, 700, 900))}" r="${f1(rnd(r, 260, 380))}" fill="${P.accent}"/>`
  // hills
  s += `<path d="M150,1560 Q 650,${f1(rnd(r, 1150, 1280))} 1250,1560 T 2250,1500 L2250,1750 L150,1750 Z" fill="${P.soft}" opacity="0.8"/>`
  s += `<path d="M150,1560 Q 1500,${f1(rnd(r, 1250, 1360))} 2250,1560 L2250,1750 L150,1750 Z" fill="${P.soft}" opacity="0.5"/>`
  const deckY = 1560, groundY = 2420
  // lower tier: 5 arches
  const nA = 5, span = (W - 400) / nA
  s += `<rect x="200" y="${deckY}" width="${W - 400}" height="70" fill="${P.fg}"/>`
  s += `<rect x="200" y="${deckY + 70}" width="${W - 400}" height="${groundY - deckY - 70}" fill="${P.fg}"/>`
  for (let i = 0; i < nA; i++) {
    const ax = 200 + i * span + span / 2
    const aw = span * 0.62, ah = groundY - deckY - 210
    s += `<path d="M${f1(ax - aw / 2)},${groundY} L${f1(ax - aw / 2)},${f1(groundY - ah + aw / 2)} A${f1(aw / 2)},${f1(aw / 2)} 0 0 1 ${f1(ax + aw / 2)},${f1(groundY - ah + aw / 2)} L${f1(ax + aw / 2)},${groundY} Z" fill="${P.bg}"/>`
  }
  // upper tier: small arches
  const nB2 = 10, span2 = (W - 400) / nB2, tierTop = deckY - 240
  s += `<rect x="200" y="${tierTop}" width="${W - 400}" height="240" fill="${P.fg}"/>`
  for (let i = 0; i < nB2; i++) {
    const ax = 200 + i * span2 + span2 / 2
    const aw = span2 * 0.56, ah = 170
    s += `<path d="M${f1(ax - aw / 2)},${deckY} L${f1(ax - aw / 2)},${f1(deckY - ah + aw / 2)} A${f1(aw / 2)},${f1(aw / 2)} 0 0 1 ${f1(ax + aw / 2)},${f1(deckY - ah + aw / 2)} L${f1(ax + aw / 2)},${deckY} Z" fill="${P.bg}"/>`
  }
  s += `<rect x="200" y="${tierTop - 40}" width="${W - 400}" height="40" fill="${P.fg}"/>`
  // ground + cypress
  s += `<rect x="150" y="${groundY}" width="${W - 300}" height="26" fill="${P.fg}"/>`
  for (let i = 0; i < ri(r, 2, 4); i++) {
    const tx = pick(r, [rnd(r, 260, 700), rnd(r, 1700, 2140)])
    const th = rnd(r, 300, 520)
    s += leaf(tx, groundY + 8, th, th * 0.16, 0, P.fg)
    s += `<line x1="${f1(tx)}" y1="${groundY}" x2="${f1(tx)}" y2="${f1(groundY + 24)}" stroke="${P.fg}" stroke-width="12"/>`
  }
  s += waveBand(240, H - 280, W - 480, 90, P.fg)
  return s
}

function artScarab(r, P, uid) {
  let s = ''
  s += stripeBandEgy(200, 170, W - 400, 70, P)
  s += stripeBandEgy(200, H - 240, W - 400, 70, P)
  const cx = W / 2, cy = 1660
  // sun disk
  s += `<circle cx="${cx}" cy="${f1(cy - 630)}" r="150" fill="${P.accent}"/>`
  s += `<circle cx="${cx}" cy="${f1(cy - 630)}" r="196" fill="none" stroke="${P.accent}" stroke-width="10"/>`
  // wings — layered feather fans
  const rows = [{ rad: 760, sw: 34, c: P.fg }, { rad: 600, sw: 30, c: P.accent }, { rad: 450, sw: 26, c: P.fg }]
  for (const dir of [-1, 1]) {
    const px = cx + dir * 90, py = cy - 120
    for (const row of rows) {
      for (let k = 0; k <= 8; k++) {
        const a = 8 + k * 9 // degrees above horizontal
        const ax = px + dir * row.rad * Math.cos(deg(a))
        const ay = py - row.rad * Math.sin(deg(a)) * 0.55
        s += `<line x1="${f1(px)}" y1="${f1(py)}" x2="${f1(ax)}" y2="${f1(ay)}" stroke="${row.c}" stroke-width="${row.sw}" stroke-linecap="round"/>`
      }
    }
  }
  // legs
  for (const dir of [-1, 1]) {
    s += `<path d="M${f1(cx + dir * 120)},${f1(cy - 160)} q ${dir * 150},-60 ${dir * 210},-150" fill="none" stroke="${P.fg}" stroke-width="26" stroke-linecap="round"/>`
    s += `<path d="M${f1(cx + dir * 165)},${f1(cy)} q ${dir * 190},20 ${dir * 260},-40" fill="none" stroke="${P.fg}" stroke-width="26" stroke-linecap="round"/>`
    s += `<path d="M${f1(cx + dir * 130)},${f1(cy + 150)} q ${dir * 150},90 ${dir * 230},80" fill="none" stroke="${P.fg}" stroke-width="26" stroke-linecap="round"/>`
  }
  // body
  s += `<ellipse cx="${cx}" cy="${cy}" rx="180" ry="240" fill="${P.fg}"/>`
  s += `<line x1="${cx}" y1="${f1(cy - 120)}" x2="${cx}" y2="${f1(cy + 236)}" stroke="${P.bg}" stroke-width="9" opacity="0.7"/>`
  s += `<path d="M${f1(cx - 172)},${f1(cy - 108)} Q ${cx},${f1(cy - 30)} ${f1(cx + 172)},${f1(cy - 108)}" fill="none" stroke="${P.bg}" stroke-width="9" opacity="0.7"/>`
  // head crescent (beetle clypeus with serrations)
  s += `<path d="M${f1(cx - 120)},${f1(cy - 210)} A 130,130 0 0 1 ${f1(cx + 120)},${f1(cy - 210)} L${f1(cx + 78)},${f1(cy - 165)} L${f1(cx - 78)},${f1(cy - 165)} Z" fill="${P.fg}"/>`
  for (let k = -2; k <= 2; k++) {
    s += `<line x1="${f1(cx + k * 44)}" y1="${f1(cy - 268)}" x2="${f1(cx + k * 58)}" y2="${f1(cy - 322)}" stroke="${P.fg}" stroke-width="16" stroke-linecap="round"/>`
  }
  // moon boat below
  s += `<path d="M${f1(cx - 420)},${f1(cy + 330)} Q ${cx},${f1(cy + 500)} ${f1(cx + 420)},${f1(cy + 330)} L${f1(cx + 360)},${f1(cy + 330)} Q ${cx},${f1(cy + 430)} ${f1(cx - 360)},${f1(cy + 330)} Z" fill="${P.accent}"/>`
  return s
}

function artObelisk(r, P, uid) {
  let s = ''
  const two = r() < 0.5
  const groundY = 2430
  s += `<circle cx="${f1(rnd(r, 850, 1550))}" cy="${f1(rnd(r, 820, 1020))}" r="${f1(rnd(r, 280, 400))}" fill="${P.accent}" opacity="0.95"/>`
  s += `<line x1="200" y1="${groundY}" x2="${W - 200}" y2="${groundY}" stroke="${P.fg}" stroke-width="16"/>`
  const obs = two ? [{ x: 830, h: rnd(r, 1500, 1650) }, { x: 1570, h: rnd(r, 1280, 1450) }] : [{ x: W / 2, h: rnd(r, 1650, 1800) }]
  for (const o of obs) {
    const bw = two ? 220 : 270, tw = bw * 0.62
    const topY = groundY - o.h
    // plinth
    s += `<rect x="${f1(o.x - bw)}" y="${f1(groundY - 90)}" width="${f1(bw * 2)}" height="90" fill="${P.fg}"/>`
    s += `<rect x="${f1(o.x - bw * 0.72)}" y="${f1(groundY - 170)}" width="${f1(bw * 1.44)}" height="80" fill="${P.fg}"/>`
    // shaft
    s += `<path d="M${f1(o.x - bw / 2)},${f1(groundY - 170)} L${f1(o.x - tw / 2)},${f1(topY + 150)} L${f1(o.x + tw / 2)},${f1(topY + 150)} L${f1(o.x + bw / 2)},${f1(groundY - 170)} Z" fill="${P.fg}"/>`
    // pyramidion
    s += `<polygon points="${f1(o.x)},${f1(topY)} ${f1(o.x - tw / 2)},${f1(topY + 152)} ${f1(o.x + tw / 2)},${f1(topY + 152)}" fill="${P.accent}"/>`
    // carved marks (geometric, bg colored)
    let gy = topY + 260
    while (gy < groundY - 300) {
      const g = ri(r, 0, 4), gs = 46
      const gx = o.x
      if (g === 0) s += `<circle cx="${f1(gx)}" cy="${f1(gy)}" r="${gs * 0.42}" fill="${P.bg}" opacity="0.9"/>`
      else if (g === 1) s += `<rect x="${f1(gx - gs / 2)}" y="${f1(gy - 8)}" width="${gs}" height="16" fill="${P.bg}" opacity="0.9"/>`
      else if (g === 2) s += `<polygon points="${f1(gx)},${f1(gy - gs / 2)} ${f1(gx - gs / 2)},${f1(gy + gs / 2)} ${f1(gx + gs / 2)},${f1(gy + gs / 2)}" fill="${P.bg}" opacity="0.9"/>`
      else if (g === 3) s += zigzagBand(gx - gs, gy - 12, gs * 2, 26, P.bg)
      else { s += `<circle cx="${f1(gx)}" cy="${f1(gy)}" r="${gs * 0.4}" fill="none" stroke="${P.bg}" stroke-width="10" opacity="0.9"/><line x1="${f1(gx)}" y1="${f1(gy + gs * 0.4)}" x2="${f1(gx)}" y2="${f1(gy + gs)}" stroke="${P.bg}" stroke-width="10" opacity="0.9"/>` }
      gy += 110
    }
  }
  s += stripeBandEgy(200, H - 230, W - 400, 64, P)
  return s
}

function artTemple(r, P, uid) {
  let s = ''
  const baseY = 2500
  // steps
  for (let i = 0; i < 3; i++) {
    const w = 2000 - i * 0 + i * 0
    s += `<rect x="${f1(W / 2 - (2020 - i * 120) / 2)}" y="${f1(baseY - (i + 1) * 66)}" width="${f1(2020 - i * 120)}" height="66" fill="${P.fg}" opacity="${1 - i * 0.08}"/>`
  }
  const stylTop = baseY - 198
  // columns
  const nC = pick(r, [4, 5, 6])
  const spanX = 1660
  const colW = 108
  const capY = 1300
  for (let i = 0; i < nC; i++) {
    const cx = W / 2 - spanX / 2 + (spanX * i) / (nC - 1)
    s += `<rect x="${f1(cx - colW / 2)}" y="${capY}" width="${colW}" height="${f1(stylTop - capY)}" fill="${P.fg}"/>`
    for (let k = -1; k <= 1; k++) s += `<line x1="${f1(cx + k * colW / 3.4)}" y1="${capY + 40}" x2="${f1(cx + k * colW / 3.4)}" y2="${stylTop - 14}" stroke="${P.bg}" stroke-width="7" opacity="0.5"/>`
    s += `<rect x="${f1(cx - colW / 2 - 22)}" y="${f1(capY - 40)}" width="${f1(colW + 44)}" height="40" fill="${P.fg}"/>`
    s += `<rect x="${f1(cx - colW / 2 - 12)}" y="${f1(stylTop - 4)}" width="${f1(colW + 24)}" height="30" fill="${P.fg}"/>`
  }
  // entablature
  const archY = capY - 40
  s += `<rect x="${f1(W / 2 - spanX / 2 - 130)}" y="${f1(archY - 84)}" width="${f1(spanX + 260)}" height="84" fill="${P.fg}"/>`
  // frieze: triglyphs & metope dots
  const friY = archY - 84 - 130
  s += `<rect x="${f1(W / 2 - spanX / 2 - 130)}" y="${f1(friY)}" width="${f1(spanX + 260)}" height="130" fill="${P.soft}"/>`
  const nT = 9
  for (let i = 0; i < nT; i++) {
    const tx = W / 2 - spanX / 2 - 60 + ((spanX + 120) * i) / (nT - 1)
    for (let k = -1; k <= 1; k++) s += `<rect x="${f1(tx + k * 26 - 9)}" y="${f1(friY + 18)}" width="18" height="94" fill="${P.fg}"/>`
    if (i < nT - 1) {
      const mx = tx + ((spanX + 120) / (nT - 1)) / 2
      s += `<circle cx="${f1(mx)}" cy="${f1(friY + 65)}" r="30" fill="none" stroke="${P.fg}" stroke-width="10"/>`
    }
  }
  s += `<rect x="${f1(W / 2 - spanX / 2 - 160)}" y="${f1(friY - 46)}" width="${f1(spanX + 320)}" height="46" fill="${P.fg}"/>`
  // pediment
  const pedB = friY - 46, apexY = pedB - rnd(r, 330, 400)
  const pedHalf = spanX / 2 + 160
  s += `<polygon points="${f1(W / 2 - pedHalf)},${f1(pedB)} ${f1(W / 2)},${f1(apexY)} ${f1(W / 2 + pedHalf)},${f1(pedB)}" fill="none" stroke="${P.fg}" stroke-width="26"/>`
  s += starN(W / 2, pedB - 120, 92, P.accent, 8)
  s += `<circle cx="${f1(W / 2 - 460)}" cy="${f1(pedB - 70)}" r="34" fill="${P.accent}"/>`
  s += `<circle cx="${f1(W / 2 + 460)}" cy="${f1(pedB - 70)}" r="34" fill="${P.accent}"/>`
  // acroteria
  for (const [ax, ay] of [[W / 2, apexY - 10], [W / 2 - pedHalf, pedB - 10], [W / 2 + pedHalf, pedB - 10]]) {
    for (let k = -2; k <= 2; k++) {
      s += `<line x1="${f1(ax)}" y1="${f1(ay)}" x2="${f1(ax + 62 * Math.sin(deg(k * 24)))}" y2="${f1(ay - 62 * Math.cos(deg(k * 24)))}" stroke="${P.fg}" stroke-width="13" stroke-linecap="round"/>`
    }
  }
  s += greekKeyBand(280, H - 280, W - 560, 84, P.fg)
  return s
}

function artVoyage(r, P, uid) {
  let s = ''
  s += greekKeyBand(240, 200, W - 480, 84, P.fg)
  s += `<circle cx="${f1(rnd(r, 500, 1900))}" cy="${f1(rnd(r, 620, 800))}" r="${f1(rnd(r, 190, 300))}" fill="${P.accent}"/>`
  for (let i = 0; i < ri(r, 2, 4); i++) {
    const bx = rnd(r, 400, 2000), by = rnd(r, 480, 900)
    s += `<path d="M${f1(bx)},${f1(by)} q 24,-22 48,0 q 24,-22 48,0" fill="none" stroke="${P.fg}" stroke-width="7" stroke-linecap="round"/>`
  }
  const seaY = 1980
  // ship
  const hullY = seaY - 60, bowX = 620, sternX = 1830
  s += `<path d="M${bowX - 140},${f1(hullY - 70)} L${bowX},${f1(hullY)} L${bowX},${f1(hullY - 40)} L${sternX - 60},${f1(hullY - 40)} Q ${sternX + 60},${f1(hullY - 60)} ${sternX + 40},${f1(hullY - 240)} L ${sternX + 90},${f1(hullY - 240)} Q ${sternX + 120},${f1(hullY - 40)} ${sternX - 40},${f1(hullY + 20)} L ${bowX + 20},${f1(hullY + 20)} Z" fill="none" stroke="none"/>`
  s += `<path d="M${bowX - 150},${f1(hullY - 90)} L${bowX + 30},${f1(hullY - 10)} L${sternX - 30},${f1(hullY - 10)} Q ${sternX + 110},${f1(hullY - 50)} ${sternX + 70},${f1(hullY - 260)} Q ${sternX + 40},${f1(hullY - 120)} ${sternX - 80},${f1(hullY - 90)} L ${bowX + 60},${f1(hullY - 90)} Z" fill="${P.fg}"/>`
  s += `<path d="M${bowX + 30},${f1(hullY - 10)} Q ${W / 2 + 100},${f1(hullY + 90)} ${sternX - 30},${f1(hullY - 10)} L${sternX - 90},${f1(hullY - 40)} Q ${W / 2 + 80},${f1(hullY + 40)} ${bowX + 80},${f1(hullY - 44)} Z" fill="${P.fg}"/>`
  s += spiral(sternX + 60, hullY - 300, 66, 2.1, P.fg, 16, 1, Math.PI / 2)
  // shields along gunwale
  for (let i = 0; i < 8; i++) {
    const sx = bowX + 180 + i * 130
    s += `<circle cx="${f1(sx)}" cy="${f1(hullY - 92)}" r="38" fill="${P.accent}" stroke="${P.bg}" stroke-width="6"/>`
    s += `<circle cx="${f1(sx)}" cy="${f1(hullY - 92)}" r="12" fill="${P.bg}"/>`
  }
  // oars
  for (let i = 0; i < 9; i++) {
    const ox = bowX + 150 + i * 130
    s += `<line x1="${f1(ox)}" y1="${f1(hullY - 20)}" x2="${f1(ox - 70)}" y2="${f1(hullY + 150)}" stroke="${P.fg}" stroke-width="13"/>`
  }
  // mast + sail
  const mastX = (bowX + sternX) / 2 - 40
  s += `<line x1="${mastX}" y1="${f1(hullY - 90)}" x2="${mastX}" y2="1080" stroke="${P.fg}" stroke-width="22"/>`
  s += `<line x1="${mastX - 380}" y1="1100" x2="${mastX + 380}" y2="1100" stroke="${P.fg}" stroke-width="18"/>`
  s += `<path d="M${mastX - 360},1120 L${mastX + 360},1120 L${mastX + 300},1600 Q ${mastX},1700 ${mastX - 300},1600 Z" fill="${P.accent}"/>`
  for (let i = 1; i < 5; i++) {
    s += `<line x1="${f1(mastX - 360 + i * 12)}" y1="${f1(1120 + i * 96)}" x2="${f1(mastX + 360 - i * 12)}" y2="${f1(1120 + i * 96)}" stroke="${P.fg}" stroke-width="8" opacity="0.6"/>`
  }
  s += `<line x1="${mastX - 360}" y1="1120" x2="${bowX - 60}" y2="${f1(hullY - 100)}" stroke="${P.fg}" stroke-width="9"/>`
  s += `<line x1="${mastX + 360}" y1="1120" x2="${sternX + 40}" y2="${f1(hullY - 240)}" stroke="${P.fg}" stroke-width="9"/>`
  // sea — rows of running spirals
  let op = 1
  for (let row = 0; row < 5; row++) {
    s += waveBand(220, seaY + 40 + row * 150, W - 440, 120, row % 2 ? P.accent : P.fg)
    op -= 0.15
  }
  return s
}

function artEmblem(r, P, uid, v) {
  let s = ''
  // nested frames with corner squares
  for (const [inset, sw] of [[190, 14], [260, 7]]) {
    s += `<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" fill="none" stroke="${P.fg}" stroke-width="${sw}"/>`
  }
  for (const cxx of [190, W - 190]) for (const cyy of [190, H - 190]) {
    s += `<rect x="${cxx - 42}" y="${cyy - 42}" width="84" height="84" fill="${P.accent}"/>`
  }
  const cx = W / 2, cy = 1420
  const kind = v % 4
  if (kind === 0) { // ankh
    s += `<ellipse cx="${cx}" cy="${f1(cy - 460)}" rx="230" ry="300" fill="none" stroke="${P.fg}" stroke-width="110"/>`
    s += `<rect x="${f1(cx - 52)}" y="${f1(cy - 190)}" width="104" height="900" rx="40" fill="${P.fg}"/>`
    s += `<rect x="${f1(cx - 400)}" y="${f1(cy - 190)}" width="800" height="104" rx="40" fill="${P.fg}"/>`
    s += `<circle cx="${cx}" cy="${f1(cy - 460)}" r="66" fill="${P.accent}"/>`
  } else if (kind === 1) { // djed pillar
    s += `<path d="M${f1(cx - 130)},${f1(cy + 700)} L${f1(cx - 100)},${f1(cy - 160)} L${f1(cx + 100)},${f1(cy - 160)} L${f1(cx + 130)},${f1(cy + 700)} Z" fill="${P.fg}"/>`
    for (let i = 0; i < 4; i++) {
      const y = cy - 220 - i * 150
      s += `<rect x="${f1(cx - 300 + i * 34)}" y="${f1(y)}" width="${f1(600 - i * 68)}" height="86" rx="30" fill="${P.fg}"/>`
      s += `<line x1="${f1(cx - 300 + i * 34 + 30)}" y1="${f1(y + 43)}" x2="${f1(cx + 300 - i * 34 - 30)}" y2="${f1(y + 43)}" stroke="${P.accent}" stroke-width="14"/>`
    }
    s += `<rect x="${f1(cx - 330)}" y="${f1(cy + 700)}" width="660" height="90" fill="${P.fg}"/>`
    for (let k = -2; k <= 2; k++) s += `<line x1="${f1(cx + k * 52)}" y1="${f1(cy - 40)}" x2="${f1(cx + k * 52)}" y2="${f1(cy + 660)}" stroke="${P.accent}" stroke-width="12" opacity="0.7"/>`
  } else if (kind === 2) { // lotus standard
    s += `<line x1="${cx}" y1="${f1(cy + 760)}" x2="${cx}" y2="${f1(cy + 60)}" stroke="${P.fg}" stroke-width="46"/>`
    s += lotusMotif(cx, cy + 60, 640, P, r)
    s += `<rect x="${f1(cx - 260)}" y="${f1(cy + 760)}" width="520" height="70" fill="${P.fg}"/>`
    s += `<circle cx="${cx}" cy="${f1(cy - 560)}" r="120" fill="${P.accent}"/>`
  } else { // winged sun disk
    s += `<circle cx="${cx}" cy="${f1(cy - 120)}" r="210" fill="${P.accent}"/>`
    s += `<circle cx="${cx}" cy="${f1(cy - 120)}" r="252" fill="none" stroke="${P.fg}" stroke-width="18"/>`
    const rows2 = [{ rad: 860, sw: 34 }, { rad: 680, sw: 30 }, { rad: 500, sw: 26 }]
    for (const dir of [-1, 1]) {
      for (const row of rows2) {
        for (let k = 0; k <= 7; k++) {
          const a = 4 + k * 8
          s += `<line x1="${f1(cx + dir * 160)}" y1="${f1(cy - 100)}" x2="${f1(cx + dir * (160 + row.rad * Math.cos(deg(a))))}" y2="${f1(cy - 100 - row.rad * Math.sin(deg(a)) * 0.5)}" stroke="${P.fg}" stroke-width="${row.sw}" stroke-linecap="round"/>`
        }
      }
      // curled tail below
      s += `<path d="M${f1(cx + dir * 130)},${f1(cy + 80)} q ${dir * 40},260 ${dir * 200},380" fill="none" stroke="${P.fg}" stroke-width="30" stroke-linecap="round"/>`
    }
  }
  // scatter small stars
  for (let i = 0; i < 6; i++) {
    s += starN(rnd(r, 420, W - 420), pick(r, [rnd(r, 380, 560), rnd(r, 2450, 2620)]), rnd(r, 26, 44), P.accent, 4, 0.4)
  }
  return s
}

function artLunar(r, P, uid) {
  let s = ''
  const cx = W / 2
  const phases = ['new', 'crescent', 'half', 'full', 'half2', 'crescent2', 'new']
  const n = phases.length
  const y0 = 480, gap = (H - 960) / (n - 1)
  s += `<line x1="${cx}" y1="${y0}" x2="${cx}" y2="${H - 480}" stroke="${P.fg}" stroke-width="5" opacity="0.4"/>`
  phases.forEach((ph, i) => {
    const y = y0 + i * gap
    const R = ph === 'full' ? 220 : 128
    if (ph === 'full') {
      for (let k = 0; k < 16; k++) {
        const a = k * 22.5
        s += `<line x1="${f1(cx + (R + 40) * Math.cos(deg(a)))}" y1="${f1(y + (R + 40) * Math.sin(deg(a)))}" x2="${f1(cx + (R + 110) * Math.cos(deg(a)))}" y2="${f1(y + (R + 110) * Math.sin(deg(a)))}" stroke="${P.accent}" stroke-width="14" stroke-linecap="round"/>`
      }
      s += `<circle cx="${cx}" cy="${f1(y)}" r="${R}" fill="${P.fg}"/>`
    } else if (ph === 'new') {
      s += `<circle cx="${cx}" cy="${f1(y)}" r="${R}" fill="none" stroke="${P.fg}" stroke-width="12"/>`
    } else if (ph.startsWith('crescent')) {
      const dir = ph === 'crescent' ? 1 : -1
      s += `<circle cx="${cx}" cy="${f1(y)}" r="${R}" fill="${P.fg}"/>`
      s += `<circle cx="${f1(cx + dir * R * 0.45)}" cy="${f1(y)}" r="${f1(R * 0.92)}" fill="${P.bg}"/>`
    } else {
      const dir = ph === 'half' ? 0 : 1
      s += `<path d="M${cx},${f1(y - R)} A${R},${R} 0 0 ${dir} ${cx},${f1(y + R)} Z" fill="${P.fg}"/>`
      s += `<circle cx="${cx}" cy="${f1(y)}" r="${R}" fill="none" stroke="${P.fg}" stroke-width="10"/>`
    }
    // side ticks
    s += `<line x1="${f1(cx - 560)}" y1="${f1(y)}" x2="${f1(cx - 480)}" y2="${f1(y)}" stroke="${P.fg}" stroke-width="8"/>`
    s += `<line x1="${f1(cx + 480)}" y1="${f1(y)}" x2="${f1(cx + 560)}" y2="${f1(y)}" stroke="${P.fg}" stroke-width="8"/>`
  })
  for (let i = 0; i < ri(r, 14, 24); i++) {
    const sx = pick(r, [rnd(r, 300, 720), rnd(r, 1680, 2100)])
    s += `<circle cx="${f1(sx)}" cy="${f1(rnd(r, 420, 2580))}" r="${f1(rnd(r, 3, 8))}" fill="${P.fg}" opacity="${rnd(r, 0.4, 0.95).toFixed(2)}"/>`
  }
  s += zigzagBand(300, 210, W - 600, 56, P.fg)
  s += waveBand(300, H - 280, W - 600, 84, P.fg)
  return s
}

function artRosette(r, P, uid) {
  let s = ''
  const cx = W / 2, cy = 1420, R = 900
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${P.fg}" stroke-width="12"/>`
  for (let i = 0; i < 48; i++) {
    const a = i * 7.5
    s += `<line x1="${f1(cx + (R - 34) * Math.cos(deg(a)))}" y1="${f1(cy + (R - 34) * Math.sin(deg(a)))}" x2="${f1(cx + R * Math.cos(deg(a)))}" y2="${f1(cy + R * Math.sin(deg(a)))}" stroke="${P.fg}" stroke-width="8"/>`
  }
  // outer ray ring
  const nRay = ri(r, 20, 28)
  for (let i = 0; i < nRay; i++) {
    const a = (360 * i) / nRay
    const x = cx + R * 0.78 * Math.cos(deg(a)), y = cy + R * 0.78 * Math.sin(deg(a))
    s += `<polygon points="${f1(cx + R * 0.9 * Math.cos(deg(a)))},${f1(cy + R * 0.9 * Math.sin(deg(a)))} ${f1(cx + R * 0.68 * Math.cos(deg(a - 180 / nRay * 0.8)))},${f1(cy + R * 0.68 * Math.sin(deg(a - 180 / nRay * 0.8)))} ${f1(cx + R * 0.68 * Math.cos(deg(a + 180 / nRay * 0.8)))},${f1(cy + R * 0.68 * Math.sin(deg(a + 180 / nRay * 0.8)))}" fill="${i % 2 ? P.accent : P.fg}"/>`
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${f1(R * 0.62)}" fill="none" stroke="${P.fg}" stroke-width="8"/>`
  // petal rings
  const n2 = 16
  for (let i = 0; i < n2; i++) {
    const a = (360 * i) / n2 + 360 / n2 / 2
    s += leaf(cx + Math.cos(deg(a)) * 10, cy + Math.sin(deg(a)) * 10, R * 0.58, R * 0.075, a + 180, i % 2 ? P.fg : P.accent, 0.96)
  }
  const n1 = 8
  for (let i = 0; i < n1; i++) {
    const a = (360 * i) / n1
    s += leaf(cx, cy, R * 0.34, R * 0.085, a + 180, P.soft, 0.98)
  }
  s += `<circle cx="${cx}" cy="${cy}" r="110" fill="${P.fg}"/>`
  s += `<circle cx="${cx}" cy="${cy}" r="44" fill="${P.accent}"/>`
  s += dotBand(340, 180, W - 680, 56, P.fg)
  s += dotBand(340, H - 236, W - 680, 56, P.fg)
  return s
}

// ---------- collection registry ----------
const COLLECTIONS = [
  {
    key: 'amphora', medium: 'fresco', name: 'Amphorae of the Aegean', fn: artAmphora, motif: 'Amphora', culture: 'Greek',
    places: ['Knossos', 'Delphi', 'Olympia', 'Mycenae', 'Thera', 'Rhodes', 'Ithaca', 'Argos', 'Corinth', 'Miletus'],
    kws: ['Greek Vase Print', 'Pottery Wall Art', 'Grecian Urn Poster'],
    tags: ['ancient greek art', 'greek vase print', 'amphora wall art', 'grecian decor', 'terracotta print', 'greek pottery', 'mediterranean art', 'greek key border'],
    blurb: 'A hand-drawn ancient Greek amphora with meander, wave and palmette bands, rendered in the spirit of classical black-figure and red-figure pottery.'
  },
  {
    key: 'columns', medium: 'oil', name: 'Pillars of Antiquity', fn: artColumns, motif: 'Column Study', culture: 'Greek',
    places: ['Athens', 'Paestum', 'Sounion', 'Segesta', 'Didyma', 'Bassae', 'Nemea', 'Aegina', 'Selinunte', 'Priene'],
    kws: ['Greek Column Print', 'Doric Ionic Corinthian', 'Architecture Poster'],
    tags: ['greek column art', 'ancient architecture', 'classical decor', 'doric column print', 'ruins wall art', 'academia decor', 'ionic column', 'history teacher gift'],
    blurb: 'Classical column studies — Doric, Ionic and Corinthian orders standing against a rising sun, drawn as minimalist architectural art.'
  },
  {
    key: 'nile', medium: 'papyrus', name: 'Nile Botanicals', fn: artNileFrieze, motif: 'Lotus & Papyrus Frieze', culture: 'Egyptian',
    places: ['Luxor', 'Karnak', 'Memphis', 'Abydos', 'Philae', 'Edfu', 'Dendera', 'Saqqara', 'Aswan', 'Thebes'],
    kws: ['Egyptian Lotus Print', 'Papyrus Wall Art', 'Nile Frieze Poster'],
    tags: ['egyptian wall art', 'lotus flower print', 'papyrus art', 'ancient egypt decor', 'egyptian frieze', 'botanical print', 'nile river art', 'egyptology gift'],
    blurb: 'Repeating registers of lotus blossoms, buds and papyrus umbels, arranged like a temple wall frieze from the banks of the Nile.'
  },
  {
    key: 'giza', medium: 'papyrus', name: 'Giza Horizons', fn: artGiza, motif: 'Pyramid Landscape', culture: 'Egyptian',
    places: ['Giza', 'Dahshur', 'Meidum', 'Abusir', 'Saqqara', 'Hawara', 'Lisht', 'Abu Rawash', 'El Kurru', 'Nuri'],
    kws: ['Pyramid Print', 'Desert Landscape Art', 'Minimalist Egypt Poster'],
    tags: ['pyramid wall art', 'egypt landscape', 'desert print', 'minimalist travel', 'giza poster', 'ancient wonders', 'sun and sand art', 'boho desert decor'],
    blurb: 'A minimalist desert horizon — pyramids catching the light, layered dunes and a heavy ancient sun.'
  },
  {
    key: 'mosaic', medium: 'fresco', name: 'Roman Mosaics', fn: artMosaic, motif: 'Mosaic Medallion', culture: 'Roman',
    places: ['Pompeii', 'Ravenna', 'Herculaneum', 'Ostia', 'Antioch', 'Volubilis', 'Aquileia', 'Piazza Armerina', 'Zeugma', 'Paphos'],
    kws: ['Roman Mosaic Print', 'Medallion Wall Art', 'Tile Pattern Poster'],
    tags: ['roman mosaic art', 'mosaic pattern', 'medallion print', 'italian decor', 'ancient rome art', 'tile art print', 'circular wall art', 'classical pattern'],
    blurb: 'A radial mosaic medallion built tessera by tessera, echoing the villa floors of Pompeii and Ravenna.'
  },
  {
    key: 'spiralstone', medium: 'engraving', name: 'Standing Stones', fn: artSpiralStone, motif: 'Spiral Stone', culture: 'Celtic',
    places: ['Newgrange', 'Knowth', 'Dowth', 'Gavrinis', 'Loughcrew', 'Tara', 'Carrowkeel', 'Bryn Celli Ddu', 'Fourknocks', 'Sess Kilgreen'],
    kws: ['Celtic Spiral Print', 'Megalith Wall Art', 'Neolithic Poster'],
    tags: ['celtic wall art', 'triple spiral', 'newgrange art', 'megalithic print', 'irish decor', 'neolithic art', 'pagan wall art', 'ancient ireland'],
    blurb: 'A carved megalith alive with triple spirals and chevrons, drawn from the passage tombs of the Boyne Valley.'
  },
  {
    key: 'script', medium: 'engraving', name: 'Clay & Rune Scripts', fn: artScript, motif: 'Ancient Script', culture: 'Mesopotamian & Norse',
    places: ['Uruk', 'Nippur', 'Jelling', 'Ur', 'Rok', 'Nineveh', 'Uppsala', 'Lagash', 'Birka', 'Kish'],
    kws: ['Cuneiform Tablet Print', 'Runestone Wall Art', 'Ancient Writing Poster'],
    tags: ['cuneiform art', 'runestone print', 'ancient script', 'mesopotamia art', 'viking rune decor', 'norse wall art', 'history buff gift', 'writing system art'],
    blurb: 'Invented glyphs pressed into clay and carved into stone — a tribute to the world’s first writing systems (decorative, not literal text).'
  },
  {
    key: 'wreath', medium: 'fresco', name: 'Laurels of Victory', fn: artWreath, motif: 'Laurel Wreath', culture: 'Greek',
    places: ['Olympia', 'Delphi', 'Nemea', 'Isthmia', 'Marathon', 'Actium', 'Salamis', 'Plataea', 'Thermopylae', 'Chaeronea'],
    kws: ['Laurel Wreath Print', 'Victory Wall Art', 'Olympic Laurels Poster'],
    tags: ['laurel wreath art', 'victory laurels', 'greek wreath print', 'classical emblem', 'olive branch art', 'triumph decor', 'academia wall art', 'graduation gift'],
    blurb: 'The victor’s laurel crown, ringed around a sunburst — the ancient world’s highest honour as a graphic emblem.'
  },
  {
    key: 'sampler', medium: 'fresco', name: 'Attic Patterns', fn: artSampler, motif: 'Pattern Sampler', culture: 'Greek',
    places: ['Attica', 'Euboea', 'Boeotia', 'Laconia', 'Arcadia', 'Achaea', 'Messenia', 'Elis', 'Phocis', 'Aetolia'],
    kws: ['Greek Pattern Print', 'Meander Wall Art', 'Ornament Sampler Poster'],
    tags: ['greek key pattern', 'meander print', 'pattern sampler', 'geometric wall art', 'ornament print', 'classical borders', 'greek fret art', 'designer wall decor'],
    blurb: 'A stacked sampler of classical ornament — meanders, waves, palmettes, chevrons and checkers — like the border bands of an Attic vase, unrolled.'
  },
  {
    key: 'labyrinth', medium: 'engraving', name: 'Labyrinths of Crete', fn: artLabyrinth, motif: 'Labyrinth', culture: 'Minoan',
    places: ['Knossos', 'Phaistos', 'Malia', 'Zakros', 'Gournia', 'Kydonia', 'Archanes', 'Tylissos', 'Palaikastro', 'Kommos'],
    kws: ['Labyrinth Print', 'Minoan Maze Wall Art', 'Meditation Poster'],
    tags: ['labyrinth wall art', 'minoan art', 'maze print', 'meditation decor', 'knossos poster', 'mythology art', 'sacred geometry', 'zen wall art'],
    blurb: 'A winding ceremonial labyrinth of concentric walls and hidden gates — the myth of Knossos as pure geometry.'
  },
  {
    key: 'ziggurat', medium: 'oil', name: 'Ziggurats of Sumer', fn: artZiggurat, motif: 'Ziggurat', culture: 'Mesopotamian',
    places: ['Ur', 'Uruk', 'Eridu', 'Babylon', 'Nippur', 'Kish', 'Lagash', 'Sippar', 'Borsippa', 'Assur'],
    kws: ['Ziggurat Print', 'Mesopotamia Wall Art', 'Babylon Poster'],
    tags: ['ziggurat art', 'mesopotamia print', 'babylon wall art', 'sumerian decor', 'ancient temple art', 'stepped pyramid', 'night sky print', 'archaeology gift'],
    blurb: 'A great stepped temple rising under a crescent night sky, stair by stair toward the shrine at its summit.'
  },
  {
    key: 'starchart', medium: 'engraving', name: 'Ancient Skies', fn: artStarChart, motif: 'Star Chart', culture: 'Hellenistic',
    places: ['Alexandria', 'Rhodes', 'Babylon', 'Nineveh', 'Syene', 'Pergamon', 'Cnidus', 'Samos', 'Chaldea', 'Harran'],
    kws: ['Star Chart Print', 'Astronomy Wall Art', 'Celestial Map Poster'],
    tags: ['star chart art', 'celestial print', 'astronomy decor', 'constellation map', 'night sky art', 'astrolabe print', 'celestial wall art', 'stargazer gift'],
    blurb: 'An astronomer’s ring of ticks and degrees around invented constellations — the night sky as the ancients charted it.'
  },
  {
    key: 'aqueduct', medium: 'oil', name: 'Arches of Rome', fn: artAqueduct, motif: 'Aqueduct', culture: 'Roman',
    places: ['Segovia', 'Nimes', 'Tarragona', 'Merida', 'Aspendos', 'Caesarea', 'Carthage', 'Ephesus', 'Rome', 'Metz'],
    kws: ['Roman Aqueduct Print', 'Arches Wall Art', 'Italy Travel Poster'],
    tags: ['roman aqueduct art', 'arch print', 'italy wall art', 'roman ruins decor', 'travel poster', 'architecture print', 'engineering gift', 'cypress landscape'],
    blurb: 'Twin tiers of Roman arches striding across the countryside, with cypress trees and a low ancient sun.'
  },
  {
    key: 'scarab', medium: 'papyrus', name: 'Sacred Scarabs', fn: artScarab, motif: 'Winged Scarab', culture: 'Egyptian',
    places: ['Heliopolis', 'Amarna', 'Tanis', 'Bubastis', 'Hermopolis', 'Elephantine', 'Kom Ombo', 'Esna', 'Naukratis', 'Sais'],
    kws: ['Scarab Print', 'Winged Scarab Wall Art', 'Egyptian Emblem Poster'],
    tags: ['scarab wall art', 'winged scarab', 'egyptian emblem', 'khepri art print', 'ancient egypt art', 'beetle art', 'sun disk print', 'mystical decor'],
    blurb: 'The winged scarab bearing the sun disk — emblem of rebirth and the morning sun, spread across layered feather fans.'
  },
  {
    key: 'obelisk', medium: 'engraving', name: 'Obelisks at Dawn', fn: artObelisk, motif: 'Obelisk', culture: 'Egyptian',
    places: ['Heliopolis', 'Karnak', 'Luxor', 'Aswan', 'Alexandria', 'Thebes', 'Tanis', 'Abu Simbel', 'Memphis', 'Piramesse'],
    kws: ['Obelisk Print', 'Egyptian Monument Art', 'Minimalist Poster'],
    tags: ['obelisk wall art', 'egyptian monument', 'minimalist egypt', 'ancient stone art', 'monolith print', 'gilded tip obelisk', 'dawn sun print', 'monument decor'],
    blurb: 'Needle-straight monoliths with gilded pyramidions catching first light, carved with quiet geometric marks.'
  },
  {
    key: 'temple', medium: 'oil', name: 'Temples of Marble', fn: artTemple, motif: 'Temple Facade', culture: 'Greek',
    places: ['Parthenon', 'Sounion', 'Aphaia', 'Hephaestus', 'Zeus Olympia', 'Apollo Delphi', 'Hera Samos', 'Artemis Ephesus', 'Poseidonia', 'Concordia'],
    kws: ['Greek Temple Print', 'Parthenon Style Art', 'Facade Poster'],
    tags: ['greek temple art', 'parthenon print', 'temple facade', 'classical building', 'marble decor', 'pediment art', 'columns print', 'architect gift'],
    blurb: 'A full temple elevation — steps, fluted columns, triglyph frieze and starred pediment — drafted like an architect’s elevation.'
  },
  {
    key: 'voyage', medium: 'oil', name: 'Aegean Voyages', fn: artVoyage, motif: 'Trireme Voyage', culture: 'Greek',
    places: ['Salamis', 'Samos', 'Naxos', 'Chios', 'Lesbos', 'Kythera', 'Melos', 'Paros', 'Aegina', 'Skyros'],
    kws: ['Greek Ship Print', 'Trireme Wall Art', 'Nautical Poster'],
    tags: ['greek ship art', 'trireme print', 'nautical wall art', 'aegean sea decor', 'ancient sailing', 'wave pattern art', 'maritime print', 'odyssey art'],
    blurb: 'A lone trireme under sail on a sea of running spirals — shields on the gunwale, oars in the swell (crew safely below deck).'
  },
  {
    key: 'emblem', medium: 'papyrus', name: 'Emblems of Egypt', fn: artEmblem, motif: 'Sacred Emblem', culture: 'Egyptian',
    places: ['Ankh', 'Djed', 'Lotus', 'Winged Sun', 'Ankh II', 'Djed II', 'Lotus II', 'Winged Sun II', 'Ankh III', 'Djed III'],
    kws: ['Ankh Print', 'Egyptian Symbol Art', 'Sacred Emblem Poster'],
    tags: ['ankh wall art', 'egyptian symbol', 'djed pillar art', 'winged sun print', 'sacred emblem', 'spiritual decor', 'kemetic art', 'symbol print'],
    blurb: 'The great emblems of the Nile — ankh, djed pillar, lotus standard and winged sun — set in ceremonial nested frames.'
  },
  {
    key: 'lunar', medium: 'papyrus', name: 'Lunar Rites', fn: artLunar, motif: 'Moon Phases', culture: 'Babylonian',
    places: ['Sin', 'Nanna', 'Harran', 'Ur', 'Jericho', 'Byblos', 'Ugarit', 'Mari', 'Ebla', 'Emar'],
    kws: ['Moon Phases Print', 'Lunar Cycle Wall Art', 'Celestial Poster'],
    tags: ['moon phases art', 'lunar cycle print', 'celestial decor', 'moon wall art', 'boho moon print', 'mystic wall decor', 'astrology art', 'night sky poster'],
    blurb: 'The full lunar cycle stacked as a ritual column, rayed at the full moon — moon-worship rendered as minimal geometry.'
  },
  {
    key: 'rosette', medium: 'fresco', name: 'Rosettes of Assyria', fn: artRosette, motif: 'Rosette Medallion', culture: 'Assyrian',
    places: ['Nimrud', 'Nineveh', 'Assur', 'Khorsabad', 'Kalhu', 'Arbela', 'Dur Sharrukin', 'Balawat', 'Til Barsip', 'Carchemish'],
    kws: ['Rosette Print', 'Assyrian Wall Art', 'Mandala Poster'],
    tags: ['rosette wall art', 'assyrian art', 'ancient mandala', 'radial pattern', 'medallion decor', 'petal pattern art', 'sacred flower', 'geometric mandala'],
    blurb: 'The eternal rosette of Assyrian palaces — rings of petals and rays inside a degree-marked circle, ancient geometry as mandala.'
  },
]

// ---------- product assembly ----------
function renderArt(coll, v, index) {
  const uid = `a${index}`
  const seed = 77001 + index * 613
  const r = mulberry32(seed)
  const medium = coll.medium
  const pals = MEDIA_PALETTES[medium]
  const P = pals[(v + COLLECTIONS.indexOf(coll) * 3) % pals.length]
  let inner = textureDefs(uid, (seed % 9000) + 1, medium)
  inner += ground(uid, P, r, medium)
  inner += `<g filter="url(#${uid}-warp)">` + coll.fn(r, P, uid, v) + frame(P, medium) + `</g>`
  inner += mediumOverlays(uid, P, r, medium)
  return { inner, P, uid }
}

const svgDoc = (inner, w = W, h = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`

// ---------- mockup scenes ----------
function framedArt(uid, x, y, w, h, artInner, frameColor = '#3a3128') {
  const ft = w * 0.05, mat = w * 0.075
  let s = `<defs><filter id="${uid}-sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter></defs>`
  s += `<rect x="${f1(x - ft + 14)}" y="${f1(y - ft + 22)}" width="${f1(w + ft * 2)}" height="${f1(h + ft * 2)}" fill="#000" opacity="0.28" filter="url(#${uid}-sh)"/>`
  s += `<rect x="${f1(x - ft)}" y="${f1(y - ft)}" width="${f1(w + ft * 2)}" height="${f1(h + ft * 2)}" fill="${frameColor}"/>`
  s += `<rect x="${f1(x - ft * 0.35)}" y="${f1(y - ft * 0.35)}" width="${f1(w + ft * 0.7)}" height="${f1(h + ft * 0.7)}" fill="none" stroke="#00000055" stroke-width="3"/>`
  s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="#f6f2ea"/>`
  s += `<svg x="${f1(x + mat)}" y="${f1(y + mat)}" width="${f1(w - mat * 2)}" height="${f1(h - mat * 2)}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${artInner}</svg>`
  return s
}

const MW = 2400, MH = 1800

function plantPot(x, y, sc, leafC = '#5d7052', potC = '#a9714d') {
  let s = ''
  for (let k = -3; k <= 3; k++) {
    s += `<path d="M${f1(x)},${f1(y)} Q ${f1(x + k * 40 * sc)},${f1(y - 190 * sc)} ${f1(x + k * 60 * sc)},${f1(y - (260 - Math.abs(k) * 40) * sc)}" fill="none" stroke="${leafC}" stroke-width="${f1(16 * sc)}" stroke-linecap="round"/>`
  }
  s += `<path d="M${f1(x - 70 * sc)},${f1(y)} L${f1(x + 70 * sc)},${f1(y)} L${f1(x + 52 * sc)},${f1(y + 110 * sc)} L${f1(x - 52 * sc)},${f1(y + 110 * sc)} Z" fill="${potC}"/>`
  return s
}

function sceneBedroom(uid, artInner, P) {
  const wall = '#e9e1d2', floor = '#c8b190', wood = '#a87e57'
  let s = `<rect width="${MW}" height="${MH}" fill="${wall}"/>`
  s += `<rect y="1430" width="${MW}" height="370" fill="${floor}"/>`
  for (let x = 120; x < MW; x += 260) s += `<line x1="${x}" y1="1430" x2="${x - 60}" y2="1800" stroke="#00000018" stroke-width="6"/>`
  s += `<rect y="1418" width="${MW}" height="16" fill="#d7cbb6"/>`
  // headboard + bed
  s += `<rect x="700" y="980" width="1000" height="460" rx="26" fill="${wood}"/>`
  s += `<rect x="660" y="1290" width="1080" height="210" rx="30" fill="#f1ebdf"/>`
  s += `<rect x="660" y="1420" width="1080" height="120" rx="24" fill="${P.accent}" opacity="0.85"/>`
  s += `<rect x="770" y="1180" width="300" height="150" rx="40" fill="#faf6ec"/>`
  s += `<rect x="1330" y="1180" width="300" height="150" rx="40" fill="${P.soft}"/>`
  s += `<rect x="640" y="1530" width="1120" height="26" rx="12" fill="${wood}"/>`
  // nightstand + lamp
  s += `<rect x="360" y="1260" width="240" height="220" rx="10" fill="${wood}"/>`
  s += `<rect x="380" y="1300" width="200" height="14" fill="#00000022"/>`
  s += `<line x1="480" y1="1260" x2="480" y2="1130" stroke="#5a4632" stroke-width="12"/>`
  s += `<path d="M410,1130 L550,1130 L520,1020 L440,1020 Z" fill="${P.accent}"/>`
  s += plantPot(2060, 1520, 1.25)
  // art above bed
  s += framedArt(uid, 940, 250, 520, 650, artInner, '#4a3d2f')
  return s
}

function sceneClassroom(uid, artInner, P) {
  const wall = '#dfe4dc', floor = '#c2a67e'
  let s = `<rect width="${MW}" height="${MH}" fill="${wall}"/>`
  s += `<rect y="1400" width="${MW}" height="400" fill="${floor}"/>`
  for (let x = 60; x < MW; x += 200) s += `<line x1="${x}" y1="1400" x2="${x - 50}" y2="1800" stroke="#00000015" stroke-width="5"/>`
  // chalkboard
  s += `<rect x="180" y="260" width="900" height="620" fill="#8a6a48"/>`
  s += `<rect x="215" y="295" width="830" height="550" fill="#41524a"/>`
  s += `<line x1="280" y1="420" x2="760" y2="420" stroke="#ffffff66" stroke-width="9" stroke-linecap="round"/>`
  s += `<line x1="280" y1="520" x2="620" y2="520" stroke="#ffffff44" stroke-width="9" stroke-linecap="round"/>`
  s += `<circle cx="880" cy="560" r="90" fill="none" stroke="#ffffff55" stroke-width="8"/>`
  s += `<rect x="215" y="845" width="830" height="22" fill="#6f5436"/>`
  // teacher desk with globe & books
  s += `<rect x="330" y="1240" width="640" height="60" rx="10" fill="#9c7449"/>`
  s += `<rect x="370" y="1300" width="60" height="240" fill="#8a6540"/>`
  s += `<rect x="870" y="1300" width="60" height="240" fill="#8a6540"/>`
  s += `<rect x="430" y="1160" width="150" height="80" rx="8" fill="${P.accent}"/>`
  s += `<rect x="450" y="1120" width="150" height="40" rx="8" fill="${P.soft}"/>`
  // globe
  s += `<circle cx="800" cy="1130" r="86" fill="#7fa3b8"/>`
  s += `<path d="M760,1060 Q820,1100 780,1190 M740,1090 Q800,1120 850,1100" stroke="#5d8069" stroke-width="16" fill="none" stroke-linecap="round"/>`
  s += `<circle cx="800" cy="1130" r="86" fill="none" stroke="#6b5233" stroke-width="7"/>`
  s += `<line x1="800" y1="1216" x2="800" y2="1250" stroke="#6b5233" stroke-width="10"/>`
  s += `<rect x="750" y="1244" width="100" height="14" rx="7" fill="#6b5233"/>`
  // bookshelf right
  s += `<rect x="1980" y="700" width="300" height="800" fill="#9c7449"/>`
  for (let i = 0; i < 3; i++) {
    const sy = 760 + i * 250
    s += `<rect x="2000" y="${sy + 170}" width="260" height="16" fill="#7c5a37"/>`
    const cols = ['#b3502f', '#39685c', '#c9a227', '#2c4661', '#8a4423']
    for (let b = 0; b < 5; b++) s += `<rect x="${2020 + b * 46}" y="${sy + 30 + (b % 2) * 12}" width="36" height="${140 - (b % 2) * 12}" fill="${cols[(i + b) % 5]}"/>`
  }
  // art on wall
  s += framedArt(uid, 1350, 300, 470, 588, artInner, '#3d342a')
  return s
}

function sceneLiving(uid, artInner, P) {
  const wall = '#e8e2d6', floor = '#cbb597'
  let s = `<rect width="${MW}" height="${MH}" fill="${wall}"/>`
  s += `<rect y="1420" width="${MW}" height="380" fill="${floor}"/>`
  // rug
  s += `<ellipse cx="1200" cy="1640" rx="760" ry="130" fill="${P.soft}" opacity="0.55"/>`
  s += `<ellipse cx="1200" cy="1640" rx="600" ry="96" fill="none" stroke="${P.accent}" stroke-width="10" opacity="0.5"/>`
  // sofa
  s += `<rect x="700" y="1120" width="1000" height="300" rx="40" fill="#97a08c"/>`
  s += `<rect x="640" y="1060" width="120" height="380" rx="40" fill="#87907c"/>`
  s += `<rect x="1640" y="1060" width="120" height="380" rx="40" fill="#87907c"/>`
  s += `<rect x="740" y="1010" width="920" height="180" rx="36" fill="#a3ac97"/>`
  s += `<rect x="800" y="1060" width="240" height="160" rx="30" fill="${P.accent}"/>`
  s += `<rect x="1380" y="1060" width="240" height="160" rx="30" fill="${P.soft}"/>`
  s += `<rect x="700" y="1420" width="26" height="120" fill="#6f6353"/><rect x="1674" y="1420" width="26" height="120" fill="#6f6353"/>`
  // arc lamp
  s += `<path d="M360,1520 Q330,820 800,880" fill="none" stroke="#4c4438" stroke-width="16"/>`
  s += `<path d="M760,870 L840,880 L810,960 L770,955 Z" fill="#4c4438"/>`
  s += `<rect x="300" y="1510" width="130" height="20" rx="10" fill="#4c4438"/>`
  s += plantPot(2080, 1500, 1.35)
  // art above sofa
  s += framedArt(uid, 950, 220, 500, 625, artInner, '#2e2823')
  return s
}

function sceneStudy(uid, artInner, P) {
  const wall = '#e5ddcf', floor = '#b89a76'
  let s = `<rect width="${MW}" height="${MH}" fill="${wall}"/>`
  s += `<rect y="1430" width="${MW}" height="370" fill="${floor}"/>`
  for (let x = 100; x < MW; x += 230) s += `<line x1="${x}" y1="1430" x2="${x - 55}" y2="1800" stroke="#00000016" stroke-width="5"/>`
  // desk
  s += `<rect x="620" y="1180" width="1180" height="52" rx="10" fill="#8a6540"/>`
  s += `<rect x="680" y="1232" width="70" height="330" fill="#775433"/>`
  s += `<rect x="1670" y="1232" width="70" height="330" fill="#775433"/>`
  // objects: stacked books, scrolls, inkpot
  s += `<rect x="760" y="1120" width="220" height="34" rx="6" fill="${P.accent}"/>`
  s += `<rect x="780" y="1086" width="200" height="34" rx="6" fill="#39685c"/>`
  s += `<rect x="800" y="1052" width="170" height="34" rx="6" fill="#c9a227"/>`
  s += `<circle cx="1240" cy="1130" r="46" fill="#3f3428"/><rect x="1226" y="1048" width="16" height="60" fill="#3f3428" transform="rotate(18 1240 1090)"/>`
  s += `<rect x="1420" y="1100" width="260" height="26" rx="13" fill="#e8dcc0"/><rect x="1450" y="1072" width="260" height="26" rx="13" fill="#dfd0ad"/>`
  // chair
  s += `<rect x="1080" y="1300" width="360" height="34" rx="14" fill="#6f5436"/>`
  s += `<rect x="1100" y="1334" width="40" height="220" fill="#6f5436"/><rect x="1380" y="1334" width="40" height="220" fill="#6f5436"/>`
  s += `<rect x="1080" y="1030" width="42" height="290" rx="14" fill="#6f5436"/>`
  // shelf
  s += `<rect x="260" y="480" width="560" height="24" fill="#8a6540"/>`
  s += `<rect x="300" y="360" width="90" height="120" fill="#b3502f"/><rect x="400" y="380" width="80" height="100" fill="#2c4661"/><rect x="490" y="350" width="86" height="130" fill="#96a396"/>`
  s += plantPot(700, 480, 0.7)
  s += plantPot(320, 1520, 1.3)
  // art
  s += framedArt(uid, 1220, 300, 560, 700, artInner, '#443a2d')
  return s
}

function sceneHallway(uid, artInner, P) {
  const wall = '#e3dccd', floor = '#a98f6d'
  let s = `<rect width="${MW}" height="${MH}" fill="${wall}"/>`
  // picture molding panels
  for (const [px, pw] of [[160, 560], [1680, 560]]) {
    s += `<rect x="${px}" y="240" width="${pw}" height="1060" fill="none" stroke="#cabfa9" stroke-width="10"/>`
    s += `<rect x="${px + 40}" y="280" width="${pw - 80}" height="980" fill="none" stroke="#cabfa9" stroke-width="5"/>`
  }
  s += `<rect y="1380" width="${MW}" height="420" fill="${floor}"/>`
  for (let x = 0; x < MW; x += 190) s += `<line x1="${x}" y1="1380" x2="${x - 70}" y2="1800" stroke="#00000018" stroke-width="6"/>`
  s += `<rect y="1364" width="${MW}" height="18" fill="#d3c8b2"/>`
  // runner rug
  s += `<path d="M700,1500 L1700,1500 L1860,1800 L540,1800 Z" fill="${P.accent}" opacity="0.75"/>`
  s += `<path d="M760,1540 L1640,1540 L1760,1760 L640,1760 Z" fill="none" stroke="#f4ecdd" stroke-width="10" opacity="0.8"/>`
  // console table
  s += `<rect x="880" y="1180" width="640" height="40" rx="8" fill="#6f5436"/>`
  s += `<rect x="920" y="1220" width="44" height="240" fill="#5e4629"/>`
  s += `<rect x="1436" y="1220" width="44" height="240" fill="#5e4629"/>`
  // vase with branches
  s += `<path d="M1160,1180 q -14,-90 40,-160 M1200,1180 q 4,-120 -10,-200 M1230,1180 q 30,-90 90,-130" stroke="#5d7052" stroke-width="12" fill="none" stroke-linecap="round"/>`
  s += `<path d="M1150,1180 L1250,1180 L1230,1080 L1170,1080 Z" fill="${P.soft}" transform="translate(0,0)"/>`
  s += `<path d="M1155,1060 h90 l-12,124 h-66 Z" fill="#b98a5a"/>`
  // candlesticks
  s += `<rect x="1380" y="1120" width="18" height="60" fill="#8f6b3d"/><ellipse cx="1389" cy="1116" rx="16" ry="10" fill="#c9a227"/>`
  // art centered
  s += framedArt(uid, 960, 260, 480, 600, artInner, '#33291f')
  return s
}

const SCENES = [
  { key: 'bedroom', fn: sceneBedroom, label: 'Bedroom' },
  { key: 'classroom', fn: sceneClassroom, label: 'Classroom' },
  { key: 'living-room', fn: sceneLiving, label: 'Living room' },
  { key: 'study', fn: sceneStudy, label: 'Study / office' },
  { key: 'hallway', fn: sceneHallway, label: 'Hallway' },
]

// ---------- listing copy ----------
function buildTitle(coll, place, P, num) {
  const kw = coll.kws[num % coll.kws.length]
  let t = `${coll.motif} of ${place} | ${kw} | Ancient ${coll.culture} Wall Art | Printable Digital Download | ${P.name}`
  if (t.length > 140) t = t.slice(0, 137) + '...'
  return t
}

const GENERIC_TAGS = ['printable wall art', 'digital download', 'ancient art print', 'digital print', 'vintage style art', 'gallery wall art', 'living room decor', 'housewarming gift', 'printable poster', 'antique style']
function buildTags(coll) {
  const tags = [...coll.tags]
  for (const g of GENERIC_TAGS) {
    if (tags.length >= 13) break
    if (!tags.includes(g)) tags.push(g)
  }
  return tags.slice(0, 13).map(t => t.slice(0, 20))
}

function buildDescription(coll, place, P, sku) {
  return `${coll.motif} of ${place} — an original artwork from the "${coll.name}" collection (${P.name} palette).

${coll.blurb}

▸ WHAT YOU RECEIVE (instant digital download — no physical item shipped)
• 1 high-resolution image file, 4:5 ratio, 300 DPI print quality
• Prints beautifully at 4x5", 8x10", 11x14", 16x20" and A-series sizes (trim to fit)
• Vibrant on matte or textured art paper; also stunning on canvas

▸ HOW IT WORKS
1. Purchase and download instantly from Etsy
2. Print at home, at a local print shop, or via an online printer
3. Frame and enjoy your own piece of the ancient world

▸ GOOD TO KNOW
• Design ${sku} is a one-of-a-kind piece — no other listing shares this exact artwork
• Colors may vary slightly between screens and printers
• Personal use only — not for resale or redistribution

From the KayCreates Ancient Artefacts Collection — 200 unique designs inspired by the art of Greece, Egypt, Rome, Mesopotamia and the megalith builders. Each piece is finished as a genuine aged medium — fresco on cracked plaster, oil on canvas, sepia engraving on foxed paper, or gouache on papyrus — with authentic grain, patina and hand-worn texture.`
}

// ---------- main ----------
fs.mkdirSync(SVG_DIR, { recursive: true })
fs.mkdirSync(MOCK_DIR, { recursive: true })

const catalog = []
let index = 0
for (const coll of COLLECTIONS) {
  for (let v = 0; v < 10; v++) {
    const num = index + 1
    const sku = `AA-${String(num).padStart(3, '0')}`
    const { inner, P, uid } = renderArt(coll, v, index)
    const artFile = `${sku}-${coll.key}-${String(v + 1).padStart(2, '0')}.svg`
    fs.writeFileSync(path.join(SVG_DIR, artFile), svgDoc(inner))

    // 3 mockups: bedroom + classroom always, third rotates
    const third = SCENES[2 + (index % 3)]
    const mockups = [SCENES[0], SCENES[1], third].map(sc => {
      const mFile = `${sku}-${sc.key}.svg`
      const mInner = sc.fn(`${uid}${sc.key[0]}`, inner, P)
      fs.writeFileSync(path.join(MOCK_DIR, mFile), svgDoc(mInner, MW, MH))
      return mFile
    })

    const place = coll.places[v % coll.places.length]
    catalog.push({
      sku,
      collection: coll.name,
      title: buildTitle(coll, place, P, v),
      price_gbp: (4.5 + (COLLECTIONS.indexOf(coll) % 4) * 0.5).toFixed(2),
      tags: buildTags(coll).join('|'),
      palette: P.name,
      art_file: `svg/${artFile}`,
      mockups: mockups.map(m => `mockups/${m}`).join('|'),
      description: buildDescription(coll, place, P, sku),
    })
    index++
  }
  console.log(`✓ ${coll.name} (10 designs)`)
}

// catalog.csv
const esc = s => `"${String(s).replace(/"/g, '""')}"`
const cols = ['sku', 'collection', 'title', 'price_gbp', 'tags', 'palette', 'art_file', 'mockups', 'description']
fs.writeFileSync(path.join(OUT, 'catalog.csv'),
  cols.join(',') + '\n' + catalog.map(row => cols.map(c => esc(row[c])).join(',')).join('\n'))

// listings.md — copy-paste blocks for manual Etsy entry
fs.writeFileSync(path.join(OUT, 'listings.md'),
  `# Etsy listing copy — Ancient Artefacts Collection (200 designs)\n\n` +
  catalog.map(rw =>
    `## ${rw.sku} — ${rw.collection}\n\n**Title:**\n${rw.title}\n\n**Price:** £${rw.price_gbp}\n\n**Tags (13):** ${rw.tags.split('|').join(', ')}\n\n**Files:** art: \`${rw.art_file}\` · mockups: ${rw.mockups.split('|').map(m => `\`${m}\``).join(' ')}\n\n**Description:**\n\n${rw.description}\n\n---\n`
  ).join('\n'))

console.log(`\nGenerated ${catalog.length} products → ${SVG_DIR}`)
console.log(`Mockups → ${MOCK_DIR}`)
console.log(`Catalog → ${path.join(OUT, 'catalog.csv')} + listings.md`)
