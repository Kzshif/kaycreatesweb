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
- **Cron** (single pass every 5 min):
  ```
  */5 * * * * cd /path/to/stock-checker && /usr/bin/node checker.mjs --once >> checker.log 2>&1
  ```
- **A cheap always-on box** (Raspberry Pi, a £4/mo VPS, or a free-tier host)
  keeps it watching while your laptop is off.

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

## Sites that need a browser (optional upgrade)

If a retailer renders stock with JavaScript, swap the `fetch` for a headless
browser. Playwright (already available in many dev setups) works well:

```bash
npm install playwright
npx playwright install chromium
```

Then the detection step loads the page, waits for the button, and reads the
rendered text instead of raw HTML. Say the word and I can add a
`--browser` mode to `checker.mjs` that does this for the watches that need it.

---

## What this tool won't do (and why)

No auto-checkout, no basket automation, no login/payment handling, no
CAPTCHA/queue bypassing. That's the scalper-bot behaviour retailers ban on
sight — it risks your accounts, your cards, and cancelled orders, and it's not
something worth building. This monitor gets you the one thing that actually
helps: **knowing first, legitimately.**
