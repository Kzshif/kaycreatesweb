# Pokémon Stock Checker (UK)

A polite **restock-alert monitor** for Pokémon packs and boxes at UK retailers.
It watches product pages you choose and pings you the moment something flips
from *out of stock* to *in stock* — with a direct link so you can check out fast
yourself.

It is a **watcher, not a buyer.** It does not log in, add to basket, or check
out. Automated purchasing violates every major UK retailer's terms of service
and gets accounts and payment cards banned — so this tool deliberately stops at
"tell me the instant it's live." For hyped Pokémon drops, knowing first is
almost the whole game.

---

## Setup (2 minutes)

Requires **Node 18 or newer** (uses the built-in `fetch` — no `npm install`).

```bash
cd stock-checker
cp config.example.json config.json
# edit config.json — see below
node checker.mjs
```

Test a single pass and exit (handy while you tune it, or for cron):

```bash
node checker.mjs --once
```

Watch a set's **pre-orders** going live (uses the pre-order preset config):

```bash
cp preorders.example.json preorders.json   # edit the URLs first
node checker.mjs --config preorders.json
```

---

## Configuring what to watch

Open `config.json` and edit the `watches` array. Each entry:

```jsonc
{
  "id": "chaoscards-scarlet-violet-etb",   // any unique string
  "name": "SV Elite Trainer Box",          // shown in alerts
  "store": "Chaos Cards",                   // free text, shown in alerts
  "url": "https://www.chaoscards.co.uk/...", // the EXACT product page
  "enabled": true,                          // set true to activate
  "inStockText":  ["add to basket"],        // phrase(s) present when buyable
  "outOfStockText": ["out of stock", "sold out"] // phrase(s) present when not
}
```

**How detection works.** The checker downloads the page HTML and looks for your
phrases (case-insensitive):

