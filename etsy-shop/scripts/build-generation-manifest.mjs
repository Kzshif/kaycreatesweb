#!/usr/bin/env node
/**
 * Builds products/generation-manifest.csv — 200 ready-to-run image-generation
 * prompts that replicate the four approved Higgsfield style samples:
 *   fresco  — aged fresco on cracked lime plaster (sample 1)
 *   oil     — classical oil painting on canvas, golden-hour light (sample 2)
 *   engrave — antique copperplate engraving, sepia on foxed paper (sample 3)
 *   papyrus — gouache + gold leaf on aged papyrus (sample 4)
 *
 * Every prompt is unique (subject, arrangement, light and patina vary per
 * design). All prompts forbid people, faces, text and watermarks.
 * Run each prompt at aspect 4:5, resolution 2k for print-quality output.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const STYLE = {
  fresco: s =>
    `Aged fresco painting on cracked lime plaster: ${s}. Faded terracotta, ochre and charcoal mineral pigments, chipped plaster patches, water stains and centuries of patina, photographed straight-on under soft diffused museum light, museum fine art print, no people, no faces, no text, no watermark`,
  oil: s =>
    `Classical oil painting on canvas: ${s}. Visible impasto brushstrokes, varnished canvas texture, 19th century romanticism style, rich atmospheric light, museum fine art, no people, no faces, no text, no watermark`,
  engrave: s =>
    `Antique copperplate engraving: ${s}. 18th century archaeological expedition illustration, fine crosshatched linework, sepia ink on aged foxed paper with deckled edges, elegant thin ruled border, no people, no faces, no text, no watermark`,
  papyrus: s =>
    `Gouache painting on authentic aged papyrus: ${s}. Lapis blue, ochre and terracotta mineral pigments with gold leaf accents, visible papyrus fiber and frayed edges, ancient Egyptian art style, soft natural light, fine art print, no human figures, no faces, no hieroglyphic text, no watermark`,
}

const LIGHT = ['dawn light', 'golden hour glow', 'soft overcast light', 'warm afternoon sun', 'cool morning haze', 'dusk afterglow', 'harsh desert noon', 'moonlit night', 'candlelit warmth', 'stormy dramatic light']

// Ten unique subjects per collection, composed from period-accurate elements.
const COLLECTIONS = [
  { key: 'amphora', style: 'fresco', subjects: [
    'a tall black-figure amphora with Greek key bands and palmette frieze on a stone plinth',
    'a wide-bellied krater painted with wave scrolls and radiating rays',
    'a slender hydria with three handles and chevron neck bands',
    'a lekythos oil flask with laurel garland and checker base band',
    'a two-handled kylix drinking cup seen in profile with meander rim',
    'a pelike storage jar with lotus bud frieze and banded foot',
    'an oinochoe wine jug with trefoil mouth and spiral shoulder pattern',
    'a stamnos vessel with ivy vine band and twin side handles',
    'a volute krater with tall scrolled handles and palmette panels',
    'a neck amphora with panel of geometric horses and triangle rays' ] },
  { key: 'columns', style: 'oil', subjects: [
    'three ruined Doric columns standing in a poppy meadow',
    'a single Ionic column with scrolled capital against a vast sky',
    'a Corinthian column overgrown with ivy beside a fallen capital',
    'a row of temple columns casting long shadows across marble paving',
    'two broken columns on a clifftop overlooking the sea',
    'a colonnade receding into golden haze',
    'a toppled column drum half-buried in wildflowers',
    'fluted columns framing a distant mountain',
    'a lone column reflected in a still pool',
    'weathered columns among olive trees at the edge of an escarpment' ] },
  { key: 'nile', style: 'papyrus', subjects: [
    'blue lotus flowers in full bloom among papyrus reeds',
    'a symmetrical frieze of lotus blossoms and closed buds',
    'papyrus umbels bending over calm Nile water',
    'alternating lotus and papyrus stems in temple-register rows',
    'a single monumental lotus flower with radiating petals',
    'reed thickets with dragonflies and lotus pads',
    'a border pattern of lotus garlands and date palm fronds',
    'papyrus stalks tied in ceremonial bundles',
    'lotus flowers floating on rippled water with fish shadows beneath',
    'a dense botanical study of Nile marsh plants' ] },
  { key: 'giza', style: 'engrave', subjects: [
    'the three pyramids of Giza rising from windswept dunes',
    'a stepped pyramid with a caravan of camels passing in the distance',
    'a great pyramid with its ruined mortuary causeway',
    'two pyramids framed by date palms at an oasis',
    'a pyramid complex surveyed from a rocky escarpment',
    'the great pyramid with scattered fallen casing stones',
    'a bent pyramid under a vast empty sky',
    'pyramids beyond the Nile floodplain with feluccas on the river',
    'a pyramid field with small queen pyramids in the foreground',
    'the sphinx-less Giza plateau with survey markers and dunes' ] },
  { key: 'mosaic', style: 'fresco', subjects: [
    'a circular Roman floor mosaic medallion with geometric guilloche rings',
    'a mosaic panel of interlocking meander patterns in red and blue tesserae',
    'a radiating sunburst mosaic with concentric tessera rings',
    'a mosaic border fragment with wave crest scrolls',
    'an octagonal mosaic panel with rosette center',
    'a chequerboard mosaic floor receding in perspective',
    'a knot-pattern mosaic emblem within a braided border',
    'a compass-rose mosaic with alternating dark and light rays',
    'a fragmentary mosaic with missing tesserae revealing plaster beneath',
    'a labyrinth-pattern mosaic panel from a villa threshold' ] },
  { key: 'spiralstone', style: 'engrave', subjects: [
    'a megalithic standing stone carved with triple spirals',
    'a passage tomb entrance stone covered in spiral and chevron carvings',
    'a circle of weathered standing stones on a moor',
    'a carved kerbstone with concentric arcs and lozenges',
    'a solitary menhir against rolling hills',
    'a dolmen of three great stones capped by a slab',
    'a spiral-carved boulder half sunk in heather',
    'an avenue of paired standing stones receding to the horizon',
    'a recumbent stone circle with a massive altar stone',
    'a carved stone basin within a chambered cairn' ] },
  { key: 'script', style: 'engrave', subjects: [
    'a cuneiform clay tablet with dense wedge-shaped writing',
    'a runestone carved with a serpentine rune band',
    'a fragmentary stone stela with weathered inscription rows',
    'a cylinder seal beside its rolled clay impression',
    'a scribal exercise tablet with practice wedges',
    'a boundary stone covered in archaic pictographs',
    'a broken tablet pieced together showing ledger columns',
    'a tall runestone in a birch clearing',
    'a clay envelope tablet with seal impressions',
    'an ostracon pottery shard with ink markings' ] },
  { key: 'wreath', style: 'fresco', subjects: [
    'a laurel victory wreath tied with ribbon',
    'an olive branch crown with silvery leaves and small fruits',
    'a laurel wreath encircling a radiant sun disk',
    'two crossed palm fronds beneath a laurel garland',
    'an ivy wreath with berries and trailing tendrils',
    'a wheat-sheaf crown bound with cord',
    'a laurel wreath around a crescent moon',
    'a myrtle wreath with delicate white blossoms',
    'an oak-leaf civic crown with acorns',
    'a laurel garland draped over a marble ledge' ] },
  { key: 'sampler', style: 'fresco', subjects: [
    'stacked horizontal bands of Greek key, wave scroll and palmette ornament',
    'a pattern sampler of chevrons, checkers and running spirals',
    'alternating friezes of meander and lotus bud ornament',
    'a column of border patterns from Attic pottery',
    'bands of zigzag, dot rosette and triangle ray ornament',
    'a wall of painted ornament registers in earth pigments',
    'egg-and-dart moulding above bead-and-reel bands',
    'a sampler of guilloche braid and astragal patterns',
    'graduated bands of palmette, anthemion and scroll ornament',
    'a decorative program of nested geometric borders' ] },
  { key: 'labyrinth', style: 'engrave', subjects: [
    'a circular classical labyrinth with a single winding path',
    'a square Roman labyrinth pattern with battlemented walls',
    'the seven-course Cretan labyrinth design',
    'a labyrinth carved into a stone slab',
    'an eleven-circuit medieval-style labyrinth rendered as a plan',
    'a coin-style labyrinth emblem with dense concentric walls',
    'a turf labyrinth seen from above on a hillside',
    'a labyrinth mosaic plan with a central rosette',
    'a spiral labyrinth cut into coastal rock',
    'an architectural survey drawing of a palace labyrinth' ] },
  { key: 'ziggurat', style: 'oil', subjects: [
    'a great ziggurat rising in stepped tiers above a river plain',
    'a ziggurat under a crescent moon with torch-lit stairways',
    'the ruined core of a ziggurat catching low sun',
    'a ziggurat with its triple staircase and summit shrine',
    'a mudbrick ziggurat above date palm groves',
    'a ziggurat in a dust storm, tiers fading into haze',
    'a restored ziggurat facade with buttressed walls',
    'a ziggurat reflected in irrigation canals',
    'caravans approaching a ziggurat at dusk',
    'a ziggurat silhouetted against a star-strewn sky' ] },
  { key: 'starchart', style: 'engrave', subjects: [
    'a celestial map with constellation figures drawn as connected stars',
    'an astrolabe rete overlaid on a star chart ring',
    'a planisphere with graduated degree rings and star magnitudes',
    "a comet's path plotted across a constellation chart",
    'a zodiac-free star atlas plate of the northern sky',
    'a lunar phase diagram ringed by star positions',
    'an armillary sphere diagram with celestial circles',
    'a meteor shower radiant plotted on a star grid',
    'a southern sky chart with the milky way band stippled',
    'an eclipse prediction diagram with solar and lunar disks' ] },
  { key: 'aqueduct', style: 'oil', subjects: [
    'a two-tiered Roman aqueduct striding across a river valley',
    'aqueduct arches golden in evening light with cypress trees',
    'a ruined aqueduct span ending abruptly mid-valley',
    'an aqueduct crossing farmland with grazing sheep',
    'the towering arches of an aqueduct against storm clouds',
    'an aqueduct bridge reflected in the river below',
    'a triple-tiered aqueduct in mountain foothills',
    'ivy-covered aqueduct piers along a country road',
    'an aqueduct vanishing into morning mist',
    "shepherds' huts beneath monumental aqueduct arches" ] },
  { key: 'scarab', style: 'papyrus', subjects: [
    'a winged scarab beetle lifting the sun disk',
    'a lapis scarab amulet with spread falcon wings',
    'a scarab pushing the solar orb above the horizon',
    'a heart scarab with folded wings and gold banding',
    'a scarab flanked by twin cobras and sun rays',
    'a scarab over a lotus garland',
    'a scarab within a cartouche-shaped border of stars',
    'a turquoise scarab with outstretched feathered wings',
    'a scarab above a solar barque on stylized water',
    'a great scarab emblem ringed by rosettes' ] },
  { key: 'obelisk', style: 'engrave', subjects: [
    'a lone obelisk with gilded pyramidion at dawn',
    'twin obelisks flanking a ruined temple pylon',
    'a fallen obelisk lying in quarry sand, partly carved',
    'an obelisk rising above palm trees by a riverbank',
    'an obelisk with survey scaffolding from an early expedition',
    'a granite obelisk against towering cumulus clouds',
    'an obelisk casting a long shadow across a plaza',
    'the unfinished obelisk still attached to bedrock',
    'an obelisk on a barge being floated down the Nile',
    'a weathered obelisk in a reed-fringed lagoon' ] },
  { key: 'temple', style: 'oil', subjects: [
    'a Doric temple facade with sculpted pediment at sunset',
    'a hilltop temple above terraced olive groves',
    'a ruined temple interior open to the sky',
    'a temple by the sea with waves breaking below',
    'a torch-lit temple front at dusk',
    'a temple half-buried in drifting sand',
    'a round tholos temple in a laurel grove',
    'a temple reflected in a sacred spring',
    'a mountain sanctuary temple wreathed in cloud',
    'a temple portico with votive garlands between columns' ] },
  { key: 'voyage', style: 'oil', subjects: [
    'a Greek trireme under full sail on a wine-dark sea',
    'a merchant galley riding heavy swells',
    'a trireme with painted eye on the prow cutting through waves',
    'a fleet of galleys on the horizon at dawn',
    'a beached trireme with furled sail in a rocky cove',
    'a galley rounding a headland lighthouse',
    'a trireme in a following sea, oars shipped',
    'a night passage with a galley under stars',
    'a trireme leaving a fortified harbor',
    'a lone galley in glassy calm, sail hanging slack' ] },
  { key: 'emblem', style: 'papyrus', subjects: [
    'a great ankh symbol flanked by was scepters',
    'a djed pillar wrapped with gold bands',
    'a winged sun disk with twin uraeus cobras',
    'an ankh entwined with lotus stems',
    'a shen ring above stylized water lines',
    'a golden ankh radiating light rays',
    'a djed pillar between twin obelisks',
    'a winged sun over a temple gateway',
    'an ankh, djed and was grouped as a blessing',
    'a solar disk in a barque with protective wings' ] },
  { key: 'lunar', style: 'papyrus', subjects: [
    'the phases of the moon stacked in a ritual column',
    'a full moon ringed by rays above stylized water',
    'crescent moons in procession across a star band',
    'a lunar disk cradled in a solar barque',
    'the moon cycle arranged in a great circle',
    'a crescent moon above a field of gold stars',
    'moon phases flanked by kneeling lotus buds',
    'an eclipse sequence painted as nested disks',
    "the moon god's silver disk between twin horns",
    'a waning moon over rippled Nile water' ] },
  { key: 'rosette', style: 'fresco', subjects: [
    'a great Assyrian rosette with concentric petal rings',
    'a band of alternating rosettes and palmettes',
    'a sunflower-form rosette within a guilloche ring',
    'a lotus-petal rosette medallion',
    'a rosette field pattern from a palace wall',
    'a rosette with alternating red and blue petals',
    'an eight-petal rosette inside a square frame',
    'a rosette ceiling boss with radiating leaves',
    'a rosette flanked by winged sun motifs',
    'a giant rosette with a hundred fine petals' ] },
]

// Read catalog for SKU + title alignment
const csv = fs.readFileSync(path.join(ROOT, 'products/catalog.csv'), 'utf8')
const lines = csv.split('\n').slice(1)

let out = 'sku,style,aspect_ratio,resolution,prompt\n'
let n = 0
for (const coll of COLLECTIONS) {
  for (let v = 0; v < 10; v++) {
    const sku = `AA-${String(n + 1).padStart(3, '0')}`
    const subject = coll.subjects[v]
    const light = LIGHT[(n * 7 + v) % LIGHT.length]
    const prompt = STYLE[coll.style](`${subject}, ${light}`)
    out += `${sku},${coll.style},4:5,2k,"${prompt.replace(/"/g, '""')}"\n`
    n++
  }
}
fs.writeFileSync(path.join(ROOT, 'products/generation-manifest.csv'), out)
console.log(`generation manifest → products/generation-manifest.csv (${n} prompts)`)
