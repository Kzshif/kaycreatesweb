# UK Website Leads

## Batch 2 (added 8 July 2026) — 114 new businesses + 6 new hot-demand leads

New regions/sector combos, fully deduped against batch 1. **100 of the 114 have
verified public emails.** Files: `uk-website-leads-batch2.csv` and
`uk-hot-demand-leads-batch2.csv`. Segments: Midlands & South trades (20),
North England hospitality (20 — incl. eleven Lake District/Yorkshire-coast B&Bs
on dated sites paying OTA commission), South England & Scotland beauty (20),
North & Midlands services (20), Wales/Scotland/North retail & produce (20),
UK-wide niche services (14 — MOT garages, kennels/catteries, dance schools,
party entertainers).

Batch-2 highlights: Badger Hill Butchers York (website now a parking page),
Lane Head Farm B&B (£109/night, 7 rooms, personal Gmail as public contact,
OTA clones outranking them), The Sandbeck Whitby (23 rooms on a legacy PHP
site), Prestatyn Butchers (takes Christmas orders via printable PDF form),
AK Scaffolding Bristol (a namesake firm owns "their" domain). Hot batch-2
leads include a ~£1m fulfilment company saying its new site isn't converting,
and two live Leeds Facebook-group posts asking for a web designer.

Use `claude-outreach-prompt-v2.md` — it links each email to the live /websites
example page and closes with the free homepage mockup offer.

---

## Batch 1 — 100 verified businesses + 15 hot-demand leads

Compiled 8 July 2026 by parallel research agents sweeping public UK sources
(Yell, Checkatrade, Cylex, Freeindex, Nextdoor, Facebook pages, tourism
directories, TripAdvisor, Companies House, PeoplePerHour, UK Business Forums).

## Files

| File | What it is |
|---|---|
| `uk-website-leads.csv` | **100 businesses**, all with a publicly listed email, all with concrete evidence they lack a proper website and a reason they'd pay for one |
| `uk-hot-demand-leads.csv` | **15 businesses that publicly posted/enquired** that they want a website (marketplace briefs, "recommend a web designer" posts, a formal college tender). Hottest leads — most are contacted via the platform rather than email |
| `claude-outreach-prompt.md` | Paste-ready Claude chat prompt that turns CSV rows into personalised outreach emails |

## The 100 — segment breakdown

- **North England — Trades** (20): plumbers, roofers, joiners, plasterers, landscapers in Manchester, Leeds, Sheffield, Newcastle, Liverpool, Preston, York. Mostly Facebook-only with strong review counts; high-ticket jobs won via Google searches they currently never appear in.
- **Scotland / Wales / NI — Hospitality** (20): cafés, restaurants, B&Bs, guest houses in Glasgow, Oban, Belfast, Fermanagh, Llandudno, Tenby, Caernarfon. Strong angle: they pay 15%+ commission to Booking.com/Just Eat that a direct-booking site recovers. Two have *hijacked or dead* domains (Roseneath Guest House, HUG Café) — urgent, visible problems.
- **Midlands — Beauty & Wellness** (20): salons, barbers, tattooists, groomers in Birmingham, Coventry, Nottingham, Stoke, Leicester, Derby. Booking-driven revenue; several are registered ltd companies paying Fresha/Treatwell marketplace commission.
- **London & South East — Services** (20): removals, cleaners, gardeners, handymen, tutors. Several already bought domains or built free Wix sites — proven willingness to spend, easy upgrade pitch.
- **South West & East Anglia — Retail/Produce** (20): farm shops, butchers, florists, bakeries. Angle: meat boxes, hampers, click-and-collect — they sell products but can't take orders online. One (Farmhouse Dairy Somerset) let their domain expire and it's being resold.

Business type: 15 confirmed **ltd companies** (strongest budget signal and simplest
PECR position), 47 likely sole traders, 38 unknown.

## Strongest openers (evidence practically writes the email)

1. **Roseneath Guest House, Oban** — their domain was hijacked and now serves junk content while they still trade via directories.
2. **CP's Barbers, Coventry** & **Pure Beauty, Wolverhampton** — dead domains still listed across directories; every click hits nothing.
3. **Farmhouse Dairy Somerset** — expired domain currently listed for resale on Dan.com.
4. **Sleepy Puffin B&B, Tenby** — live site still shows WordPress theme demo pages ("Saul Goodman" placeholder staff).
5. **Heart Nails & Spa, Nottingham** — registered ltd running on a free Firebase subdomain; they already tried to build a site.
6. All 15 in `uk-hot-demand-leads.csv` — they *asked* for this.

## How to work the list

1. Start with `uk-hot-demand-leads.csv` (active buyers), then the 15 ltd
   companies, then the dead-domain leads above.
2. Open `claude-outreach-prompt.md`, paste the block into Claude chat, then
   paste 5-10 CSV rows at a time. Fill in turnaround/signature once at the top.
3. Send 20-30/day from a warmed-up address; track replies in a new CSV column.

## Compliance (read before sending)

- **B2B email to ltd companies** is permitted under UK PECR provided you
  identify who you are and honour opt-outs. The generated emails include both.
- **Sole traders and partnerships count as individuals** under PECR — the safe
  route is the lighter-touch email the prompt produces for them, or ring first
  (cold calls to businesses are fine if they're not on CTPS — check
  ctpsonline.org.uk before phoning).
- Every email in these files was published by the business itself on a public
  page (their Facebook page, directory listing, or own site) — the source URL
  is in each row. Suppress anyone who opts out, permanently.
- One row is flagged `RE-VERIFY source before contact` in the notes column
  (source link mismatch found during QA) — check it before emailing.

## Caveats

- Verification was done via public pages and search snippets on 7–8 July 2026;
  businesses close, emails change — the first send will surface a few bounces.
- "Hot demand" post dates weren't always visible; the CSV notes which ones need
  a recency check before you invest time in a proposal.