1. If any `outOfStockText` phrase is found → treated as **out**.
2. Otherwise, if any `inStockText` phrase is found → treated as **in**.
3. Otherwise → **unknown** (never triggers an alert — it won't guess).

You only get pinged on a real **out/unknown → in** transition, so no spam.

### Getting the phrases right (important)

The example config ships with sensible guesses and every watch **disabled**.
Before enabling one:

1. Open the real product page in your browser while it's **out of stock**.
2. View source (Ctrl-U) and find the exact wording — e.g. `Out of stock`,
   `Sold out`, `Notify me when available`, `Currently unavailable`. Put that in
   `outOfStockText`.
3. Find the wording shown when it's buyable — usually `Add to basket` /
   `Add to cart`. Put that in `inStockText`.
4. Set `"enabled": true`.

Using the out-of-stock phrase as the primary signal is the most reliable
approach, because "Add to basket" markup sometimes exists in the HTML even when
the button is disabled.

> **Watch for false positives.** The plain (non-browser) mode searches the whole
> raw HTML, including inside `<script>` blocks. If a page ships "Add to basket"
> as text in its JavaScript regardless of stock, plain matching can read "in"
> when it isn't. If a watch alerts wrongly, either tighten the phrases to
> something only the live button shows, or switch that watch to browser mode
> (below), which reads the *rendered* page instead of the raw source.

### Pre-order mode

Add `"mode": "preorder"` to a watch (the `preorders.example.json` config does
this for you). It:

- ships **default phrases** tuned for pre-orders, so you can omit
  `inStockText`/`outOfStockText` — "coming soon" / "register interest" count as
  not-yet-live; "pre-order" / "add to basket" count as live;
- labels alerts **"PRE-ORDER LIVE"** (purple) instead of "IN STOCK".

Point pre-order watches at a retailer's set/category page *before* the release
date. Pre-ordering is the most reliable **legitimate** way to be first, and this
mode tells you the instant the button appears.

> **JavaScript-rendered pages.** A few sites (Pokémon Center, some Argos flows)
> build stock status in the browser with JS, so the raw HTML won't contain the
> phrase. If a watch always reads `unknown`, that site needs a headless browser.
> See "Sites that need a browser" below.

---

## Getting alerts

Console output always works. For push-to-phone, fill in one or both in the
`notify` block of `config.json`:

**Discord** — in your server: *Server Settings → Integrations → Webhooks → New
Webhook → Copy URL*. Paste into `discordWebhookUrl`. Free, instant, easiest.

**Telegram** — message [@BotFather](https://t.me/BotFather), `/newbot`, copy the
token into `telegramBotToken`. Then message your new bot once, and get your chat
id from `https://api.telegram.org/bot<TOKEN>/getUpdates` (the `chat.id` field).
Put it in `telegramChatId`.

`config.json` is git-ignored so your tokens never get committed.

---

## Running it around the clock

- **Leave it running** in a terminal (`node checker.mjs`), or
- **systemd** (Raspberry Pi / any Linux box) — ready-made unit in
  [`poke-checker.service`](poke-checker.service); install steps are in its
  header comments. Auto-restarts on crash and on reboot.
- **Cron** — single pass every 5 minutes; copy the line from
  [`crontab.example`](crontab.example).
- **Docker** — [`Dockerfile`](Dockerfile) included, with a
  `--build-arg WITH_BROWSER=1` variant that bakes in Playwright/Chromium for
  browser-mode watches. Run commands are in its header comments.
- **A cheap always-on box** (Raspberry Pi, a £4/mo VPS, or a free-tier host)
  keeps it watching while your laptop is off.

There's also [`CLAUDE-CHAT-PROMPT.md`](CLAUDE-CHAT-PROMPT.md) — a ready-made
prompt to paste into a claude.ai chat so Claude has full context on this tool
and can help you tune phrases, edit configs, and debug without re-explaining.

**Be a good citizen.** Defaults poll every ~5 minutes with jitter and space
requests 2.5s apart. Please don't crank the interval down to seconds — that
looks like an attack, gets your IP blocked, and won't get you stock any faster.

---

## Newbury-local buying notes

You're in Newbury, so lean on **click & collect** — it often beats delivery for
getting scarce stock, and lets you grab it same-day:

| Retailer | Nearest to you | Notes |
|---|---|---|
| **Argos** | Newbury, Kennet Centre (in-town) | Check-stock-at-store + reserve online. Also inside some Sainsbury's. |
| **Smyths Toys** | Reading & Basingstoke | Reserve online, collect in store. Good for ETBs/boxes. |
| **GAME** | Reading (Broad St / Oracle) | Sometimes gets TCG allocations. |
| **WHSmith / Tesco / Sainsbury's** | Newbury town + retail parks | Supermarkets get booster boxes/blisters; in-store only, no online stock feed — worth a physical pop-in on drop days. |
| **John Lewis** | Reading | Occasional TCG stock, reliable click & collect. |

Strong **online-only** UK specialists worth watching (usually get allocations
before supermarkets): **Chaos Cards**, **Magic Madhouse**, **Zatu Games**,
**ShopTo**, **Total Cards**, and the official **Pokémon Center UK**.

For brand-new set releases, check each retailer's **pre-order** pages ahead of
the street date — pre-ordering is the most reliable legitimate way to be first,
and this checker can watch pre-order pages for the "add to basket" going live.

---

## Browser mode — for JavaScript-rendered sites

Some retailers (Pokémon Center, some Argos flows) build stock status in the
browser with JavaScript, so the raw HTML doesn't contain the phrase and plain
mode reads `unknown`. For those, use browser rendering, which loads the page in
headless Chromium and reads the *rendered* text.

One-time install:

```bash
npm install playwright
npx playwright install chromium
```

Then either run everything through the browser:

```bash
node checker.mjs --browser
node checker.mjs --config preorders.json --browser
```

…or flip just the watches that need it by adding `"browser": true` to those
entries (they'll render in a browser even without the global `--browser` flag —
`pokemoncenter-uk-preorder` in the example is already set this way). The
checker launches Chromium once per run and reuses it, so it's cheap even with
many watches.

---

## What this tool won't do (and why)

No auto-checkout, no basket automation, no login/payment handling, no
CAPTCHA/queue bypassing. That's the scalper-bot behaviour retailers ban on
sight — it risks your accounts, your cards, and cancelled orders, and it's not
something worth building. This monitor gets you the one thing that actually
helps: **knowing first, legitimately.**
