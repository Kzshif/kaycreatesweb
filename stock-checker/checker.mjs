#!/usr/bin/env node
// Pokémon stock checker — a polite restock-alert monitor for UK retailers.
//
// What it does:
//   - Polls a list of product pages you configure.
//   - Detects "in stock" vs "out of stock" from the page HTML.
//   - Alerts you (console + Discord and/or Telegram) only when something
//     flips from out-of-stock to in-stock, so you don't get spammed.
//
// What it deliberately does NOT do:
//   - It does not add to basket, log in, or check out. It only watches and
//     tells you. You buy manually, like everyone else — you just find out
//     first. Automated purchasing violates every major retailer's terms and
//     is a fast way to get your account and card banned.
//
// Run:  node checker.mjs            (uses ./config.json)
//       node checker.mjs --once     (single pass, then exit — good for cron)
//       node checker.mjs --config /path/to/config.json
//
// Requires Node 18+ (uses the built-in fetch). No npm install needed.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
const args = process.argv.slice(2);
const runOnce = args.includes("--once");
const configFlagIndex = args.indexOf("--config");
const configPath =
  configFlagIndex !== -1 && args[configFlagIndex + 1]
    ? resolve(args[configFlagIndex + 1])
    : resolve(__dirname, "config.json");

if (!existsSync(configPath)) {
  console.error(
    `No config found at ${configPath}\n` +
      `Copy config.example.json to config.json and edit it first.`,
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const statePath = resolve(__dirname, config.stateFile || "state.json");

// ----------------------------------------------------------------------------
// State (last-known status per watch, so we only alert on transitions)
// ----------------------------------------------------------------------------
function loadState() {
  if (!existsSync(statePath)) return {};
  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}
function saveState(state) {
  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn(`Could not write state file: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
const DEFAULT_HEADERS = {
  // A realistic desktop UA so pages render the same HTML they'd send a browser.
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
    "image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// Fetch a URL with a timeout. Returns { ok, status, html } or throws.
async function fetchPage(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html };
  } finally {
    clearTimeout(timer);
  }
}

// Decide stock status from HTML using the watch's rules.
// Returns "in", "out", or "unknown".
//
// Priority order:
//   1. If any outOfStockText phrase is present -> "out" (most reliable signal).
//   2. Else if any inStockText phrase is present -> "in".
//   3. Else -> "unknown" (we don't guess; unknown never triggers an alert).
function detectStatus(html, watch) {
  const haystack = html.toLowerCase();
  const outPhrases = (watch.outOfStockText || []).map((s) => s.toLowerCase());
  const inPhrases = (watch.inStockText || []).map((s) => s.toLowerCase());

  const hasOut = outPhrases.some((p) => p && haystack.includes(p));
  if (hasOut) return "out";

  const hasIn = inPhrases.some((p) => p && haystack.includes(p));
  if (hasIn) return "in";

  return "unknown";
}

// ----------------------------------------------------------------------------
// Notifications
// ----------------------------------------------------------------------------
async function notifyDiscord(webhookUrl, watch) {
  const body = {
    username: "Pokémon Restock",
    embeds: [
      {
        title: `🟢 IN STOCK: ${watch.name}`,
        description: watch.url,
        color: 0x2ecc71,
        fields: watch.store ? [{ name: "Store", value: watch.store }] : [],
        timestamp: new Date().toISOString(),
      },
    ],
  };
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
}

async function notifyTelegram(token, chatId, watch) {
  const text =
    `🟢 *IN STOCK*\n${watch.name}` +
    (watch.store ? `\n_${watch.store}_` : "") +
    `\n${watch.url}`;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) throw new Error(`Telegram API returned ${res.status}`);
}

async function sendAlerts(notify, watch) {
  const jobs = [];
  if (notify?.discordWebhookUrl) {
    jobs.push(
      notifyDiscord(notify.discordWebhookUrl, watch).catch((e) =>
        console.warn(`  ! Discord alert failed: ${e.message}`),
      ),
    );
  }
  if (notify?.telegramBotToken && notify?.telegramChatId) {
    jobs.push(
      notifyTelegram(notify.telegramBotToken, notify.telegramChatId, watch).catch(
        (e) => console.warn(`  ! Telegram alert failed: ${e.message}`),
      ),
    );
  }
  await Promise.all(jobs);
}

// ----------------------------------------------------------------------------
// One pass over all watches
// ----------------------------------------------------------------------------
async function runPass(state) {
  const watches = config.watches || [];
  const perRequestDelayMs = config.perRequestDelayMs ?? 2500;

  for (const watch of watches) {
    if (watch.enabled === false) continue;
    const key = watch.id || watch.url;

    try {
      const { ok, status, html } = await fetchPage(
        watch.url,
        config.requestTimeoutMs ?? 15000,
      );

      if (!ok) {
        console.log(`[${nowStamp()}] ${watch.name}: HTTP ${status} (skipped)`);
      } else {
        const current = detectStatus(html, watch);
        const previous = state[key]?.status ?? "unknown";

        const label =
          current === "in" ? "IN STOCK" : current === "out" ? "out" : "unknown";
        console.log(`[${nowStamp()}] ${watch.name}: ${label}`);

        // Alert only on a genuine out/unknown -> in transition.
        if (current === "in" && previous !== "in") {
          console.log(`  >>> RESTOCK DETECTED — sending alerts`);
          await sendAlerts(config.notify, watch);
        }

        state[key] = { status: current, checkedAt: nowStamp() };
      }
    } catch (err) {
      console.log(`[${nowStamp()}] ${watch.name}: error — ${err.message}`);
    }

    saveState(state);
    // Be polite: space out requests so we never hammer a retailer.
    if (perRequestDelayMs > 0) await sleep(perRequestDelayMs);
  }
}

// ----------------------------------------------------------------------------
// Main loop
// ----------------------------------------------------------------------------
async function main() {
  const state = loadState();
  const intervalSec = config.intervalSeconds ?? 300; // default 5 min
  const jitterSec = config.jitterSeconds ?? 60;

  console.log(
    `Pokémon stock checker started — ${
      (config.watches || []).filter((w) => w.enabled !== false).length
    } active watch(es).`,
  );
  if (runOnce) {
    await runPass(state);
    console.log("Single pass complete (--once).");
    return;
  }

  console.log(
    `Polling every ~${intervalSec}s (±${jitterSec}s jitter). Ctrl-C to stop.\n`,
  );
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runPass(state);
    // Randomised interval so requests don't land on a predictable cadence.
    const jitter = Math.floor((Math.random() * 2 - 1) * jitterSec * 1000);
    const waitMs = Math.max(30000, intervalSec * 1000 + jitter);
    console.log(`\n--- next check in ${Math.round(waitMs / 1000)}s ---\n`);
    await sleep(waitMs);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
