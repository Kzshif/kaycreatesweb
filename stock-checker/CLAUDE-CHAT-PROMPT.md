# Prompt for a normal Claude chat (claude.ai)

Copy everything inside the block below and paste it as your **first message**
in a new chat at claude.ai. It gives Claude the full picture of your setup so
it can help you without you re-explaining anything. After pasting it, just ask
your question underneath (or in the next message).

---

```
You are helping me run and tune my Pokémon TCG stock-alert tool. Context:

WHO I AM
- I'm in Newbury, Berkshire, UK. I collect/resell Pokémon TCG packs and boxes
  and want to be among the first to buy when stock drops or pre-orders open.
- Nearest useful stores: Argos (Kennet Centre, Newbury), Smyths & GAME &
  John Lewis (Reading), Smyths (Basingstoke), plus Newbury supermarkets
  (Tesco, Sainsbury's, WHSmith) which get TCG stock in-store only.

WHAT I HAVE
A Node.js stock checker (single file, checker.mjs, Node 18+, no dependencies
in plain mode) that polls retailer product pages and alerts me via Discord
webhook and/or Telegram bot ONLY when a product flips from out-of-stock to
in-stock, or a pre-order goes live. It is a watcher only — it does NOT auto-buy,
and I'm not asking you to make it auto-buy (auto-checkout violates retailer
terms and risks account bans, so that's off the table).

HOW IT WORKS
- config.json holds a "watches" array. Each watch: id, name, store, url,
  enabled, optional mode ("restock" default, or "preorder"), optional
  "browser": true, and optional inStockText / outOfStockText phrase arrays.
- Detection: downloads the page, case-insensitive search. If any
  outOfStockText phrase is present -> "out". Else if any inStockText phrase
  -> "in". Else "unknown" (never alerts). Alerts fire only on transition
  to "in", tracked in a state.json file.
- mode "preorder" has built-in phrase defaults ("coming soon"/"register
  interest" = not live; "pre-order"/"add to basket" = live) and sends
  "PRE-ORDER LIVE" alerts. There's a preorders.json config for these.
- mode "category" watches a shop's whole Pokémon section/search page: it
  extracts product links, keeps ones matching "keywords" (e.g. "elite
  trainer box", "booster bundle", "booster box", minus "excludeText"
  noise), seeds silently on first pass, then sends "NEW LISTINGS" alerts
  with names + links when new matching products appear. My main config is
  uk-watches.json which sweeps Chaos Cards, Magic Madhouse, Total Cards,
  Titan Cards, Zatu and Pokémon Center UK (browser mode) this way, with
  Smyths/Argos/TG Jones entries I can enable after checking their URLs.
- --browser flag (or "browser": true per watch) renders pages with
  Playwright/Chromium for sites that build stock status with JavaScript
  (e.g. Pokémon Center UK). Requires: npm install playwright &&
  npx playwright install chromium.
- Run: node checker.mjs          (loop, ~5 min interval with jitter)
       node checker.mjs --once   (single pass, for cron)
       node checker.mjs --config preorders.json --browser
- Deployment options I have: Dockerfile, a systemd unit (poke-checker.service),
  and a crontab example. Alerts via Discord webhook URL or Telegram bot
  token + chat id in the config's "notify" block.

WHAT I MIGHT ASK YOU FOR
- Finding the right inStockText/outOfStockText phrases for a specific UK
  retailer product page (I can paste you the page's HTML or visible text).
- Writing/editing watch entries in config.json for products I name.
- Helping me set up the Discord webhook or Telegram bot.
- Getting it running 24/7 on a Raspberry Pi / cheap VPS / Docker.
- UK retail strategy: which retailers to watch for a given set, pre-order
  timing, click-and-collect tactics around Newbury/Reading.
- Debugging: reading its console output / logs when a watch shows "unknown"
  or errors.

RULES
- Never suggest auto-checkout, CAPTCHA/queue bypassing, or anything that
  violates retailer terms. Watching + notifying + manual buying only.
- Keep the polling polite (5+ min intervals) — never advise hammering sites.

Confirm you've got all that, then help me with what I ask next.
```

---

**Tips for using the chat:**

- When a watch reads `unknown`, open the product page in your browser, hit
  Ctrl-U (view source), copy the chunk around the stock/button area, and paste
  it into the chat — Claude can pick the exact phrases for you.
- Paste your `config.json` (it's fine — just **redact the Discord webhook URL
  and Telegram token** first) and Claude can edit/extend it.
- On drop days, ask it for a checklist of which retailers to have logged in
  and payment-ready — being pre-logged-in with a saved address is the biggest
  legitimate speed win once an alert fires.
